import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getActiveEvents() {
  return await db.query.events.findMany({
    where: eq(events.status, "active"),
    with: {
      teams: true,
      rounds: {
        orderBy: (rounds, { asc }) => [asc(rounds.roundNumber)],
      },
    },
    orderBy: [desc(events.startedAt)],
  });
}

export async function getUpcomingEvents() {
  return await db.query.events.findMany({
    where: eq(events.status, "upcoming"),
    orderBy: [desc(events.scheduledDate)],
  });
}

export async function getDraftEvents() {
  return await db.query.events.findMany({
    where: eq(events.status, "draft"),
    orderBy: [desc(events.createdAt)],
  });
}

export async function getRecentlyCompletedEvents() {
  return await db.query.events.findMany({
    where: eq(events.status, "completed"),
    orderBy: [desc(events.endedAt)],
    limit: 3,
  });
}

export async function getHistoricalEvents(page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;

  const allEvents = await db.query.events.findMany({
    where: (events, { or, eq }) => or(
      eq(events.status, "completed"),
      eq(events.status, "archived")
    ),
    with: {
      teams: true,
      scores: true,
    },
    orderBy: [desc(events.endedAt), desc(events.createdAt)],
    limit: limit + 1,
    offset,
  });

  const hasMore = allEvents.length > limit;
  const eventsData = hasMore ? allEvents.slice(0, limit) : allEvents;

  return {
    events: eventsData,
    hasMore,
    page,
  };
}

export async function getArchivedEvents(page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;

  const allEvents = await db.query.events.findMany({
    where: eq(events.status, "archived"),
    orderBy: [desc(events.createdAt)],
    limit: limit + 1,
    offset,
  });

  const hasMore = allEvents.length > limit;
  const eventsData = hasMore ? allEvents.slice(0, limit) : allEvents;

  return {
    events: eventsData,
    hasMore,
    page,
  };
}

export async function getEventById(eventId: string) {
  return await db.query.events.findFirst({
    where: eq(events.id, eventId),
    with: {
      teams: {
        orderBy: (teams, { asc }) => [asc(teams.name)],
      },
      rounds: {
        orderBy: (rounds, { asc }) => [asc(rounds.roundNumber)],
      },
      scores: true,
      creator: true,
    },
  });
}
