"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { adminPaths } from "@/lib/paths";
import { X } from "lucide-react";

interface AuditLogFiltersProps {
  events: Array<{ id: string; name: string; status: string }>;
  currentEventId?: string;
}

export function AuditLogFilters({ events, currentEventId }: AuditLogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleEventChange = (value: string) => {
    if (value === "all") {
      router.push(adminPaths.auditLogs);
    } else {
      router.push(`${adminPaths.auditLogs}?eventId=${value}`);
    }
  };

  const handleClearFilters = () => {
    router.push(adminPaths.auditLogs);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Select value={currentEventId || "all"} onValueChange={handleEventChange}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name} ({event.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {currentEventId && (
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              <X className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
