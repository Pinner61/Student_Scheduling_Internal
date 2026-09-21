import { format, parseISO } from "date-fns";
import {
  getAvailability,
  getEffectiveWeekSchedule,
  getExceptions,
  getSettings,
  getUser,
} from "@/lib/services/data-service";
import { getCurrentWeekStart, getTodayDateString } from "@/lib/schedule/engine";
import { WeekScheduleGrid } from "@/components/schedule/week-schedule-grid";
import { ExceptionStatusBadge } from "@/components/schedule/exception-status-badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatTimeRange, formatWeekRange } from "@/lib/utils/time";
import { EXCEPTION_TYPE_LABEL } from "@/components/schedule/schedule-language";
import { addDays, format as formatDate } from "date-fns";

export function StudentScheduleDetail({ userId }: { userId: string }) {
  const profile = getUser(userId);
  if (!profile) {
    return <p>Student not found.</p>;
  }

  const settings = getSettings();
  const weekStart = getCurrentWeekStart();
  const weekSchedule = getEffectiveWeekSchedule(userId, weekStart);
  const today = getTodayDateString();
  const weekDates = Array.from({ length: 5 }, (_, i) =>
    formatDate(addDays(parseISO(weekStart), i), "yyyy-MM-dd")
  );
  const recurring = getAvailability(userId);
  const upcoming = getExceptions(userId)
    .filter((e) => e.exceptionDate >= today && (e.status === "PENDING" || e.status === "APPROVED"))
    .sort((a, b) => a.exceptionDate.localeCompare(b.exceptionDate));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {profile.firstName} {profile.lastName}
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {profile.teamName ?? "Unassigned"} · {profile.role} · {profile.status}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly availability</CardTitle>
          <CardDescription>
            Week of {formatWeekRange(weekStart)}, including approved exceptions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recurring.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              This student has not added weekly availability yet.
            </p>
          ) : (
            <WeekScheduleGrid
              weekDates={weekDates}
              scheduleByDate={weekSchedule}
              workingDayStart={settings.workingDayStart}
              workingDayEnd={settings.workingDayEnd}
              intervalMinutes={settings.schedulingIntervalMinutes}
              today={today}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming exceptions</CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              No pending or approved exceptions coming up.
            </p>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((ex) => (
                <li key={ex.id} className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm">
                  <span className="font-medium">{format(parseISO(ex.exceptionDate), "MMM d")}</span>
                  <span>{EXCEPTION_TYPE_LABEL[ex.exceptionType]}</span>
                  <span>{formatTimeRange(ex.startTime, ex.endTime)}</span>
                  <ExceptionStatusBadge status={ex.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
