import { getPublicEventData } from "@/actions/leaderboard";
import { Leaderboard } from "@/components/landing/leaderboard";
import { ConfettiEffect } from "@/components/landing/confetti";
import { formatDistanceToNow } from "date-fns";

export default async function EventDisplay() {
    const result = await getPublicEventData();
  
    if (result.type === "none") {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="text-center space-y-4">
            <div className="text-6xl">🎯</div>
            <h1 className="text-3xl font-bold">Trivia Leaderboard</h1>
            <p className="text-muted-foreground max-w-md">
              No active trivia event
            </p>
            <p className="text-muted-foreground">
              Check back soon for the next competition!
            </p>
          </div>
        </div>
      );
    }
  
    if (result.type === "upcoming") {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="text-center space-y-6 max-w-2xl">
            <div className="text-6xl">🎯</div>
            <h1 className="text-3xl font-bold">Coming Soon!</h1>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">{result.event.name}</h2>
              {result.event.description && (
                <p className="text-muted-foreground text-lg">
                  {result.event.description}
                </p>
              )}
            </div>
            {result.event.scheduledDate && (
              <div className="mt-6 p-6 border rounded-lg bg-card">
                <div className="text-4xl mb-2">📅</div>
                <p className="text-lg font-medium">
                  {new Date(result.event.scheduledDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-muted-foreground">
                  {new Date(result.event.scheduledDate).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    timeZoneName: "short",
                  })}
                </p>
              </div>
            )}
            <p className="text-muted-foreground mt-4">Stay tuned!</p>
          </div>
        </div>
      );
    }
  
    if (result.type === "completed") {
      return (
        <>
          <ConfettiEffect />
          <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="text-center space-y-2 mb-8">
                <div className="flex items-center justify-center gap-2 text-4xl mb-2">
                  🎊 <h1 className="text-3xl md:text-4xl font-bold">{result.data.event.name}</h1> 🎊
                </div>
                {result.data.event.description && (
                  <p className="text-muted-foreground text-lg">
                    {result.data.event.description}
                  </p>
                )}
                <p className="text-xl font-semibold text-primary">Final Results</p>
                {result.data.event.endedAt && (
                  <p className="text-sm text-muted-foreground">
                    Event completed {formatDistanceToNow(new Date(result.data.event.endedAt), { addSuffix: true })}
                  </p>
                )}
              </div>
  
              <Leaderboard data={result.data} isCompleted={true} />
            </div>
          </div>
        </>
      );
    }
  
    // Active event
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="text-center space-y-2 mb-8">
            <div className="flex items-center justify-center gap-2 text-4xl mb-2">
              🎯
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">{result.data.event.name}</h1>
            {result.data.event.description && (
              <p className="text-muted-foreground text-lg">
                {result.data.event.description}
              </p>
            )}
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span>
                Current Round: <span className="font-semibold text-primary">{result.data.currentRound}</span> of{" "}
                {result.data.totalRounds}
              </span>
              <span>•</span>
              <span>
                Last Updated: {formatDistanceToNow(new Date(result.data.lastUpdated), { addSuffix: true })}
              </span>
            </div>
          </div>
  
          <Leaderboard data={result.data} isCompleted={false} />
        </div>
      </div>
    );
  }