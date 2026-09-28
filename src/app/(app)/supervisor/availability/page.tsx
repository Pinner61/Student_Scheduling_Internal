import { getSessionUser } from "@/lib/auth/session";
import {
  findAvailableStudents,
  getSupervisorTeams,
  listTeams,
  getSettings,
} from "@/lib/services/data-service";
import { getTodayDateString } from "@/lib/schedule/engine";
import { FindAvailabilityForm } from "@/features/coverage/find-availability-form";
import { AvailabilityWindowResults } from "@/features/coverage/availability-window-results";
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
  const settings = getSettings();
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
        <AvailabilityWindowResults
          results={results}
          windowStart={start}
          windowEnd={end}
          workingDayStart={settings.workingDayStart}
          workingDayEnd={settings.workingDayEnd}
        />
      )}
    </div>
  );
}
