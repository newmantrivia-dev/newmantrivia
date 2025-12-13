"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { saveScore } from "@/actions/scores";
import { toast } from "sonner";
import { Check, Edit2, Save, RefreshCw } from "lucide-react";
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
  isModified: boolean;
};

export function ScoreEntry({ event, roundNumber }: ScoreEntryProps) {
  const router = useRouter();
  const [teamScores, setTeamScores] = useState<TeamScore[]>([]);
  const [isSavingAll, setIsSavingAll] = useState(false);

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
        isModified: false,
      };
    });

    setTeamScores(scores);
  }, [event, roundNumber]);

  const handleScoreChange = (teamId: string, value: string) => {
    setTeamScores((prev) =>
      prev.map((ts) =>
        ts.teamId === teamId
          ? { ...ts, currentScore: value, isModified: value !== ts.savedScore }
          : ts
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
                isModified: false,
              }
            : ts
        )
      );
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

  const handleSaveAll = async () => {
    const modifiedScores = teamScores.filter(ts => ts.isModified && ts.currentScore);

    if (modifiedScores.length === 0) {
      toast.info("No changes to save");
      return;
    }

    setIsSavingAll(true);

    try {
      const savePromises = modifiedScores.map(async (teamScore) => {
        const points = parseFloat(teamScore.currentScore);
        if (isNaN(points)) {
          throw new Error(`Invalid score for ${teamScore.teamName}`);
        }

        const result = await saveScore({
          eventId: event.id,
          teamId: teamScore.teamId,
          roundNumber,
          points,
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        return { teamId: teamScore.teamId, scoreId: result.data?.scoreId };
      });

      const results = await Promise.all(savePromises);

      // Update all saved scores
      setTeamScores((prev) =>
        prev.map((ts) => {
          const result = results.find(r => r.teamId === ts.teamId);
          return result
            ? {
                ...ts,
                savedScore: ts.currentScore,
                scoreId: result.scoreId || ts.scoreId,
                isEditing: false,
                isModified: false,
              }
            : ts;
        })
      );

      toast.success(`Saved ${modifiedScores.length} score${modifiedScores.length === 1 ? '' : 's'}!`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save scores");
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleRefresh = () => {
    router.refresh();
  };

  const handleKeyPress = (e: React.KeyboardEvent, teamId: string) => {
    if (e.key === "Enter") {
      handleSave(teamId);
    }
  };

  const modifiedCount = teamScores.filter(ts => ts.isModified).length;

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

      {teamScores.length > 0 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {modifiedCount > 0 && (
              <span>{modifiedCount} score{modifiedCount === 1 ? '' : 's'} modified</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isSavingAll}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={handleSaveAll}
              disabled={isSavingAll || modifiedCount === 0}
              size="sm"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSavingAll ? "Saving..." : `Save All (${modifiedCount})`}
            </Button>
          </div>
        </div>
      )}

      {teamScores.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No teams registered yet. Add teams to start entering scores.</p>
        </div>
      )}
    </div>
  );
}
