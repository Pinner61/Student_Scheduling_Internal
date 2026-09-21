import Link from "next/link";
import { getAdminOverviewStats, getTeamCoverageData } from "@/lib/services/data-service";
import { getTodayDateString } from "@/lib/schedule/engine";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export default async function AdminOverviewPage() {
  const stats = getAdminOverviewStats();
  const today = getTodayDateString();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Administrator Overview</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          System health and operational attention
        </p>
      </div>

      <section aria-labelledby="schedule-health">
        <h2 id="schedule-health" className="mb-3 text-lg font-semibold">
          Schedule health
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active users</CardDescription>
              <CardTitle className="text-3xl">{stats.activeUsers}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Missing availability</CardDescription>
              <CardTitle className="text-3xl">{stats.studentsMissingAvailability}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending exceptions</CardDescription>
              <CardTitle className="text-3xl">{stats.pendingExceptions}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active teams</CardDescription>
              <CardTitle className="text-3xl">{stats.teamCount}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section aria-labelledby="needs-attention">
        <h2 id="needs-attention" className="mb-3 text-lg font-semibold">
          Needs attention
        </h2>
        <Card>
          <CardContent className="pt-6 space-y-4">
            {stats.pendingExceptionsList.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Pending exceptions</h3>
                <ul className="space-y-1 text-sm">
                  {stats.pendingExceptionsList.slice(0, 5).map((ex) => (
                    <li key={ex.id}>
                      {ex.exceptionDate} —{" "}
                      <Link href="/admin/exceptions" className="text-[var(--color-primary)] underline">
                        Review exception
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {stats.incompleteStudents.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Students without complete schedules</h3>
                <ul className="space-y-1 text-sm">
                  {stats.incompleteStudents.slice(0, 5).map((s) => (
                    <li key={s.id}>
                      <Link href={`/admin/users/${s.id}`} className="text-[var(--color-primary)] underline">
                        {s.firstName} {s.lastName}
                      </Link>{" "}
                      ({s.scheduleStatus.replace("_", " ")})
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {stats.unassignedStudents.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Unassigned students</h3>
                <ul className="space-y-1 text-sm">
                  {stats.unassignedStudents.slice(0, 5).map((s) => (
                    <li key={s.id}>
                      <Link href={`/admin/users/${s.id}`} className="text-[var(--color-primary)] underline">
                        {s.firstName} {s.lastName}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {stats.pendingExceptionsList.length === 0 &&
              stats.incompleteStudents.length === 0 &&
              stats.unassignedStudents.length === 0 && (
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  No urgent items need attention.
                </p>
              )}
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="team-coverage">
        <h2 id="team-coverage" className="mb-3 text-lg font-semibold">
          Team coverage today
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {stats.teams.map((team) => {
            const coverage = getTeamCoverageData(team.id, today);
            const scheduled = coverage.filter((c) => c.blocks.length > 0).length;
            return (
              <Card key={team.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{team.name}</CardTitle>
                  <CardDescription>
                    {scheduled} of {coverage.length} students scheduled
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="recent-activity">
        <h2 id="recent-activity" className="mb-3 text-lg font-semibold">
          Recent administrative activity
        </h2>
        <Card>
          <CardContent className="pt-6">
            {stats.recentAudit.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">No recent activity.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {stats.recentAudit.map((log) => (
                  <li key={log.id} className="flex flex-wrap items-center gap-2">
                    <Badge variant="neutral">{log.action.replace(/_/g, " ")}</Badge>
                    <span className="text-[var(--color-muted-foreground)]">
                      {new Date(log.createdAt).toLocaleString("en-US", {
                        timeZone: "America/Phoenix",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/admin/audit"
              className={`${buttonVariants({ variant: "outline", size: "sm" })} mt-4`}
            >
              View audit log
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
