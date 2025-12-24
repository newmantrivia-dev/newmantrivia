"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface RefreshPromptProps {
  isCompleted: boolean;
  delayMs?: number;
}

export function RefreshPrompt({ isCompleted, delayMs = 120000 }: RefreshPromptProps) {
  const router = useRouter();
  const [hasShownPrompt, setHasShownPrompt] = useState(false);

  useEffect(() => {
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

  return null;
}
