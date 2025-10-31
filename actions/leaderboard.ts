import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq, and, gte, desc, asc } from "drizzle-orm";
import type { TeamRanking, LeaderboardData, Event, Team, Round, Score } from "@/lib/types";

/**
 * Get active or upcoming event for public display
 * Priority: active > recently completed (48h) > upcoming > none
 */
export async function getPublicEventData(): Promise<
  | { type: "active"; data: LeaderboardData }
  | { type: "completed"; data: LeaderboardData }
  | { type: "upcoming"; event: LeaderboardData["event"] }
  | { type: "none" }
> {
  // Check for active event first
  const activeEvent = await db.query.events.findFirst({
    where: eq(events.status, "active"),
    with: {
      teams: {
        orderBy: (teams, { asc }) => [asc(teams.name)],
      },
      rounds: {
        orderBy: (rounds, { asc }) => [asc(rounds.roundNumber)],
      },
      scores: true,
    },
  });

  if (activeEvent) {
    const leaderboardData = calculateLeaderboard(activeEvent);
    return { type: "active", data: leaderboardData };
  }

  // Check for recently completed event (within 48 hours)
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const completedEvent = await db.query.events.findFirst({
    where: and(
      eq(events.status, "completed"),
      gte(events.endedAt, twoDaysAgo)
    ),
    orderBy: [desc(events.endedAt)],
    with: {
      teams: {
        orderBy: (teams, { asc }) => [asc(teams.name)],
      },
      rounds: {
        orderBy: (rounds, { asc }) => [asc(rounds.roundNumber)],
      },
      scores: true,
    },
  });

  if (completedEvent) {
    const leaderboardData = calculateLeaderboard(completedEvent);
    return { type: "completed", data: leaderboardData };
  }

  // Check for upcoming event
  const upcomingEvent = await db.query.events.findFirst({
    where: eq(events.status, "upcoming"),
    orderBy: [asc(events.scheduledDate)],
  });

  if (upcomingEvent) {
    return {
      type: "upcoming",
      event: upcomingEvent,
    };
  }

  return { type: "none" };
}

/**
 * Calculate leaderboard rankings from event data
 */
function calculateLeaderboard(
  event: Event & { teams: Team[]; rounds: Round[]; scores: Score[] }
): LeaderboardData {
  if (!event.teams || !event.rounds || !event.scores) {
    throw new Error("Event data incomplete");
  }

  // Calculate totals for each team
  const teamRankings: TeamRanking[] = event.teams.map((team: Team) => {
    const teamScores = event.scores.filter((score: Score) => score.teamId === team.id);

    const roundScores = event.rounds.map((round: Round) => {
      const score = teamScores.find((s: Score) => s.roundNumber === round.roundNumber);
      return {
        roundNumber: round.roundNumber,
        points: score ? parseFloat(score.points) : 0,
      };
    });

    const totalScore = roundScores.reduce((sum: number, rs) => sum + rs.points, 0);

    return {
      team,
      totalScore,
      rank: 0, // Will be calculated after sorting
      roundScores,
    };
  });

  // Sort by total score (descending) and assign ranks
  teamRankings.sort((a, b) => b.totalScore - a.totalScore);
  teamRankings.forEach((ranking, index) => {
    ranking.rank = index + 1;
  });

  return {
    event,
    rankings: teamRankings,
    currentRound: event.currentRound,
    totalRounds: event.rounds.length,
    lastUpdated: event.updatedAt,
  };
}

