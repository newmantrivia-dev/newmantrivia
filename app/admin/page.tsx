import { Suspense } from "react";
import EventsList from "@/components/admin/events-list";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="text-6xl animate-pulse">🎯</div>
            <p className="text-muted-foreground">Loading events...</p>
          </div>
        </div>
      }
    >
      <EventsList />
    </Suspense>
  );
}
