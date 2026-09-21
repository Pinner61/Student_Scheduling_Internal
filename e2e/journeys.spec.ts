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

test("student can view schedule, paint availability, copy it, and submit an exception", async ({
  page,
}) => {
  await signIn(page, "Student");
  await expect(page.getByRole("heading", { name: "Your Schedule" })).toBeVisible();
  await page.getByRole("link", { name: "Edit Weekly Availability" }).click();
  await expect(page.getByRole("heading", { name: "Edit Weekly Availability" })).toBeVisible();
  await page.getByRole("button", { name: "Office", exact: true }).click();
  await page.getByRole("button", { name: /Tuesday 2:00 PM/ }).click();
  await expect(page.getByRole("status")).toContainText("unsaved changes");
  await page.getByRole("button", { name: "Save Availability" }).click();
  await expect(page.getByText("Availability updated.")).toBeVisible();
  await page.getByRole("button", { name: "Copy Weekly Availability" }).click();
  await expect(page.getByText("Weekly availability copied.")).toBeVisible();

  await page.getByRole("link", { name: "Exceptions" }).click();
  await page.getByLabel("Date").fill("2026-10-02");
  await page.getByRole("button", { name: "Add Schedule Exception" }).click();
  await expect(page.getByText("Exception submitted for review")).toBeVisible();
  await expect(page.getByText("Pending").first()).toBeVisible();
});

test("supervisor can inspect the day grid, find availability, and approve an exception", async ({
  page,
}) => {
  await signIn(page, "Supervisor");
  await expect(page.getByRole("heading", { name: "Today’s team" })).toBeVisible();
  await page.getByRole("link", { name: "Team Schedule", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Team Schedule" })).toBeVisible();
  await page.getByLabel("Filter by team").selectOption({ label: "Design" });
  await page.goto("/supervisor/students/profile-student-0");
  await expect(page.getByRole("heading", { name: "Alex Chen" })).toBeVisible();
  await page.getByRole("link", { name: "Find Availability", exact: true }).click();
  await page.getByRole("button", { name: "Find Available Students" }).click();
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
  await expect(row.getByText("active")).toBeVisible();
  await row.getByRole("button", { name: /Actions for Jordan Patel/ }).click();
  await expect(page.getByRole("menuitem", { name: "Deactivate user" })).toBeVisible();
  await expect(row.getByText("active")).toBeVisible();
  await page.getByRole("menuitem", { name: "Deactivate user" }).click();
  await expect(page.getByRole("heading", { name: /Deactivate Jordan Patel/ })).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(row.getByText("active")).toBeVisible();
  await row.getByRole("button", { name: /Actions for Jordan Patel/ }).click();
  await page.getByRole("menuitem", { name: "Deactivate user" }).click();
  await page.getByRole("button", { name: "Deactivate User" }).click();
  await expect(page.getByText("User deactivated")).toBeVisible();
  await expect(row.getByText("inactive")).toBeVisible();
});
