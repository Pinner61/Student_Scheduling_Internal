import { listTeams, getTeamMembers, listUsers } from "@/lib/services/data-service";
import { TeamManagementActions } from "@/features/teams/team-management";
import { TeamCard } from "@/features/teams/team-card";

export default async function AdminTeamsPage() {
  const teams = listTeams();
  const supervisors = listUsers({ role: "supervisor" });
  const allUsers = listUsers();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teams</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Manage Creative Strategy teams
          </p>
        </div>
        <TeamManagementActions
          supervisors={supervisors.map((s) => ({
            id: s.id,
            name: `${s.firstName} ${s.lastName}`,
          }))}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {teams.map((team) => {
          const members = getTeamMembers(team.id);
          const supervisor = allUsers.find((s) => s.id === team.supervisorId);
          return (
            <TeamCard
              key={team.id}
              team={team}
              supervisorName={
                supervisor ? `${supervisor.firstName} ${supervisor.lastName}` : "Unassigned"
              }
              members={members}
            />
          );
        })}
      </div>
    </div>
  );
}
