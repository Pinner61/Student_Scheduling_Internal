import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import {
  getSupervisorTeams,
  getTeamCoverageData,
  getTeamMembers,
  listTeams,
  getSettings,
  getEffectiveSchedule,
} from "@/lib/services/data-service";
import { addDaysToDateString, formatFriendlyDate, formatWeekRange, weekdayDatesFromWeekStart } from "@/lib/utils/time";
import { getCurrentWeekStart, getTodayDateString } from "@/lib/schedule/engine";
import { CoverageFilters } from "@/features/coverage/coverage-filters";
import { DayTeamGrid } from "@/features/coverage/day-team-grid";
import { WeekTeamGrid } from "@/features/coverage/week-team-grid";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Profile, ScheduleBlock } from "@/types";

interface PageProps {
  searchParams: Promise<{
    date?: string;
    team?: string;
    student?: string;
    mode?: string;
    q?: string;
    view?: string;
  }>;
}

function uniqueStudents(students: Profile[]) {
  return Array.from(new Map(students.map((s) => [s.id, s])).values());
}

export default async function SupervisorTeamPage({ searchParams }: PageProps) {
  const user = await getSessionUser();
  if (!user) return null;

  const params = await searchParams;
  const view = params.view === "day" ? "day" : "week";
  const date = params.date ?? getTodayDateString();
  const weekStart = getCurrentWeekStart(new Date(`${date}T12:00:00`));
  const weekDates = weekdayDatesFromWeekStart(weekStart);
  const settings = getSettings();
  const supervisorTeams = getSupervisorTeams(user.id);
  const allTeams = listTeams();
  const selectedTeamId = params.team && params.team !== "all" ? params.team : undefined;
  const team = selectedTeamId ? allTeams.find((t) => t.id === selectedTeamId) : undefined;
  const teamIds = selectedTeamId ? [selectedTeamId] : supervisorTeams.map((t) => t.id);

  const students = uniqueStudents(
    teamIds.flatMap((id) => getTeamMembers(id).filter((m) => m.role === "student" && m.status === "active"))
  );

  let coverage = teamIds.flatMap((id) => getTeamCoverageData(id, date));
  if (params.student && params.student !== "all") {
    coverage = coverage.filter((c) => c.student.id === params.student);
  }
  if (params.q) {
    const q = params.q.toLowerCase();
    coverage = coverage.filter((c) =>
      `${c.student.firstName} ${c.student.lastName}`.toLowerCase().includes(q)
    );
  }

  let weekRows: { student: Profile; byDate: Map<string, ScheduleBlock[]> }[] = students.map((student) => ({
    student,
    byDate: new Map(weekDates.map((d) => [d, getEffectiveSchedule(student.id, d)])),
  }));
  if (params.student && params.student !== "all") {
    weekRows = weekRows.filter((row) => row.student.id === params.student);
  }
  if (params.q) {
    const q = params.q.toLowerCase();
    weekRows = weekRows.filter((row) =>
      `${row.student.firstName} ${row.student.lastName}`.toLowerCase().includes(q)
    );
  }

  const query = new URLSearchParams();
  if (params.team) query.set("team", params.team);
  if (params.mode) query.set("mode", params.mode);
  if (params.q) query.set("q", params.q);
  if (params.student) query.set("student", params.student);
  query.set("view", view);
  const qs = query.toString();
  const withDate = (next: string) => `/supervisor/team?date=${next}${qs ? `&${qs}` : ""}`;
  const withView = (nextView: string) => {
    const next = new URLSearchParams(qs);
    next.set("view", nextView);
    next.set("date", date);
    return `/supervisor/team?${next.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Team Schedule</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Compare when students overlap across the week, then switch to Day view for a single date.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Schedule view">
        <Link
          href={withView("week")}
          className={buttonVariants({ variant: view === "week" ? "default" : "outline" })}
          aria-current={view === "week" ? "page" : undefined}
        >
          Week
        </Link>
        <Link
          href={withView("day")}
          className={buttonVariants({ variant: view === "day" ? "default" : "outline" })}
          aria-current={view === "day" ? "page" : undefined}
        >
          Day
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {view === "week" ? (
          <>
            <Link href={withDate(addDaysToDateString(weekStart, -7))} className={buttonVariants({ variant: "outline" })}>
              ← Previous Week
            </Link>
            <Link href={withDate(getTodayDateString())} className={buttonVariants({ variant: "secondary" })}>
              Today
            </Link>
            <Link href={withDate(addDaysToDateString(weekStart, 7))} className={buttonVariants({ variant: "outline" })}>
              Next Week →
            </Link>
            <span className="text-sm font-medium">Week of {formatWeekRange(weekStart)}</span>
          </>
        ) : (
          <>
            <Link href={withDate(addDaysToDateString(date, -1))} className={buttonVariants({ variant: "outline" })}>
              ← Previous Day
            </Link>
            <Link href={withDate(getTodayDateString())} className={buttonVariants({ variant: "secondary" })}>
              Today
            </Link>
            <Link href={withDate(addDaysToDateString(date, 1))} className={buttonVariants({ variant: "outline" })}>
              Next Day →
            </Link>
            <span className="text-sm font-medium">{formatFriendlyDate(date)}</span>
          </>
        )}
      </div>

      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <CoverageFilters
          teams={supervisorTeams}
          students={students}
          basePath="/supervisor/team"
          showSearch
          defaultDate={date}
        />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>{team?.name ?? "Assigned teams"}</CardTitle>
          <CardDescription>
            Office and Remote stay visually distinct. Click a student name for their weekly schedule
            and exceptions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {view === "week" ? (
            <WeekTeamGrid
              dates={weekDates}
              rows={weekRows}
              workingDayStart={settings.workingDayStart}
              workingDayEnd={settings.workingDayEnd}
              detailBasePath="/supervisor/students"
              workModeFilter={params.mode}
            />
          ) : (
            <DayTeamGrid
              coverage={coverage}
              workingDayStart={settings.workingDayStart}
              workingDayEnd={settings.workingDayEnd}
              intervalMinutes={settings.schedulingIntervalMinutes}
              detailBasePath="/supervisor/students"
              workModeFilter={params.mode}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
