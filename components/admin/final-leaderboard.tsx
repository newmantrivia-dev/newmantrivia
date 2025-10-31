import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRankBadge } from "@/lib/leaderboard-utils";
import type { Team } from "@/lib/types";

interface FinalLeaderboardProps {
  teamTotals: Array<{
    team: Team;
    total: number;
    roundScores: Array<{ roundNumber: number; roundName: string | null; points: number }>;
  }>;
}

export function FinalLeaderboard({ teamTotals }: FinalLeaderboardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Final Standings</CardTitle>
      </CardHeader>
      <CardContent>
        {teamTotals.length > 0 ? (
          <div className="space-y-3">
            {teamTotals.map((item, index) => {
              const rank = index + 1;
              const badge = getRankBadge(rank);

              return (
                <div
                  key={item.team.id}
                  className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                    rank === 1
                      ? "bg-amber-100 dark:bg-amber-950/20 border-2 border-amber-500"
                      : rank === 2
                        ? "bg-slate-100 dark:bg-slate-950/20 border-2 border-slate-400"
                        : rank === 3
                          ? "bg-orange-100 dark:bg-orange-950/20 border-2 border-orange-600"
                          : "bg-muted/50 hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl w-10">
                      {badge || <span className="font-semibold text-xl">{rank}</span>}
                    </span>
                    <span className="font-semibold text-lg">{item.team.name}</span>
                  </div>
                  <span className="text-2xl font-bold">{item.total}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No teams registered for this event.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
