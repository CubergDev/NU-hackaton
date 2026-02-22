import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db";
import { businessUnits, tickets } from "../db/schema";
import { geocodeAddress, searchAddress, reverseGeocodeAddress } from "../services/geocode";

export const businessUnitsRoutes = new Elysia({ prefix: "/business-units" })

  // GET /business-units/suggestions?q=...&city=... — address autocomplete
  .get(
    "/suggestions",
    async ({ query: { q, city } }) => {
      if (!q || q.length < 2) return [];
      return await searchAddress(q, 5, city || undefined);
    },
    {
      query: t.Object({
        q: t.String(),
        city: t.Optional(t.String()),
      }),
    },
  )

  // GET /business-units/reverse-geocode?lat=...&lon=... — get address from coords
  .get(
    "/reverse-geocode",
    async ({ query: { lat, lon } }) => {
      const address = await reverseGeocodeAddress(lat, lon);
      return { address };
    },
    {
      query: t.Object({
        lat: t.Numeric(),
        lon: t.Numeric(),
      }),
    }
  )

  // GET /business-units/:id — fetch single unit
  .get(
    "/:id",
    async ({ params, set, user }) => {
      const companyId = (user as any).companyId;
      const [unit] = await db
        .select()
        .from(businessUnits)
        .where(
          and(
            eq(businessUnits.id, Number(params.id)),
            eq(businessUnits.companyId, companyId)
          )
        );

      if (!unit) {
        set.status = 404;
        return { error: "Business unit not found" };
      }

      return unit;
    }
  )

  // GET /business-units — list all for the current company
  .get("/", async ({ user }) => {
    const companyId = (user as any).companyId;
    return await db
      .select()
      .from(businessUnits)
      .where(eq(businessUnits.companyId, companyId));
  })

  // POST /business-units — create a new business unit (auto-geocodes address)
  .post(
    "/",
    async ({ body, user }) => {
      const companyId = (user as any).companyId;
      const { office, address } = body;

      // Auto-geocode: combine office (city) + address for best results
      let latitude: number | null = null;
      let longitude: number | null = null;
      if (address) {
        const fullQuery = `${office}, ${address}, Казахстан`;
        const coords = await geocodeAddress(fullQuery);
        if (coords) {
          latitude = coords.latitude;
          longitude = coords.longitude;
        }
      }

      const [unit] = await db
        .insert(businessUnits)
        .values({ companyId, office, address, latitude, longitude })
        .returning();

      return unit;
    },
    {
      body: t.Object({
        office: t.String(),
        address: t.Optional(t.String()),
      }),
    },
  )

  // POST /business-units/batch — create multiple business units
  .post(
    "/batch",
    async ({ body, user }) => {
      const companyId = (user as any).companyId;
      if (!body || body.length === 0) return { inserted: 0 };

      const values = [];
      for (const item of body) {
        let latitude: number | null = null;
        let longitude: number | null = null;
        if (item.address) {
          const fullQuery = `${item.office}, ${item.address}, Казахстан`;
          const coords = await geocodeAddress(fullQuery);
          if (coords) {
            latitude = coords.latitude;
            longitude = coords.longitude;
          }
        }
        values.push({
          companyId,
          office: item.office,
          address: item.address,
          latitude,
          longitude,
        });
      }

      const inserted = await db.insert(businessUnits).values(values).returning();
      return { inserted: inserted.length };
    },
    {
      body: t.Array(
        t.Object({
          office: t.String(),
          address: t.Optional(t.String()),
        }),
      ),
    },
  )

  // PUT /business-units/:id — update a business unit (re-geocodes if address changed)
  .put(
    "/:id",
    async ({ params, body, set, user }) => {
      const companyId = (user as any).companyId;
      const { office, address } = body;

      // Re-geocode if address or office provided
      let latitude: number | undefined;
      let longitude: number | undefined;
      if (address !== undefined || office !== undefined) {
        const resolvedOffice = office ?? "";
        const resolvedAddress = address ?? "";
        if (resolvedAddress) {
          const fullQuery = `${resolvedOffice}, ${resolvedAddress}, Казахстан`;
          const coords = await geocodeAddress(fullQuery);
          if (coords) {
            latitude = coords.latitude;
            longitude = coords.longitude;
          }
        }
      }

      const [unit] = await db
        .update(businessUnits)
        .set({
          office,
          address,
          latitude,
          longitude,
        })
        .where(
          and(
            eq(businessUnits.id, Number(params.id)),
            eq(businessUnits.companyId, companyId),
          ),
        )
        .returning();

      if (!unit) {
        set.status = 404;
        return { error: "Business unit not found" };
      }

      return unit;
    },
    {
      body: t.Object({
        office: t.Optional(t.String()),
        address: t.Optional(t.String()),
      }),
    },
  )

  // DELETE /business-units/:id — delete a business unit
  .delete("/:id", async ({ params, set, user }) => {
    const companyId = (user as any).companyId;
    const businessUnitId = Number(params.id);

    await db
      .update(tickets)
      .set({ businessUnitId: null })
      .where(eq(tickets.businessUnitId, businessUnitId));

    const [deleted] = await db
      .delete(businessUnits)
      .where(
        and(
          eq(businessUnits.id, businessUnitId),
          eq(businessUnits.companyId, companyId),
        ),
      )
      .returning();

    if (!deleted) {
      set.status = 404;
      return { error: "Business unit not found" };
    }

    return { success: true };
  });
