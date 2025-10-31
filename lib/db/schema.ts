import { relations } from 'drizzle-orm';
import { boolean, decimal, integer, pgTable, text, timestamp, index, pgEnum, uuid, unique } from 'drizzle-orm/pg-core';

// =============================================================================
// ENUMS
// =============================================================================

export const roles = pgEnum("role", ["user", "admin"]);

export const eventStatus = pgEnum("event_status", [
  "draft",
  "upcoming",
  "active",
  "completed",
  "archived"
]);

export const auditAction = pgEnum("audit_action", [
  "created",
  "updated",
  "deleted"
]);

// =============================================================================
// BETTER AUTH TABLES
// =============================================================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  role: roles("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// =============================================================================
// TRIVIA APPLICATION TABLES
// =============================================================================

/**
 * Events table - stores trivia event configurations
 * Status flow: draft → upcoming → active → completed → archived
 */
export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    scheduledDate: timestamp("scheduled_date"),
    status: eventStatus("status").default("draft").notNull(),
    currentRound: integer("current_round"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    startedAt: timestamp("started_at"),
    endedAt: timestamp("ended_at"),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("events_status_idx").on(table.status),
    index("events_created_by_idx").on(table.createdBy),
    index("events_started_at_idx").on(table.startedAt),
  ]
);

/**
 * Rounds table - stores round configurations for each event
 */
export const rounds = pgTable(
  "rounds",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    roundNumber: integer("round_number").notNull(),
    roundName: text("round_name"),
    description: text("description"),
    maxPoints: integer("max_points"),
    isBonus: boolean("is_bonus").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("rounds_event_id_idx").on(table.eventId),
    unique("rounds_event_round_unique").on(
      table.eventId,
      table.roundNumber
    ),
  ]
);

/**
 * Teams table - stores team registrations for events
 */
export const teams = pgTable(
  "teams",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
    joinedRound: integer("joined_round").default(1).notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("teams_event_id_idx").on(table.eventId),
    unique("teams_event_name_unique").on(
      table.eventId,
      table.name
    ),
  ]
);

/**
 * Scores table - stores individual round scores for teams
 */
export const scores = pgTable(
  "scores",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    roundNumber: integer("round_number").notNull(),
    points: decimal("points", { precision: 10, scale: 2 }).notNull(),
    enteredBy: text("entered_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    enteredAt: timestamp("entered_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("scores_event_id_idx").on(table.eventId),
    index("scores_team_id_idx").on(table.teamId),
    index("scores_entered_by_idx").on(table.enteredBy),
    index("scores_entered_at_idx").on(table.enteredAt),
    unique("scores_team_round_unique").on(
      table.teamId,
      table.roundNumber
    ),
  ]
);

/**
 * Score audit log table - tracks all score changes for accountability
 */
export const scoreAuditLog = pgTable(
  "score_audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    scoreId: uuid("score_id").references(() => scores.id, {
      onDelete: "cascade",
    }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    roundNumber: integer("round_number").notNull(),
    oldPoints: decimal("old_points", { precision: 10, scale: 2 }),
    newPoints: decimal("new_points", { precision: 10, scale: 2 }).notNull(),
    action: auditAction("action").notNull(),
    reason: text("reason"),
    changedBy: text("changed_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    changedAt: timestamp("changed_at").defaultNow().notNull(),
  },
  (table) => [
    index("audit_event_id_idx").on(table.eventId),
    index("audit_team_id_idx").on(table.teamId),
    index("audit_score_id_idx").on(table.scoreId),
    index("audit_changed_by_idx").on(table.changedBy),
    index("audit_changed_at_idx").on(table.changedAt),
  ]
);

// =============================================================================
// RELATIONS
// =============================================================================

export const userRelations = relations(user, ({ many }) => ({
  eventsCreated: many(events),
  teamsCreated: many(teams),
  scoresEntered: many(scores),
  auditLogEntries: many(scoreAuditLog),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  creator: one(user, {
    fields: [events.createdBy],
    references: [user.id],
  }),
  rounds: many(rounds),
  teams: many(teams),
  scores: many(scores),
  auditLogs: many(scoreAuditLog),
}));

export const roundsRelations = relations(rounds, ({ one }) => ({
  event: one(events, {
    fields: [rounds.eventId],
    references: [events.id],
  }),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  event: one(events, {
    fields: [teams.eventId],
    references: [events.id],
  }),
  creator: one(user, {
    fields: [teams.createdBy],
    references: [user.id],
  }),
  scores: many(scores),
  auditLogs: many(scoreAuditLog),
}));

export const scoresRelations = relations(scores, ({ one, many }) => ({
  event: one(events, {
    fields: [scores.eventId],
    references: [events.id],
  }),
  team: one(teams, {
    fields: [scores.teamId],
    references: [teams.id],
  }),
  enteredByUser: one(user, {
    fields: [scores.enteredBy],
    references: [user.id],
  }),
  auditLogs: many(scoreAuditLog),
}));

export const scoreAuditLogRelations = relations(scoreAuditLog, ({ one }) => ({
  score: one(scores, {
    fields: [scoreAuditLog.scoreId],
    references: [scores.id],
  }),
  event: one(events, {
    fields: [scoreAuditLog.eventId],
    references: [events.id],
  }),
  team: one(teams, {
    fields: [scoreAuditLog.teamId],
    references: [teams.id],
  }),
  changedByUser: one(user, {
    fields: [scoreAuditLog.changedBy],
    references: [user.id],
  }),
}));