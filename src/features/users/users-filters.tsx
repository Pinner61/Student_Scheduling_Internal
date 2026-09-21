"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Team } from "@/types";

interface UsersFiltersProps {
  teams: Team[];
}

export function UsersFilters({ teams }: UsersFiltersProps) {
  const router = useRouter();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value && value !== "all") {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    router.push(`/admin/users?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Input
        type="search"
        placeholder="Search name or email…"
        defaultValue={params.get("search") ?? ""}
        onChange={(e) => update("search", e.target.value)}
        className="max-w-xs"
        aria-label="Search users"
      />
      <Select
        aria-label="Filter by role"
        defaultValue={params.get("role") ?? "all"}
        onChange={(e) => update("role", e.target.value)}
        className="w-auto min-w-[130px]"
      >
        <option value="all">All roles</option>
        <option value="student">Student</option>
        <option value="supervisor">Supervisor</option>
        <option value="administrator">Administrator</option>
      </Select>
      <Select
        aria-label="Filter by team"
        defaultValue={params.get("team") ?? "all"}
        onChange={(e) => update("team", e.target.value)}
        className="w-auto min-w-[140px]"
      >
        <option value="all">All teams</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </Select>
      <Select
        aria-label="Filter by status"
        defaultValue={params.get("status") ?? "all"}
        onChange={(e) => update("status", e.target.value)}
        className="w-auto min-w-[120px]"
      >
        <option value="all">All statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </Select>
    </div>
  );
}
