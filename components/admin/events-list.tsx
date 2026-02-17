import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EventCard } from "./event-card";
import { adminPaths } from "@/lib/paths";
import {
  getActiveEvents,
  getUpcomingEvents,
  getDraftEvents,
  getRecentlyCompletedEvents,
} from "@/lib/queries/events";
import { requireAdmin } from "@/lib/auth/server";
import { Plus } from "lucide-react";
import { EventsListRealtime } from "./events-list-realtime";

export default async function EventsList() {
    await requireAdmin();
  
    const [activeEvents, upcomingEvents, draftEvents, recentlyCompleted] = await Promise.all([
      getActiveEvents(),
      getUpcomingEvents(),
      getDraftEvents(),
      getRecentlyCompletedEvents(),
    ]);
  
    return (
      <div className="space-y-8">
        <EventsListRealtime />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Trivia Events</h1>
            <p className="text-muted-foreground mt-1">
              Manage your trivia events and leaderboards
            </p>
          </div>
          <Button asChild size="lg">
            <Link href={adminPaths.events.new}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Event
            </Link>
          </Button>
        </div>
  
        <Separator />
  
        {/* Active Events */}
        {activeEvents.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">⚡</span>
              <h2 className="text-2xl font-semibold">Active Events</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {activeEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}
  
        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">📅</span>
              <h2 className="text-2xl font-semibold">Upcoming Events</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}
  
        {/* Draft Events */}
        {draftEvents.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">📝</span>
              <h2 className="text-2xl font-semibold">Draft Events</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {draftEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}
  
        {/* Recently Completed */}
        {recentlyCompleted.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">✅</span>
                <h2 className="text-2xl font-semibold">Recently Completed</h2>
              </div>
              <Button variant="outline" asChild>
                <Link href={adminPaths.history}>View All History →</Link>
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentlyCompleted.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}
  
        {/* Empty State */}
        {activeEvents.length === 0 &&
          upcomingEvents.length === 0 &&
          draftEvents.length === 0 &&
          recentlyCompleted.length === 0 && (
            <Card className="p-12 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-2xl font-semibold mb-2">No Events Yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first trivia event to get started
              </p>
              <Button asChild size="lg">
                <Link href={adminPaths.events.new}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Event
                </Link>
              </Button>
            </Card>
          )}
      </div>
    );
  }
