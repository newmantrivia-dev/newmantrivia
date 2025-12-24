"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { reopenEvent, archiveEvent } from "@/actions/events";
import { exportEventCSV } from "@/actions/export";
import { toast } from "sonner";
import { Download, RotateCcw, Archive } from "lucide-react";
import type { Event } from "@/lib/types";

interface EventDetailsActionsProps {
  event: Event;
}

export function EventDetailsActions({ event }: EventDetailsActionsProps) {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    const result = await exportEventCSV(event.id);

    if (result.success) {
      const blob = new Blob([result.data.csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Event exported successfully!");
    } else {
      toast.error(result.error);
    }
    setIsExporting(false);
  };

  const handleReopen = async () => {
    setIsReopening(true);
    const result = await reopenEvent(event.id);

    if (result.success) {
      toast.success("Event reopened successfully!");
      setShowReopenDialog(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setIsReopening(false);
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    const result = await archiveEvent(event.id);

    if (result.success) {
      toast.success("Event archived successfully!");
      setShowArchiveDialog(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setIsArchiving(false);
  };

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? "Exporting..." : "Export CSV"}
        </Button>

        {event.status === "completed" && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReopenDialog(true)}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reopen Event
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowArchiveDialog(true)}
            >
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </Button>
          </>
        )}
      </div>

      {/* Reopen Event Dialog */}
      <Dialog open={showReopenDialog} onOpenChange={setShowReopenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reopen Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to reopen &quot;{event.name}&quot;? This will change the
              status back to active and allow you to modify scores.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReopenDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReopen} disabled={isReopening}>
              {isReopening ? "Reopening..." : "Reopen Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Event Dialog */}
      <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to archive &quot;{event.name}&quot;? Archived events will be
              moved to the history page and won&apos;t appear in the main dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowArchiveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleArchive} disabled={isArchiving}>
              {isArchiving ? "Archiving..." : "Archive Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
