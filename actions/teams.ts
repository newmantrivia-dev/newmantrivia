"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { teams, scores, scoreAuditLog, events } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/server";
import { publicPaths, adminPaths } from "@/lib/paths";
import { eq, and } from "drizzle-orm";
import type { ActionResponse, AddTeamInput } from "@/lib/types";

/**
 * Add a team to an event
 * Handles mid-event joins by creating 0 scores for missed rounds
 */
export async function addTeam(
  input: AddTeamInput
): Promise<ActionResponse<{ teamId: string }>> {
  try {
    const user = await requireAdmin();

    // Validate input
    if (!input.name || input.name.trim().length === 0) {
      return { success: false, error: "Team name is required" };
    }

    const teamName = input.name.trim();

    // Check if team name already exists in this event
    const existingTeam = await db.query.teams.findFirst({
      where: and(
        eq(teams.eventId, input.eventId),
        eq(teams.name, teamName)
      ),
    });

    if (existingTeam) {
      return {
        success: false,
        error: "A team with this name already exists in this event",
      };
    }

    // Get event to verify it exists
    const event = await db.query.events.findFirst({
      where: eq(events.id, input.eventId),
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    const joinedRound = input.joinedRound || 1;

    // Create team and backfill scores in a transaction
    const teamId = await db.transaction(async (tx) => {
      // Insert team
      const [newTeam] = await tx
        .insert(teams)
        .values({
          eventId: input.eventId,
          name: teamName,
          joinedRound,
          createdBy: user.id,
        })
        .returning({ id: teams.id });

      // If mid-event join, create 0 scores for previous rounds
      if (joinedRound > 1) {
        for (let roundNum = 1; roundNum < joinedRound; roundNum++) {
          const [newScore] = await tx
            .insert(scores)
            .values({
              eventId: input.eventId,
              teamId: newTeam.id,
              roundNumber: roundNum,
              points: "0",
              enteredBy: user.id,
            })
            .returning({ id: scores.id });

          // Create audit log entry
          await tx.insert(scoreAuditLog).values({
            scoreId: newScore.id,
            eventId: input.eventId,
            teamId: newTeam.id,
            roundNumber: roundNum,
            oldPoints: null,
            newPoints: "0",
            action: "created",
            reason: `Mid-event join at round ${joinedRound}`,
            changedBy: user.id,
          });
        }
      }

      return newTeam.id;
    });

    revalidatePath(adminPaths.events.byId(input.eventId));
    revalidatePath(publicPaths.home);
    return { success: true, data: { teamId } };
  } catch (error) {
    console.error("Error adding team:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add team",
    };
  }
}

/**
 * Remove a team from an event
 * Cascade deletes all scores and audit logs
 */
export async function removeTeam(
  teamId: string,
  eventId: string
): Promise<ActionResponse> {
  try {
    await requireAdmin();

    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
    });

    if (!team) {
      return { success: false, error: "Team not found" };
    }

    // Delete team (cascade deletes scores and audit logs)
    await db.delete(teams).where(eq(teams.id, teamId));

    revalidatePath(adminPaths.events.byId(eventId));
    revalidatePath(publicPaths.home);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error removing team:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove team",
    };
  }
}

/**
 * Update team name
 */
export async function updateTeamName(
  teamId: string,
  eventId: string,
  newName: string
): Promise<ActionResponse> {
  try {
    await requireAdmin();

    const teamName = newName.trim();

    if (teamName.length === 0) {
      return { success: false, error: "Team name is required" };
    }

    // Check if new name conflicts with existing team
    const existingTeam = await db.query.teams.findFirst({
      where: and(
        eq(teams.eventId, eventId),
        eq(teams.name, teamName)
      ),
    });

    if (existingTeam && existingTeam.id !== teamId) {
      return {
        success: false,
        error: "A team with this name already exists in this event",
      };
    }

    await db
      .update(teams)
      .set({ name: teamName })
      .where(eq(teams.id, teamId));

    revalidatePath(adminPaths.events.byId(eventId));
    revalidatePath(publicPaths.home);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error updating team name:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update team name",
    };
  }
}
