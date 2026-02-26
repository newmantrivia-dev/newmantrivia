'use client';

import { useEffect, useState, useCallback, createContext, useContext, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAblyEvent } from '@/lib/ably/hooks';
import { ABLY_EVENTS } from '@/lib/ably/config';
import type { LeaderboardData } from '@/lib/types';
import { ConnectionStatus } from '@/components/ably/connection-status';

interface RealtimeEventContextValue {
  data: LeaderboardData;
  liveCommentary: LeaderboardData["commentaryHistory"][number] | null;
}

const RealtimeEventContext = createContext<RealtimeEventContextValue | null>(null);

export function useRealtimeEventData() {
  const context = useContext(RealtimeEventContext);
  if (!context) {
    throw new Error('useRealtimeEventData must be used within RealtimeEventWrapper');
  }
  return context.data;
}

export function useRealtimeCommentary() {
  const context = useContext(RealtimeEventContext);
  if (!context) {
    throw new Error('useRealtimeCommentary must be used within RealtimeEventWrapper');
  }
  return context.liveCommentary;
}

interface RealtimeEventWrapperProps {
  eventId: string;
  initialData: LeaderboardData;
  mode: 'active' | 'completed';
  children: React.ReactNode;
}

export function RealtimeEventWrapper({
  eventId,
  initialData,
  children,
}: RealtimeEventWrapperProps) {
  const router = useRouter();
  const [data, setData] = useState<LeaderboardData>(initialData);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date(initialData.lastUpdated));
  const [liveCommentary, setLiveCommentary] = useState<LeaderboardData["commentaryHistory"][number] | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commentaryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRefresh = useCallback((delayMs = 300) => {
    if (refreshTimerRef.current) {
      return;
    }

    refreshTimerRef.current = setTimeout(() => {
      refreshTimerRef.current = null;
      router.refresh();
    }, delayMs);
  }, [router]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      if (commentaryTimerRef.current) {
        clearTimeout(commentaryTimerRef.current);
      }
    };
  }, []);

  useAblyEvent(eventId, ABLY_EVENTS.SCORE_UPDATED, useCallback(() => {
    setLastUpdateTime(new Date());
    scheduleRefresh();
  }, [scheduleRefresh]));

  useAblyEvent(eventId, ABLY_EVENTS.SCORE_DELETED, useCallback(() => {
    setLastUpdateTime(new Date());
    scheduleRefresh();
  }, [scheduleRefresh]));

  useAblyEvent(eventId, ABLY_EVENTS.ROUND_CHANGED, useCallback((payload) => {
    setData((prev) => ({
      ...prev,
      currentRound: payload.newRound,
      lastUpdated: new Date(),
    }));
    setLastUpdateTime(new Date());
    scheduleRefresh();
  }, [scheduleRefresh]));

  useAblyEvent(eventId, ABLY_EVENTS.TEAM_ADDED, useCallback(() => {
    setLastUpdateTime(new Date());
    scheduleRefresh();
  }, [scheduleRefresh]));

  useAblyEvent(eventId, ABLY_EVENTS.TEAM_REMOVED, useCallback(() => {
    setLastUpdateTime(new Date());
    scheduleRefresh();
  }, [scheduleRefresh]));

  useAblyEvent(eventId, ABLY_EVENTS.COMMENTARY_POSTED, useCallback((payload) => {
    const incoming = {
      id: payload.id,
      message: payload.message,
      displayDurationMs: payload.displayDurationMs,
      createdAt: new Date(payload.timestamp),
      createdBy: payload.createdBy,
      createdByName: payload.createdByName,
    };

    setData((prev) => ({
      ...prev,
      commentaryHistory: [incoming, ...prev.commentaryHistory].slice(0, 50),
      lastUpdated: new Date(),
    }));

    setLiveCommentary(incoming);
    if (commentaryTimerRef.current) {
      clearTimeout(commentaryTimerRef.current);
    }
    commentaryTimerRef.current = setTimeout(() => {
      setLiveCommentary(null);
      commentaryTimerRef.current = null;
    }, payload.displayDurationMs);
  }, []));

  useAblyEvent(eventId, ABLY_EVENTS.COMMENTARY_DELETED, useCallback((payload) => {
    setData((prev) => ({
      ...prev,
      commentaryHistory: prev.commentaryHistory.filter((entry) => entry.id !== payload.id),
      lastUpdated: new Date(),
    }));

    setLiveCommentary((prev) => {
      if (!prev || prev.id !== payload.id) {
        return prev;
      }

      if (commentaryTimerRef.current) {
        clearTimeout(commentaryTimerRef.current);
        commentaryTimerRef.current = null;
      }

      return null;
    });
  }, []));

  useEffect(() => {
    setData(initialData);
    setLastUpdateTime(new Date(initialData.lastUpdated));
    setLiveCommentary(null);
  }, [initialData]);

  const displayData: LeaderboardData = {
    ...data,
    lastUpdated: lastUpdateTime,
  };

  return (
    <RealtimeEventContext.Provider value={{ data: displayData, liveCommentary }}>
      {children}
      <ConnectionStatus variant="public" />
    </RealtimeEventContext.Provider>
  );
}
