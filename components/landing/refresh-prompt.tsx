"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface RefreshPromptProps {
  /**
   * Whether the event is completed (no need to prompt for refresh)
   */
  isCompleted: boolean;
  /**
   * Delay in milliseconds before showing the refresh prompt
   * @default 120000 (2 minutes)
   */
  delayMs?: number;
}

export function RefreshPrompt({ isCompleted, delayMs = 120000 }: RefreshPromptProps) {
  const router = useRouter();
  const [hasShownPrompt, setHasShownPrompt] = useState(false);

  useEffect(() => {
    // Don't show refresh prompt for completed events
    if (isCompleted) {
      return;
    }

    const timer = setTimeout(() => {
      if (!hasShownPrompt) {
        toast.info("Scores may have updated", {
          description: "Refresh the page to see the latest standings",
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
  }, [isCompleted, delayMs, hasShownPrompt, router]);

  // Reset prompt state when user manually refreshes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setHasShownPrompt(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return null; // This component only manages side effects
}
