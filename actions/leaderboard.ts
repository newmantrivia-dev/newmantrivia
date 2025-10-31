import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq, and, gte, desc, asc } from "drizzle-orm";
import type {
  TeamRanking,
  LeaderboardData,
  Event,
  Team,
  Round,
  Score,
} from "@/lib/types";

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

  const teamsById = new Map(event.teams.map((team) => [team.id, team]));

  const scoresByRound = new Map<number, Score[]>();
  for (const score of event.scores) {
    const roundScores = scoresByRound.get(score.roundNumber) ?? [];
    roundScores.push(score);
    scoresByRound.set(score.roundNumber, roundScores);
  }

  const completedRoundNumbers = Array.from(scoresByRound.entries())
    .filter(([, scores]) => scores.length > 0)
    .map(([roundNumber]) => roundNumber)
    .sort((a, b) => a - b);

  const lastCompletedRound =
    completedRoundNumbers.length > 0
      ? completedRoundNumbers[completedRoundNumbers.length - 1]
      : null;

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

    const lastRoundPoints = lastCompletedRound
      ? roundScores.find((rs) => rs.roundNumber === lastCompletedRound)?.points ?? 0
      : 0;
    const previousRoundPoints = lastCompletedRound && lastCompletedRound > 1
      ? roundScores.find((rs) => rs.roundNumber === lastCompletedRound - 1)?.points ?? 0
      : 0;
    const recentDelta = lastCompletedRound ? lastRoundPoints - previousRoundPoints : 0;

    const averageScore = event.rounds.length > 0 ? totalScore / event.rounds.length : 0;

    return {
      team,
      totalScore,
      rank: 0, // Will be calculated after sorting
      roundScores,
      lastRoundPoints,
      recentDelta,
      averageScore,
    };
  });

  // Sort by total score (descending) and assign ranks
  teamRankings.sort((a, b) => b.totalScore - a.totalScore);
  teamRankings.forEach((ranking, index) => {
    ranking.rank = index + 1;
  });

  const isCompletedEvent = event.status === "completed";

  const roundsSummary = event.rounds.map((round) => {
    const roundScores = scoresByRound.get(round.roundNumber) ?? [];
    const hasScores = roundScores.length > 0;

    const status: "completed" | "current" | "upcoming" = (() => {
      if (isCompletedEvent) {
        return hasScores ? "completed" : "upcoming";
      }
      if (event.currentRound && round.roundNumber === event.currentRound) {
        return "current";
      }
      if (event.currentRound && round.roundNumber < event.currentRound) {
        return "completed";
      }
      if (hasScores) {
        return "completed";
      }
      return "upcoming";
    })();

    const topScoreEntry = roundScores.reduce<
      { points: number; teamId: string } | null
    >((acc, score) => {
      const points = parseFloat(score.points);
      if (Number.isNaN(points)) return acc;
      if (!acc || points > acc.points) {
        return { points, teamId: score.teamId };
      }
      return acc;
    }, null);

    return {
      roundNumber: round.roundNumber,
      name: round.roundName,
      isBonus: Boolean(round.isBonus),
      maxPoints: round.maxPoints,
      status,
      topTeamName: topScoreEntry ? teamsById.get(topScoreEntry.teamId)?.name ?? null : null,
      topScore: topScoreEntry ? topScoreEntry.points : null,
    };
  });

  const leader = teamRankings[0] ?? null;
  const runnerUp = teamRankings[1] ?? null;

  const surgingCandidate = lastCompletedRound
    ? [...teamRankings]
        .filter((ranking) => ranking.recentDelta > 0)
        .sort((a, b) => b.recentDelta - a.recentDelta)[0] ?? null
    : null;

  const highestSingleRoundScore = event.scores.reduce<
    { points: number; teamId: string; roundNumber: number } | null
  >((acc, score) => {
    const points = parseFloat(score.points);
    if (Number.isNaN(points)) return acc;
    if (!acc || points > acc.points) {
      return { points, teamId: score.teamId, roundNumber: score.roundNumber };
    }
    return acc;
  }, null);

  let tightRace: {
    margin: number;
    teams: [Team, Team];
  } | null = null;

  for (let i = 0; i < teamRankings.length - 1; i++) {
    const current = teamRankings[i];
    const next = teamRankings[i + 1];
    const margin = current.totalScore - next.totalScore;
    if (margin <= 0) continue;
    if (!tightRace || margin < tightRace.margin) {
      tightRace = {
        margin,
        teams: [current.team, next.team],
      };
    }
  }

  return {
    event,
    rankings: teamRankings,
    currentRound: event.currentRound,
    totalRounds: event.rounds.length,
    lastUpdated: event.updatedAt,
    lastCompletedRound,
    highlights: {
      leader: leader
        ? {
            team: leader.team,
            total: leader.totalScore,
            leadOverNext: runnerUp
              ? leader.totalScore - runnerUp.totalScore
              : null,
          }
        : null,
      surging: surgingCandidate
        ? {
            team: surgingCandidate.team,
            delta: surgingCandidate.recentDelta,
            roundNumber: lastCompletedRound,
          }
        : null,
      roundHero: highestSingleRoundScore
        ? {
            team: teamsById.get(highestSingleRoundScore.teamId)!,
            points: highestSingleRoundScore.points,
            roundNumber: highestSingleRoundScore.roundNumber,
          }
        : null,
      tightRace,
    },
    roundsSummary,
  };
}
