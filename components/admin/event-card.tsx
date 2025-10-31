"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminPaths } from "@/lib/paths";
import { startEvent, endEvent, deleteEvent } from "@/actions/events";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Play, Edit, Trash2, Eye, Flag } from "lucide-react";
import type { Event } from "@/lib/types";

interface EventCardProps {
  event: Event & {
    teams?: Array<{ id: string }>;
    rounds?: Array<{ id: string }>;
  };
}

export function EventCard({ event }: EventCardProps) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleStart = async () => {
    setIsStarting(true);
    const result = await startEvent(event.id);

    if (result.success) {
      toast.success("Event started successfully!");
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setIsStarting(false);
  };

  const handleEnd = async () => {
    setIsEnding(true);
    const result = await endEvent(event.id);

    if (result.success) {
      toast.success("Event ended successfully!");
      setShowEndDialog(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setIsEnding(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteEvent(event.id);

    if (result.success) {
      toast.success("Event deleted successfully!");
      setShowDeleteDialog(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setIsDeleting(false);
  };

  const getStatusBadge = () => {
    switch (event.status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "upcoming":
        return <Badge className="bg-blue-500">Upcoming</Badge>;
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "completed":
        return <Badge variant="outline">Completed</Badge>;
      case "archived":
        return <Badge variant="outline">Archived</Badge>;
    }
  };

  const teamCount = event.teams?.length || 0;
  const roundCount = event.rounds?.length || 0;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-xl">{event.name}</CardTitle>
              {event.description && (
                <CardDescription className="line-clamp-2">
                  {event.description}
                </CardDescription>
              )}
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {event.status === "active" && (
              <>
                <span>
                  Round {event.currentRound} of {roundCount}
                </span>
                <span>•</span>
                <span>{teamCount} teams</span>
                <span>•</span>
                <span>
                  Started {event.startedAt && formatDistanceToNow(new Date(event.startedAt), { addSuffix: true })}
                </span>
              </>
            )}

            {event.status === "upcoming" && (
              <>
                {event.scheduledDate && (
                  <span>
                    Scheduled for{" "}
                    {new Date(event.scheduledDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </>
            )}

            {event.status === "draft" && (
              <>
                <span>{roundCount} rounds configured</span>
                {teamCount > 0 && (
                  <>
                    <span>•</span>
                    <span>{teamCount} teams</span>
                  </>
                )}
              </>
            )}

            {event.status === "completed" && event.endedAt && (
              <span>
                Completed {formatDistanceToNow(new Date(event.endedAt), { addSuffix: true })}
              </span>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex gap-2 flex-wrap">
          {event.status === "draft" && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href={adminPaths.events.edit(event.id)}>
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Link>
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </>
          )}

          {event.status === "upcoming" && (
            <>
              <Button size="sm" onClick={handleStart} disabled={isStarting}>
                <Play className="w-4 h-4 mr-1" />
                {isStarting ? "Starting..." : "Start Event"}
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={adminPaths.events.edit(event.id)}>
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Link>
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </>
          )}

          {event.status === "active" && (
            <>
              <Button size="sm" asChild>
                <Link href={adminPaths.events.byId(event.id)}>
                  <Eye className="w-4 h-4 mr-1" />
                  Manage Event
                </Link>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowEndDialog(true)}
              >
                <Flag className="w-4 h-4 mr-1" />
                End Event
              </Button>
            </>
          )}

          {event.status === "completed" && (
            <Button variant="outline" size="sm" asChild>
              <Link href={adminPaths.events.view(event.id)}>
                <Eye className="w-4 h-4 mr-1" />
                View Details
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* End Event Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to end &quot;{event.name}&quot;? This will mark the event as
              completed and display final results.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleEnd} disabled={isEnding}>
              {isEnding ? "Ending..." : "End Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Event Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{event.name}&quot;? This action cannot be
              undone. All teams, scores, and audit logs will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
