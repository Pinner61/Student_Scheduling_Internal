import Link from "next/link";
import type { Profile, ScheduleBlock } from "@/types";
import { cn } from "@/lib/utils/cn";
import {
  formatTime12,
  formatTimeRange,
  getShortDayName,
  timeToMinutes,
} from "@/lib/utils/time";
import { workModeCellClass, workModeLabel } from "@/components/schedule/schedule-language";

interface WeekTeamGridProps {
  dates: string[];
  rows: {
    student: Profile;
    byDate: Map<string, ScheduleBlock[]>;
  }[];
  workingDayStart: string;
  workingDayEnd: string;
  detailBasePath: string;
  workModeFilter?: string;
}

function ticks(start: string, end: string) {
  const startM = timeToMinutes(start);
  const endM = timeToMinutes(end);
  const hours: string[] = [];
  for (let m = startM; m < endM; m += 120) {
    hours.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return hours;
}

function position(startTime: string, endTime: string, dayStart: string, dayEnd: string) {
  const span = timeToMinutes(dayEnd) - timeToMinutes(dayStart);
  const left = ((timeToMinutes(startTime) - timeToMinutes(dayStart)) / span) * 100;
  const width = ((timeToMinutes(endTime) - timeToMinutes(startTime)) / span) * 100;
  return { left: `${Math.max(0, left)}%`, width: `${Math.max(width, 1.5)}%` };
}

export function WeekTeamGrid({
  dates,
  rows,
  workingDayStart,
  workingDayEnd,
  detailBasePath,
  workModeFilter,
}: WeekTeamGridProps) {
  const hourTicks = ticks(workingDayStart, workingDayEnd);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted-foreground)]">
        No students match these filters. Try changing the team, work mode, or week.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <div
        className="grid min-w-[920px]"
        style={{ gridTemplateColumns: `9rem repeat(${dates.length}, minmax(9rem, 1fr))` }}
      >
        <div className="sticky left-0 z-10 border-b bg-white px-3 py-2 text-xs font-semibold">Student</div>
        {dates.map((date) => {
          const day = new Date(`${date}T12:00:00`).getDay();
          return (
            <div key={`head-${date}`} className="border-b border-l px-2 py-2 text-center">
              <div className="text-xs font-semibold">{getShortDayName(day)}</div>
              <div className="text-[11px] text-[var(--color-muted-foreground)]">
                {date.slice(5).replace("-", "/")}
              </div>
              <div className="relative mt-2 h-4 text-[9px] text-[var(--color-muted-foreground)]">
                {hourTicks.map((tick) => (
                  <span
                    key={`${date}-${tick}`}
                    className="absolute -translate-x-1/2"
                    style={{
                      left: position(tick, tick, workingDayStart, workingDayEnd).left,
                    }}
                  >
                    {formatTime12(tick).replace(":00", "")}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
        {rows.map(({ student, byDate }) => (
          <div key={student.id} className="contents">
            <div className="sticky left-0 z-10 border-t bg-white px-3 py-2 text-sm">
              <Link
                href={`${detailBasePath}/${student.id}`}
                className="font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
              >
                {student.firstName} {student.lastName}
              </Link>
            </div>
            {dates.map((date) => {
              const blocks = (byDate.get(date) ?? []).filter(
                (block) =>
                  !workModeFilter ||
                  workModeFilter === "all" ||
                  block.workMode === workModeFilter
              );
              return (
                <div key={`${student.id}-${date}`} className="border-t border-l px-1 py-2">
                  <div className="relative h-10 rounded-sm bg-[var(--color-muted)]/50">
                    {blocks.map((block, i) => {
                      const style = position(
                        block.startTime,
                        block.endTime,
                        workingDayStart,
                        workingDayEnd
                      );
                      return (
                        <div
                          key={`${block.startTime}-${i}`}
                          title={`${workModeLabel(block.workMode)} ${formatTimeRange(block.startTime, block.endTime)}`}
                          className={cn(
                            "absolute top-0.5 bottom-0.5 overflow-hidden rounded-sm border text-[10px] font-medium leading-9",
                            workModeCellClass(block.workMode)
                          )}
                          style={style}
                        >
                          <span className="px-1">{workModeLabel(block.workMode)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
