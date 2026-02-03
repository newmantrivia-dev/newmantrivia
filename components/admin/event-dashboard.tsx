import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/server";
import { getEventById } from "@/lib/queries/events";
import { adminPaths } from "@/lib/paths";
import { RealtimeEventDashboard } from "./realtime-event-dashboard";
import { EventDashboardContent } from "./event-dashboard-content";

export async function EventDashboard({ eventId }: { eventId: string }) {
  await requireAdmin();

  const event = await getEventById(eventId);

  if (!event) {
    notFound();
  }

  if (event.status !== "active") {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-2xl font-semibold mb-2">Event Not Active</h3>
          <p className="text-muted-foreground mb-6">
            This event is currently {event.status}. You can only manage active events here.
          </p>
          <Button asChild>
            <Link href={adminPaths.root}>Back to Events</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <RealtimeEventDashboard eventId={event.id} event={event}>
      <EventDashboardContent />
    </RealtimeEventDashboard>
  );
}
