"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Copy, Share2 } from "lucide-react";

interface ShareLeaderboardButtonProps {
  eventName: string;
}

export function ShareLeaderboardButton({ eventName }: ShareLeaderboardButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied">("idle");
  const [canNativeShare, setCanNativeShare] = useState(false);

  const label = useMemo(() => {
    return status === "copied" ? "Link copied" : "Share leaderboard";
  }, [status]);

  useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setCanNativeShare(true);
    }
  }, []);

  const handleShare = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }

    const url = window.location.href;
    const shareData = {
      title: `${eventName} · Newman Trivia`,
      text: "Catch the live Newman trivia leaderboard",
      url,
    };

    if (canNativeShare) {
      try {
        await navigator.share(shareData);
        setStatus("idle");
        return;
      } catch (error) {
        if ((error as DOMException)?.name === "AbortError") {
          return;
        }
      }
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setStatus("copied");
        setTimeout(() => setStatus("idle"), 2400);
        return;
      }
    } catch (error) {
      console.error("Failed to copy leaderboard URL", error);
    }
  }, [eventName, canNativeShare]);

  return (
    <Button
      type="button"
      onClick={handleShare}
      className={cn(
        "group relative overflow-hidden rounded-full border border-white/20 bg-white/10 px-6 py-5 text-sm font-semibold uppercase tracking-[0.35em] text-white shadow-lg transition",
        "hover:border-white/40 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      )}
    >
      <span className="relative z-10 flex items-center gap-3">
        {status === "copied" ? (
          <Check className="h-5 w-5" />
        ) : canNativeShare ? (
          <Share2 className="h-5 w-5" />
        ) : (
          <Copy className="h-5 w-5" />
        )}
        <span>{label}</span>
      </span>
      <span className="absolute inset-0 -z-10 bg-gradient-to-r from-pink-500/30 via-blue-400/30 to-purple-500/30 opacity-0 transition-opacity group-hover:opacity-100" />
    </Button>
  );
}
