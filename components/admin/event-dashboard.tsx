import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/server";
import { getEventById } from "@/lib/queries/events";
import { adminPaths } from "@/lib/paths";
import { ArrowLeft, Users, Target, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { RoundTabs } from "./round-tabs";
import { CurrentStandings } from "./current-standings";
import { EventActions } from "./event-actions";

export async function EventDashboard({ eventId }: { eventId: string }) {
    await requireAdmin();
  
    const event = await getEventById(eventId);
  
    if (!event) {
      notFound();
    }
  
    // Only show this dashboard for active events
    if (event.status !== "active") {
      return (
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-2xl font-semibold mb-2">Event Not Active</h3>
            <p className="text-muted-foreground mb-6">
              This event is currently {event.status}. You can only manage active events here.
            </p>
            <Button asChild>
              <Link href={adminPaths.root}>Back to Events</Link>
            </Button>
          </Card>
        </div>
      );
    }
  
    const currentRound = event.currentRound || 1;
    const totalRounds = event.rounds.length;
  
    // Calculate total scores for each team
    const teamTotals = event.teams.map((team) => {
      const teamScores = event.scores.filter((s) => s.teamId === team.id);
      const total = teamScores.reduce((sum, score) => sum + parseFloat(score.points), 0);
      return { team, total };
    });
  
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Button variant="ghost" size="icon" asChild>
              <Link href={adminPaths.root}>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold truncate">{event.name}</h1>
              {event.description && (
                <p className="text-muted-foreground mt-1">{event.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <Badge className="bg-green-500">Active</Badge>
                <span className="text-sm text-muted-foreground">
                  Round {currentRound} of {totalRounds}
                </span>
                {event.startedAt && (
                  <span className="text-sm text-muted-foreground">
                    Started {formatDistanceToNow(new Date(event.startedAt), { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>
          </div>
          <EventActions event={event} />
        </div>
  
        <Separator />
  
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{event.teams.length}</div>
            </CardContent>
          </Card>
  
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rounds</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRounds}</div>
            </CardContent>
          </Card>
  
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Round</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
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