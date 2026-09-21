"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { UserWithTeam } from "@/types";

export function AuditFilters({ users }: { users: UserWithTeam[] }) {
  const router = useRouter();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value && value !== "all") next.set(key, value);
    else next.delete(key);
    router.push(`/admin/audit?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Select
        aria-label="Filter by actor"
        defaultValue={params.get("user") ?? "all"}
        onChange={(e) => update("user", e.target.value)}
        className="w-auto min-w-[180px]"
      >
        <option value="all">All users</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.firstName} {u.lastName}
          </option>
        ))}
      </Select>
      <Select
        aria-label="Filter by action"
        defaultValue={params.get("action") ?? "all"}
        onChange={(e) => update("action", e.target.value)}
        className="w-auto min-w-[200px]"
      >
        <option value="all">All actions</option>
        <option value="availability_changed">Availability changed</option>
        <option value="exception_submitted">Exception submitted</option>
        <option value="exception_approved">Exception approved</option>
        <option value="exception_declined">Exception declined</option>
        <option value="user_created">User created</option>
        <option value="user_role_changed">Role changed</option>
        <option value="team_assignment_changed">Team assignment changed</option>
        <option value="user_deactivated">User deactivated</option>
        <option value="user_reactivated">User reactivated</option>
        <option value="settings_changed">Settings changed</option>
      </Select>
      <Select
        aria-label="Filter by entity type"
        defaultValue={params.get("entityType") ?? "all"}
        onChange={(e) => update("entityType", e.target.value)}
        className="w-auto min-w-[180px]"
      >
        <option value="all">All entities</option>
        <option value="profile">Profile</option>
        <option value="schedule_exception">Exception</option>
        <option value="recurring_availability">Availability</option>
        <option value="team">Team</option>
        <option value="settings">Settings</option>
      </Select>
      <Input
        type="date"
        aria-label="From date"
        defaultValue={params.get("from") ?? ""}
        onChange={(e) => update("from", e.target.value)}
        className="w-auto"
      />
      <Input
        type="date"
        aria-label="To date"
        defaultValue={params.get("to") ?? ""}
        onChange={(e) => update("to", e.target.value)}
        className="w-auto"
      />
    </div>
  );
}
