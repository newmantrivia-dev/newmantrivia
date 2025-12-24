import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/server";
import { getEventById } from "@/lib/queries/events";
import { adminPaths } from "@/lib/paths";
import { ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { EventDetailsActions } from "./event-details-actions";
import { FinalLeaderboard } from "./final-leaderboard";
import { RoundBreakdown } from "./round-breakdown";

export async function EventDetailsView({ eventId }: { eventId: string }) {
    await requireAdmin();
  
    const event = await getEventById(eventId);
  
    if (!event) {
      notFound();
    }
  
    const teamTotals = event.teams.map((team) => {
      const teamScores = event.scores.filter((s) => s.teamId === team.id);
      const roundScores = event.rounds.map((round) => {
        const score = teamScores.find((s) => s.roundNumber === round.roundNumber);
        return {
          roundNumber: round.roundNumber,
          roundName: round.roundName,
          points: score ? parseFloat(score.points) : 0,
        };
      });
      const total = roundScores.reduce((sum, rs) => sum + rs.points, 0);
  
      return { team, total, roundScores };
    });
  
    teamTotals.sort((a, b) => b.total - a.total);
  
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Button variant="ghost" size="icon" asChild>
              <Link href={adminPaths.history}>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold truncate">{event.name}</h1>
              {event.description && (
                <p className="text-muted-foreground mt-1">{event.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {event.status === "completed" && <Badge variant="outline">Completed</Badge>}
                {event.status === "archived" && <Badge variant="outline">Archived</Badge>}
                {event.endedAt && (
                  <span className="text-sm text-muted-foreground">
                    Ended {formatDistanceToNow(new Date(event.endedAt), { addSuffix: true })}
                  </span>
                )}
                {event.startedAt && event.endedAt && (
                  <span className="text-sm text-muted-foreground">
                    Duration:{" "}
                    {formatDistanceToNow(new Date(event.startedAt), {
                      includeSeconds: false,
                    }).replace("about ", "")}
                  </span>
                )}
              </div>
            </div>
          </div>
          <EventDetailsActions event={event} />
        </div>
  
        <Separator />
  
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{event.teams.length}</div>
            </CardContent>
          </Card>
  
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Rounds</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{event.rounds.length}</div>
            </CardContent>
          </Card>
  
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Winner</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold truncate">
                {teamTotals[0]?.team.name || "—"}
              </div>
              <p className="text-sm text-muted-foreground">
                {teamTotals[0]?.total || 0} points
              </p>
            </CardContent>
          </Card>
        </div>
  
        {/* Final Standings */}
        <FinalLeaderboard teamTotals={teamTotals} />
  
        {/* Round Breakdown */}
        <RoundBreakdown event={event} teamTotals={teamTotals} />
      </div>
    );
  }