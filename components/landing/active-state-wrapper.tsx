'use client';

import { useRealtimeCommentary, useRealtimeEventData } from './realtime-event-wrapper';
import { ActiveOrCompletedState } from './active-state';

interface ActiveOrCompletedStateWrapperProps {
  mode: 'active' | 'completed';
}

export function ActiveOrCompletedStateWrapper({ mode }: ActiveOrCompletedStateWrapperProps) {
  const data = useRealtimeEventData();
  const liveCommentary = useRealtimeCommentary();
  return <ActiveOrCompletedState data={data} mode={mode} liveCommentary={liveCommentary} />;
}
