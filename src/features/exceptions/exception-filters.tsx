"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { Team } from "@/types";

interface ExceptionFiltersProps {
  teams: Team[];
  students: { id: string; name: string }[];
  basePath: string;
}

export function ExceptionFilters({ teams, students, basePath }: ExceptionFiltersProps) {
  const router = useRouter();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value && value !== "all") next.set(key, value);
    else next.delete(key);
    router.push(`${basePath}?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Select
        aria-label="Filter by status"
        defaultValue={params.get("status") ?? "PENDING"}
        onChange={(e) => update("status", e.target.value)}
        className="w-auto min-w-[140px]"
      >
        <option value="all">All statuses</option>
        <option value="PENDING">Pending</option>
        <option value="APPROVED">Approved</option>
        <option value="DECLINED">Declined</option>
        <option value="CANCELLED">Cancelled</option>
      </Select>
      <Select
        aria-label="Filter by type"
        defaultValue={params.get("type") ?? "all"}
        onChange={(e) => update("type", e.target.value)}
        className="w-auto min-w-[180px]"
      >
        <option value="all">All types</option>
        <option value="UNAVAILABLE">Unavailable</option>
        <option value="REMOTE_INSTEAD">Remote instead</option>
        <option value="OFFICE_INSTEAD">Office instead</option>
        <option value="ALTERNATE_AVAILABILITY">Alternate availability</option>
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
        aria-label="Filter by student"
        defaultValue={params.get("student") ?? "all"}
        onChange={(e) => update("student", e.target.value)}
        className="w-auto min-w-[160px]"
      >
        <option value="all">All students</option>
        {students.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
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
