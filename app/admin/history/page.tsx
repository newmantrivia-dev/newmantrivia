import { Suspense } from "react";
import { HistoryList } from "@/components/admin/history-list";

export const dynamic = "force-dynamic";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="text-6xl animate-pulse">📚</div>
            <p className="text-muted-foreground">Loading event history...</p>
          </div>
        </div>
      }
    >
      <HistoryList page={page} />
    </Suspense>
  );
}
