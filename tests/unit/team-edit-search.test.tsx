/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { TeamEditDialog } from "@/features/teams/team-edit-dialog";
import type { Profile, Team, UserWithTeam } from "@/types";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/app/actions/scheduling", () => ({
  saveTeamEditsAction: vi.fn(),
}));

function typeInto(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function student(partial: Partial<UserWithTeam> & Pick<UserWithTeam, "id" | "firstName" | "lastName" | "email">): UserWithTeam {
  return {
    authUserId: null,
    role: "student",
    status: "active",
    lastLoginAt: null,
    invitedBy: null,
    activatedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    teamId: null,
    teamName: null,
    supervisorId: null,
    supervisorName: null,
    scheduleStatus: "not_started",
    submissionStatus: "DRAFT",
    submittedAt: null,
    availabilityUpdatedAt: null,
    ...partial,
  };
}

describe("team edit member search", () => {
  it("keeps focus while typing a full member query", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    const team: Team = {
      id: "team-design",
      name: "Design",
      description: "Visual design and branding",
      status: "active",
      supervisorId: "lead-1",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const members: Profile[] = [];
    const students = [
      student({
        id: "jordan",
        firstName: "Jordan",
        lastName: "Patel",
        email: "jordan.patel@asu.edu",
        teamName: "Multimedia",
      }),
      student({
        id: "alex",
        firstName: "Alex",
        lastName: "Chen",
        email: "alex.chen@asu.edu",
        teamName: "Design",
      }),
    ];

    await act(async () => {
      root.render(
        <TeamEditDialog
          team={team}
          members={members}
          students={students}
          leads={[{ id: "lead-1", name: "Sarah Mitchell" }]}
          open
          onOpenChange={() => undefined}
        />
      );
    });

    const search = container.querySelector<HTMLInputElement>("#team-search-team-design");
    expect(search).toBeTruthy();

    await act(async () => {
      search!.focus();
      typeInto(search!, "j");
    });
    await act(async () => {
      typeInto(search!, "jor");
    });
    await act(async () => {
      typeInto(search!, "jordan");
    });

    expect(search!.value).toBe("jordan");
    expect(document.activeElement).toBe(search);
    expect(container.textContent).toContain("Jordan Patel");
    expect(container.textContent).toContain("Add Jordan Patel");
    expect(container.textContent).not.toContain("Add Alex Chen");
    expect(container.textContent).toContain("No students are assigned to this team yet.");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
