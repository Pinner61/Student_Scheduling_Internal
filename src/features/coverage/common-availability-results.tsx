import { formatTimeRange, getDayName } from "@/lib/utils/time";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CommonAvailabilityWindow, UserWithTeam } from "@/types";

interface WindowResult extends CommonAvailabilityWindow {
  students: UserWithTeam[];
}

export function CommonAvailabilityResults({
  full,
  partial,
  total,
}: {
  full: WindowResult[];
  partial: WindowResult[];
  total: number;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Full-team matches</CardTitle>
          <CardDescription>
            Every selected student is available for the whole window. These are the only results that
            satisfy a full-group meeting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {full.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              No windows where all {total} selected students are available.
            </p>
          ) : (
            <ul className="space-y-2">
              {full.map((window) => (
                <li
                  key={`${window.date}-${window.startTime}`}
                  className="rounded-md border px-3 py-2 text-sm"
                >
                  <div className="font-medium">
                    {getDayName(window.dayOfWeek)} · {formatTimeRange(window.startTime, window.endTime)}
                  </div>
                  <div className="text-[var(--color-muted-foreground)]">
                    {window.availableCount}/{window.totalCount} students available
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {partial.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Partial matches</CardTitle>
            <CardDescription>
              These windows do not cover the full group and should not be used as a full-team meeting.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {partial.slice(0, 24).map((window) => (
                <li
                  key={`partial-${window.date}-${window.startTime}`}
                  className="rounded-md border border-dashed px-3 py-2 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2 font-medium">
                    {getDayName(window.dayOfWeek)} · {formatTimeRange(window.startTime, window.endTime)}
                    <Badge variant="warning">
                      Partial · {window.availableCount}/{window.totalCount} available
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
