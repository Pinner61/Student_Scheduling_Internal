import { Suspense } from "react";
import { listUsers, listTeams } from "@/lib/services/data-service";
import { UsersTable } from "@/features/users/users-table";
import { UsersFilters } from "@/features/users/users-filters";
import { CsvImportForm } from "@/features/users/csv-import-form";
import { InviteUserForm } from "@/features/users/invite-user-form";
import { listUserInvitations } from "@/lib/auth/service";
import { hydrateAuthStateFromDatabase } from "@/lib/auth/persist";
import { Skeleton } from "@/components/ui/skeleton";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    role?: string;
    team?: string;
    status?: string;
  }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  await hydrateAuthStateFromDatabase();
  const users = listUsers({
    search: params.search,
    role: params.role,
    team: params.team,
    status: params.status,
  });
  const teams = listTeams();
  const invitations = listUserInvitations();
  const supervisors = listUsers({ role: "supervisor", status: "active" }).map((user) => ({
    id: user.id,
    name: `${user.firstName} ${user.lastName}`,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Manage student employees, supervisors, and administrators
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CsvImportForm />
          <InviteUserForm teams={teams.map((t) => ({ id: t.id, name: t.name }))} />
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-10 w-full max-w-2xl" />}>
        <UsersFilters teams={teams} />
      </Suspense>

      <UsersTable users={users} teams={teams} supervisors={supervisors} invitations={invitations} />
    </div>
  );
}
