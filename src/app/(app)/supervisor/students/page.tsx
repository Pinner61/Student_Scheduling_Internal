import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import {
  getSupervisorTeams,
  getTeamMembers,
  getUser,
  getExceptions,
} from "@/lib/services/data-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { scheduleStatusLabel } from "@/components/schedule/schedule-language";

export default async function SupervisorStudentsPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const teams = getSupervisorTeams(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Students</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Team members under your supervision
        </p>
      </div>

      {teams.map((team) => {
        const members = getTeamMembers(team.id).filter((m) => m.role === "student");
        return (
          <Card key={team.id}>
            <CardHeader>
              <CardTitle className="text-base">{team.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <p className="text-sm text-[var(--color-muted-foreground)]">No students assigned.</p>
              ) : (
                <ul className="divide-y">
                  {members.map((member) => {
                    const details = getUser(member.id);
                    const pendingCount = getExceptions(member.id).filter(
                      (e) => e.status === "PENDING"
                    ).length;
                    const submitted = details?.scheduleStatus === "submitted";
                    return (
                      <li key={member.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                        <div>
                          <Link
                            href={`/supervisor/students/${member.id}`}
                            className="font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
                          >
                            {member.firstName} {member.lastName}
                          </Link>
                          <p className="text-sm text-[var(--color-muted-foreground)]">{member.email}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={submitted ? "success" : "neutral"}>
                            {details ? scheduleStatusLabel(details.scheduleStatus) : "No schedule submitted"}
                          </Badge>
                          {pendingCount > 0 && (
                            <Link
                              href={`/supervisor/exceptions?status=PENDING&student=${member.id}`}
                              className="text-sm font-medium text-amber-800 underline-offset-2 hover:underline"
                            >
                              {pendingCount} pending exception{pendingCount === 1 ? "" : "s"}
                            </Link>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
