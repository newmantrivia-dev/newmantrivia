'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminPaths } from "@/lib/paths";
import { ArrowLeft, Users, Target, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { RoundTabs } from "./round-tabs";
import { CurrentStandings } from "./current-standings";
import { EventActions } from "./event-actions";
import { useEventDashboardData } from "./realtime-event-dashboard";

export function EventDashboardContent() {
  const event = useEventDashboardData();

  const currentRound = event.currentRound || 1;
  const totalRounds = event.rounds.length;

  const teamTotals = event.teams.map((team) => {
    const teamScores = event.scores.filter((s) => s.teamId === team.id);
    const total = teamScores.reduce((sum, score) => sum + parseFloat(score.points), 0);
    return { team, total };
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
          <Button variant="ghost" size="icon" className="mt-0.5 h-9 w-9 shrink-0" asChild>
            <Link href={adminPaths.root}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="truncate text-2xl font-bold sm:text-3xl">{event.name}</h1>
            {event.description && (
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">{event.description}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3">
              <Badge className="bg-green-500">Active</Badge>
              <span className="text-xs text-muted-foreground sm:text-sm">
                Round {currentRound} of {totalRounds}
              </span>
              {event.startedAt && (
                <span className="text-xs text-muted-foreground sm:text-sm">
                  Started {formatDistanceToNow(new Date(event.startedAt), { addSuffix: true })}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="w-full lg:w-auto">
          <EventActions event={event} />
        </div>
      </div>

      <Separator />

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">Total Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl">{event.teams.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">Total Rounds</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl">{totalRounds}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">Current Round</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl">
              {currentRound} / {totalRounds}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Round Tabs & Score Entry */}
      <RoundTabs event={event} currentRound={currentRound} />

      {/* Current Standings */}
      <CurrentStandings teamTotals={teamTotals} />
    </div>
  );
}
