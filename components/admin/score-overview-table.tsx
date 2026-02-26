"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Team } from "@/lib/types";

interface ScoreOverviewTableProps {
  teams: Team[];
  rounds: Array<{
    id: string;
    roundNumber: number;
    roundName: string | null;
    isBonus: boolean;
  }>;
  scores: Array<{
    id: string;
    teamId: string;
    roundNumber: number;
    points: string;
  }>;
  currentRound: number;
}

function formatPoints(value: number): string {
  if (Number.isNaN(value)) return "0";
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/\.?0+$/, "");
}

export function ScoreOverviewTable({
  teams,
  rounds,
  scores,
  currentRound,
}: ScoreOverviewTableProps) {
  const scoreByTeamRound = new Map<string, number>();
  for (const score of scores) {
    const parsed = Number.parseFloat(score.points);
    scoreByTeamRound.set(`${score.teamId}:${score.roundNumber}`, Number.isNaN(parsed) ? 0 : parsed);
  }

  const rows = teams
    .map((team) => {
      const total = rounds.reduce((sum, round) => {
        return sum + (scoreByTeamRound.get(`${team.id}:${round.roundNumber}`) ?? 0);
      }, 0);
      return { team, total };
    })
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.team.name.localeCompare(b.team.name);
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Score Overview</CardTitle>
        <p className="text-sm text-muted-foreground">
          Full score matrix across all rounds.
        </p>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">No teams available yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 z-20 w-[72px] bg-card">Rank</TableHead>
                <TableHead className="sticky left-[72px] z-20 min-w-[180px] bg-card">Team</TableHead>
                {rounds.map((round) => (
                  <TableHead
                    key={round.id}
                    className={cn(
                      "min-w-[88px] text-right",
                      round.roundNumber === currentRound && "bg-muted/50"
                    )}
                    title={round.roundName || undefined}
                  >
                    R{round.roundNumber}
                  </TableHead>
                ))}
                <TableHead className="min-w-[96px] text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ team, total }, index) => (
                <TableRow key={team.id}>
                  <TableCell className="sticky left-0 z-10 bg-card font-semibold">
                    {index + 1}
                  </TableCell>
                  <TableCell className="sticky left-[72px] z-10 bg-card font-medium">
                    {team.name}
                  </TableCell>
                  {rounds.map((round) => {
                    const isBeforeJoinedRound = round.roundNumber < team.joinedRound;
                    const value = scoreByTeamRound.get(`${team.id}:${round.roundNumber}`);
                    const display = isBeforeJoinedRound
                      ? "—"
                      : value === undefined
                        ? "—"
                        : formatPoints(value);

                    return (
                      <TableCell
                        key={round.id}
                        className={cn(
                          "text-right",
                          round.roundNumber === currentRound && "bg-muted/50",
                          value === undefined && !isBeforeJoinedRound && round.roundNumber <= currentRound
                            ? "text-amber-600"
                            : "text-foreground"
                        )}
                      >
                        {display}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-right text-base font-semibold">
                    {formatPoints(total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
