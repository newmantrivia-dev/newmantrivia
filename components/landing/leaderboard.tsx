"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TeamRow } from "./team-row";
import { getRankBadge } from "@/lib/leaderboard-utils";
import type { LeaderboardData, TeamRanking } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";

interface LeaderboardProps {
  data: LeaderboardData;
  isCompleted: boolean;
}

type TeamMovement = "up" | "down" | "same" | "new";

interface TeamWithMovement extends TeamRanking {
  movement: TeamMovement;
}

export function Leaderboard({ data, isCompleted }: LeaderboardProps) {
  const [teamMovements, setTeamMovements] = useState<TeamWithMovement[]>([]);

  useEffect(() => {
    // Get previous rankings from localStorage
    const storageKey = `trivia-rankings-${data.event.id}`;
    const previousRankingsStr = localStorage.getItem(storageKey);
    const previousRankings: Array<{ teamId: string; rank: number }> =
      previousRankingsStr ? JSON.parse(previousRankingsStr) : [];

    // Determine movement for each team
    const withMovement: TeamWithMovement[] = data.rankings.map((ranking) => {
      const prevRank = previousRankings.find(
        (pr) => pr.teamId === ranking.team.id
      )?.rank;

      let movement: TeamMovement = "same";
      if (!prevRank) {
        movement = "new";
      } else if (prevRank > ranking.rank) {
        movement = "up";
      } else if (prevRank < ranking.rank) {
        movement = "down";
      }

      return { ...ranking, movement };
    });

    setTeamMovements(withMovement);

    // Store current rankings for next render
    const currentRankings = data.rankings.map((r) => ({
      teamId: r.team.id,
      rank: r.rank,
    }));
    localStorage.setItem(storageKey, JSON.stringify(currentRankings));
  }, [data]);

  if (teamMovements.length === 0) {
    // Initial load, no movements yet
    return (
      <div className="space-y-4">
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Team Name
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">
                    Total
                  </th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.rankings.map((ranking) => (
                  <TeamRow
                    key={ranking.team.id}
                    ranking={{ ...ranking, movement: "same" }}
                    totalRounds={data.totalRounds}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {data.rankings.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No teams have registered yet.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Rank
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Team Name
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  Total
                </th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <AnimatePresence mode="popLayout">
                {teamMovements.map((ranking) => (
                  <TeamRow
                    key={ranking.team.id}
                    ranking={ranking}
                    totalRounds={data.totalRounds}
                  />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </Card>

      {data.rankings.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No teams have registered yet.</p>
        </div>
      )}

      {/* Mobile view */}
      <div className="md:hidden space-y-3">
        {teamMovements.map((ranking) => (
          <MobileTeamCard
            key={ranking.team.id}
            ranking={ranking}
            totalRounds={data.totalRounds}
          />
        ))}
      </div>
    </div>
  );
}

function MobileTeamCard({
  ranking,
  totalRounds,
}: {
  ranking: TeamWithMovement;
  totalRounds: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const rankBadge = getRankBadge(ranking.rank);

  const backgroundColorClass =
    ranking.movement === "up"
      ? "bg-green-50 dark:bg-green-950/20"
      : ranking.movement === "down"
        ? "bg-red-50 dark:bg-red-950/20"
        : "";

  return (
    <motion.div
      layout
      initial={ranking.movement === "new" ? { opacity: 0, y: -20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`${backgroundColorClass}`}
    >
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {rankBadge || ranking.rank}
              </span>
              <div>
                <p className="font-semibold">{ranking.team.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.span
                className="text-xl font-bold"
                animate={
                  ranking.movement === "up" || ranking.movement === "down"
                    ? { scale: [1, 1.1, 1] }
                    : {}
                }
                transition={{ duration: 0.5 }}
              >
                {ranking.totalScore}
              </motion.span>
              <ChevronDown
                className={`w-5 h-5 text-muted-foreground transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </div>
          </div>

          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t"
            >
              <div className="grid grid-cols-4 gap-2">
                {ranking.roundScores.map((rs) => (
                  <div
                    key={rs.roundNumber}
                    className="text-center p-2 bg-muted/50 rounded"
                  >
                    <p className="text-xs text-muted-foreground">R{rs.roundNumber}</p>
                    <p className="font-semibold">{rs.points}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
