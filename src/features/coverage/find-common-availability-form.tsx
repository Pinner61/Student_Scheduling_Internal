"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Profile, Team } from "@/types";

interface FindCommonAvailabilityFormProps {
  teams: Team[];
  students: Profile[];
  defaults: {
    startDate: string;
    endDate: string;
    duration: string;
    team?: string;
    mode?: string;
    students?: string[];
  };
}

export function FindCommonAvailabilityForm({
  teams,
  students,
  defaults,
}: FindCommonAvailabilityFormProps) {
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const next = new URLSearchParams();
    next.set("common", "1");
    next.set("startDate", String(form.get("startDate")));
    next.set("endDate", String(form.get("endDate")));
    next.set("duration", String(form.get("duration")));
    const team = String(form.get("team") ?? "all");
    const mode = String(form.get("mode") ?? "all");
    if (team !== "all") next.set("team", team);
    if (mode !== "all") next.set("mode", mode);
    const selected = form.getAll("students").map(String);
    selected.forEach((id) => next.append("student", id));
    router.push(`/supervisor/availability?${next.toString()}`);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <label htmlFor="common-start" className="mb-1 block text-sm font-medium">
          Start date
        </label>
        <Input id="common-start" name="startDate" type="date" defaultValue={defaults.startDate} required />
      </div>
      <div>
        <label htmlFor="common-end" className="mb-1 block text-sm font-medium">
          End date
        </label>
        <Input id="common-end" name="endDate" type="date" defaultValue={defaults.endDate} required />
      </div>
      <div>
        <label htmlFor="common-duration" className="mb-1 block text-sm font-medium">
          Duration (minutes)
        </label>
        <Select id="common-duration" name="duration" defaultValue={defaults.duration}>
          <option value="30">30</option>
          <option value="60">60</option>
          <option value="90">90</option>
          <option value="120">120</option>
        </Select>
      </div>
      <div>
        <label htmlFor="common-team" className="mb-1 block text-sm font-medium">
          Team
        </label>
        <Select id="common-team" name="team" defaultValue={defaults.team ?? "all"}>
          <option value="all">All assigned teams</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label htmlFor="common-mode" className="mb-1 block text-sm font-medium">
          Work mode
        </label>
        <Select id="common-mode" name="mode" defaultValue={defaults.mode ?? "all"}>
          <option value="all">Any</option>
          <option value="OFFICE">Office</option>
          <option value="REMOTE">Remote</option>
        </Select>
      </div>
      <div className="sm:col-span-2 lg:col-span-3">
        <fieldset>
          <legend className="mb-1 text-sm font-medium">Students</legend>
          <p className="mb-2 text-xs text-[var(--color-muted-foreground)]">
            Leave unselected to include every authorized student in the chosen team.
          </p>
          <div className="grid max-h-40 gap-1 overflow-y-auto rounded-md border p-2 sm:grid-cols-2">
            {students.map((student) => (
              <label key={student.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="students"
                  value={student.id}
                  defaultChecked={defaults.students?.includes(student.id)}
                />
                {student.firstName} {student.lastName}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <div className="flex items-end">
        <Button type="submit">Find Common Availability</Button>
      </div>
    </form>
  );
}
