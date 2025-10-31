"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Event, Team } from "@/lib/types";

interface RoundBreakdownProps {
  event: Event & {
    rounds: Array<{ id: string; roundNumber: number; roundName: string | null; isBonus: boolean }>;
    teams: Team[];
  };
  teamTotals: Array<{
    team: Team;
    total: number;
    roundScores: Array<{ roundNumber: number; roundName: string | null; points: number }>;
  }>;
}

export function RoundBreakdown({ event, teamTotals }: RoundBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (teamTotals.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Round Breakdown</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                Collapse <ChevronUp className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Expand <ChevronDown className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold sticky left-0 bg-muted/50">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold sticky left-16 bg-muted/50">
                    Team
                  </th>
                  {event.rounds.map((round) => (
                    <th
                      key={round.id}
                      className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap"
                    >
                      {round.roundName || `R${round.roundNumber}`}
                      {round.isBonus && " ⭐"}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-sm font-semibold bg-primary/10">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {teamTotals.map((item, index) => (
                  <tr key={item.team.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 font-semibold sticky left-0 bg-card">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 font-medium sticky left-16 bg-card">
                      {item.team.name}
                    </td>
                    {item.roundScores.map((rs) => (
                      <td
                        key={rs.roundNumber}
                        className="px-4 py-3 text-center"
                      >
                        {rs.points}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right font-bold bg-primary/5">
                      {item.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
