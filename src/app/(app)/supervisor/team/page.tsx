import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import {
  getSupervisorTeams,
  getTeamCoverageData,
  listTeams,
  getSettings,
} from "@/lib/services/data-service";
import { addDaysToDateString, formatFriendlyDate } from "@/lib/utils/time";
import { getTodayDateString } from "@/lib/schedule/engine";
import { CoverageFilters } from "@/features/coverage/coverage-filters";
import { DayTeamGrid } from "@/features/coverage/day-team-grid";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface PageProps {
  searchParams: Promise<{ date?: string; team?: string; student?: string; mode?: string; q?: string }>;
}

export default async function SupervisorTeamPage({ searchParams }: PageProps) {
  const user = await getSessionUser();
  if (!user) return null;

  const params = await searchParams;
  const date = params.date ?? getTodayDateString();
  const settings = getSettings();
  const supervisorTeams = getSupervisorTeams(user.id);
  const allTeams = listTeams();
  const selectedTeamId = params.team && params.team !== "all" ? params.team : undefined;
  const team = selectedTeamId ? allTeams.find((t) => t.id === selectedTeamId) : undefined;
  const teamIds = selectedTeamId ? [selectedTeamId] : supervisorTeams.map((t) => t.id);
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

  const query = new URLSearchParams();
  if (params.team) query.set("team", params.team);
  if (params.mode) query.set("mode", params.mode);
  if (params.q) query.set("q", params.q);
  const qs = query.toString();
  const withDate = (next: string) => `/supervisor/team?date=${next}${qs ? `&${qs}` : ""}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Team Schedule</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          One day at a time so you can compare who is Office or Remote.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
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
      </div>

      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <CoverageFilters
          teams={supervisorTeams}
          students={teamIds.flatMap((id) => getTeamCoverageData(id, date)).map((c) => c.student)}
          basePath="/supervisor/team"
          showSearch
          defaultDate={date}
        />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>{team?.name ?? "Assigned teams"}</CardTitle>
          <CardDescription>
            Click a student name to see their weekly availability and upcoming exceptions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DayTeamGrid
            coverage={coverage}
            workingDayStart={settings.workingDayStart}
            workingDayEnd={settings.workingDayEnd}
            intervalMinutes={settings.schedulingIntervalMinutes}
            detailBasePath="/supervisor/students"
            workModeFilter={params.mode}
          />
        </CardContent>
      </Card>
    </div>
  );
}
