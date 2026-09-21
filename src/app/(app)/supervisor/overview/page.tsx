import { getSessionUser } from "@/lib/auth/session";
import {
  getSupervisorTeams,
  getTeamCoverageData,
  getSettings,
  getExceptionsForTeam,
} from "@/lib/services/data-service";
import {
  getTodayDateString,
  getNowTimeString,
  isCurrentlyWorking,
} from "@/lib/schedule/engine";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkModeBadge } from "@/components/schedule/work-mode-badge";
import { formatTimeRange, formatLongWeekdayYear } from "@/lib/utils/time";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default async function SupervisorOverviewPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const teams = getSupervisorTeams(user.id);
  const today = getTodayDateString();
  const nowTime = getNowTimeString();
  const settings = getSettings();

  const allCoverage = teams.flatMap((team) => {
    const coverage = getTeamCoverageData(team.id, today);
    return coverage.map((c) => ({ ...c, teamName: team.name, teamId: team.id }));
  });

  const currentlyWorking = allCoverage.filter((c) =>
    isCurrentlyWorking(c.blocks, nowTime)
  );
  const inOffice = currentlyWorking.filter((c) =>
    c.blocks.some(
      (b) =>
        b.workMode === "OFFICE" &&
        b.startTime <= nowTime &&
        b.endTime > nowTime
    )
  );
  const remote = currentlyWorking.filter((c) =>
    c.blocks.some(
      (b) =>
        b.workMode === "REMOTE" &&
        b.startTime <= nowTime &&
        b.endTime > nowTime
    )
  );

  const upcomingToday = allCoverage
    .flatMap((c) =>
      c.blocks
        .filter((b) => b.startTime > nowTime)
        .map((b) => ({
          student: c.student,
          teamName: c.teamName,
          block: b,
        }))
    )
    .sort((a, b) => a.block.startTime.localeCompare(b.block.startTime))
    .slice(0, 10);

  const pendingCount = teams
    .flatMap((t) => getExceptionsForTeam(t.id))
    .filter((e) => e.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Today’s team</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {formatLongWeekdayYear(today)} · Who is working, where, and what needs attention
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/supervisor/team" className={buttonVariants()}>
          View Team Schedule
        </Link>
        <Link href="/supervisor/availability" className={buttonVariants({ variant: "outline" })}>
          Find Availability
        </Link>
        <Link href="/supervisor/exceptions" className={buttonVariants({ variant: "outline" })}>
          Review Exceptions
        </Link>
      </div>

      {pendingCount > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          {pendingCount} exception{pendingCount !== 1 ? "s" : ""} awaiting review.{" "}
          <a href="/supervisor/exceptions" className="font-medium text-[var(--color-primary)] underline">
            Review now
          </a>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Currently working</CardDescription>
            <CardTitle className="text-3xl">{currentlyWorking.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In office</CardDescription>
            <CardTitle className="text-3xl">{inOffice.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Remote</CardDescription>
            <CardTitle className="text-3xl">{remote.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Working now</CardTitle>
        </CardHeader>
        <CardContent>
          {currentlyWorking.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              No team members are scheduled right now.
            </p>
          ) : (
            <ul className="space-y-2">
              {currentlyWorking.map((c) => {
                const activeBlock = c.blocks.find(
                  (b) => b.startTime <= nowTime && b.endTime > nowTime
                );
                return (
                  <li
                    key={c.student.id}
                    className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm"
                  >
                    <span className="font-medium">
                      {c.student.firstName} {c.student.lastName}
                    </span>
                    <Badge variant="neutral">{c.teamName}</Badge>
                    {activeBlock && <WorkModeBadge mode={activeBlock.workMode} />}
                    {activeBlock && (
                      <span className="text-[var(--color-muted-foreground)]">
                        until {formatTimeRange(activeBlock.startTime, activeBlock.endTime).split("–")[1]?.trim()}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming today</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingToday.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              No more scheduled shifts today.
            </p>
          ) : (
            <ul className="space-y-2">
              {upcomingToday.map((item, i) => (
                <li
                  key={`${item.student.id}-${i}`}
                  className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <span className="font-medium">
                    {item.student.firstName} {item.student.lastName}
                  </span>
                  <span>{formatTimeRange(item.block.startTime, item.block.endTime)}</span>
                  <WorkModeBadge mode={item.block.workMode} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team coverage thresholds</CardTitle>
          <CardDescription>
            Office: {settings.coverageThresholdOffice} · Remote: {settings.coverageThresholdRemote} · Total: {settings.coverageThresholdTotal}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {teams.map((team) => {
              const coverage = getTeamCoverageData(team.id, today);
              const officeSlots = coverage.reduce((s, c) => s + c.officeCount, 0);
              const remoteSlots = coverage.reduce((s, c) => s + c.remoteCount, 0);
              const belowThreshold =
                officeSlots < settings.coverageThresholdOffice ||
                remoteSlots < settings.coverageThresholdRemote;
              return (
                <div
                  key={team.id}
                  className={`rounded-md border p-4 ${belowThreshold ? "border-amber-300 bg-amber-50" : ""}`}
                >
                  <h3 className="font-medium">{team.name}</h3>
                  <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                    {coverage.length} students · {officeSlots} office blocks · {remoteSlots} remote blocks
                  </p>
                  {belowThreshold && (
                    <Badge variant="warning" className="mt-2">
                      Below coverage threshold
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
