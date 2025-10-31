import { Suspense } from "react";
import { EventDetailsView } from "@/components/admin/event-details-view";

export const dynamic = "force-dynamic";

export default async function EventViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="text-6xl animate-pulse">🎯</div>
            <p className="text-muted-foreground">Loading event details...</p>
          </div>
        </div>
      }
    >
      <EventDetailsView eventId={id} />
    </Suspense>
  );
}
