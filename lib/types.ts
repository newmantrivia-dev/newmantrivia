import type { events, rounds, teams, scores, scoreAuditLog } from "@/lib/db/schema";

/**
 * Type utilities for inferring types from Drizzle schema
 */
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

/**
 * Extended types with relations for complex queries
 */
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

/**
 * Calculated types for leaderboard display
 */
export type TeamRanking = {
  team: Team;
  totalScore: number;
  rank: number;
  roundScores: {
    roundNumber: number;
    points: number;
  }[];
};

export type LeaderboardData = {
  event: Event;
  rankings: TeamRanking[];
  currentRound: number | null;
  totalRounds: number;
  lastUpdated: Date;
};

/**
 * Server Action response types
 */
export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Form input types
 */
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

/**
 * Filter and pagination types
 */
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
