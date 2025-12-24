"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { teams, scores, scoreAuditLog, events } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/server";
import { publicPaths, adminPaths } from "@/lib/paths";
import { eq, and } from "drizzle-orm";
import type { ActionResponse, AddTeamInput } from "@/lib/types";
import { publishEvent } from "@/lib/ably/server";
import { ABLY_EVENTS } from "@/lib/ably/config";

export async function addTeam(
  input: AddTeamInput
): Promise<ActionResponse<{ teamId: string }>> {
  try {
    const user = await requireAdmin();

    if (!input.name || input.name.trim().length === 0) {
      return { success: false, error: "Team name is required" };
    }

    const teamName = input.name.trim();

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

    const event = await db.query.events.findFirst({
      where: eq(events.id, input.eventId),
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    const joinedRound = input.joinedRound || 1;

    const teamId = await db.transaction(async (tx) => {
      const [newTeam] = await tx
        .insert(teams)
        .values({
          eventId: input.eventId,
          name: teamName,
          joinedRound,
          createdBy: user.id,
        })
        .returning({ id: teams.id });

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

    try {
      await publishEvent(input.eventId, ABLY_EVENTS.TEAM_ADDED, {
        teamId,
        teamName: teamName,
        joinedRound,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[Ably] Failed to publish team addition:', error);
    }

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

    const teamName = team.name;

    await db.delete(teams).where(eq(teams.id, teamId));

    try {
      await publishEvent(eventId, ABLY_EVENTS.TEAM_REMOVED, {
        teamId,
        teamName,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[Ably] Failed to publish team removal:', error);
    }

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
