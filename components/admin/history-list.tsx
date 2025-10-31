import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth/server";
import { getHistoricalEvents } from "@/lib/queries/events";
import { adminPaths } from "@/lib/paths";
import { Eye, Calendar, Users, Trophy } from "lucide-react";

export async function HistoryList({ page = 1 }: { page?: number }) {
    await requireAdmin();
  
    const result = await getHistoricalEvents(page, 20);
  
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Event History</h1>
          <p className="text-muted-foreground mt-1">
            View all completed and archived trivia events
          </p>
        </div>
  
        <Separator />
  
        {result.events.length > 0 ? (
          <div className="space-y-4">
            {result.events.map((event) => {
              // Calculate winner
              const teamTotals = event.teams?.map((team) => {
                const teamScores = event.scores?.filter((s) => s.teamId === team.id) || [];
                const total = teamScores.reduce((sum, score) => sum + parseFloat(score.points), 0);
                return { team, total };
              }) || [];
  
              teamTotals.sort((a, b) => b.total - a.total);
              const winner = teamTotals[0];
  
              return (
                <Card key={event.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <CardTitle className="text-xl truncate">{event.name}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {event.status}
                          </Badge>
                        </div>
                        {event.description && (
                          <CardDescription className="line-clamp-2">
                            {event.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {event.endedAt
                            ? new Date(event.endedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{event.teams?.length || 0} teams</span>
                      </div>
                      {winner && (
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-amber-500" />
                          <span>
                            <span className="font-medium">{winner.team.name}</span> ({winner.total}{" "}
                            pts)
                          </span>
                        </div>
                      )}
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={adminPaths.events.view(event.id)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
  
            {result.hasMore && (
              <div className="flex justify-center pt-4">
                <Button variant="outline" asChild>
                  <Link href={`${adminPaths.history}?page=${page + 1}`}>Load More Events</Link>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-semibold mb-2">No Historical Events</h3>
            <p className="text-muted-foreground mb-6">
              Completed or archived events will appear here
            </p>
            <Button asChild>
              <Link href={adminPaths.root}>Back to Events</Link>
            </Button>
          </Card>
        )}
      </div>
    );
  }