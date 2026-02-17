"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TeamRow } from "./team-row";
import { getRankBadge } from "@/lib/leaderboard-utils";
import type { LeaderboardData, TeamRanking, TeamMovement } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  ChevronDown,
  Flame,
  Sparkles,
  Trophy,
} from "lucide-react";

interface LeaderboardProps {
  data: LeaderboardData;
  isCompleted: boolean;
}

export function Leaderboard({ data, isCompleted }: LeaderboardProps) {
  const [viewMode, setViewMode] = useState<"total" | "last-round">("total");
  const teamMovements = data.rankings;

  const canShowLastRound = Boolean(data.lastCompletedRound);
  const effectiveViewMode: "total" | "last-round" =
    viewMode === "last-round" && canShowLastRound ? "last-round" : "total";

  const displayTeams = useMemo(() => {
    if (effectiveViewMode === "last-round" && data.lastCompletedRound) {
      return [...teamMovements].sort((a, b) => {
        if (b.lastRoundPoints === a.lastRoundPoints) {
          return a.rank - b.rank;
        }
        return b.lastRoundPoints - a.lastRoundPoints;
      });
    }
    return teamMovements;
  }, [teamMovements, effectiveViewMode, data.lastCompletedRound]);

  const lastUpdatedLabel = formatDistanceToNow(new Date(data.lastUpdated), {
    addSuffix: true,
  });

  const hasTeams = data.rankings.length > 0;

  return (
    <div className="space-y-6">
      <LeaderboardTopBar
        isCompleted={isCompleted}
        lastUpdatedLabel={lastUpdatedLabel}
        lastCompletedRound={data.lastCompletedRound}
        activeViewMode={effectiveViewMode}
        setViewMode={setViewMode}
        disableRoundMode={!canShowLastRound}
      />

      <div className="hidden md:block">
        <Card className="overflow-hidden border-white/15 bg-slate-950/40 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <TableHeader hasLastRound={canShowLastRound} />
              <tbody className="divide-y divide-white/5">
                <AnimatePresence mode="popLayout">
                  {displayTeams.map((ranking) => (
                    <TeamRow
                      key={ranking.team.id}
                      ranking={ranking}
                      totalRounds={data.totalRounds}
                      highlightRound={data.lastCompletedRound}
                      viewMode={effectiveViewMode}
                    />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {!hasTeams && <EmptyLeaderboardMessage isCompleted={isCompleted} />}

      <div className="space-y-3 md:hidden">
        {displayTeams.map((ranking) => (
          <MobileTeamCard
            key={ranking.team.id}
            ranking={ranking}
            totalRounds={data.totalRounds}
            highlightRound={data.lastCompletedRound}
          />
        ))}
      </div>
    </div>
  );
}

function LeaderboardTopBar({
  isCompleted,
  lastUpdatedLabel,
  lastCompletedRound,
  activeViewMode,
  setViewMode,
  disableRoundMode,
}: {
  isCompleted: boolean;
  lastUpdatedLabel: string;
  lastCompletedRound: number | null;
  activeViewMode: "total" | "last-round";
  setViewMode: (mode: "total" | "last-round") => void;
  disableRoundMode: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-2">
        <PulseBadge isCompleted={isCompleted} />
        <p className="text-sm text-indigo-100/80">
          {isCompleted ? "Scores locked" : "Streaming live"} • {lastUpdatedLabel}
        </p>
        {lastCompletedRound && (
          <p className="text-xs uppercase tracking-[0.35em] text-indigo-200">
            Last completed round: {lastCompletedRound}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <ViewToggle
          icon={Trophy}
          label="Overall"
          active={activeViewMode === "total"}
          onClick={() => setViewMode("total")}
        />
        <ViewToggle
          icon={Flame}
          label="Last round"
          active={activeViewMode === "last-round"}
          onClick={() => setViewMode("last-round")}
          disabled={disableRoundMode}
        />
      </div>
    </div>
  );
}

function ViewToggle({
  icon: Icon,
  label,
  active,
  onClick,
  disabled,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "cursor-pointer flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] transition",
        disabled
          ? "cursor-not-allowed border-white/10 text-white/30"
          : "hover:border-white/40",
        active
          ? "border-white/40 bg-white/15 text-white shadow-md"
          : "border-white/10 bg-slate-950/40 text-white/70"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function TableHeader({ hasLastRound }: { hasLastRound: boolean }) {
  return (
    <thead className="bg-white/5 text-xs uppercase tracking-[0.35em] text-indigo-200">
      <tr>
        <th className="px-4 py-4 text-left">Rank</th>
        <th className="px-4 py-4 text-left">Team</th>
        {hasLastRound && (
          <th className="px-4 py-4 text-right">Last Round</th>
        )}
        <th className="px-4 py-4 text-right">Total</th>
        <th className="w-12 px-4 py-4 text-right">Details</th>
      </tr>
    </thead>
  );
}

function PulseBadge({ isCompleted }: { isCompleted: boolean }) {
  return (
    <div className="relative inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white">
      <span className="relative flex h-2.5 w-2.5">
        <span
          className={cn(
            "absolute inline-flex h-full w-full rounded-full opacity-75",
            isCompleted ? "bg-emerald-400" : "bg-rose-500",
            isCompleted ? "" : "animate-ping"
          )}
        />
        <span
          className={cn(
            "relative inline-flex h-2.5 w-2.5 rounded-full",
            isCompleted ? "bg-emerald-300" : "bg-rose-400"
          )}
        />
      </span>
      {isCompleted ? "Finalized" : "Live"}
    </div>
  );
}

function EmptyLeaderboardMessage({
  isCompleted,
}: {
  isCompleted: boolean;
}) {
  return (
    <Card className="border-white/10 bg-white/5 p-10 text-center text-indigo-100/80">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
        {isCompleted ? <Sparkles className="h-8 w-8" /> : <Activity className="h-8 w-8" />}
      </div>
      <p className="mt-4 text-lg font-semibold text-white">
        {isCompleted ? "No teams recorded" : "Teams are checking in"}
      </p>
      <p className="mt-2 text-sm">
        {isCompleted
          ? "This event wrapped without recorded scores."
          : "As soon as teams submit their first points, they will appear here."}
      </p>
    </Card>
  );
}

function MobileTeamCard({
  ranking,
  totalRounds,
  highlightRound,
}: {
  ranking: TeamRanking;
  totalRounds: number;
  highlightRound: number | null;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const rankBadge = getRankBadge(ranking.rank);

  return (
    <motion.div
      layout
      initial={ranking.movement === "new" ? { opacity: 0, y: -20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className="cursor-pointer border-white/10 bg-slate-950/40 shadow-lg transition hover:border-white/30"
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl text-white">
                {rankBadge || ranking.rank}
              </span>
              <div>
                <p className="font-semibold text-base text-white">{ranking.team.name}</p>
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                  Avg {formatPoints(ranking.averageScore)} pts
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white">
              <motion.span
                className="text-xl font-bold"
                animate={
                  ranking.movement === "up" || ranking.movement === "down"
                    ? { scale: [1, 1.12, 1] }
                    : {}
                }
                transition={{ duration: 0.4 }}
              >
                {formatPoints(ranking.totalScore)}
              </motion.span>
              <ChevronDown
                className={`h-5 w-5 text-white/60 transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/50">
            <span>Rounds {totalRounds}</span>
            <MovementBadge movement={ranking.movement} />
          </div>
          {highlightRound && (
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white">
              Round {highlightRound}: {formatPoints(ranking.lastRoundPoints)} pts
            </div>
          )}
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3 grid grid-cols-2 gap-3 text-sm"
              >
                {ranking.roundScores.map((rs) => (
                  <div
                    key={rs.roundNumber}
                    className={cn(
                      "rounded-2xl border px-3 py-2 text-white",
                      highlightRound === rs.roundNumber
                        ? "border-primary/60 bg-primary/10"
                        : "border-white/10 bg-white/5"
                    )}
                  >
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                      R{rs.roundNumber}
                    </p>
                    <p className="font-semibold">{formatPoints(rs.points)}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
}

function MovementBadge({ movement }: { movement: TeamMovement }) {
  if (movement === "up") {
    return <Badge className="border-transparent bg-emerald-400/20 text-emerald-100">Rise</Badge>;
  }
  if (movement === "down") {
    return <Badge className="border-transparent bg-rose-400/20 text-rose-100">Dip</Badge>;
  }
  if (movement === "new") {
    return <Badge className="border-transparent bg-sky-400/20 text-sky-100">New</Badge>;
  }
  return <Badge className="border-white/10 bg-white/10 text-white/70">Even</Badge>;
}

function formatPoints(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}
