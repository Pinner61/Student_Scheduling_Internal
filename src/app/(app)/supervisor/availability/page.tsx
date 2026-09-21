import { getSessionUser } from "@/lib/auth/session";
import {
  findAvailableStudents,
  getSupervisorTeams,
  listTeams,
} from "@/lib/services/data-service";
import { getTodayDateString } from "@/lib/schedule/engine";
import { FindAvailabilityForm } from "@/features/coverage/find-availability-form";
import { WorkModeBadge } from "@/components/schedule/work-mode-badge";
import { formatTimeRange } from "@/lib/utils/time";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";

interface PageProps {
  searchParams: Promise<{
    date?: string;
    start?: string;
    end?: string;
    team?: string;
    mode?: string;
  }>;
}

export default async function FindAvailabilityPage({ searchParams }: PageProps) {
  const user = await getSessionUser();
  if (!user) return null;

  const params = await searchParams;
  const date = params.date ?? getTodayDateString();
  const start = params.start ?? "10:00";
  const end = params.end ?? "12:00";
  const searched = Boolean(params.date || params.start);
  const teams =
    user.role === "administrator" ? listTeams() : getSupervisorTeams(user.id);

  const results = searched
    ? findAvailableStudents({
        date,
        startTime: start,
        endTime: end,
        teamId: params.team,
        workMode: params.mode,
        viewer: user,
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Find Availability</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Find students available for a meeting, shoot, event, or coverage window. Results use
          approved exceptions, not only the normal weekly schedule.
        </p>
      </div>

      <FindAvailabilityForm
        teams={teams}
        defaultDate={date}
        defaultStart={start}
        defaultEnd={end}
      />

      {searched && results.length === 0 && (
        <EmptyState
          title="No students are available for that window."
          description="Try a different time, team, or work mode."
        />
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium">{results.length} students available</p>
          {results.map(({ student, blocks, coversWindow }) => (
            <Card key={student.id}>
              <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link
                    href={`/supervisor/students/${student.id}`}
                    className="font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
                  >
                    {student.firstName} {student.lastName}
                  </Link>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    {student.teamName ?? "Unassigned"}
                    {coversWindow ? " · Covers the full window" : " · Overlaps this window"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  {blocks.map((b, i) => (
                    <span key={`${b.startTime}-${i}`} className="inline-flex items-center gap-1">
                      {formatTimeRange(b.startTime, b.endTime)}
                      <WorkModeBadge mode={b.workMode} />
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
