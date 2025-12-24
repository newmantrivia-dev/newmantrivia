'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAblyEvent } from '@/lib/ably/hooks';
import { ABLY_EVENTS } from '@/lib/ably/config';
import type { LeaderboardData } from '@/lib/types';
import { ConnectionStatus } from '@/components/ably/connection-status';

interface RealtimeEventWrapperProps {
  eventId: string;
  initialData: LeaderboardData;
  mode: 'active' | 'completed';
  children: (data: LeaderboardData) => React.ReactNode;
}

export function RealtimeEventWrapper({
  eventId,
  initialData,
  mode,
  children,
}: RealtimeEventWrapperProps) {
  const router = useRouter();
  const [data, setData] = useState<LeaderboardData>(initialData);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date(initialData.lastUpdated));

  useAblyEvent(eventId, ABLY_EVENTS.SCORE_UPDATED, useCallback(() => {
    setLastUpdateTime(new Date());
    router.refresh();
  }, [router]));

  useAblyEvent(eventId, ABLY_EVENTS.SCORE_DELETED, useCallback(() => {
    setLastUpdateTime(new Date());
    router.refresh();
  }, [router]));

  useAblyEvent(eventId, ABLY_EVENTS.ROUND_CHANGED, useCallback((payload) => {
    setData((prev) => ({
      ...prev,
      currentRound: payload.newRound,
      lastUpdated: new Date(),
    }));
    setLastUpdateTime(new Date());
    router.refresh();
  }, [router]));

  useAblyEvent(eventId, ABLY_EVENTS.TEAM_ADDED, useCallback(() => {
    setLastUpdateTime(new Date());
    router.refresh();
  }, [router]));

  useAblyEvent(eventId, ABLY_EVENTS.TEAM_REMOVED, useCallback(() => {
    setLastUpdateTime(new Date());
    router.refresh();
  }, [router]));

  useAblyEvent(eventId, ABLY_EVENTS.EVENT_STATUS_CHANGED, useCallback((payload) => {
    if (payload.status === 'completed' && mode === 'active') {
      router.refresh();
    } else if (payload.status === 'archived') {
      router.refresh();
    }
  }, [router, mode]));

  useEffect(() => {
    setData(initialData);
    setLastUpdateTime(new Date(initialData.lastUpdated));
  }, [initialData]);

  const displayData: LeaderboardData = {
    ...data,
    lastUpdated: lastUpdateTime,
  };

  return (
    <>
      {children(displayData)}
      <ConnectionStatus variant="public" />
    </>
  );
}

