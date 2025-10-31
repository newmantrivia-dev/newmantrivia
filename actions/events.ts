"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { events, rounds, teams, scores, scoreAuditLog } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/server";
import { publicPaths, adminPaths } from "@/lib/paths";
import { eq, and, desc, gte } from "drizzle-orm";
import type { ActionResponse, CreateEventInput, UpdateEventInput } from "@/lib/types";

/**
 * Create a new event with rounds and optionally teams
 */
export async function createEvent(
  input: CreateEventInput
): Promise<ActionResponse<{ eventId: string }>> {
  try {
    const user = await requireAdmin();

    // Validate input
    if (!input.name || input.name.trim().length === 0) {
      return { success: false, error: "Event name is required" };
    }

    if (!input.rounds || input.rounds.length === 0) {
      return { success: false, error: "At least one round is required" };
    }

    // Determine status based on scheduled date
    const status = input.scheduledDate ? "upcoming" : "draft";

    // Create event with rounds and teams in a transaction
    const eventId = await db.transaction(async (tx) => {
      // Insert event
      const [event] = await tx
        .insert(events)
        .values({
          name: input.name.trim(),
          description: input.description?.trim() || null,
          scheduledDate: input.scheduledDate || null,
          status,
          createdBy: user.id,
        })
        .returning({ id: events.id });

      // Insert rounds
      for (let i = 0; i < input.rounds.length; i++) {
        const round = input.rounds[i];
        await tx.insert(rounds).values({
          eventId: event.id,
          roundNumber: i + 1,
          roundName: round.roundName?.trim() || null,
          description: round.description?.trim() || null,
          maxPoints: round.maxPoints || null,
          isBonus: round.isBonus,
        });
      }

      // Insert teams if provided
      if (input.teams && input.teams.length > 0) {
        for (const team of input.teams) {
          const teamName = team.name.trim();
          if (teamName.length > 0) {
            await tx.insert(teams).values({
              eventId: event.id,
              name: teamName,
              joinedRound: 1,
              createdBy: user.id,
            });
          }
        }
      }

      return event.id;
    });

    revalidatePath(adminPaths.root);
    return { success: true, data: { eventId } };
  } catch (error) {
    console.error("Error creating event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create event",
    };
  }
}

/**
 * Update an existing draft or upcoming event
 */
export async function updateEvent(
  input: UpdateEventInput
): Promise<ActionResponse> {
  try {
    const user = await requireAdmin();

    // Get existing event
    const event = await db.query.events.findFirst({
      where: eq(events.id, input.id),
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    // Only allow editing draft and upcoming events
    if (event.status !== "draft" && event.status !== "upcoming") {
      return { success: false, error: "Cannot edit an active or completed event" };
    }

    // Update event
    await db
      .update(events)
      .set({
        name: input.name?.trim() || event.name,
        description: input.description?.trim() || event.description,
        scheduledDate: input.scheduledDate !== undefined ? input.scheduledDate : event.scheduledDate,
        status: input.scheduledDate ? "upcoming" : event.status,
      })
      .where(eq(events.id, input.id));

    revalidatePath(adminPaths.root);
    revalidatePath(adminPaths.events.byId(input.id));
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error updating event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update event",
    };
  }
}

/**
 * Start an event (change status to active)
 */
export async function startEvent(
  eventId: string
): Promise<ActionResponse> {
  try {
    await requireAdmin();

    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    if (event.status === "active") {
      return { success: false, error: "Event is already active" };
    }

    if (event.status !== "draft" && event.status !== "upcoming") {
      return { success: false, error: "Cannot start a completed or archived event" };
    }

    await db
      .update(events)
      .set({
        status: "active",
        startedAt: new Date(),
        currentRound: 1,
      })
      .where(eq(events.id, eventId));

    revalidatePath(adminPaths.root);
    revalidatePath(adminPaths.events.byId(eventId));
    revalidatePath(publicPaths.home);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error starting event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to start event",
    };
  }
}

/**
 * End an event (change status to completed)
 */
export async function endEvent(
  eventId: string
): Promise<ActionResponse> {
  try {
    await requireAdmin();

    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    if (event.status !== "active") {
      return { success: false, error: "Only active events can be ended" };
    }

    await db
      .update(events)
      .set({
        status: "completed",
        endedAt: new Date(),
      })
      .where(eq(events.id, eventId));

    revalidatePath(adminPaths.root);
    revalidatePath(adminPaths.events.byId(eventId));
    revalidatePath(publicPaths.home);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error ending event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to end event",
    };
  }
}

/**
 * Archive a completed event
 */
export async function archiveEvent(
  eventId: string
): Promise<ActionResponse> {
  try {
    await requireAdmin();

    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    if (event.status !== "completed") {
      return { success: false, error: "Only completed events can be archived" };
    }

    await db
      .update(events)
      .set({
        status: "archived",
      })
      .where(eq(events.id, eventId));

    revalidatePath(adminPaths.root);
    revalidatePath(adminPaths.history);
    revalidatePath(publicPaths.home);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error archiving event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to archive event",
    };
  }
}

/**
 * Reopen a completed event (change status back to active)
 */
export async function reopenEvent(
  eventId: string
): Promise<ActionResponse> {
  try {
    await requireAdmin();

    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    if (event.status !== "completed") {
      return { success: false, error: "Only completed events can be reopened" };
    }

    await db
      .update(events)
      .set({
        status: "active",
        endedAt: null,
      })
      .where(eq(events.id, eventId));

    revalidatePath(adminPaths.root);
    revalidatePath(adminPaths.events.byId(eventId));
    revalidatePath(publicPaths.home);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error reopening event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reopen event",
    };
  }
}

/**
 * Move to the next round
 */
export async function moveToNextRound(
  eventId: string
): Promise<ActionResponse<{ nextRound: number }>> {
  try {
    await requireAdmin();

    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
      with: {
        rounds: true,
        teams: true,
        scores: true,
      },
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    if (event.status !== "active") {
      return { success: false, error: "Only active events can move to next round" };
    }

    const currentRound = event.currentRound || 1;

    // Verify all teams have scores for current round
    const teamsWithoutScores = event.teams.filter((team) => {
      return !event.scores.some(
        (score) =>
          score.teamId === team.id && score.roundNumber === currentRound
      );
    });

    if (teamsWithoutScores.length > 0) {
      return {
        success: false,
        error: `Cannot move to next round. ${teamsWithoutScores.length} team(s) missing scores for round ${currentRound}`,
      };
    }

    const nextRound = currentRound + 1;

    await db
      .update(events)
      .set({
        currentRound: nextRound,
      })
      .where(eq(events.id, eventId));

    revalidatePath(adminPaths.events.byId(eventId));
    revalidatePath(publicPaths.home);
    return { success: true, data: { nextRound } };
  } catch (error) {
    console.error("Error moving to next round:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to move to next round",
    };
  }
}

/**
 * Delete an event (only draft and upcoming events)
 */
export async function deleteEvent(
  eventId: string
): Promise<ActionResponse> {
  try {
    await requireAdmin();

    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    if (event.status !== "draft" && event.status !== "upcoming") {
      return {
        success: false,
        error: "Cannot delete an active, completed, or archived event",
      };
    }

    // Delete will cascade to rounds, teams, scores, and audit logs
    await db.delete(events).where(eq(events.id, eventId));

    revalidatePath(adminPaths.root);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error deleting event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete event",
    };
  }
}
