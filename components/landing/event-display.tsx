import { getPublicEventData } from "@/actions/leaderboard";
import { Leaderboard } from "@/components/landing/leaderboard";
import { ConfettiEffect } from "@/components/landing/confetti";
import { ShareLeaderboardButton } from "@/components/landing/share-button";
import { RefreshPrompt } from "@/components/landing/refresh-prompt";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { LeaderboardData } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Activity,
  CalendarDays,
  Crown,
  Flame,
  Hourglass,
  Sparkles,
  Trophy,
} from "lucide-react";
import {
  format,
  formatDistanceToNow,
  formatDistanceToNowStrict,
} from "date-fns";

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

export default async function EventDisplay() {
  const result = await getPublicEventData();

  if (result.type === "none") {
    return <EmptyState />;
  }

  if (result.type === "upcoming") {
    return <UpcomingState event={result.event} />;
  }

  if (result.type === "completed") {
    return (
      <>
        <ConfettiEffect />
        <ActiveOrCompletedState data={result.data} mode="completed" />
      </>
    );
  }

  return <ActiveOrCompletedState data={result.data} mode="active" />;
}

function EmptyState() {
  return (
    <div className="relative flex flex-1 items-center justify-center px-6 py-24">
      <Card className="relative z-10 w-full max-w-2xl overflow-hidden border-white/10 bg-white/5 p-12 text-center text-slate-100 shadow-2xl backdrop-blur">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
          <Sparkles className="h-10 w-10" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Trivia takes a breather</h1>
        <p className="mt-3 text-sm uppercase tracking-[0.35em] text-indigo-200">
          Leaderboard standby
        </p>
        <p className="mt-6 text-slate-200/80">
          No live events right now. Newman Trivia returns soon with fresh questions and fresh rivalries. Stay tuned for updates!
        </p>
      </Card>
      <FloatingOrbs />
    </div>
  );
}

function UpcomingState({ event }: { event: LeaderboardData["event"] }) {
  const scheduledDate = event.scheduledDate ? new Date(event.scheduledDate) : null;
  const countdown = scheduledDate
    ? formatDistanceToNowStrict(scheduledDate, { addSuffix: true })
    : "TBA";

  return (
    <div className="relative flex flex-1 items-center justify-center px-6 py-24">
      <FloatingOrbs />
      <Card className="relative z-10 w-full max-w-4xl overflow-hidden border-white/10 bg-white/10 p-10 text-slate-100 shadow-2xl backdrop-blur">
        <div className="absolute -top-20 right-10 h-48 w-48 rounded-full bg-pink-400/40 blur-3xl" />
        <div className="absolute -bottom-24 left-8 h-56 w-56 rounded-full bg-sky-500/30 blur-3xl" />
        <div className="relative grid gap-10 md:grid-cols-[1.2fr,0.8fr]">
          <div className="space-y-6">
            <Badge className="border border-indigo-200/30 bg-indigo-500/20 text-indigo-100 backdrop-blur">
              Upcoming spotlight
            </Badge>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">{event.name}</h1>
              {event.description && (
                <p className="mt-4 text-lg text-slate-100/80">{event.description}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm text-indigo-100/80">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                <span>
                  {scheduledDate
                    ? format(scheduledDate, "EEEE, MMMM d")
                    : "Date coming soon"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Hourglass className="h-5 w-5" />
                <span>{countdown}</span>
              </div>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-6 shadow-lg">
              <p className="text-sm uppercase tracking-[0.4em] text-indigo-200">Get ready</p>
              <h2 className="mt-4 text-2xl font-semibold">Recruit your team early</h2>
              <p className="mt-2 text-sm text-indigo-100/80">
                Save the date, polish the trivia chops, and meet us courtside for the next showdown.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-gradient-to-tr from-sky-400/20 to-pink-500/20 p-6 shadow-lg">
              <p className="text-sm uppercase tracking-[0.4em] text-white/70">Bring the hype</p>
              <p className="mt-3 text-lg font-semibold text-white">
                Share the event link with your team and the Newman community.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ActiveOrCompletedState({
  data,
  mode,
}: {
  data: LeaderboardData;
  mode: "active" | "completed";
}) {
  const event = data.event;
  const heroTitle = mode === "completed" ? "Final showdown" : "Live standings";
  const statusLabel = mode === "completed" ? "Completed" : "Live now";
  const statusAccent = mode === "completed" ? "bg-emerald-400/30" : "bg-rose-400/30";
  const statusText = mode === "completed" ? "text-emerald-100" : "text-rose-100";
  const updatedCopy = mode === "completed"
    ? event.endedAt
      ? `Wrapped ${formatDistanceToNow(new Date(event.endedAt), { addSuffix: true })}`
      : "Event completed"
    : `Updated ${formatDistanceToNow(new Date(data.lastUpdated), { addSuffix: true })}`;

  return (
    <div className="relative flex flex-1 flex-col px-4 pb-24 pt-24 sm:px-6 lg:px-10">
      <RefreshPrompt isCompleted={mode === "completed"} />
      <FloatingOrbs />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-12">
        <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/10 p-10 shadow-2xl backdrop-blur">
          <div className="absolute -left-20 top-10 h-56 w-56 rounded-full bg-pink-500/30 blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-sky-500/30 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_60%)]" />
          <div className="relative space-y-8">
            <header className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl space-y-4">
                <Badge className={cn("border-none px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.35em]", statusAccent, statusText)}>
                  {statusLabel}
                </Badge>
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-indigo-200">
                    Newman Trivia Leaderboard
                  </p>
                  <h1 className="mt-3 text-4xl font-bold tracking-tight text-white md:text-5xl">
                    {event.name}
                  </h1>
                </div>
                {event.description && (
                  <p className="text-lg text-indigo-100/85">{event.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-4 text-sm text-indigo-100/70">
                  <span>{heroTitle}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>{updatedCopy}</span>
                </div>
              </div>
              <ShareLeaderboardButton eventName={event.name} />
            </header>

            <div className="grid gap-4 md:grid-cols-3">
              <HeroStat
                icon={Trophy}
                label="Teams on the board"
                value={`${data.rankings.length}`}
              />
              <HeroStat
                icon={Activity}
                label={mode === "completed" ? "Rounds played" : "Current round"}
                value={mode === "completed" ? `${data.totalRounds}` : `${data.currentRound ?? "—"} / ${data.totalRounds}`}
              />
              <HeroStat
                icon={Flame}
                label={mode === "completed" ? "Champion margin" : "Chasing the leader"}
                value={formatLeaderStat(data, mode)}
              />
            </div>
          </div>
        </section>

        <HighlightsStrip data={data} />
        <RoundTimeline summary={data.roundsSummary} currentRound={data.currentRound} />

        <section>
          <Leaderboard data={data} isCompleted={mode === "completed"} />
        </section>
      </div>
    </div>
  );
}

function HighlightsStrip({ data }: { data: LeaderboardData }) {
  const items: Array<{
    title: string;
    description: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  }> = [];

  if (data.highlights.leader) {
    const { team, total, leadOverNext } = data.highlights.leader;
    items.push({
      title: `${team.name} out front`,
      description: leadOverNext != null
        ? `${numberFormatter.format(total)} pts • up by ${numberFormatter.format(leadOverNext)}`
        : `${numberFormatter.format(total)} pts • unchallenged`,
      icon: Crown,
    });
  }

  if (data.highlights.surging) {
    const { team, delta, roundNumber } = data.highlights.surging;
    items.push({
      title: `${team.name} heating up`,
      description: `${delta > 0 ? "+" : ""}${numberFormatter.format(delta)} last round${roundNumber ? ` • R${roundNumber}` : ""}`,
      icon: Flame,
    });
  }

  if (data.highlights.tightRace) {
    const { margin, teams } = data.highlights.tightRace;
    items.push({
      title: `Tight race for ${teams[1].name}`,
      description: `${teams[0].name} leads by ${numberFormatter.format(margin)} pts`,
      icon: Activity,
    });
  }

  if (data.highlights.roundHero) {
    const { team, points, roundNumber } = data.highlights.roundHero;
    items.push({
      title: `Round ${roundNumber} hero`,
      description: `${team.name} dropped ${numberFormatter.format(points)} pts`,
      icon: Sparkles,
    });
  }

  if (items.length === 0) {
    items.push({
      title: "Leaderboard warming up",
      description: "Teams are still locking in their first scores",
      icon: Activity,
    });
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item, idx) => (
        <HighlightCard key={idx} {...item} />
      ))}
    </div>
  );
}

function HighlightCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) {
  return (
    <Card className="relative overflow-hidden border-white/10 bg-white/[0.08] p-6 text-slate-100 shadow-xl backdrop-blur transition hover:border-white/40">
      <div className="absolute -top-10 right-0 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex flex-col gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-indigo-200">Highlight</p>
          <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm text-indigo-100/80">{description}</p>
        </div>
      </div>
    </Card>
  );
}

function RoundTimeline({
  summary,
  currentRound,
}: {
  summary: LeaderboardData["roundsSummary"];
  currentRound: LeaderboardData["currentRound"];
}) {
  if (summary.length === 0) return null;

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-indigo-200">Event flow</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Round timeline</h2>
        </div>
        {currentRound && (
          <Badge className="border border-white/10 bg-white/15 text-white backdrop-blur">
            Live round: {currentRound}
          </Badge>
        )}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summary.map((round) => (
          <div
            key={round.roundNumber}
            className={cn(
              "relative overflow-hidden rounded-2xl border border-white/10 p-4 transition",
              round.status === "current" && "border-white/40 bg-white/10",
              round.status === "completed" && "bg-white/5",
            )}
          >
            <div className="flex items-center justify-between text-sm text-indigo-100/70">
              <span className="font-semibold">Round {round.roundNumber}</span>
              {round.isBonus && <Badge className="border border-amber-400/40 bg-amber-400/20 text-amber-50">Bonus</Badge>}
            </div>
            <h3 className="mt-2 text-lg font-semibold text-white">
              {round.name || `Round ${round.roundNumber}`}
            </h3>
            <p className="mt-2 text-sm text-indigo-100/70">
              {round.status === "current"
                ? "Live scoring"
                : round.status === "completed"
                  ? round.topTeamName
                    ? `${round.topTeamName} led with ${round.topScore ?? 0} pts`
                    : "Scores locked"
                  : "Up next"}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HeroStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
}) {
  return (
    <Card className="relative overflow-hidden border-white/10 bg-slate-950/50 p-6 text-white shadow-lg">
      <div className="absolute -top-10 right-0 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-indigo-200">{label}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function FloatingOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 animate-pulse">
      <div className="absolute -top-32 left-12 h-72 w-72 rounded-full bg-pink-500/20 blur-3xl" />
      <div className="absolute right-24 top-20 h-64 w-64 rounded-full bg-sky-400/25 blur-3xl" />
      <div className="absolute bottom-10 right-12 h-56 w-56 rounded-full bg-indigo-500/30 blur-3xl" />
    </div>
  );
}

function formatLeaderStat(data: LeaderboardData, mode: "active" | "completed") {
  if (!data.highlights.leader) {
    return mode === "completed" ? "Final scores" : "Scores pending";
  }
  const lead = data.highlights.leader.leadOverNext;
  if (lead == null || lead <= 0) {
    return "Neck & neck";
  }
  return `${numberFormatter.format(lead)} pts`;
}
