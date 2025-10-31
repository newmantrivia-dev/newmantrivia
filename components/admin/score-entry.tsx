"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { saveScore } from "@/actions/scores";
import { toast } from "sonner";
import { Check, Edit2 } from "lucide-react";
import type { Event } from "@/lib/types";

interface ScoreEntryProps {
  event: Event & {
    teams: Array<{ id: string; name: string }>;
    scores: Array<{ id: string; teamId: string; roundNumber: number; points: string }>;
  };
  roundNumber: number;
}

type TeamScore = {
  teamId: string;
  teamName: string;
  currentScore: string;
  savedScore: string | null;
  scoreId: string | null;
  isEditing: boolean;
  isSaving: boolean;
};

export function ScoreEntry({ event, roundNumber }: ScoreEntryProps) {
  const router = useRouter();
  const [teamScores, setTeamScores] = useState<TeamScore[]>([]);

  // Initialize team scores
  useEffect(() => {
    const scores: TeamScore[] = event.teams.map((team) => {
      const existingScore = event.scores.find(
        (s) => s.teamId === team.id && s.roundNumber === roundNumber
      );

      return {
        teamId: team.id,
        teamName: team.name,
        currentScore: existingScore?.points || "",
        savedScore: existingScore?.points || null,
        scoreId: existingScore?.id || null,
        isEditing: !existingScore,
        isSaving: false,
      };
    });

    setTeamScores(scores);
  }, [event, roundNumber]);

  const handleScoreChange = (teamId: string, value: string) => {
    setTeamScores((prev) =>
      prev.map((ts) =>
        ts.teamId === teamId ? { ...ts, currentScore: value } : ts
      )
    );
  };

  const handleSave = async (teamId: string) => {
    const teamScore = teamScores.find((ts) => ts.teamId === teamId);
    if (!teamScore) return;

    const points = parseFloat(teamScore.currentScore);
    if (isNaN(points)) {
      toast.error("Please enter a valid number");
      return;
    }

    // Update UI immediately
    setTeamScores((prev) =>
      prev.map((ts) =>
        ts.teamId === teamId ? { ...ts, isSaving: true } : ts
      )
    );

    const result = await saveScore({
      eventId: event.id,
      teamId,
      roundNumber,
      points,
    });

    if (result.success) {
      toast.success("Score saved!");
      setTeamScores((prev) =>
        prev.map((ts) =>
          ts.teamId === teamId
            ? {
                ...ts,
                savedScore: teamScore.currentScore,
                scoreId: result.data?.scoreId || ts.scoreId,
                isEditing: false,
                isSaving: false,
              }
            : ts
        )
      );
      router.refresh();
    } else {
      toast.error(result.error);
      setTeamScores((prev) =>
        prev.map((ts) =>
          ts.teamId === teamId ? { ...ts, isSaving: false } : ts
        )
      );
    }
  };

  const handleEdit = (teamId: string) => {
    setTeamScores((prev) =>
      prev.map((ts) =>
        ts.teamId === teamId ? { ...ts, isEditing: true } : ts
      )
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent, teamId: string) => {
    if (e.key === "Enter") {
      handleSave(teamId);
    }
  };

  return (
    <div className="space-y-2">
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Team Name</th>
              <th className="px-4 py-3 text-right text-sm font-semibold w-32">Score</th>
              <th className="px-4 py-3 text-right text-sm font-semibold w-32">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {teamScores.map((teamScore) => (
              <tr key={teamScore.teamId} className="hover:bg-muted/50">
                <td className="px-4 py-3">
                  <span className="font-medium">{teamScore.teamName}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  {teamScore.isEditing ? (
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      value={teamScore.currentScore}
                      onChange={(e) => handleScoreChange(teamScore.teamId, e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, teamScore.teamId)}
                      disabled={teamScore.isSaving}
                      className="text-right max-w-[100px] ml-auto"
                      autoFocus
                    />
                  ) : (
                    <span className="text-lg font-semibold">
                      {teamScore.savedScore || "—"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {teamScore.isEditing ? (
                    <Button
                      size="sm"
                      onClick={() => handleSave(teamScore.teamId)}
                      disabled={teamScore.isSaving || !teamScore.currentScore}
                    >
                      {teamScore.isSaving ? "Saving..." : "Save"}
                    </Button>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-green-500 flex items-center gap-1 text-sm">
                        <Check className="w-4 h-4" />
                        Saved
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(teamScore.teamId)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {teamScores.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No teams registered yet. Add teams to start entering scores.</p>
        </div>
      )}
    </div>
  );
}
