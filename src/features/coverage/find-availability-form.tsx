"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Team } from "@/types";

interface FindAvailabilityFormProps {
  teams: Team[];
  defaultDate: string;
  defaultStart: string;
  defaultEnd: string;
}

export function FindAvailabilityForm({
  teams,
  defaultDate,
  defaultStart,
  defaultEnd,
}: FindAvailabilityFormProps) {
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const next = new URLSearchParams();
    next.set("date", String(form.get("date")));
    next.set("start", String(form.get("start")));
    next.set("end", String(form.get("end")));
    const team = String(form.get("team") ?? "all");
    const mode = String(form.get("mode") ?? "all");
    if (team !== "all") next.set("team", team);
    if (mode !== "all") next.set("mode", mode);
    router.push(`/supervisor/availability?${next.toString()}`);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-2 lg:grid-cols-6">
      <div>
        <label htmlFor="avail-date" className="mb-1 block text-sm font-medium">
          Date
        </label>
        <Input id="avail-date" name="date" type="date" defaultValue={defaultDate} required />
      </div>
      <div>
        <label htmlFor="avail-start" className="mb-1 block text-sm font-medium">
          Start time
        </label>
        <Input id="avail-start" name="start" type="time" defaultValue={defaultStart} required />
      </div>
      <div>
        <label htmlFor="avail-end" className="mb-1 block text-sm font-medium">
          End time
        </label>
        <Input id="avail-end" name="end" type="time" defaultValue={defaultEnd} required />
      </div>
      <div>
        <label htmlFor="avail-team" className="mb-1 block text-sm font-medium">
          Team
        </label>
        <Select id="avail-team" name="team" defaultValue="all">
          <option value="all">All assigned teams</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label htmlFor="avail-mode" className="mb-1 block text-sm font-medium">
          Work mode
        </label>
        <Select id="avail-mode" name="mode" defaultValue="all">
          <option value="all">All</option>
          <option value="OFFICE">Office</option>
          <option value="REMOTE">Remote</option>
        </Select>
      </div>
      <div className="flex items-end">
        <Button type="submit" className="w-full">
          Find Available Students
        </Button>
      </div>
    </form>
  );
}
