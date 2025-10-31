import { Suspense } from "react";
import EventDisplay from "@/components/landing/event-display";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-6xl animate-bounce">🎯</div>
            <p className="text-muted-foreground">Loading trivia leaderboard...</p>
          </div>
        </div>
      }
    >
      <EventDisplay />
    </Suspense>
  );
}
