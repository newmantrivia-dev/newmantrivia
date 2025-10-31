import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { FileEdit, FilePlus, Trash2 } from "lucide-react";

interface AuditLogEntryProps {
  log: {
    id: string;
    action: "created" | "updated" | "deleted";
    roundNumber: number;
    oldPoints: string | null;
    newPoints: string;
    reason: string | null;
    changedAt: Date;
    team: { name: string };
    changedByUser: { name: string };
  };
}

export function AuditLogEntry({ log }: AuditLogEntryProps) {
  const getActionIcon = () => {
    switch (log.action) {
      case "created":
        return <FilePlus className="w-4 h-4 text-green-500" />;
      case "updated":
        return <FileEdit className="w-4 h-4 text-blue-500" />;
      case "deleted":
        return <Trash2 className="w-4 h-4 text-red-500" />;
    }
  };

  const getActionBadge = () => {
    switch (log.action) {
      case "created":
        return <Badge className="bg-green-500">Created</Badge>;
      case "updated":
        return <Badge className="bg-blue-500">Updated</Badge>;
      case "deleted":
        return <Badge variant="destructive">Deleted</Badge>;
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{getActionIcon()}</div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {getActionBadge()}
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(log.changedAt), { addSuffix: true })}
              </span>
            </div>

            <div className="text-sm">
              <span className="font-medium">{log.changedByUser.name}</span>{" "}
              <span className="text-muted-foreground">{log.action} score for</span>{" "}
              <span className="font-medium">{log.team.name}</span>{" "}
              <span className="text-muted-foreground">• Round {log.roundNumber}</span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              {log.oldPoints !== null && (
                <span className="text-muted-foreground">
                  Old: <span className="font-mono">{log.oldPoints}</span>
                </span>
              )}
              {log.oldPoints !== null && <span className="text-muted-foreground">→</span>}
              <span className="text-muted-foreground">
                New: <span className="font-mono font-semibold">{log.newPoints}</span>
              </span>
            </div>

            {log.reason && (
              <div className="text-sm text-muted-foreground italic bg-muted/50 p-2 rounded">
                Reason: {log.reason}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
