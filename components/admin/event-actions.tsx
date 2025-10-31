"use client";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { addTeam } from "@/actions/teams";
import { addRound } from "@/actions/rounds";
import { endEvent } from "@/actions/events";
import { toast } from "sonner";
import { Plus, Flag, Users, Target } from "lucide-react";
import type { Event } from "@/lib/types";

interface EventActionsProps {
  event: Event & {
    teams?: Array<{ id: string }>;
    rounds?: Array<{ id: string; roundNumber: number }>;
  };
}

export function EventActions({ event }: EventActionsProps) {
  const router = useRouter();

  // Add Team Dialog
  const [showAddTeamDialog, setShowAddTeamDialog] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [joinedRound, setJoinedRound] = useState(event.currentRound?.toString() || "1");
  const [isAddingTeam, setIsAddingTeam] = useState(false);

  // Add Round Dialog
  const [showAddRoundDialog, setShowAddRoundDialog] = useState(false);
  const [roundName, setRoundName] = useState("");
  const [roundDescription, setRoundDescription] = useState("");
  const [maxPoints, setMaxPoints] = useState("");
  const [isBonus, setIsBonus] = useState(false);
  const [isAddingRound, setIsAddingRound] = useState(false);

  // End Event Dialog
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

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

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={() => setShowAddTeamDialog(true)}>
          <Users className="w-4 h-4 mr-2" />
          Add Team
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowAddRoundDialog(true)}>
          <Target className="w-4 h-4 mr-2" />
          Add Round
        </Button>
        <Button variant="destructive" size="sm" onClick={() => setShowEndDialog(true)}>
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
    </>
  );
}
