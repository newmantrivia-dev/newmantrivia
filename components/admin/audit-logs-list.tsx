import { Separator } from "@/components/ui/separator";
import { requireAdmin } from "@/lib/auth/server";
import { getAuditLogs, getEventsForFilter } from "@/lib/queries/audit-logs";
import { AuditLogFilters } from "./audit-log-filters";
import { AuditLogEntry } from "./audit-log-entry";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { adminPaths } from "@/lib/paths";

export default async function AuditLogsList({
    eventId,
    page = 1,
  }: {
    eventId?: string;
    page?: number;
  }) {
    await requireAdmin();
  
    const [result, events] = await Promise.all([
      getAuditLogs({ eventId, page, limit: 50 }),
      getEventsForFilter(),
    ]);
  
    // Group logs by event
    const logsByEvent = result.logs.reduce(
      (acc, log) => {
        const eventName = log.event.name;
        if (!acc[eventName]) {
          acc[eventName] = [];
        }
        acc[eventName].push(log);
        return acc;
      },
      {} as Record<string, typeof result.logs>
    );
  
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">
            View all score changes and modifications
          </p>
        </div>
  
        <Separator />
  
        <AuditLogFilters events={events} currentEventId={eventId} />
  
        {result.logs.length > 0 ? (
          <div className="space-y-8">
            {Object.entries(logsByEvent).map(([eventName, logs]) => (
              <div key={eventName} className="space-y-3">
                <h2 className="text-xl font-semibold">{eventName}</h2>
                <div className="space-y-2">
                  {logs.map((log) => (
                    <AuditLogEntry key={log.id} log={log} />
                  ))}
                </div>
              </div>
            ))}
  
            {result.hasMore && (
              <div className="flex justify-center pt-4">
                <Button variant="outline" asChild>
                  <Link
                    href={`${adminPaths.auditLogs}?page=${page + 1}${eventId ? `&eventId=${eventId}` : ""}`}
                  >
                    Load More Logs
                  </Link>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No audit logs found.</p>
          </div>
        )}
      </div>
    );
  }