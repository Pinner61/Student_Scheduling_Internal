import type { Profile, ScheduleBlock } from "@/types";
import { WorkModeBadge } from "@/components/schedule/work-mode-badge";
import { formatTimeRange, getShortDayName } from "@/lib/utils/time";

interface CoverageEntry {
  student: Profile;
  blocks: ScheduleBlock[];
}

interface TeamCoverageGridProps {
  coverage: CoverageEntry[];
  date: string;
  dayOfWeek: number;
}

export function TeamCoverageGrid({ coverage, date, dayOfWeek }: TeamCoverageGridProps) {
  if (coverage.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted-foreground)]">
        No students on this team.
      </p>
    );
  }

  const office = coverage.filter((c) => c.blocks.some((b) => b.workMode === "OFFICE")).length;
  const remote = coverage.filter((c) => c.blocks.some((b) => b.workMode === "REMOTE")).length;
  const unavailable = coverage.filter((c) => c.blocks.length === 0).length;

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--color-muted-foreground)]">
        {office} in office · {remote} remote · {unavailable} with no availability on this date
      </p>
      <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-sm">
        <caption className="sr-only">
          Team coverage for {getShortDayName(dayOfWeek)}, {date}
        </caption>
        <thead>
          <tr className="border-b">
            <th className="px-3 py-2 text-left font-medium">Student</th>
            <th className="px-3 py-2 text-left font-medium">Schedule</th>
          </tr>
        </thead>
        <tbody>
          {coverage.map(({ student, blocks }) => (
            <tr key={student.id} className="border-b">
              <td className="px-3 py-2 whitespace-nowrap">
                {student.firstName} {student.lastName}
              </td>
              <td className="px-3 py-2">
                {blocks.length === 0 ? (
                  <span className="text-[var(--color-muted-foreground)]">Unavailable</span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {blocks.map((b, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded border px-2 py-0.5"
                      >
                        {formatTimeRange(b.startTime, b.endTime)}
                        <WorkModeBadge mode={b.workMode} />
                      </span>
                    ))}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
