import { getSessionUser } from "@/lib/auth/session";
import {
  findAvailableStudents,
  findCommonAvailability,
  getSupervisorTeams,
  getTeamMembers,
  listTeams,
  getSettings,
  getCurrentPeriod,
} from "@/lib/services/data-service";
import { getTodayDateString } from "@/lib/schedule/engine";
import { addDaysToDateString } from "@/lib/utils/time";
import { FindAvailabilityForm } from "@/features/coverage/find-availability-form";
import { FindCommonAvailabilityForm } from "@/features/coverage/find-common-availability-form";
import { AvailabilityWindowResults } from "@/features/coverage/availability-window-results";
import { CommonAvailabilityResults } from "@/features/coverage/common-availability-results";
import { EmptyState } from "@/components/ui/empty-state";

interface PageProps {
  searchParams: Promise<{
    date?: string;
    start?: string;
    end?: string;
    team?: string;
    mode?: string;
    common?: string;
    startDate?: string;
    endDate?: string;
    duration?: string;
    student?: string | string[];
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
  const commonSearch = params.common === "1";
  const settings = getSettings();
  const period = getCurrentPeriod();
  const teams =
    user.role === "administrator" ? listTeams() : getSupervisorTeams(user.id);
  const students = teams.flatMap((team) =>
    getTeamMembers(team.id).filter((member) => member.role === "student" && member.status === "active")
  );
  const uniqueStudents = Array.from(new Map(students.map((s) => [s.id, s])).values());
  const selectedStudentIds = Array.isArray(params.student)
    ? params.student
    : params.student
      ? [params.student]
      : [];

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

  const common = commonSearch
    ? findCommonAvailability({
        viewer: user,
        startDate: params.startDate ?? date,
        endDate: params.endDate ?? addDaysToDateString(date, 4),
        durationMinutes: Number(params.duration ?? "60"),
        teamId: params.team,
        studentIds: selectedStudentIds,
        workMode: params.mode,
      })
    : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Find Availability</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {period ? `${period.name}. ` : ""}
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
        <AvailabilityWindowResults
          results={results}
          windowStart={start}
          windowEnd={end}
          workingDayStart={settings.workingDayStart}
          workingDayEnd={settings.workingDayEnd}
        />
      )}

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Find Common Availability</h2>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Find windows where every selected student is available at the same time. Partial matches
            are listed separately and do not count as a full-team meeting.
          </p>
        </div>
        <FindCommonAvailabilityForm
          teams={teams}
          students={uniqueStudents}
          defaults={{
            startDate: params.startDate ?? date,
            endDate: params.endDate ?? addDaysToDateString(date, 4),
            duration: params.duration ?? "60",
            team: params.team,
            mode: params.mode,
            students: selectedStudentIds,
          }}
        />
        {common && (
          <CommonAvailabilityResults
            full={common.full}
            partial={common.partial}
            total={common.students.length}
          />
        )}
      </section>
    </div>
  );
}
