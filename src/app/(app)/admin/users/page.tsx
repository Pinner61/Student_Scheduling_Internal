import { Suspense } from "react";
import { listUsers, listTeams } from "@/lib/services/data-service";
import { UsersTable } from "@/features/users/users-table";
import { UsersFilters } from "@/features/users/users-filters";
import { CreateUserForm } from "@/features/users/create-user-form";
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
  const users = listUsers({
    search: params.search,
    role: params.role,
    team: params.team,
    status: params.status,
  });
  const teams = listTeams();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Manage student employees, supervisors, and administrators
          </p>
        </div>
        <CreateUserForm teams={teams.map((t) => ({ id: t.id, name: t.name }))} />
      </div>

      <Suspense fallback={<Skeleton className="h-10 w-full max-w-2xl" />}>
        <UsersFilters teams={teams} />
      </Suspense>

      <UsersTable users={users} teams={teams.map((t) => ({ id: t.id, name: t.name }))} />
    </div>
  );
}
