"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { scores, scoreAuditLog, events } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/server";
import { publicPaths, adminPaths } from "@/lib/paths";
import { eq, and } from "drizzle-orm";
import type { ActionResponse, SaveScoreInput } from "@/lib/types";

/**
 * Validate score value
 */
function validateScore(points: number): { valid: boolean; error?: string } {
  if (isNaN(points)) {
    return { valid: false, error: "Score must be a valid number" };
  }

  if (points < 0) {
    return { valid: false, error: "Score cannot be negative" };
  }

  if (points > 1000) {
    return { valid: false, error: "Score cannot exceed 1000 points" };
  }

  // Check decimal places (max 2)
  const decimalPlaces = (points.toString().split(".")[1] || "").length;
  if (decimalPlaces > 2) {
    return { valid: false, error: "Score cannot have more than 2 decimal places" };
  }

  return { valid: true };
}

/**
 * Save or update a score for a team in a specific round
 * Creates audit log entry for all changes
 */
export async function saveScore(
  input: SaveScoreInput
): Promise<ActionResponse<{ scoreId: string }>> {
  try {
    const user = await requireAdmin();

    // Validate score
    const validation = validateScore(input.points);
    if (!validation.valid) {
      return { success: false, error: validation.error! };
    }

    // Check if score already exists
    const existingScore = await db.query.scores.findFirst({
      where: and(
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
        // Update existing score
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
        // Create new score
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

      // Create audit log entry
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

      // Update event's updatedAt timestamp to trigger leaderboard refresh
      await tx
        .update(events)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(events.id, input.eventId));
    });

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

/**
 * Delete a score
 * Creates audit log entry for deletion
 */
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

    await db.transaction(async (tx) => {
      // Create audit log before deletion
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

      // Delete score
      await tx.delete(scores).where(eq(scores.id, scoreId));
    });

    revalidatePath(adminPaths.events.byId(eventId));
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

/**
 * Batch save scores for multiple teams in a round
 * Useful for bulk score entry
 */
export async function batchSaveScores(
  eventId: string,
  roundNumber: number,
  teamScores: Array<{ teamId: string; points: number; reason?: string }>
): Promise<ActionResponse<{ saved: number; failed: number }>> {
  try {
    const user = await requireAdmin();

    let saved = 0;
    let failed = 0;

    // Process each score
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
