"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { rounds, events } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/server";
import { adminPaths } from "@/lib/paths";
import { eq, desc } from "drizzle-orm";
import type { ActionResponse, AddRoundInput } from "@/lib/types";

/**
 * Add a new round to an event
 * Useful for adding bonus rounds during active events
 */
export async function addRound(
  input: AddRoundInput
): Promise<ActionResponse<{ roundNumber: number }>> {
  try {
    await requireAdmin();

    // Verify event exists
    const event = await db.query.events.findFirst({
      where: eq(events.id, input.eventId),
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    // Get current max round number
    const maxRoundResult = await db.query.rounds.findFirst({
      where: eq(rounds.eventId, input.eventId),
      orderBy: desc(rounds.roundNumber),
    });

    const newRoundNumber = (maxRoundResult?.roundNumber || 0) + 1;

    // Insert new round
    await db.insert(rounds).values({
      eventId: input.eventId,
      roundNumber: newRoundNumber,
      roundName: input.roundName?.trim() || null,
      description: input.description?.trim() || null,
      maxPoints: input.maxPoints || null,
      isBonus: input.isBonus,
    });

    revalidatePath(adminPaths.events.byId(input.eventId));
    return { success: true, data: { roundNumber: newRoundNumber } };
  } catch (error) {
    console.error("Error adding round:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add round",
    };
  }
}

/**
 * Update round details
 */
export async function updateRound(
  roundId: string,
  eventId: string,
  updates: {
    roundName?: string;
    description?: string;
    maxPoints?: number;
    isBonus?: boolean;
  }
): Promise<ActionResponse> {
  try {
    await requireAdmin();

    const round = await db.query.rounds.findFirst({
      where: eq(rounds.id, roundId),
    });

    if (!round) {
      return { success: false, error: "Round not found" };
    }

    await db
      .update(rounds)
      .set({
        roundName: updates.roundName?.trim() || round.roundName,
        description: updates.description?.trim() || round.description,
        maxPoints: updates.maxPoints !== undefined ? updates.maxPoints : round.maxPoints,
        isBonus: updates.isBonus !== undefined ? updates.isBonus : round.isBonus,
      })
      .where(eq(rounds.id, roundId));

    revalidatePath(adminPaths.events.byId(eventId));
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error updating round:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update round",
    };
  }
}

/**
 * Delete a round (only if no scores have been entered)
 */
export async function deleteRound(
  roundId: string,
  eventId: string
): Promise<ActionResponse> {
  try {
    await requireAdmin();

    const round = await db.query.rounds.findFirst({
      where: eq(rounds.id, roundId),
      with: {
        event: {
          with: {
            scores: true,
          },
        },
      },
    });

    if (!round) {
      return { success: false, error: "Round not found" };
    }

    // Check if any scores exist for this round
    const scoresForRound = round.event.scores.filter(
      (score) => score.roundNumber === round.roundNumber
    );

    if (scoresForRound.length > 0) {
      return {
        success: false,
        error: "Cannot delete a round that has scores entered",
      };
    }

    await db.delete(rounds).where(eq(rounds.id, roundId));

    revalidatePath(adminPaths.events.byId(eventId));
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error deleting round:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete round",
    };
  }
}
