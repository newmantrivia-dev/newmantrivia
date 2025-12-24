import type { events, rounds, teams, scores, scoreAuditLog } from "@/lib/db/schema";

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

export type Round = typeof rounds.$inferSelect;
export type NewRound = typeof rounds.$inferInsert;

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;

export type Score = typeof scores.$inferSelect;
export type NewScore = typeof scores.$inferInsert;

export type AuditLog = typeof scoreAuditLog.$inferSelect;
export type NewAuditLog = typeof scoreAuditLog.$inferInsert;

export type EventWithDetails = Event & {
  rounds: Round[];
  teams: Team[];
  scores: Score[];
};

export type TeamWithScores = Team & {
  scores: Score[];
};

export type EventWithTeamsAndScores = Event & {
  teams: TeamWithScores[];
  rounds: Round[];
};

export type TeamRanking = {
  team: Team;
  totalScore: number;
  rank: number;
  roundScores: {
    roundNumber: number;
    points: number;
  }[];
  lastRoundPoints: number;
  recentDelta: number;
  averageScore: number;
};

export type LeaderboardData = {
  event: Event;
  rankings: TeamRanking[];
  currentRound: number | null;
  totalRounds: number;
  lastUpdated: Date;
  lastCompletedRound: number | null;
  highlights: LeaderboardHighlights;
  roundsSummary: RoundSummary[];
};

export type RoundSummary = {
  roundNumber: number;
  name?: string | null;
  isBonus: boolean;
  maxPoints?: number | null;
  status: "completed" | "current" | "upcoming";
  topTeamName?: string | null;
  topScore?: number | null;
};

export type LeaderboardHighlights = {
  leader: {
    team: Team;
    total: number;
    leadOverNext: number | null;
  } | null;
  surging: {
    team: Team;
    delta: number;
    roundNumber: number | null;
  } | null;
  roundHero: {
    team: Team;
    points: number;
    roundNumber: number;
  } | null;
  tightRace: {
    margin: number;
    teams: [Team, Team];
  } | null;
};

export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export type CreateEventInput = {
  name: string;
  description?: string;
  scheduledDate?: Date;
  rounds: {
    roundName?: string;
    description?: string;
    maxPoints?: number;
    isBonus: boolean;
  }[];
  teams?: {
    name: string;
  }[];
};

export type UpdateEventInput = Partial<CreateEventInput> & {
  id: string;
};

export type AddTeamInput = {
  eventId: string;
  name: string;
  joinedRound?: number;
};

export type SaveScoreInput = {
  eventId: string;
  teamId: string;
  roundNumber: number;
  points: number;
  reason?: string;
};

export type AddRoundInput = {
  eventId: string;
  roundName?: string;
  description?: string;
  maxPoints?: number;
  isBonus: boolean;
};

export type EventFilter = {
  status?: Event["status"];
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

export type PaginationParams = {
  page: number;
  limit: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
