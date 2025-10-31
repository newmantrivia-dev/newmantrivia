"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { adminPaths } from "@/lib/paths";
import { createEvent } from "@/actions/events";
import { toast } from "sonner";
import { Plus, X, ArrowLeft } from "lucide-react";
import Link from "next/link";

type RoundInput = {
  id: string;
  roundName: string;
  description: string;
  maxPoints: string;
  isBonus: boolean;
};

type TeamInput = {
  id: string;
  name: string;
};

export default function NewEventPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Event details
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  // Rounds
  const [rounds, setRounds] = useState<RoundInput[]>([
    { id: crypto.randomUUID(), roundName: "", description: "", maxPoints: "", isBonus: false },
  ]);

  // Teams
  const [teams, setTeams] = useState<TeamInput[]>([]);

  const addRound = () => {
    setRounds([
      ...rounds,
      { id: crypto.randomUUID(), roundName: "", description: "", maxPoints: "", isBonus: false },
    ]);
  };

  const removeRound = (id: string) => {
    if (rounds.length === 1) {
      toast.error("At least one round is required");
      return;
    }
    setRounds(rounds.filter((r) => r.id !== id));
  };

  const updateRound = (id: string, field: keyof RoundInput, value: string | boolean) => {
    setRounds(rounds.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const addTeam = () => {
    setTeams([...teams, { id: crypto.randomUUID(), name: "" }]);
  };

  const removeTeam = (id: string) => {
    setTeams(teams.filter((t) => t.id !== id));
  };

  const updateTeam = (id: string, name: string) => {
    setTeams(teams.map((t) => (t.id === id ? { ...t, name } : t)));
  };

  const handleSubmit = async (asDraft: boolean) => {
    // Validation
    if (!name.trim()) {
      toast.error("Event name is required");
      return;
    }

    if (rounds.length === 0) {
      toast.error("At least one round is required");
      return;
    }

    setIsSubmitting(true);

    // Combine date and time if provided
    let scheduledDateTime: Date | undefined;
    if (scheduledDate && scheduledTime) {
      scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    } else if (scheduledDate) {
      scheduledDateTime = new Date(scheduledDate);
    }

    // Prepare rounds data
    const roundsData = rounds.map((round) => ({
      roundName: round.roundName.trim() || undefined,
      description: round.description.trim() || undefined,
      maxPoints: round.maxPoints ? parseInt(round.maxPoints) : undefined,
      isBonus: round.isBonus,
    }));

    // Prepare teams data
    const teamsData = teams
      .filter((team) => team.name.trim())
      .map((team) => ({ name: team.name.trim() }));

    const result = await createEvent({
      name: name.trim(),
      description: description.trim() || undefined,
      scheduledDate: !asDraft ? scheduledDateTime : undefined,
      rounds: roundsData,
      teams: teamsData.length > 0 ? teamsData : undefined,
    });

    if (result.success) {
      toast.success(asDraft ? "Event saved as draft!" : "Event created successfully!");
      router.push(adminPaths.root);
      router.refresh();
    } else {
      toast.error(result.error);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={adminPaths.root}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Event</h1>
          <p className="text-muted-foreground">Set up your trivia event details</p>
        </div>
      </div>

      <Separator />

      {/* Event Details */}
      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
          <CardDescription>Basic information about your trivia event</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Event Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Fall Trivia Night"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description/Theme</Label>
            <textarea
              id="description"
              placeholder="Spooky questions for Halloween season"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Scheduled Date (optional)</Label>
              <Input
                id="scheduledDate"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduledTime">Scheduled Time (optional)</Label>
              <Input
                id="scheduledTime"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Leave blank to save as draft. Setting a date will mark the event as &quot;upcoming&quot;.
          </p>
        </CardContent>
      </Card>

      {/* Rounds Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Rounds Configuration</CardTitle>
          <CardDescription>Define the rounds for your trivia event</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rounds.map((round, index) => (
            <Card key={round.id} className="bg-muted/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Round {index + 1}</CardTitle>
                  {rounds.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRound(round.id)}
                      disabled={isSubmitting}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`round-name-${round.id}`}>Round Name</Label>
                    <Input
                      id={`round-name-${round.id}`}
                      placeholder="Music Round"
                      value={round.roundName}
                      onChange={(e) => updateRound(round.id, "roundName", e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`max-points-${round.id}`}>Max Points</Label>
                    <Input
                      id={`max-points-${round.id}`}
                      type="number"
                      placeholder="30"
                      value={round.maxPoints}
                      onChange={(e) => updateRound(round.id, "maxPoints", e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`round-desc-${round.id}`}>Description</Label>
                  <Input
                    id={`round-desc-${round.id}`}
                    placeholder="Questions about 80s and 90s music"
                    value={round.description}
                    onChange={(e) => updateRound(round.id, "description", e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`is-bonus-${round.id}`}
                    checked={round.isBonus}
                    onChange={(e) => updateRound(round.id, "isBonus", e.target.checked)}
                    disabled={isSubmitting}
                    className="rounded"
                  />
                  <Label htmlFor={`is-bonus-${round.id}`} className="cursor-pointer">
                    Bonus Round
                  </Label>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button onClick={addRound} variant="outline" className="w-full" disabled={isSubmitting}>
            <Plus className="w-4 h-4 mr-2" />
            Add Round
          </Button>
        </CardContent>
      </Card>

      {/* Teams (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle>Teams (Optional)</CardTitle>
          <CardDescription>
            Pre-add teams now or add them later during the event
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {teams.map((team, index) => (
            <div key={team.id} className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground w-8">#{index + 1}</span>
              <Input
                placeholder="Team Name"
                value={team.name}
                onChange={(e) => updateTeam(team.id, e.target.value)}
                disabled={isSubmitting}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeTeam(team.id)}
                disabled={isSubmitting}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}

          <Button onClick={addTeam} variant="outline" className="w-full" disabled={isSubmitting}>
            <Plus className="w-4 h-4 mr-2" />
            Add Team
          </Button>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" asChild disabled={isSubmitting}>
          <Link href={adminPaths.root}>Cancel</Link>
        </Button>
        <Button
          variant="secondary"
          onClick={() => handleSubmit(true)}
          disabled={isSubmitting}
        >
          Save as Draft
        </Button>
        <Button onClick={() => handleSubmit(false)} disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Event"}
        </Button>
      </div>
    </div>
  );
}
