"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScoreEntry } from "./score-entry";
import { moveToNextRound, moveToPreviousRound } from "@/actions/events";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useAblyEvent } from "@/lib/ably/hooks";
import { ABLY_EVENTS } from "@/lib/ably/config";
import { useSession } from "@/lib/auth/client";
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
  const { data: session } = useSession();
  const currentUserId = session?.user?.id || null;
  const [activeTab, setActiveTab] = useState(currentRound.toString());
  const [isMoving, setIsMoving] = useState(false);
  const [optimisticCurrentRound, setOptimisticCurrentRound] = useState<number | null>(null);

  useEffect(() => {
    setActiveTab(currentRound.toString());
    setOptimisticCurrentRound(null);
  }, [currentRound]);

  useAblyEvent(
    event.id,
    ABLY_EVENTS.ROUND_CHANGED,
    useCallback(
      (payload) => {
        if (currentUserId !== payload.changedBy) {
          setOptimisticCurrentRound(payload.newRound);
          setActiveTab(payload.newRound.toString());
        }
      },
      [currentUserId]
    )
  );

  const effectiveCurrentRound = optimisticCurrentRound ?? currentRound;

  const handleMoveToNext = async () => {
    const currentRoundNum = parseInt(activeTab);

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

    const nextRound = currentRoundNum + 1;

    setIsMoving(true);
    setOptimisticCurrentRound(nextRound);
    setActiveTab(nextRound.toString());

    try {
      const result = await moveToNextRound(event.id);

      if (result.success) {
        toast.success(`Moved to round ${result.data?.nextRound}!`);
        router.refresh();
      } else {
        toast.error(result.error);
        setOptimisticCurrentRound(null);
        setActiveTab(currentRoundNum.toString());
      }
    } catch {
      toast.error("Failed to move to next round");
      setOptimisticCurrentRound(null);
      setActiveTab(currentRoundNum.toString());
    } finally {
      setIsMoving(false);
    }
  };

  const handleMoveToPrevious = async () => {
    const currentRoundNum = parseInt(activeTab);
    if (currentRoundNum <= 1) {
      toast.info("Already at round 1");
      return;
    }

    const previousRound = currentRoundNum - 1;

    setIsMoving(true);
    setOptimisticCurrentRound(previousRound);
    setActiveTab(previousRound.toString());

    try {
      const result = await moveToPreviousRound(event.id);

      if (result.success) {
        toast.success(`Moved back to round ${result.data?.previousRound}!`);
        router.refresh();
      } else {
        toast.error(result.error);
        setOptimisticCurrentRound(null);
        setActiveTab(currentRoundNum.toString());
      }
    } catch {
      toast.error("Failed to move to previous round");
      setOptimisticCurrentRound(null);
      setActiveTab(currentRoundNum.toString());
    } finally {
      setIsMoving(false);
    }
  };

  const isRoundComplete = (roundNumber: number) => {
    return event.teams.every((team) =>
      event.scores.some(
        (score) => score.teamId === team.id && score.roundNumber === roundNumber
      )
    );
  };

  return (
    <Card className="p-3 sm:p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold sm:text-2xl">Score Entry</h2>
        </div>

        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto whitespace-nowrap">
          {event.rounds.map((round) => {
            const isComplete = isRoundComplete(round.roundNumber);
            const isCurrent = round.roundNumber === effectiveCurrentRound;

            return (
              <TabsTrigger
                key={round.id}
                value={round.roundNumber.toString()}
                className="relative shrink-0"
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {round.roundName || `Round ${round.roundNumber}`}
                  {round.isBonus && " ⭐"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Enter scores for each team
                </p>
              </div>

              {round.roundNumber === effectiveCurrentRound && (
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                  {round.roundNumber > 1 && (
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={handleMoveToPrevious}
                      disabled={isMoving}
                    >
                      {isMoving ? (
                        "Moving..."
                      ) : (
                        <>
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          <span className="sm:hidden">Previous</span>
                          <span className="hidden sm:inline">
                            Back to Round {effectiveCurrentRound - 1}
                          </span>
                        </>
                      )}
                    </Button>
                  )}
                  {round.roundNumber < event.rounds.length && (
                    <Button className="w-full sm:w-auto" onClick={handleMoveToNext} disabled={isMoving}>
                      {isMoving ? (
                        "Moving..."
                      ) : (
                        <>
                          <span className="sm:hidden">Next round</span>
                          <span className="hidden sm:inline">
                            Move to Round {effectiveCurrentRound + 1}
                          </span>
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>

            <ScoreEntry event={event} roundNumber={round.roundNumber} />
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
}
