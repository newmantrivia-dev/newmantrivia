"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { getRankBadge } from "@/lib/leaderboard-utils";
import type { TeamRanking } from "@/lib/types";
import { cn } from "@/lib/utils";

type TeamMovement = "up" | "down" | "same" | "new";

interface TeamRowProps {
  ranking: TeamRanking & { movement: TeamMovement };
  totalRounds: number;
  highlightRound: number | null;
  viewMode: "total" | "last-round";
}

export function TeamRow({ ranking, totalRounds, highlightRound, viewMode }: TeamRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const rankBadge = getRankBadge(ranking.rank);
  const isPodium = ranking.rank <= 3;
  const highlightActive = Boolean(highlightRound);

  const podiumStyles = [
    "from-amber-400/30 via-transparent to-transparent",
    "from-zinc-200/30 via-transparent to-transparent",
    "from-orange-300/20 via-transparent to-transparent",
  ];

  const rowGlow =
    ranking.movement === "up"
      ? "rgba(34, 197, 94, 0.16)"
      : ranking.movement === "down"
        ? "rgba(244, 63, 94, 0.16)"
        : "rgba(148, 163, 184, 0.1)";

  return (
    <>
      <motion.tr
        layout
        initial={ranking.movement === "new" ? { opacity: 0, y: -20 } : false}
        animate={{
          opacity: 1,
          y: 0,
          filter: `drop-shadow(0px 12px 28px ${rowGlow})`,
        }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{
          layout: { duration: 0.45, ease: "easeInOut" },
          opacity: { duration: 0.3 },
          filter: { duration: 0.6 },
        }}
        className={cn(
          "group cursor-pointer text-white transition",
          isPodium && "bg-linear-to-r",
          isPodium && podiumStyles[ranking.rank - 1]
        )}
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <td className="px-4 py-4 align-middle">
          <div className="flex items-center">
            {rankBadge ? (
              <span className="text-2xl drop-shadow-lg">{rankBadge}</span>
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-lg font-semibold">
                {ranking.rank}
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-4 align-middle">
          <div className="flex items-center gap-4">
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold tracking-tight">
                {ranking.team.name}
              </p>
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                Avg {formatPoints(ranking.averageScore)} pts
              </p>
            </div>
            <MovementChip movement={ranking.movement} />
          </div>
        </td>
        {highlightActive && (
          <td
            className={cn(
              "px-4 py-4 text-right text-base font-semibold align-middle",
              viewMode === "last-round" && "text-emerald-200"
            )}
          >
            <motion.span
              animate={
                viewMode === "last-round"
                  ? { scale: [1, 1.15, 1], color: ["#FFFFFF", "#86ffcf", "#FFFFFF"] }
                  : {}
              }
              transition={{ duration: 0.6 }}
            >
              {formatPoints(ranking.lastRoundPoints)}
            </motion.span>
            <span className="ml-2 text-xs font-normal text-white/60">
              {formatDelta(ranking.recentDelta)}
            </span>
          </td>
        )}
        <td className="px-4 py-4 text-right align-middle">
          <motion.span
            className="text-xl font-bold"
            animate={
              ranking.movement === "up" || ranking.movement === "down"
                ? { scale: [1, 1.12, 1] }
                : {}
            }
            transition={{ duration: 0.45 }}
          >
            {formatPoints(ranking.totalScore)}
          </motion.span>
        </td>
        <td className="px-4 py-4 text-right align-middle">
          <ChevronDown
            className={cn(
              "ml-auto h-5 w-5 text-white/60 transition-transform group-hover:text-white",
              isExpanded && "rotate-180"
            )}
          />
        </td>
      </motion.tr>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.tr
            key="details"
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <td
              colSpan={highlightActive ? 5 : 4}
              className="px-8 pb-6 pt-2 text-white/90"
            >
              <div className="grid gap-4 md:grid-cols-[1fr,0.8fr] md:items-center">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                    Round progression
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ranking.roundScores.map((rs) => (
                      <div
                        key={rs.roundNumber}
                        className={cn(
                          "rounded-2xl border px-3 py-2",
                          highlightRound === rs.roundNumber
                            ? "border-primary/70 bg-primary/10 text-white"
                            : "border-white/10 bg-white/5 text-white"
                        )}
                      >
                        <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                          R{rs.roundNumber}
                        </p>
                        <p className="font-semibold">{formatPoints(rs.points)}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid gap-2 rounded-3xl border border-white/10 bg-white/5 p-4">
                  <DetailStat label="Total rounds" value={`${totalRounds}`} />
                  <DetailStat
                    label="Last round"
                    value={highlightRound ? `R${highlightRound}` : "—"}
                  />
                  <DetailStat label="Momentum" value={momentumCopy(ranking)} />
                </div>
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}

function MovementChip({ movement }: { movement: TeamMovement }) {
  const palette: Record<TeamMovement, { label: string; className: string }> = {
    up: { label: "Rise", className: "bg-emerald-400/15 text-emerald-100" },
    down: { label: "Dip", className: "bg-rose-400/15 text-rose-100" },
    new: { label: "New", className: "bg-sky-400/15 text-sky-100" },
    same: { label: "Even", className: "bg-white/10 text-white/60" },
  };

  const tone = palette[movement];

  return (
    <span
      className={cn(
        "inline-flex min-w-[64px] items-center justify-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]",
        tone.className
      )}
    >
      {tone.label}
    </span>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-xs uppercase tracking-[0.35em] text-white/50">
        {label}
      </span>
      <span className="font-semibold text-white">
        {value}
      </span>
    </div>
  );
}

function momentumCopy(ranking: TeamRanking & { movement: TeamMovement }) {
  if (ranking.recentDelta > 0) {
    return `+${formatPoints(ranking.recentDelta)} last round`;
  }
  if (ranking.recentDelta < 0) {
    return `${formatPoints(ranking.recentDelta)} last round`;
  }
  return "Holding steady";
}

function formatDelta(delta: number) {
  if (delta > 0) return `+${formatPoints(delta)}`;
  if (delta < 0) return `${formatPoints(delta)}`;
  return "±0";
}

function formatPoints(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}
