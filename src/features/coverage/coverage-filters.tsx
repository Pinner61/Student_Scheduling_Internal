"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { Team, Profile } from "@/types";

interface CoverageFiltersProps {
  teams: Team[];
  students: Profile[];
  basePath: string;
  showSearch?: boolean;
  defaultDate?: string;
}

export function CoverageFilters({ teams, students, basePath, showSearch, defaultDate }: CoverageFiltersProps) {
  const router = useRouter();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value && value !== "all") {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    router.push(`${basePath}?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <div>
        <label htmlFor="filter-date" className="sr-only">
          Date
        </label>
        <Input
          id="filter-date"
          type="date"
          defaultValue={params.get("date") ?? defaultDate ?? ""}
          onChange={(e) => update("date", e.target.value)}
          className="w-auto"
        />
      </div>
      {showSearch && (
        <Input
          type="search"
          aria-label="Search student name"
          placeholder="Search student name"
          defaultValue={params.get("q") ?? ""}
          className="max-w-xs"
          onChange={(e) => update("q", e.target.value)}
        />
      )}
      <Select
        aria-label="Filter by team"
        defaultValue={params.get("team") ?? "all"}
        onChange={(e) => update("team", e.target.value)}
        className="w-auto min-w-[140px]"
      >
        <option value="all">All assigned teams</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </Select>
      <Select
        aria-label="Filter by student"
        defaultValue={params.get("student") ?? "all"}
        onChange={(e) => update("student", e.target.value)}
        className="w-auto min-w-[160px]"
      >
        <option value="all">All students</option>
        {students.map((s) => (
          <option key={s.id} value={s.id}>
            {s.firstName} {s.lastName}
          </option>
        ))}
      </Select>
      <Select
        aria-label="Filter by work mode"
        defaultValue={params.get("mode") ?? "all"}
        onChange={(e) => update("mode", e.target.value)}
        className="w-auto min-w-[120px]"
      >
        <option value="all">All modes</option>
        <option value="OFFICE">Office</option>
        <option value="REMOTE">Remote</option>
      </Select>
    </div>
  );
}
