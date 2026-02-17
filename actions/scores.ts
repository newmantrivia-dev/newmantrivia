"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { scores, scoreAuditLog, events, teams, rounds } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/server";
import { publicPaths, adminPaths } from "@/lib/paths";
import { eq, and } from "drizzle-orm";
import type { ActionResponse, SaveScoreInput } from "@/lib/types";
import { publishEvent } from "@/lib/ably/server";
import { ABLY_EVENTS } from "@/lib/ably/config";

function validateScore(points: number): { valid: boolean; error?: string } {
  if (isNaN(points)) {
    return { valid: false, error: "Score must be a valid number" };
  }

  const decimalPlaces = (points.toString().split(".")[1] || "").length;
  if (decimalPlaces > 2) {
    return { valid: false, error: "Score cannot have more than 2 decimal places" };
  }

  return { valid: true };
}

export async function saveScore(
  input: SaveScoreInput
): Promise<ActionResponse<{ scoreId: string }>> {
  try {
    const user = await requireAdmin();

    const validation = validateScore(input.points);
    if (!validation.valid) {
      return { success: false, error: validation.error! };
    }

    const event = await db.query.events.findFirst({
      where: eq(events.id, input.eventId),
      columns: { id: true, status: true },
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    if (event.status !== "active") {
      return { success: false, error: "Scores can only be edited for active events" };
    }

    const team = await db.query.teams.findFirst({
      where: and(eq(teams.id, input.teamId), eq(teams.eventId, input.eventId)),
      columns: { id: true, name: true },
    });

    if (!team) {
      return { success: false, error: "Team not found in this event" };
    }

    const round = await db.query.rounds.findFirst({
      where: and(
        eq(rounds.eventId, input.eventId),
        eq(rounds.roundNumber, input.roundNumber)
      ),
      columns: { id: true },
    });

    if (!round) {
      return { success: false, error: "Round not found in this event" };
    }

    const existingScore = await db.query.scores.findFirst({
      where: and(
        eq(scores.eventId, input.eventId),
        eq(scores.teamId, input.teamId),
        eq(scores.roundNumber, input.roundNumber)
      ),
    });

    let action: "created" | "updated" = "created";
    let oldPoints: string | null = null;
    let scoreId: string;

    const pointsStr = input.points.toString();

    await db.transaction(async (tx) => {
      if (existingScore) {
        action = "updated";
        oldPoints = existingScore.points;
        scoreId = existingScore.id;

        await tx
          .update(scores)
          .set({
            points: pointsStr,
          })
          .where(eq(scores.id, existingScore.id));
      } else {
        const [newScore] = await tx
          .insert(scores)
          .values({
            eventId: input.eventId,
            teamId: input.teamId,
            roundNumber: input.roundNumber,
            points: pointsStr,
            enteredBy: user.id,
          })
          .returning({ id: scores.id });

        scoreId = newScore.id;
      }

      await tx.insert(scoreAuditLog).values({
        scoreId,
        eventId: input.eventId,
        teamId: input.teamId,
        roundNumber: input.roundNumber,
        oldPoints,
        newPoints: pointsStr,
        action,
        reason: input.reason || null,
        changedBy: user.id,
      });

      await tx
        .update(events)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(events.id, input.eventId));
    });

    try {
      await publishEvent(input.eventId, ABLY_EVENTS.SCORE_UPDATED, {
        teamId: input.teamId,
        teamName: team.name,
        roundNumber: input.roundNumber,
        points: input.points,
        oldPoints: existingScore ? parseFloat(existingScore.points) : undefined,
        changedBy: user.id,
        changedByName: user.name || user.email,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[Ably] Failed to publish score update:', error);
    }

    revalidatePath(adminPaths.events.byId(input.eventId));
    revalidatePath(publicPaths.home);
    return { success: true, data: { scoreId: scoreId! } };
  } catch (error) {
    console.error("Error saving score:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save score",
    };
  }
}

export async function deleteScore(
  scoreId: string,
  eventId: string
): Promise<ActionResponse> {
  try {
    const user = await requireAdmin();

    const score = await db.query.scores.findFirst({
      where: eq(scores.id, scoreId),
    });

    if (!score) {
      return { success: false, error: "Score not found" };
    }

    if (score.eventId !== eventId) {
      return { success: false, error: "Score does not belong to this event" };
    }

    await db.transaction(async (tx) => {
      await tx.insert(scoreAuditLog).values({
        scoreId: score.id,
        eventId: score.eventId,
        teamId: score.teamId,
        roundNumber: score.roundNumber,
        oldPoints: score.points,
        newPoints: "0",
        action: "deleted",
        reason: null,
        changedBy: user.id,
      });

      await tx.delete(scores).where(eq(scores.id, scoreId));
    });

    try {
      const team = await db.query.teams.findFirst({
        where: eq(teams.id, score.teamId),
        columns: { name: true },
      });

      await publishEvent(score.eventId, ABLY_EVENTS.SCORE_DELETED, {
        teamId: score.teamId,
        teamName: team?.name || 'Unknown Team',
        roundNumber: score.roundNumber,
        changedBy: user.id,
        changedByName: user.name || user.email,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[Ably] Failed to publish score deletion:', error);
    }

    revalidatePath(adminPaths.events.byId(score.eventId));
    revalidatePath(publicPaths.home);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error deleting score:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete score",
    };
  }
}

export async function batchSaveScores(
  eventId: string,
  roundNumber: number,
  teamScores: Array<{ teamId: string; points: number; reason?: string }>
): Promise<ActionResponse<{ saved: number; failed: number }>> {
  try {
    await requireAdmin();

    let saved = 0;
    let failed = 0;

    for (const teamScore of teamScores) {
      const result = await saveScore({
        eventId,
        teamId: teamScore.teamId,
        roundNumber,
        points: teamScore.points,
        reason: teamScore.reason,
      });

      if (result.success) {
        saved++;
      } else {
        failed++;
      }
    }

    return {
      success: true,
      data: { saved, failed },
    };
  } catch (error) {
    console.error("Error batch saving scores:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to batch save scores",
    };
  }
}
