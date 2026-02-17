'use client';

import { useCallback, useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { useAblyEvent } from '@/lib/ably/hooks';
import { ABLY_EVENTS } from '@/lib/ably/config';
import { toast } from 'sonner';
import { ConnectionStatus } from '@/components/ably/connection-status';
import { useSession } from '@/lib/auth/client';
import { RealtimeProvider } from './realtime-context';
import type { Event, Team } from '@/lib/types';

export type EventWithDetails = Event & {
  teams: Team[];
  rounds: Array<{ id: string; roundNumber: number; roundName: string | null; isBonus: boolean }>;
  scores: Array<{ id: string; teamId: string; roundNumber: number; points: string }>;
};

const EventDashboardContext = createContext<EventWithDetails | null>(null);

export function useEventDashboardData() {
  const context = useContext(EventDashboardContext);
  if (!context) {
    throw new Error('useEventDashboardData must be used within RealtimeEventDashboard');
  }
  return context;
}

interface RealtimeEventDashboardProps {
  eventId: string;
  event: EventWithDetails;
  children: React.ReactNode;
}

export function RealtimeEventDashboard({
  eventId,
  event: initialEvent,
  children,
}: RealtimeEventDashboardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id || null;
  const [event, setEvent] = useState(initialEvent);

  useEffect(() => {
    setEvent(initialEvent);
  }, [initialEvent]);

  const isMyChange = useCallback((changedBy: string) => {
    return currentUserId === changedBy;
  }, [currentUserId]);

  useAblyEvent(eventId, ABLY_EVENTS.SCORE_UPDATED, useCallback((payload) => {
    if (isMyChange(payload.changedBy)) {
      return;
    }

    const changeText = payload.oldPoints !== undefined
      ? `${payload.changedByName} updated ${payload.teamName} Round ${payload.roundNumber}: ${payload.oldPoints} → ${payload.points} pts`
      : `${payload.changedByName} added score for ${payload.teamName} Round ${payload.roundNumber}: ${payload.points} pts`;

    toast.info(changeText, {
      duration: 4000,
    });

    router.refresh();
  }, [router, isMyChange]));

  useAblyEvent(eventId, ABLY_EVENTS.SCORE_DELETED, useCallback((payload) => {
    if (isMyChange(payload.changedBy)) {
      return;
    }

    toast.info(`${payload.changedByName} deleted score for ${payload.teamName} Round ${payload.roundNumber}`, {
      duration: 4000,
    });

    router.refresh();
  }, [router, isMyChange]));

  useAblyEvent(eventId, ABLY_EVENTS.ROUND_CHANGED, useCallback((payload) => {
    if (isMyChange(payload.changedBy)) {
      return;
    }

    toast.info(`${payload.changedByName} moved to Round ${payload.newRound}`, {
      duration: 4000,
    });

    router.refresh();
  }, [router, isMyChange]));

  useAblyEvent(eventId, ABLY_EVENTS.TEAM_ADDED, useCallback((payload) => {
    toast.success(`${payload.teamName} was added to the event`, {
      duration: 4000,
    });

    router.refresh();
  }, [router]));

  useAblyEvent(eventId, ABLY_EVENTS.TEAM_REMOVED, useCallback((payload) => {
    toast.warning(`${payload.teamName} was removed from the event`, {
      duration: 4000,
    });

    router.refresh();
  }, [router]));

  useAblyEvent(eventId, ABLY_EVENTS.EVENT_STATUS_CHANGED, useCallback((payload) => {
    if (payload.status === 'completed') {
      toast.success('Event has been completed', {
        duration: 5000,
      });
    } else if (payload.status === 'archived') {
      toast.info('Event has been archived', {
        duration: 5000,
      });
    }

    router.refresh();
  }, [router]));

  return (
      <RealtimeProvider eventId={eventId}>
      <EventDashboardContext.Provider value={event}>
        <div className="mb-4 flex items-center justify-start gap-4 sm:justify-end">
          <ConnectionStatus variant="admin" />
        </div>
        {children}
      </EventDashboardContext.Provider>
    </RealtimeProvider>
  );
}
