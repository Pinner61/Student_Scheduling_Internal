import Link from "next/link";
import type { Profile, ScheduleBlock } from "@/types";
import { cn } from "@/lib/utils/cn";
import { formatTime12, generateSlotStarts, minutesToTime, timeToMinutes } from "@/lib/utils/time";
import { workModeCellClass, workModeLabel } from "@/components/schedule/schedule-language";

interface DayTeamGridProps {
  coverage: { student: Profile; blocks: ScheduleBlock[] }[];
  workingDayStart: string;
  workingDayEnd: string;
  intervalMinutes: number;
  detailBasePath: string;
  workModeFilter?: string;
}

function blockAt(blocks: ScheduleBlock[], slot: string, interval: number): ScheduleBlock | undefined {
  const slotEnd = minutesToTime(timeToMinutes(slot) + interval);
  return blocks.find(
    (b) => timeToMinutes(b.startTime) <= timeToMinutes(slot) && timeToMinutes(b.endTime) >= timeToMinutes(slotEnd)
  );
}

export function DayTeamGrid({
  coverage,
  workingDayStart,
  workingDayEnd,
  intervalMinutes,
  detailBasePath,
  workModeFilter,
}: DayTeamGridProps) {
  const slots = generateSlotStarts(workingDayStart, workingDayEnd, intervalMinutes);

  if (coverage.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted-foreground)]">
        No students match these filters. Try changing the team, work mode, or date.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <div
        className="grid min-w-[900px]"
        style={{ gridTemplateColumns: `9rem repeat(${slots.length}, minmax(2.4rem, 1fr))` }}
      >
        <div className="sticky left-0 z-10 border-b bg-white px-3 py-2 text-xs font-semibold">Student</div>
        {slots.map((slot) => (
          <div
            key={slot}
            className="border-b px-1 py-2 text-center text-[10px] text-[var(--color-muted-foreground)]"
          >
            {formatTime12(slot).replace(" ", "\n")}
          </div>
        ))}
        {coverage.map(({ student, blocks }) => (
          <div key={student.id} className="contents">
            <div className="sticky left-0 z-10 border-t bg-white px-3 py-2 text-sm">
              <Link
                href={`${detailBasePath}/${student.id}`}
                className="font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
              >
                {student.firstName} {student.lastName}
              </Link>
            </div>
            {slots.map((slot) => {
              const block = blockAt(blocks, slot, intervalMinutes);
              const visible =
                !workModeFilter ||
                workModeFilter === "all" ||
                block?.workMode === workModeFilter;
              const show = visible ? block : undefined;
              return (
                <div
                  key={`${student.id}-${slot}`}
                  title={
                    show
                      ? `${workModeLabel(show.workMode)} ${formatTime12(show.startTime)}–${formatTime12(show.endTime)}`
                      : "Unavailable"
                  }
                  className={cn(
                    "min-h-10 border-t border-l text-center text-[10px] font-medium leading-10",
                    workModeCellClass(show?.workMode)
                  )}
                >
                  {show && show.startTime === slot ? workModeLabel(show.workMode) : ""}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
