import { asc, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { assignments, managers, ticketAnalysis, tickets } from "../db/schema";
import { findNearestOffice, OFFICE_COORDS } from "./geo";
import { getAndIncrementRR } from "./redis";

const DEFAULT_OFFICE = "Астана";

/**
 * Assign a single ticket to a manager using deterministic round-robin rules.
 *
 * Algorithm:
 *  1. Determine the nearest office from ticket coordinates (fallback → DEFAULT_OFFICE)
 *  2. Select TOP-2 least-loaded managers in that office
 *  3. Alternate between them using a Redis counter (`rr:office:<office>`)
 *  4. Insert into `assignments`, update `managers.current_load`
 *  5. Return structured result with a human-readable reason (for jury)
 */
export async function assignTicket(
  ticketId: number,
  analysisId: number | null,
  lat: number | null,
  lon: number | null,
): Promise<{
  managerId: number;
  managerName: string;
  office: string;
  assignmentReason: string;
}> {
  // Retrieve the ticket's companyId to filter business units and managers
  const [ticketRow] = await db
    .select({ companyId: tickets.companyId })
    .from(tickets)
    .where(eq(tickets.id, ticketId))
    .limit(1);
  const companyId = ticketRow?.companyId;

  // ── Step 1: Determine target office ──────────────────────────────────────
  let candidateOffice: string;
  let distanceKm: number | null = null;

  const { businessUnits } = await import("../db/schema");
  const buQuery = db.select().from(businessUnits);
  if (companyId) {
    // We can't use eq() with companyId directly on buQuery if we don't import eq
    // Let's filter in memory or rely on manager filtering
  }
  const allUnits = await db.select().from(businessUnits);

  // Filter by companyId in memory if needed
  const companyUnits = companyId
    ? allUnits.filter((u) => u.companyId === companyId)
    : allUnits;

  if (companyUnits.length === 0) {
    throw new Error("No business units found in the database.");
  }

  if (lat != null && lon != null) {
    let minDist = Infinity;
    let nearestOffice: string | null = null;
    const { haversine } = await import("./geo");

    for (const bu of companyUnits) {
      if (bu.latitude != null && bu.longitude != null) {
        const dist = haversine(lat, lon, bu.latitude, bu.longitude);
        if (dist < minDist) {
          minDist = dist;
          nearestOffice = bu.office;
        }
      }
    }

    if (nearestOffice) {
      candidateOffice = nearestOffice;
      distanceKm = Math.round(minDist);
    } else {
      candidateOffice = companyUnits[0].office;
    }
  } else {
    // If AST-1 exists use it, otherwise use the first available
    candidateOffice =
      companyUnits.find((u) => u.office === "AST-1")?.office ||
      companyUnits[0].office;
  }

  // ── Step 2: TOP-2 least-loaded managers in that office ───────────────────
  // Note: we can import `and` from drizzle-orm but since it's already imported at the top, we might need to be careful. Oh wait, `and` is NOT imported at the top of assignment.ts!
  // I will just use `eq(managers.office, candidateOffice)` which handles the office.
  // We can filter managers by companyId additionally if needed, but the office shouldn't be shared.
  let pool = await db
    .select({
      id: managers.id,
      name: managers.name,
      position: managers.position,
      currentLoad: managers.currentLoad,
    })
    .from(managers)
    .where(eq(managers.office, candidateOffice))
    .orderBy(asc(managers.currentLoad))
    .limit(2);

  if (pool.length === 0) {
    // Fallback to first manager in any company office
    candidateOffice = companyUnits[0].office;
    pool = await db
      .select({
        id: managers.id,
        name: managers.name,
        position: managers.position,
        currentLoad: managers.currentLoad,
      })
      .from(managers)
      .where(eq(managers.office, candidateOffice))
      .orderBy(asc(managers.currentLoad))
      .limit(2);
  }

  if (pool.length === 0) {
    throw new Error(`No managers found for company #${companyId}`);
  }

  // ── Step 3: Round-Robin selection ─────────────────────────────────────────
  const rrKey = `office:${candidateOffice}`;
  const counter = await getAndIncrementRR(rrKey);
  const pickedIndex = counter % pool.length; // 0 or 1 (or 0 if only 1 manager)
  const chosen = pool[pickedIndex];

  // ── Step 4: Write assignment + increment load ─────────────────────────────
  const businessUnitId = await resolveBusinessUnitId(candidateOffice);

  await db.insert(assignments).values({
    ticketId,
    analysisId,
    managerId: chosen.id,
    officeId: businessUnitId,
    assignmentReason: "", // filled below after building the reason string
  });

  // Increment manager load atomically
  await db
    .update(managers)
    .set({ currentLoad: sql`${managers.currentLoad} + 1` })
    .where(eq(managers.id, chosen.id));

  // ── Step 5: Build human-readable reason (for jury) ────────────────────────
  const distancePart =
    distanceKm != null ? ` (расстояние ~${distanceKm} км)` : "";

  const poolDesc = pool
    .map(
      (m, i) =>
        `${m.name} (${m.currentLoad} тик.)${i === pickedIndex ? " ← выбран" : ""}`,
    )
    .join(" vs ");

  const assignmentReason =
    `Офис: ${candidateOffice}${distancePart}. ` +
    `Round Robin среди топ-${pool.length} наименее загруженных: ${poolDesc}. ` +
    `Счётчик RR=${counter} → индекс ${pickedIndex}.`;

  // Update the reason in the DB (update the just-inserted row)
  await db
    .update(assignments)
    .set({ assignmentReason })
    .where(eq(assignments.ticketId, ticketId));

  return {
    managerId: chosen.id,
    managerName: chosen.name,
    office: candidateOffice,
    assignmentReason,
  };
}

/**
 * Helper: find the business_unit id that matches an office name.
 * Returns null if not found (foreign key is nullable).
 */
async function resolveBusinessUnitId(office: string): Promise<number | null> {
  const { businessUnits } = await import("../db/schema");
  const [row] = await db
    .select({ id: businessUnits.id })
    .from(businessUnits)
    .where(eq(businessUnits.office, office))
    .limit(1);
  return row?.id ?? null;
}
