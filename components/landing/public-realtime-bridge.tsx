'use client';

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAblyEvent } from "@/lib/ably/hooks";
import { ABLY_EVENTS } from "@/lib/ably/config";

export function PublicRealtimeBridge() {
  const router = useRouter();

  useAblyEvent(
    "global",
    ABLY_EVENTS.EVENT_LIFECYCLE,
    useCallback(() => {
      router.refresh();
    }, [router])
  );

  return null;
}
