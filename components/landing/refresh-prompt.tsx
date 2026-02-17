"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAblyConnectionStatus } from "@/lib/ably/hooks";

interface RefreshPromptProps {
  isCompleted: boolean;
  delayMs?: number;
}

export function RefreshPrompt({ isCompleted, delayMs = 120000 }: RefreshPromptProps) {
  const router = useRouter();
  const [hasShownPrompt, setHasShownPrompt] = useState(false);
  const connectionStatus = useAblyConnectionStatus();

  useEffect(() => {
    if (isCompleted || connectionStatus === "connected") {
      return;
    }

    const timer = setTimeout(() => {
      if (!hasShownPrompt) {
        toast.warning("Live connection looks unstable", {
          description: "Standings usually update automatically. Tap refresh if updates stop.",
          duration: 10000,
          action: {
            label: "Refresh",
            onClick: () => {
              router.refresh();
            },
          },
        });
        setHasShownPrompt(true);
      }
    }, delayMs);

    return () => clearTimeout(timer);
  }, [isCompleted, connectionStatus, delayMs, hasShownPrompt, router]);

  return null;
}
