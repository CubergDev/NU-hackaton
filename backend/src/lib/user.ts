import { eq } from "drizzle-orm";
import { db } from "../db";
import { managers } from "../db/schema";

/**
 * Get manager ID from user ID
 */
export async function getManagerId(userId: number) {
  const [row] = await db
    .select({ id: managers.id })
    .from(managers)
    .where(eq(managers.userId, userId))
    .limit(1);

  return row?.id ?? null;
}
