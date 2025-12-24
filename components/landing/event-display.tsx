import { getPublicEventData } from "@/actions/leaderboard";
import { ConfettiEffect } from "@/components/landing/confetti";
import { RealtimeEventWrapper } from "@/components/landing/realtime-event-wrapper";
import { ActiveOrCompletedStateWrapper } from "@/components/landing/active-state-wrapper";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { LeaderboardData } from "@/lib/types";
import {
  CalendarDays,
  Fuel,
  Hourglass,
} from "lucide-react";
import {
  format,
  formatDistanceToNowStrict,
} from "date-fns";

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
        <RealtimeEventWrapper
          eventId={result.data.event.id}
          initialData={result.data}
          mode="completed"
        >
          <ActiveOrCompletedStateWrapper mode="completed" />
        </RealtimeEventWrapper>
      </>
    );
  }

  return (
    <RealtimeEventWrapper
      eventId={result.data.event.id}
      initialData={result.data}
      mode="active"
    >
      <ActiveOrCompletedStateWrapper mode="active" />
    </RealtimeEventWrapper>
  );
}

function EmptyState() {
  return (
    <div className="relative flex flex-1 items-center justify-center px-6 py-24">
      <Card className="relative z-10 w-full max-w-2xl overflow-hidden border-white/10 bg-white/5 p-12 text-center text-slate-100 shadow-2xl backdrop-blur">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
          <Fuel className="h-10 w-10" />
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
            <div className="rounded-3xl border border-white/10 bg-linear-to-tr from-sky-400/20 to-pink-500/20 p-6 shadow-lg">
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

function FloatingOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 animate-pulse">
      <div className="absolute -top-32 left-12 h-72 w-72 rounded-full bg-pink-500/20 blur-3xl" />
      <div className="absolute right-24 top-20 h-64 w-64 rounded-full bg-sky-400/25 blur-3xl" />
      <div className="absolute bottom-10 right-12 h-56 w-56 rounded-full bg-indigo-500/30 blur-3xl" />
    </div>
  );
}

