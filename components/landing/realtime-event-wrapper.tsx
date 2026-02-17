'use client';

import { useEffect, useState, useCallback, createContext, useContext, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAblyEvent } from '@/lib/ably/hooks';
import { ABLY_EVENTS } from '@/lib/ably/config';
import type { LeaderboardData } from '@/lib/types';
import { ConnectionStatus } from '@/components/ably/connection-status';

interface RealtimeEventContextValue {
  data: LeaderboardData;
}

const RealtimeEventContext = createContext<RealtimeEventContextValue | null>(null);

export function useRealtimeEventData() {
  const context = useContext(RealtimeEventContext);
  if (!context) {
    throw new Error('useRealtimeEventData must be used within RealtimeEventWrapper');
  }
  return context.data;
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
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    setData(initialData);
    setLastUpdateTime(new Date(initialData.lastUpdated));
  }, [initialData]);

  const displayData: LeaderboardData = {
    ...data,
    lastUpdated: lastUpdateTime,
  };

  return (
    <RealtimeEventContext.Provider value={{ data: displayData }}>
      {children}
      <ConnectionStatus variant="public" />
    </RealtimeEventContext.Provider>
  );
}
