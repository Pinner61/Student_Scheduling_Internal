import type { UserRole } from "@/types";

export interface CsvImportRow {
  line: number;
  name: string;
  email: string;
  role: string;
  team: string;
}

export interface CsvRowIssue {
  line: number;
  email: string;
  message: string;
  severity: "error" | "flag";
}

export interface CsvValidatedRow {
  line: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  teamName: string;
  action: "create" | "skip";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES: UserRole[] = ["student", "supervisor", "administrator"];

export function parseCsvText(text: string): { rows: CsvImportRow[]; parseError?: string } {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) {
    return { rows: [], parseError: "The file is empty." };
  }

  const header = splitCsvLine(lines[0]).map((cell) => cell.trim().toLowerCase());
  const nameIdx = header.indexOf("name");
  const emailIdx = header.indexOf("email");
  const roleIdx = header.indexOf("role");
  const teamIdx = header.indexOf("team");
  if (nameIdx < 0 || emailIdx < 0 || roleIdx < 0 || teamIdx < 0) {
    return {
      rows: [],
      parseError: "CSV must include columns: name,email,role,team",
    };
  }

  const rows: CsvImportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    rows.push({
      line: i + 1,
      name: (cells[nameIdx] ?? "").trim(),
      email: (cells[emailIdx] ?? "").trim(),
      role: (cells[roleIdx] ?? "").trim(),
      team: (cells[teamIdx] ?? "").trim(),
    });
  }
  return { rows };
}

export function validateCsvRows(
  rows: CsvImportRow[],
  existing: { email: string; firstName: string; lastName: string; role: string; teamName: string | null }[],
  teamNames: string[]
): { valid: CsvValidatedRow[]; issues: CsvRowIssue[] } {
  const valid: CsvValidatedRow[] = [];
  const issues: CsvRowIssue[] = [];
  const seen = new Set<string>();
  const teams = new Map(teamNames.map((name) => [name.toLowerCase(), name]));
  const byEmail = new Map(existing.map((user) => [user.email.toLowerCase(), user]));

  for (const row of rows) {
    const email = row.email.toLowerCase();
    if (!row.name || !row.email || !row.role) {
      issues.push({
        line: row.line,
        email: row.email,
        message: "Name, email, and role are required.",
        severity: "error",
      });
      continue;
    }
    if (!EMAIL_RE.test(email)) {
      issues.push({
        line: row.line,
        email: row.email,
        message: "Email is not valid.",
        severity: "error",
      });
      continue;
    }
    if (seen.has(email)) {
      issues.push({
        line: row.line,
        email,
        message: "Duplicate email in this file.",
        severity: "error",
      });
      continue;
    }
    seen.add(email);

    const role = row.role.trim().toLowerCase() as UserRole;
    if (!ROLES.includes(role)) {
      issues.push({
        line: row.line,
        email,
        message: "Role must be student, supervisor, or administrator.",
        severity: "error",
      });
      continue;
    }

    const teamKey = row.team.trim().toLowerCase();
    if (teamKey && !teams.has(teamKey)) {
      issues.push({
        line: row.line,
        email,
        message: `Unknown team "${row.team}".`,
        severity: "error",
      });
      continue;
    }

    const { firstName, lastName } = splitName(row.name);
    if (!firstName || !lastName) {
      issues.push({
        line: row.line,
        email,
        message: "Name must include first and last name.",
        severity: "error",
      });
      continue;
    }

    const existingUser = byEmail.get(email);
    if (existingUser) {
      const nextTeam = teamKey ? teams.get(teamKey) ?? "" : "";
      const sameRole = existingUser.role === role;
      const sameTeam = (existingUser.teamName ?? "").toLowerCase() === nextTeam.toLowerCase();
      const sameName =
        existingUser.firstName.toLowerCase() === firstName.toLowerCase() &&
        existingUser.lastName.toLowerCase() === lastName.toLowerCase();
      if (sameRole && sameTeam && sameName) {
        valid.push({
          line: row.line,
          firstName,
          lastName,
          email,
          role,
          teamName: nextTeam,
          action: "skip",
        });
        continue;
      }
      issues.push({
        line: row.line,
        email,
        message:
          "An account with this email already exists and would change. Review it in Users instead of overwriting from CSV.",
        severity: "flag",
      });
      continue;
    }

    valid.push({
      line: row.line,
      firstName,
      lastName,
      email,
      role,
      teamName: teamKey ? teams.get(teamKey) ?? "" : "",
      action: "create",
    });
  }

  return { valid, issues };
}

export function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}
