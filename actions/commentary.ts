"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { commentaryMessages, events } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/server";
import { publishEvent } from "@/lib/ably/server";
import { ABLY_EVENTS } from "@/lib/ably/config";
import { adminPaths, publicPaths } from "@/lib/paths";
import type { ActionResponse } from "@/lib/types";

const MIN_DURATION_MS = 2000;
const MAX_DURATION_MS = 15000;
const DEFAULT_DURATION_MS = 5000;
const MAX_COMMENTARY_LENGTH = 280;

type PostCommentaryInput = {
  eventId: string;
  message: string;
  displayDurationMs?: number;
};

type DeleteCommentaryInput = {
  eventId: string;
  commentaryId: string;
};

export async function postCommentary(
  input: PostCommentaryInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const user = await requireAdmin();

    const message = input.message.trim();
    if (!message) {
      return { success: false, error: "Commentary message is required" };
    }
    if (message.length > MAX_COMMENTARY_LENGTH) {
      return {
        success: false,
        error: `Commentary message cannot exceed ${MAX_COMMENTARY_LENGTH} characters`,
      };
    }

    const parsedDuration = Number(input.displayDurationMs);
    const durationMs = Number.isFinite(parsedDuration)
      ? Math.round(parsedDuration)
      : DEFAULT_DURATION_MS;

    if (durationMs < MIN_DURATION_MS || durationMs > MAX_DURATION_MS) {
      return {
        success: false,
        error: `Display duration must be between ${MIN_DURATION_MS / 1000} and ${
          MAX_DURATION_MS / 1000
        } seconds`,
      };
    }

    const event = await db.query.events.findFirst({
      where: and(eq(events.id, input.eventId), eq(events.status, "active")),
      columns: { id: true },
    });

    if (!event) {
      return { success: false, error: "Active event not found" };
    }

    const [created] = await db
      .insert(commentaryMessages)
      .values({
        eventId: input.eventId,
        message,
        displayDurationMs: durationMs,
        createdBy: user.id,
      })
      .returning({
        id: commentaryMessages.id,
      });

    try {
      await publishEvent(input.eventId, ABLY_EVENTS.COMMENTARY_POSTED, {
        id: created.id,
        message,
        displayDurationMs: durationMs,
        createdBy: user.id,
        createdByName: user.name || user.email || "Admin",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[Ably] Failed to publish commentary:", error);
    }

    revalidatePath(adminPaths.events.byId(input.eventId));
    revalidatePath(publicPaths.home);

    return {
      success: true,
      data: { id: created.id },
    };
  } catch (error) {
    console.error("Error posting commentary:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to post commentary",
    };
  }
}

export async function deleteCommentary(
  input: DeleteCommentaryInput
): Promise<ActionResponse> {
  try {
    const user = await requireAdmin();

    const message = await db.query.commentaryMessages.findFirst({
      where: and(
        eq(commentaryMessages.id, input.commentaryId),
        eq(commentaryMessages.eventId, input.eventId)
      ),
      columns: {
        id: true,
      },
    });

    if (!message) {
      return { success: false, error: "Commentary entry not found" };
    }

    await db
      .delete(commentaryMessages)
      .where(
        and(
          eq(commentaryMessages.id, input.commentaryId),
          eq(commentaryMessages.eventId, input.eventId)
        )
      );

    try {
      await publishEvent(input.eventId, ABLY_EVENTS.COMMENTARY_DELETED, {
        id: input.commentaryId,
        deletedBy: user.id,
        deletedByName: user.name || user.email || "Admin",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[Ably] Failed to publish commentary deletion:", error);
    }

    revalidatePath(adminPaths.events.byId(input.eventId));
    revalidatePath(publicPaths.home);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error deleting commentary:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete commentary",
    };
  }
}
