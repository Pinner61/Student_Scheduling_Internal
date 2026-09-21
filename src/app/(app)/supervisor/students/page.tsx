import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { getSupervisorTeams, getTeamMembers } from "@/lib/services/data-service";
import { getUser } from "@/lib/services/data-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
                        <Badge
                          variant={
                            details?.scheduleStatus === "complete"
                              ? "success"
                              : details?.scheduleStatus === "incomplete"
                                ? "warning"
                                : "danger"
                          }
                        >
                          {details?.scheduleStatus === "complete"
                            ? "Schedule complete"
                            : details?.scheduleStatus === "incomplete"
                              ? "Incomplete"
                              : "Not started"}
                        </Badge>
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
