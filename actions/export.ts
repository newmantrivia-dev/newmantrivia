"use server";

import { db } from "@/lib/db";
import { events, teams, rounds, scores } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/server";
import { eq, asc } from "drizzle-orm";
import type { ActionResponse } from "@/lib/types";

/**
 * Export event results as CSV
 */
export async function exportEventCSV(
  eventId: string
): Promise<ActionResponse<{ csv: string; filename: string }>> {
  try {
    await requireAdmin();

    // Fetch event with all related data
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
      with: {
        teams: {
          orderBy: asc(teams.name),
        },
        rounds: {
          orderBy: asc(rounds.roundNumber),
        },
        scores: true,
      },
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    // Build CSV headers
    const headers = ["Rank", "Team Name"];
    event.rounds.forEach((round) => {
      const roundLabel = round.roundName
        ? `Round ${round.roundNumber} (${round.roundName})`
        : `Round ${round.roundNumber}`;
      headers.push(roundLabel);
    });
    headers.push("Total Score");

    // Calculate team totals and rankings
    const teamData = event.teams.map((team) => {
      const teamScores = event.scores.filter((score) => score.teamId === team.id);

      const roundScores = event.rounds.map((round) => {
        const score = teamScores.find((s) => s.roundNumber === round.roundNumber);
        return score ? parseFloat(score.points) : 0;
      });

      const totalScore = roundScores.reduce((sum, score) => sum + score, 0);

      return {
        teamName: team.name,
        roundScores,
        totalScore,
      };
    });

    // Sort by total score (descending) to get rankings
    teamData.sort((a, b) => b.totalScore - a.totalScore);

    // Build CSV rows
    const rows = teamData.map((data, index) => {
      const rank = index + 1;
      const row = [rank, escapeCSV(data.teamName)];

      // Add round scores
      data.roundScores.forEach((score) => {
        row.push(score.toString());
      });

      // Add total score
      row.push(data.totalScore.toString());

      return row.join(",");
    });

    // Combine headers and rows
    const csvContent = [headers.join(","), ...rows].join("\n");

    // Generate filename
    const eventName = event.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `${eventName}_results_${dateStr}.csv`;

    return {
      success: true,
      data: {
        csv: csvContent,
        filename,
      },
    };
  } catch (error) {
    console.error("Error exporting event CSV:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to export event",
    };
  }
}

/**
 * Escape CSV field if it contains special characters
 */
function escapeCSV(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Export audit log as CSV for an event
 */
export async function exportAuditLogCSV(
  eventId: string
): Promise<ActionResponse<{ csv: string; filename: string }>> {
  try {
    await requireAdmin();

    // Fetch event with audit logs
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
      with: {
        auditLogs: {
          orderBy: (auditLogs, { desc }) => [desc(auditLogs.changedAt)],
          with: {
            team: true,
            changedByUser: true,
          },
        },
      },
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    // Build CSV headers
    const headers = [
      "Timestamp",
      "Action",
      "Team Name",
      "Round Number",
      "Old Score",
      "New Score",
      "Changed By",
      "Reason",
    ];

    // Build CSV rows
    const rows = event.auditLogs.map((log) => {
      return [
        new Date(log.changedAt).toISOString(),
        log.action,
        escapeCSV(log.team.name),
        log.roundNumber.toString(),
        log.oldPoints || "N/A",
        log.newPoints,
        escapeCSV(log.changedByUser.name),
        escapeCSV(log.reason || ""),
      ].join(",");
    });

    // Combine headers and rows
    const csvContent = [headers.join(","), ...rows].join("\n");

    // Generate filename
    const eventName = event.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `${eventName}_audit_log_${dateStr}.csv`;

    return {
      success: true,
      data: {
        csv: csvContent,
        filename,
      },
    };
  } catch (error) {
    console.error("Error exporting audit log CSV:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to export audit log",
    };
  }
}
