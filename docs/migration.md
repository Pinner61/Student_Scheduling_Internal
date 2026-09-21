# Excel / CSV migration

The current workbook can be imported later without allowing unsafe bulk writes.

## Proposed CSV shape

```csv
student_email,team,day_of_week,start_time,end_time,work_mode
alex.chen@asu.edu,Design,1,09:00,12:00,OFFICE
alex.chen@asu.edu,Design,1,13:00,16:00,REMOTE
```

- `day_of_week`: 0 = Sunday … 6 = Saturday (application working week is Monday–Friday).
- `start_time` / `end_time`: `HH:mm` in America/Phoenix.
- `work_mode`: `OFFICE` or `REMOTE`.

## Import rules

1. Administrators only.
2. Validate every row (email exists, team exists, times align to the configured interval, no overlaps) **before** writing.
3. Reject the batch if any row fails; do not partially apply.
4. Write recurring availability and an audit event `availability_changed` with import metadata.
5. Do not deactivate or create users from the spreadsheet unless a separate, confirmed user-import flow is added.

A dry-run report should list row numbers, students without profiles, and overlapping ranges so staff can clean the Excel file first.
