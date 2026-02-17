import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq, and, gte, desc, asc } from "drizzle-orm";
import type {
  TeamRanking,
  TeamMovement,
  LeaderboardData,
  Event,
  Team,
  Round,
  Score,
} from "@/lib/types";

export async function getPublicEventData(): Promise<
  | { type: "active"; data: LeaderboardData }
  | { type: "completed"; data: LeaderboardData }
  | { type: "upcoming"; event: LeaderboardData["event"] }
  | { type: "none" }
> {
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

  const sortedRoundNumbers = event.rounds
    .map((round) => round.roundNumber)
    .sort((a, b) => a - b);

  const scoreKey = (teamId: string, roundNumber: number) => `${teamId}:${roundNumber}`;
  const recordedScores = new Set(
    event.scores.map((score) => scoreKey(score.teamId, score.roundNumber))
  );

  const isRoundCompleted = (roundNumber: number) => {
    const eligibleTeams = event.teams.filter((team) => team.joinedRound <= roundNumber);
    if (eligibleTeams.length === 0) return false;
    return eligibleTeams.every((team) => recordedScores.has(scoreKey(team.id, roundNumber)));
  };

  const completedRoundNumbers = sortedRoundNumbers.filter((roundNumber) =>
    isRoundCompleted(roundNumber)
  );

  const fallbackCompletedRound =
    completedRoundNumbers.length > 0
      ? completedRoundNumbers[completedRoundNumbers.length - 1]
      : null;

  let lastCompletedRound: number | null = fallbackCompletedRound;
  if (event.status === "active") {
    const currentRound = event.currentRound ?? 1;
    const candidateRound = currentRound - 1;

    if (candidateRound < 1) {
      lastCompletedRound = null;
    } else if (isRoundCompleted(candidateRound)) {
      lastCompletedRound = candidateRound;
    } else {
      lastCompletedRound =
        completedRoundNumbers.filter((roundNumber) => roundNumber < candidateRound).at(-1) ??
        null;
    }
  }

  const getCumulativeTotalsByRound = (upToRound: number) => {
    const totals = new Map<string, number>(
      event.teams.map((team) => [team.id, 0])
    );

    for (const score of event.scores) {
      if (score.roundNumber > upToRound) continue;
      const points = parseFloat(score.points);
      if (Number.isNaN(points)) continue;
      totals.set(score.teamId, (totals.get(score.teamId) ?? 0) + points);
    }

    return totals;
  };

  const buildRankMap = (totals: Map<string, number>) => {
    const sortedTeams = [...event.teams].sort((a, b) => {
      const totalDelta = (totals.get(b.id) ?? 0) - (totals.get(a.id) ?? 0);
      if (totalDelta !== 0) return totalDelta;
      return a.name.localeCompare(b.name);
    });

    return new Map<string, number>(
      sortedTeams.map((team, index) => [team.id, index + 1])
    );
  };

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

    const averageRoundNumbers = sortedRoundNumbers.filter(
      (roundNumber) =>
        lastCompletedRound !== null &&
        roundNumber <= lastCompletedRound &&
        roundNumber >= team.joinedRound
    );

    const averagePointsTotal = averageRoundNumbers.reduce((sum, roundNumber) => {
      const points = roundScores.find((rs) => rs.roundNumber === roundNumber)?.points ?? 0;
      return sum + points;
    }, 0);

    const averageScore =
      averageRoundNumbers.length > 0
        ? averagePointsTotal / averageRoundNumbers.length
        : 0;

    return {
      team,
      totalScore,
      rank: 0, // Will be calculated after sorting
      movement: "same",
      roundScores,
      lastRoundPoints,
      recentDelta,
      averageScore,
    };
  });

  // Sort by total score (descending) and assign ranks
  teamRankings.sort((a, b) => {
    const totalDelta = b.totalScore - a.totalScore;
    if (totalDelta !== 0) return totalDelta;
    return a.team.name.localeCompare(b.team.name);
  });
  teamRankings.forEach((ranking, index) => {
    ranking.rank = index + 1;
  });

  const previousComparisonRound =
    event.status === "active"
      ? lastCompletedRound
      : lastCompletedRound && lastCompletedRound > 1
        ? lastCompletedRound - 1
        : null;

  if (previousComparisonRound) {
    const currentRanks = new Map(
      teamRankings.map((ranking) => [ranking.team.id, ranking.rank])
    );
    const previousRanks = buildRankMap(getCumulativeTotalsByRound(previousComparisonRound));

    for (const ranking of teamRankings) {
      const currentRank = currentRanks.get(ranking.team.id);
      const previousRank = previousRanks.get(ranking.team.id);

      if (!previousRank || !currentRank) {
        ranking.movement = "new";
      } else if (currentRank < previousRank) {
        ranking.movement = "up";
      } else if (currentRank > previousRank) {
        ranking.movement = "down";
      } else {
        ranking.movement = "same";
      }
    }
  }

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
