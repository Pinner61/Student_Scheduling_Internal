"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useDebouncedQueryParam } from "@/lib/use-debounced-query-param";
import type { Team } from "@/types";

interface UsersFiltersProps {
  teams: Team[];
}

export function UsersFilters({ teams }: UsersFiltersProps) {
  const router = useRouter();
  const params = useSearchParams();
  const paramsString = params.toString();
  const search = useDebouncedQueryParam("search", "/admin/users", params.get("search") ?? "", paramsString);

  function navigate(next: URLSearchParams, replace = false) {
    const href = `/admin/users?${next.toString()}`;
    if (replace) router.replace(href, { scroll: false });
    else router.push(href, { scroll: false });
  }

  function update(key: string, value: string) {
    const next = new URLSearchParams(paramsString);
    if (search.value) next.set("search", search.value);
    else next.delete("search");
    if (value && value !== "all") next.set(key, value);
    else next.delete(key);
    navigate(next);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Input
        ref={search.inputRef}
        id="users-search"
        key="users-search"
        type="text"
        placeholder="Search name or email…"
        value={search.value}
        autoComplete="off"
        spellCheck={false}
        onChange={search.onChange}
        onFocus={search.onFocus}
        onBlur={search.onBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.preventDefault();
        }}
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
        <option value="pending">Pending invitation</option>
        <option value="inactive">Deactivated</option>
      </Select>
    </div>
  );
}
