import { Suspense } from "react";
import EventDisplay from "@/components/landing/event-display";
import { PublicRealtimeBridge } from "@/components/landing/public-realtime-bridge";

export const dynamic = "force-dynamic";

function LoadingState() {
  return (
    <div className="relative flex min-h-screen items-center justify-center">
      <div className="absolute inset-0 -z-10">
        <BackdropLayers />
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/5 px-10 py-12 shadow-2xl backdrop-blur">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-bounce">🎯</div>
          <p className="text-sm uppercase tracking-[0.4em] text-indigo-200">
            Newman Trivia Live Feed
          </p>
          <p className="text-indigo-100/80">
            Warming up the scoreboard...
          </p>
        </div>
      </div>
    </div>
  );
}

function BackdropLayers() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-[#220b2a] via-[#08172b] to-[#020813]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(244,114,182,0.18),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(56,189,248,0.2),transparent_65%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-size-[140px_140px] opacity-30" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[80px_80px] opacity-20 mix-blend-soft-light" />
    </div>
  );
}

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden text-slate-50">
      <div className="absolute inset-0">
        <BackdropLayers />
      </div>
      <div className="relative z-10 flex min-h-screen flex-col">
        <PublicRealtimeBridge />
        <Suspense fallback={<LoadingState />}>
          <EventDisplay />
        </Suspense>
      </div>
    </div>
  );
}
