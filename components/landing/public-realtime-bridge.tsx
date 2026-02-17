'use client';

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAblyEvent } from "@/lib/ably/hooks";
import { ABLY_EVENTS } from "@/lib/ably/config";

export function PublicRealtimeBridge() {
  const router = useRouter();
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

  useAblyEvent(
    "global",
    ABLY_EVENTS.EVENT_LIFECYCLE,
    useCallback(() => {
      scheduleRefresh();
    }, [scheduleRefresh])
  );

  return null;
}
