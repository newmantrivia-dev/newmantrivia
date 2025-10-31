import { db } from "@/lib/db";
import { scoreAuditLog, events } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

/**
 * Get audit logs with optional filtering
 */
export async function getAuditLogs({
  eventId,
  page = 1,
  limit = 50,
}: {
  eventId?: string;
  page?: number;
  limit?: number;
}) {
  const offset = (page - 1) * limit;

  const whereClause = eventId ? eq(scoreAuditLog.eventId, eventId) : undefined;

  const allLogs = await db.query.scoreAuditLog.findMany({
    where: whereClause,
    with: {
      event: true,
      team: true,
      changedByUser: true,
    },
    orderBy: [desc(scoreAuditLog.changedAt)],
    limit: limit + 1,
    offset,
  });

  const hasMore = allLogs.length > limit;
  const logs = hasMore ? allLogs.slice(0, limit) : allLogs;

  return {
    logs,
    hasMore,
    page,
  };
}

/**
 * Get all events for filter dropdown
 */
export async function getEventsForFilter() {
  return await db.query.events.findMany({
    orderBy: [desc(events.createdAt)],
    columns: {
      id: true,
      name: true,
      status: true,
    },
  });
}
