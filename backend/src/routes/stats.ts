import { sql } from "drizzle-orm";
import { Elysia } from "elysia";
import { db } from "../db";
import { cacheStats, getCachedStats } from "../services/redis";

export const statsRoutes = new Elysia({ prefix: "/stats" }).get(
  "/",
  async ({ user }) => {
    const companyId = (user as any).companyId;
    const role = (user as any).role;
    const userId = (user as any).id;

    let managerId: number | null = null;
    if (role === "MANAGER") {
      const { getManagerId } = await import("../lib/user");
      managerId = await getManagerId(userId);
    }

    // Check Redis cache first (TTL 60 sec)
    // We should include companyId and managerId in cache key
    const cacheKey = managerId ? `stats_${companyId}_mgr_${managerId}` : `stats_${companyId}`;
    const cached = await getCachedStats(cacheKey);
    if (cached) return cached;

    const [totals] = await db.execute(sql`
      SELECT
        COUNT(DISTINCT t.id)                                                AS total_tickets,
        ROUND(AVG(ta.priority)::numeric, 1)                                 AS avg_priority,
        COUNT(DISTINCT t.id) FILTER (WHERE ta.sentiment = 'Негативный')     AS negative_count,
        COUNT(DISTINCT t.id) FILTER (WHERE t.segment IN ('VIP','Priority')) AS vip_count
      FROM tickets t
      LEFT JOIN ticket_analysis ta ON ta.ticket_id = t.id
      LEFT JOIN assignments a ON a.ticket_id = t.id
      WHERE t.company_id = ${companyId}
      ${managerId ? sql`AND a.manager_id = ${managerId}` : sql``}
    `);

    const byType = await db.execute(sql`
      SELECT ta.ticket_type AS name, COUNT(DISTINCT t.id)::int AS count
      FROM ticket_analysis ta
      JOIN tickets t ON t.id = ta.ticket_id
      LEFT JOIN assignments a ON a.ticket_id = t.id
      WHERE t.company_id = ${companyId}
      ${managerId ? sql`AND a.manager_id = ${managerId}` : sql``}
      GROUP BY ta.ticket_type ORDER BY count DESC
    `);

    const bySentiment = await db.execute(sql`
      SELECT ta.sentiment AS name, COUNT(DISTINCT t.id)::int AS count
      FROM ticket_analysis ta
      JOIN tickets t ON t.id = ta.ticket_id
      LEFT JOIN assignments a ON a.ticket_id = t.id
      WHERE t.company_id = ${companyId}
      ${managerId ? sql`AND a.manager_id = ${managerId}` : sql``}
      GROUP BY ta.sentiment
    `);

    const byOffice = await db.execute(sql`
      SELECT m.office AS name, COUNT(DISTINCT a.ticket_id)::int AS count
      FROM assignments a
      JOIN managers m ON m.id = a.manager_id
      WHERE m.company_id = ${companyId}
      ${managerId ? sql`AND a.manager_id = ${managerId}` : sql``}
      GROUP BY m.office ORDER BY count DESC
    `);

    const bySegment = await db.execute(sql`
      SELECT t.segment AS name, COUNT(DISTINCT t.id)::int AS count
      FROM tickets t
      LEFT JOIN assignments a ON a.ticket_id = t.id
      WHERE t.company_id = ${companyId}
      ${managerId ? sql`AND a.manager_id = ${managerId}` : sql``}
      GROUP BY t.segment
    `);

    const managerLoads = await db.execute(sql`
      SELECT name, office, current_load AS load, position
      FROM managers
      WHERE company_id = ${companyId}
      ${managerId ? sql`AND id = ${managerId}` : sql``}
      ORDER BY current_load DESC
      LIMIT 20
    `);

    const stats = {
      totals,
      byType,
      bySentiment,
      byOffice,
      bySegment,
      managerLoads,
    };
    await cacheStats(stats, cacheKey);
    return stats;
  },
);
