import { Suspense } from "react";
import { EventDashboard } from "@/components/admin/event-dashboard";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="text-6xl animate-pulse">🎯</div>
            <p className="text-muted-foreground">Loading event dashboard...</p>
          </div>
        </div>
      }
    >
      <EventDashboard eventId={id} />
    </Suspense>
  );
}
