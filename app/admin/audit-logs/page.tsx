import { Suspense } from "react";
import AuditLogsList from "@/components/admin/audit-logs-list";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="text-6xl animate-pulse">📋</div>
            <p className="text-muted-foreground">Loading audit logs...</p>
          </div>
        </div>
      }
    >
      <AuditLogsList eventId={params.eventId} page={page} />
    </Suspense>
  );
}
