"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { addTeam } from "@/actions/teams";
import { addRound } from "@/actions/rounds";
import { deleteCommentary, postCommentary } from "@/actions/commentary";
import { endEvent, resetEvent } from "@/actions/events";
import { toast } from "sonner";
import { Flag, Users, Target, RotateCcw, MessageSquare, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Event } from "@/lib/types";

interface EventActionsProps {
  event: Event & {
    teams?: Array<{ id: string }>;
    rounds?: Array<{ id: string; roundNumber: number }>;
    commentaryMessages?: Array<{
      id: string;
      message: string;
      displayDurationMs: number;
      createdAt: Date;
      createdBy: string;
      createdByUser: {
        id: string;
        name: string;
        email: string;
      } | null;
    }>;
  };
}

export function EventActions({ event }: EventActionsProps) {
  const router = useRouter();
  const recentCommentary = useMemo(
    () => (event.commentaryMessages ?? []).slice(0, 10),
    [event.commentaryMessages]
  );

  const [showAddTeamDialog, setShowAddTeamDialog] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [joinedRound, setJoinedRound] = useState(event.currentRound?.toString() || "1");
  const [isAddingTeam, setIsAddingTeam] = useState(false);

  const [showAddRoundDialog, setShowAddRoundDialog] = useState(false);
  const [roundName, setRoundName] = useState("");
  const [roundDescription, setRoundDescription] = useState("");
  const [maxPoints, setMaxPoints] = useState("");
  const [isBonus, setIsBonus] = useState(false);
  const [isAddingRound, setIsAddingRound] = useState(false);

  const [showEndDialog, setShowEndDialog] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showCommentaryDialog, setShowCommentaryDialog] = useState(false);
  const [commentaryMessage, setCommentaryMessage] = useState("");
  const [commentaryDurationSec, setCommentaryDurationSec] = useState("5");
  const [isPostingCommentary, setIsPostingCommentary] = useState(false);
  const [retractingCommentaryId, setRetractingCommentaryId] = useState<string | null>(null);

  const handleAddTeam = async () => {
    if (!teamName.trim()) {
      toast.error("Team name is required");
      return;
    }

    setIsAddingTeam(true);
    const result = await addTeam({
      eventId: event.id,
      name: teamName.trim(),
      joinedRound: parseInt(joinedRound),
    });

    if (result.success) {
      toast.success("Team added successfully!");
      setShowAddTeamDialog(false);
      setTeamName("");
      setJoinedRound(event.currentRound?.toString() || "1");
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setIsAddingTeam(false);
  };

  const handleAddRound = async () => {
    setIsAddingRound(true);
    const result = await addRound({
      eventId: event.id,
      roundName: roundName.trim() || undefined,
      description: roundDescription.trim() || undefined,
      maxPoints: maxPoints ? parseInt(maxPoints) : undefined,
      isBonus,
    });

    if (result.success) {
      toast.success(`Round ${result.data?.roundNumber} added successfully!`);
      setShowAddRoundDialog(false);
      setRoundName("");
      setRoundDescription("");
      setMaxPoints("");
      setIsBonus(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setIsAddingRound(false);
  };

  const handleEndEvent = async () => {
    setIsEnding(true);
    const result = await endEvent(event.id);

    if (result.success) {
      toast.success("Event ended successfully!");
      setShowEndDialog(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setIsEnding(false);
  };

  const handleResetEvent = async () => {
    setIsResetting(true);
    const result = await resetEvent(event.id);

    if (result.success) {
      toast.success("Event reset to Round 1");
      setShowResetDialog(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }

    setIsResetting(false);
  };

  const submitCommentary = async (
    message: string,
    displayDurationMs: number,
    successMessage: string
  ) => {
    setIsPostingCommentary(true);
    const result = await postCommentary({
      eventId: event.id,
      message,
      displayDurationMs,
    });

    if (result.success) {
      toast.success(successMessage);
      router.refresh();
      setIsPostingCommentary(false);
      return true;
    } else {
      toast.error(result.error);
    }

    setIsPostingCommentary(false);
    return false;
  };

  const handlePostCommentary = async () => {
    const message = commentaryMessage.trim();
    if (!message) {
      toast.error("Commentary message is required");
      return;
    }

    const durationSeconds = Number.parseInt(commentaryDurationSec, 10);
    if (Number.isNaN(durationSeconds)) {
      toast.error("Duration must be a number");
      return;
    }

    const success = await submitCommentary(message, durationSeconds * 1000, "Commentary posted");
    if (success) {
      setCommentaryMessage("");
      setCommentaryDurationSec("5");
      setShowCommentaryDialog(false);
    }
  };

  const handleResurfaceCommentary = async (entry: {
    message: string;
    displayDurationMs: number;
  }) => {
    await submitCommentary(entry.message, entry.displayDurationMs, "Commentary resurfaced");
  };

  const handleRetractCommentary = async (commentaryId: string) => {
    setRetractingCommentaryId(commentaryId);
    const result = await deleteCommentary({
      eventId: event.id,
      commentaryId,
    });

    if (result.success) {
      toast.success("Commentary retracted");
      router.refresh();
    } else {
      toast.error(result.error);
    }

    setRetractingCommentaryId(null);
  };

  return (
    <>
      <div className="grid w-full gap-2 sm:flex sm:flex-wrap">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start sm:w-auto sm:justify-center"
          onClick={() => setShowAddTeamDialog(true)}
        >
          <Users className="w-4 h-4 mr-2" />
          Add Team
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start sm:w-auto sm:justify-center"
          onClick={() => setShowAddRoundDialog(true)}
        >
          <Target className="w-4 h-4 mr-2" />
          Add Round
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start sm:w-auto sm:justify-center"
          onClick={() => setShowCommentaryDialog(true)}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Post Commentary
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start sm:w-auto sm:justify-center"
          onClick={() => setShowResetDialog(true)}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset Event
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="w-full justify-start sm:w-auto sm:justify-center"
          onClick={() => setShowEndDialog(true)}
        >
          <Flag className="w-4 h-4 mr-2" />
          End Event
        </Button>
      </div>

      {/* Add Team Dialog */}
      <Dialog open={showAddTeamDialog} onOpenChange={setShowAddTeamDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team</DialogTitle>
            <DialogDescription>
              Add a new team to this event. Teams joining after round 1 will receive 0 points for
              missed rounds.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teamName">
                Team Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="teamName"
                placeholder="Quiz Masters"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                disabled={isAddingTeam}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="joinedRound">Joining Round</Label>
              <Input
                id="joinedRound"
                type="number"
                min="1"
                max={event.rounds?.length || 1}
                value={joinedRound}
                onChange={(e) => setJoinedRound(e.target.value)}
                disabled={isAddingTeam}
              />
              <p className="text-xs text-muted-foreground">
                Teams joining after Round 1 will receive 0 points for all previous rounds.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTeamDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTeam} disabled={isAddingTeam}>
              {isAddingTeam ? "Adding..." : "Add Team"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Round Dialog */}
      <Dialog open={showAddRoundDialog} onOpenChange={setShowAddRoundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Round</DialogTitle>
            <DialogDescription>
              Add a new round to this event (e.g., bonus round)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roundName">Round Name</Label>
              <Input
                id="roundName"
                placeholder="Bonus Round"
                value={roundName}
                onChange={(e) => setRoundName(e.target.value)}
                disabled={isAddingRound}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roundDescription">Description</Label>
              <Input
                id="roundDescription"
                placeholder="Lightning round questions"
                value={roundDescription}
                onChange={(e) => setRoundDescription(e.target.value)}
                disabled={isAddingRound}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxPoints">Max Points</Label>
              <Input
                id="maxPoints"
                type="number"
                placeholder="50"
                value={maxPoints}
                onChange={(e) => setMaxPoints(e.target.value)}
                disabled={isAddingRound}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isBonus"
                checked={isBonus}
                onChange={(e) => setIsBonus(e.target.checked)}
                disabled={isAddingRound}
                className="rounded"
              />
              <Label htmlFor="isBonus" className="cursor-pointer">
                Bonus Round
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddRoundDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRound} disabled={isAddingRound}>
              {isAddingRound ? "Adding..." : "Add Round"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Event Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to end &quot;{event.name}&quot;? This will mark the event as
              completed and display final results on the public leaderboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleEndEvent} disabled={isEnding}>
              {isEnding ? "Ending..." : "End Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Commentary Dialog */}
      <Dialog open={showCommentaryDialog} onOpenChange={setShowCommentaryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post Commentary</DialogTitle>
            <DialogDescription>
              Send a live message to audience screens. It will appear briefly and also be saved in
              commentary history.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="commentaryMessage">
                Message <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="commentaryMessage"
                placeholder="Team Blue just jumped into first place!"
                value={commentaryMessage}
                onChange={(e) => setCommentaryMessage(e.target.value)}
                disabled={isPostingCommentary}
                maxLength={280}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                {commentaryMessage.trim().length}/280 characters
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="commentaryDuration">Display Duration (seconds)</Label>
              <Input
                id="commentaryDuration"
                type="number"
                min="2"
                max="15"
                value={commentaryDurationSec}
                onChange={(e) => setCommentaryDurationSec(e.target.value)}
                disabled={isPostingCommentary}
              />
            </div>

            <div className="space-y-2">
              <Label>Recent Commentary</Label>
              {recentCommentary.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No prior commentary yet.
                </p>
              ) : (
                <div className="max-h-52 space-y-2 overflow-y-auto rounded-md border p-2">
                  {recentCommentary.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-md border bg-muted/30 p-2"
                    >
                      <p className="text-sm">{entry.message}</p>
                      <div className="mt-1 space-y-2">
                        <div className="text-xs text-muted-foreground">
                          {(entry.createdByUser?.name || entry.createdByUser?.email || "Admin")} •{" "}
                          {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleResurfaceCommentary({
                                message: entry.message,
                                displayDurationMs: entry.displayDurationMs,
                              })
                            }
                            disabled={isPostingCommentary || retractingCommentaryId === entry.id}
                          >
                            Resurface
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRetractCommentary(entry.id)}
                            disabled={isPostingCommentary || retractingCommentaryId === entry.id}
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            {retractingCommentaryId === entry.id ? "Retracting..." : "Retract"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCommentaryDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePostCommentary} disabled={isPostingCommentary}>
              {isPostingCommentary ? "Posting..." : "Post Commentary"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Event Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Event</DialogTitle>
            <DialogDescription>
              This will clear all scores and audit history for &quot;{event.name}&quot; and return
              the event to Round 1. Teams and rounds will remain.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleResetEvent} disabled={isResetting}>
              {isResetting ? "Resetting..." : "Reset Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
