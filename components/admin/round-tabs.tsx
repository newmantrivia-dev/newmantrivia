"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScoreEntry } from "./score-entry";
import { moveToNextRound } from "@/actions/events";
import { toast } from "sonner";
import { ChevronRight, Check } from "lucide-react";
import type { Event } from "@/lib/types";

interface RoundTabsProps {
  event: Event & {
    teams: Array<{ id: string; name: string }>;
    rounds: Array<{ id: string; roundNumber: number; roundName: string | null; isBonus: boolean }>;
    scores: Array<{ id: string; teamId: string; roundNumber: number; points: string }>;
  };
  currentRound: number;
}

export function RoundTabs({ event, currentRound }: RoundTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(currentRound.toString());
  const [isMoving, setIsMoving] = useState(false);

  const handleMoveToNext = async () => {
    const currentRoundNum = parseInt(activeTab);

    // Check if all teams have scores for current round
    const teamsWithoutScores = event.teams.filter((team) => {
      return !event.scores.some(
        (score) => score.teamId === team.id && score.roundNumber === currentRoundNum
      );
    });

    if (teamsWithoutScores.length > 0) {
      toast.error(
        `Cannot move to next round. ${teamsWithoutScores.length} team(s) missing scores for round ${currentRoundNum}.`
      );
      return;
    }

    setIsMoving(true);
    const result = await moveToNextRound(event.id);

    if (result.success) {
      toast.success(`Moved to round ${result.data?.nextRound}!`);
      setActiveTab(result.data?.nextRound.toString() || activeTab);
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setIsMoving(false);
  };

  const isRoundComplete = (roundNumber: number) => {
    return event.teams.every((team) =>
      event.scores.some(
        (score) => score.teamId === team.id && score.roundNumber === roundNumber
      )
    );
  };

  return (
    <Card className="p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Score Entry</h2>
        </div>

        <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
          {event.rounds.map((round) => {
            const isComplete = isRoundComplete(round.roundNumber);
            const isCurrent = round.roundNumber === currentRound;

            return (
              <TabsTrigger
                key={round.id}
                value={round.roundNumber.toString()}
                className="relative"
              >
                <span>
                  {round.roundName || `Round ${round.roundNumber}`}
                  {round.isBonus && " ⭐"}
                </span>
                {isCurrent && (
                  <span className="ml-2 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                    Current
                  </span>
                )}
                {isComplete && !isCurrent && (
                  <Check className="w-3 h-3 ml-1 text-green-500" />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {event.rounds.map((round) => (
          <TabsContent key={round.id} value={round.roundNumber.toString()} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {round.roundName || `Round ${round.roundNumber}`}
                  {round.isBonus && " ⭐"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Enter scores for each team
                </p>
              </div>

              {round.roundNumber === currentRound &&
                round.roundNumber < event.rounds.length && (
                  <Button onClick={handleMoveToNext} disabled={isMoving}>
                    {isMoving ? (
                      "Moving..."
                    ) : (
                      <>
                        Move to Round {currentRound + 1}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>
                )}
            </div>

            <ScoreEntry event={event} roundNumber={round.roundNumber} />
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
}
