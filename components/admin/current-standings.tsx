"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRankBadge } from "@/lib/leaderboard-utils";
import type { Team } from "@/lib/types";

interface CurrentStandingsProps {
  teamTotals: Array<{ team: Team; total: number }>;
}

export function CurrentStandings({ teamTotals }: CurrentStandingsProps) {
  // Sort by total (descending)
  const sortedTeams = [...teamTotals].sort((a, b) => b.total - a.total);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Standings</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedTeams.length > 0 ? (
          <div className="space-y-2">
            {sortedTeams.map((item, index) => {
              const rank = index + 1;
              const badge = getRankBadge(rank);

              return (
                <div
                  key={item.team.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl w-8">
                      {badge || <span className="font-semibold">{rank}</span>}
                    </span>
                    <span className="font-medium">{item.team.name}</span>
                  </div>
                  <span className="text-xl font-bold">{item.total}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No teams registered yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
