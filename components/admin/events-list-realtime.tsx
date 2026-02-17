'use client';

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "@/lib/auth/client";
import { useAblyEvent } from "@/lib/ably/hooks";
import { ABLY_EVENTS } from "@/lib/ably/config";

export function EventsListRealtime() {
  const router = useRouter();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id || null;

  useAblyEvent(
    "global",
    ABLY_EVENTS.EVENT_LIFECYCLE,
    useCallback(
      (payload) => {
        router.refresh();

        if (payload.changedBy === currentUserId) {
          return;
        }

        const message = (() => {
          switch (payload.action) {
            case "created":
              return `${payload.changedByName} created "${payload.eventName}"`;
            case "started":
              return `${payload.changedByName} started "${payload.eventName}"`;
            case "ended":
              return `${payload.changedByName} ended "${payload.eventName}"`;
            case "reopened":
              return `${payload.changedByName} reopened "${payload.eventName}"`;
            case "archived":
              return `${payload.changedByName} archived "${payload.eventName}"`;
            case "deleted":
              return `${payload.changedByName} deleted "${payload.eventName}"`;
            case "reset":
              return `${payload.changedByName} reset "${payload.eventName}"`;
            default:
              return `Event "${payload.eventName}" was updated`;
          }
        })();

        toast.info(message, { duration: 4000 });
      },
      [router, currentUserId]
    )
  );

  return null;
}
