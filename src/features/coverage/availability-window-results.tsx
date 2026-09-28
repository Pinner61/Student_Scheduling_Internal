import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ScheduleBlock, UserWithTeam } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { WorkModeBadge } from "@/components/schedule/work-mode-badge";
import { workModeCellClass, workModeLabel } from "@/components/schedule/schedule-language";
import { formatTime12, formatTimeRange, timeToMinutes } from "@/lib/utils/time";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";

interface AvailabilityWindowResultsProps {
  results: {
    student: UserWithTeam;
    blocks: ScheduleBlock[];
    coversWindow: boolean;
  }[];
  windowStart: string;
  windowEnd: string;
  workingDayStart: string;
  workingDayEnd: string;
  detailBasePath?: string;
}

function pct(time: string, dayStart: string, dayEnd: string) {
  const span = timeToMinutes(dayEnd) - timeToMinutes(dayStart);
  return ((timeToMinutes(time) - timeToMinutes(dayStart)) / span) * 100;
}

export function AvailabilityWindowResults({
  results,
  windowStart,
  windowEnd,
  workingDayStart,
  workingDayEnd,
  detailBasePath = "/supervisor/students",
}: AvailabilityWindowResultsProps) {
  const bandLeft = pct(windowStart, workingDayStart, workingDayEnd);
  const bandWidth = pct(windowEnd, workingDayStart, workingDayEnd) - bandLeft;
  const fullCount = results.filter((r) => r.coversWindow).length;
  const partialCount = results.length - fullCount;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">
        {results.length} student{results.length === 1 ? "" : "s"} overlap{" "}
        {formatTimeRange(windowStart, windowEnd)} · {fullCount} full · {partialCount} partial
      </p>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        The highlighted band is the requested window. Students not listed have no availability in
        this window.
      </p>
      {results.map(({ student, blocks, coversWindow }) => (
        <Card key={student.id}>
          <CardContent className="space-y-3 py-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Link
                  href={`${detailBasePath}/${student.id}`}
                  className="font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
                >
                  {student.firstName} {student.lastName}
                </Link>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {student.teamName ?? "Unassigned"}
                </p>
              </div>
              <p
                className={cn(
                  "inline-flex items-center gap-1.5 text-sm font-semibold",
                  coversWindow ? "text-emerald-800" : "text-amber-800"
                )}
              >
                {coversWindow ? (
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                )}
                {coversWindow ? "Covers full window" : "Partial overlap"}
              </p>
            </div>
            <div className="relative h-12 overflow-hidden rounded-md border bg-[var(--color-muted)]/40">
              <div
                className="absolute inset-y-0 bg-amber-200/70"
                style={{ left: `${bandLeft}%`, width: `${bandWidth}%` }}
                aria-hidden="true"
              />
              <div
                className="absolute inset-y-0 border-x-2 border-amber-600/80"
                style={{ left: `${bandLeft}%`, width: `${bandWidth}%` }}
                title={`Requested ${formatTimeRange(windowStart, windowEnd)}`}
              />
              {blocks.map((block, i) => (
                <div
                  key={`${block.startTime}-${i}`}
                  className={cn(
                    "absolute top-1.5 bottom-1.5 overflow-hidden rounded-sm border text-[10px] font-medium leading-8",
                    workModeCellClass(block.workMode),
                    !coversWindow && "opacity-70"
                  )}
                  style={{
                    left: `${pct(block.startTime, workingDayStart, workingDayEnd)}%`,
                    width: `${pct(block.endTime, workingDayStart, workingDayEnd) - pct(block.startTime, workingDayStart, workingDayEnd)}%`,
                  }}
                  title={`${workModeLabel(block.workMode)} ${formatTimeRange(block.startTime, block.endTime)}`}
                >
                  <span className="px-1">{workModeLabel(block.workMode)}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-muted-foreground)]">
              <span>Requested: {formatTimeRange(windowStart, windowEnd)}</span>
              {blocks.map((b, i) => (
                <span key={`${b.startTime}-label-${i}`} className="inline-flex items-center gap-1">
                  {formatTimeRange(b.startTime, b.endTime)}
                  <WorkModeBadge mode={b.workMode} />
                </span>
              ))}
            </div>
            <p className="text-[11px] text-[var(--color-muted-foreground)]">
              {formatTime12(workingDayStart)} — {formatTime12(workingDayEnd)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
