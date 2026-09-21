# Product requirements

## Operational problem

University College Creative Strategy currently tracks student employee availability in a shared Excel workbook. Each student has a tab and marks 30-minute cells with `o` (office), `r` (remote), or blank. Composite sheets try to show team coverage.

That process fails students (wrong sheet, broken formulas, poor mobile use, no way to record a one-time appointment) and supervisors (slow answers to “who is in the office this afternoon?”). It also lacks permissions, audit history, and a clean onboarding path.

## Users

| Role | Primary job |
| --- | --- |
| Student employee | See this week, edit normal availability, submit exceptions |
| Supervisor / team lead | See coverage now and this week; review team exceptions |
| Administrator | Keep users, teams, settings, and audit trail healthy |

## Student workflow

1. Sign in and land on **Schedule Home** (not an analytics dashboard).
2. See the current week’s effective schedule, upcoming exceptions, and a primary **Edit Availability** action.
3. Enter range-based weekly availability (Monday–Friday, 30-minute intervals, office/remote).
4. Submit a dated exception without changing the normal week.
5. Receive save/error feedback.

## Supervisor workflow

1. Land on today’s coverage: working now, office, remote, upcoming.
2. Open Team Schedule, filter by team/student/date/mode.
3. Review exceptions with normal vs requested vs resulting schedule.
4. Approve or decline with confirmation on decline.

## Administrator workflow

1. Overview of schedule health, needs-attention items, team coverage, recent audit events.
2. Search and filter users. The actions menu only opens a menu; deactivation requires confirmation.
3. Manage teams (create, archive, assign supervisor).
4. Review all exceptions, inspect audit logs, adjust coverage and working-hour settings.

## Non-goals (for this version)

Payroll, Workday, Salesforce, public self-signup, and official ASU marketing site branding.
