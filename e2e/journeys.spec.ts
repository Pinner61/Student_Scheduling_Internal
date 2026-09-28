import { test, expect } from "@playwright/test";

const ACCOUNTS = {
  Student: { email: "alex.chen@asu.edu", password: "Demo123!" },
  Supervisor: { email: "smitchell@asu.edu", password: "Demo123!" },
  Administrator: { email: "preyes@asu.edu", password: "Demo123!" },
} as const;

async function signIn(
  page: import("@playwright/test").Page,
  role: keyof typeof ACCOUNTS
) {
  const account = ACCOUNTS[role];
  await page.goto("/login");
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password").fill(account.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
}

test("student can view schedule, paint availability, share it, and submit an exception", async ({
  page,
}) => {
  await signIn(page, "Student");
  await expect(page.getByRole("heading", { name: /Schedule$/ })).toBeVisible();
  await expect(page.getByText(/Approved exceptions overlay your normal weekly availability/)).toBeVisible();
  await page.getByRole("button", { name: "Edit Schedule" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Edit Schedule" }).click();
  await expect(page.getByRole("heading", { name: /Weekly Availability/ })).toBeVisible();
  await page.getByRole("button", { name: "Office", exact: true }).click();
  await page.getByRole("button", { name: /Tuesday 2:00 PM/ }).click();
  await expect(page.getByRole("status")).toContainText("unsaved changes");
  await page.getByRole("button", { name: "Save Availability" }).click();
  await expect(page.getByText("Availability updated.")).toBeVisible();
  await page.getByRole("button", { name: "Share availability in text" }).click();
  await expect(page.getByText("Copied to clipboard!")).toBeVisible();

  await page.getByRole("link", { name: "Exceptions" }).click();
  await expect(page.getByRole("heading", { name: "Pending Supervisor Approval" })).toBeVisible();
  await page.getByLabel("Date").fill("2026-10-02");
  await page.getByRole("button", { name: "Add Schedule Exception" }).click();
  await expect(page.getByText("Exception submitted for review")).toBeVisible();
  await expect(page.getByText("Pending").first()).toBeVisible();
});

test("supervisor can inspect the week grid, find availability, and approve an exception", async ({
  page,
}) => {
  await signIn(page, "Supervisor");
  await expect(page.getByRole("heading", { name: "Today’s team" })).toBeVisible();
  await page.getByRole("link", { name: "Team Schedule", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Team Schedule" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Week", exact: true })).toBeVisible();
  await page.getByLabel("Filter by team").selectOption({ label: "Design" });
  await page.goto("/supervisor/students/profile-student-0");
  await expect(page.getByRole("heading", { name: "Alex Chen" })).toBeVisible();
  await expect(page.getByText("Schedule submitted")).toBeVisible();
  await page.getByRole("link", { name: "Find Availability", exact: true }).click();
  await page.getByLabel("Date").fill("2026-09-21");
  await page.getByLabel("Start time").fill("10:00");
  await page.getByLabel("End time").fill("12:00");
  await page.getByRole("button", { name: "Find Available Students" }).click();
  await expect(page.getByText(/Covers full window|Partial overlap/).first()).toBeVisible();
  await page.getByRole("link", { name: "Exceptions" }).click();
  const approve = page.getByRole("button", { name: "Approve" }).first();
  if (await approve.isVisible()) {
    await approve.click();
    await expect(page.getByText("Exception approved")).toBeVisible();
  }
});

test("admin three-dot menu does not deactivate until confirmation", async ({ page }) => {
  await signIn(page, "Administrator");
  await page.getByRole("link", { name: "Users" }).click();
  await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
  const row = page.getByRole("row").filter({ hasText: "Jordan Patel" });
  await expect(row.getByText("Active")).toBeVisible();
  await row.getByRole("button", { name: /Actions for Jordan Patel/ }).click();
  await expect(page.getByRole("menuitem", { name: "Deactivate user" })).toBeVisible();
  await expect(row.getByText("Active")).toBeVisible();
  await page.getByRole("menuitem", { name: "Deactivate user" }).click();
  await expect(page.getByRole("heading", { name: /Deactivate Jordan Patel/ })).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(row.getByText("Active")).toBeVisible();
  await row.getByRole("button", { name: /Actions for Jordan Patel/ }).click();
  await page.getByRole("menuitem", { name: "Deactivate user" }).click();
  await page.getByRole("button", { name: "Deactivate User" }).click();
  await expect(page.getByText("User deactivated")).toBeVisible();
  await expect(row.getByText("Inactive")).toBeVisible();
});

test("sign out returns to the demo login page", async ({ page }) => {
  await signIn(page, "Student");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Student alex.chen@asu.edu" })).toBeVisible();
  await signIn(page, "Supervisor");
  await expect(page.getByRole("heading", { name: "Today’s team" })).toBeVisible();
});
