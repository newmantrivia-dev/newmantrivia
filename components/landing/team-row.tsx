"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { getRankBadge } from "@/lib/leaderboard-utils";
import type { TeamRanking } from "@/lib/types";

type TeamMovement = "up" | "down" | "same" | "new";

interface TeamRowProps {
  ranking: TeamRanking & { movement: TeamMovement };
  totalRounds: number;
}

export function TeamRow({ ranking, totalRounds }: TeamRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const rankBadge = getRankBadge(ranking.rank);

  // Determine background color based on movement
  const getBackgroundColor = () => {
    if (ranking.movement === "up") {
      return ["rgba(34, 197, 94, 0)", "rgba(34, 197, 94, 0.2)", "rgba(34, 197, 94, 0)"];
    }
    if (ranking.movement === "down") {
      return ["rgba(239, 68, 68, 0)", "rgba(239, 68, 68, 0.2)", "rgba(239, 68, 68, 0)"];
    }
    return undefined;
  };

  return (
    <motion.tr
      layout
      initial={ranking.movement === "new" ? { opacity: 0, y: -20 } : false}
      animate={{
        opacity: 1,
        y: 0,
        backgroundColor: getBackgroundColor(),
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        layout: { duration: 0.4, ease: "easeInOut" },
        opacity: { duration: 0.3 },
        backgroundColor: { duration: 1, ease: "easeOut" },
      }}
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {rankBadge ? (
            <span className="text-2xl">{rankBadge}</span>
          ) : (
            <span className="text-lg font-semibold w-8 text-center">
              {ranking.rank}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div>
          <p className="font-medium">{ranking.team.name}</p>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 flex flex-wrap gap-2"
            >
              {ranking.roundScores.map((rs) => (
                <div
                  key={rs.roundNumber}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm"
                >
                  <span className="text-muted-foreground">R{rs.roundNumber}:</span>
                  <span className="font-semibold">{rs.points}</span>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <motion.span
          className="text-lg font-bold"
          animate={
            ranking.movement === "up" || ranking.movement === "down"
              ? { scale: [1, 1.15, 1] }
              : {}
          }
          transition={{ duration: 0.5 }}
        >
          {ranking.totalScore}
        </motion.span>
      </td>
      <td className="px-4 py-3">
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </td>
    </motion.tr>
  );
}
