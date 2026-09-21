import { Suspense } from "react";
import { listTeams, listUsers, getTeamCoverageData, getSettings } from "@/lib/services/data-service";
import { getTodayDateString } from "@/lib/schedule/engine";
import { CoverageFilters } from "@/features/coverage/coverage-filters";
import { TeamCoverageGrid } from "@/features/coverage/team-coverage-grid";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface PageProps {
  searchParams: Promise<{ date?: string; team?: string; student?: string; mode?: string }>;
}

export default async function AdminSchedulePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const date = params.date ?? getTodayDateString();
  const dayOfWeek = new Date(`${date}T12:00:00`).getDay();
  const teams = listTeams().filter((t) => t.status === "active");
  const students = listUsers({ role: "student", status: "active" });
  const settings = getSettings();
  const selectedTeams =
    params.team && params.team !== "all" ? teams.filter((t) => t.id === params.team) : teams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Schedule / Coverage</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Organization-wide coverage using the same schedule engine as student views
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <CoverageFilters teams={teams} students={students} basePath="/admin/schedule" />
      </Suspense>

      {selectedTeams.map((team) => {
        let coverage = getTeamCoverageData(team.id, date);
        if (params.student && params.student !== "all") {
          coverage = coverage.filter((c) => c.student.id === params.student);
        }
        if (params.mode && params.mode !== "all") {
          coverage = coverage.map((c) => ({
            ...c,
            blocks: c.blocks.filter((b) => b.workMode === params.mode),
          }));
        }
        const officePeople = coverage.filter((c) =>
          c.blocks.some((b) => b.workMode === "OFFICE")
        ).length;
        const remotePeople = coverage.filter((c) =>
          c.blocks.some((b) => b.workMode === "REMOTE")
        ).length;
        const totalPeople = coverage.filter((c) => c.blocks.length > 0).length;
        const below =
          officePeople < settings.coverageThresholdOffice ||
          remotePeople < settings.coverageThresholdRemote ||
          totalPeople < settings.coverageThresholdTotal;

        return (
          <Card key={team.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle>{team.name}</CardTitle>
                  <CardDescription>
                    {officePeople} office · {remotePeople} remote · {totalPeople} scheduled
                  </CardDescription>
                </div>
                {below && <Badge variant="warning">Below configured threshold</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <TeamCoverageGrid coverage={coverage} date={date} dayOfWeek={dayOfWeek} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
