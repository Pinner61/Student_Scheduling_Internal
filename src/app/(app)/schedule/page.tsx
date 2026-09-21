import Link from "next/link";
import { addDays, format, parseISO } from "date-fns";
import { enUS } from "date-fns/locale";
import { getSessionUser } from "@/lib/auth/session";
import {
  getCurrentWeekStart,
  getTodayDateString,
  getNowTimeString,
  isCurrentlyWorking,
} from "@/lib/schedule/engine";
import {
  getExceptions,
  getUser,
  getEffectiveWeekSchedule,
  getSettings,
  getAvailability,
} from "@/lib/services/data-service";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExceptionStatusBadge } from "@/components/schedule/exception-status-badge";
import { WeekScheduleGrid } from "@/components/schedule/week-schedule-grid";
import { WorkModeBadge } from "@/components/schedule/work-mode-badge";
import { formatTimeRange, formatWeekRange, formatLongWeekday } from "@/lib/utils/time";
import { EXCEPTION_TYPE_LABEL } from "@/components/schedule/schedule-language";
import { CopyAvailabilityButton } from "@/features/availability/copy-availability-button";

export default async function ScheduleHomePage() {
  const user = await getSessionUser();
  if (!user) return null;

  const weekStart = getCurrentWeekStart();
  const exceptions = getExceptions(user.id);
  const weekSchedule = getEffectiveWeekSchedule(user.id, weekStart);
  const today = getTodayDateString();
  const nowTime = getNowTimeString();
  const todayBlocks = weekSchedule.get(today) ?? [];
  const isWorkingNow = isCurrentlyWorking(todayBlocks, nowTime);
  const profile = getUser(user.id);
  const settings = getSettings();
  const recurring = getAvailability(user.id);

  const weekDates = Array.from({ length: 5 }, (_, i) =>
    format(addDays(parseISO(weekStart), i), "yyyy-MM-dd")
  );

  const todayHasException = exceptions.some(
    (e) => e.exceptionDate === today && e.status === "APPROVED"
  );
  const upcomingExceptions = exceptions
    .filter(
      (e) =>
        e.exceptionDate >= today &&
        (e.status === "PENDING" || e.status === "APPROVED")
    )
    .sort((a, b) => a.exceptionDate.localeCompare(b.exceptionDate))
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Schedule</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            This week · {formatWeekRange(weekStart)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyAvailabilityButton ranges={recurring} />
          <Link href="/availability" className={buttonVariants({ size: "lg" })}>
            Edit Weekly Availability
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today</CardTitle>
          <CardDescription>
            {formatLongWeekday(today)}
            {todayHasException ? " · Schedule adjusted by an exception" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {todayBlocks.length === 0 ? (
            <p className="text-sm">You’re not scheduled today.</p>
          ) : (
            <ul className="space-y-2">
              {todayBlocks.map((block) => (
                <li key={`${block.startTime}-${block.workMode}`} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium">{formatTimeRange(block.startTime, block.endTime)}</span>
                  <WorkModeBadge mode={block.workMode} />
                  {isWorkingNow &&
                    block.startTime <= nowTime &&
                    block.endTime > nowTime && <Badge variant="success">Now</Badge>}
                </li>
              ))}
            </ul>
          )}
          {profile?.scheduleStatus === "not_started" && (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Add your weekly availability so your supervisor can see when you’re available.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>This week</CardTitle>
          <CardDescription>
            Office and Remote blocks include approved exceptions. Empty time is unavailable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WeekScheduleGrid
            weekDates={weekDates}
            scheduleByDate={weekSchedule}
            workingDayStart={settings.workingDayStart}
            workingDayEnd={settings.workingDayEnd}
            intervalMinutes={settings.schedulingIntervalMinutes}
            today={today}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Upcoming changes</CardTitle>
            <CardDescription>
              Exceptions temporarily override your normal weekly availability for a specific date.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Link href="/exceptions" className={buttonVariants({ variant: "outline" })}>
              View All Exceptions
            </Link>
            <Link href="/exceptions" className={buttonVariants({ variant: "secondary" })}>
              Add Exception
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingExceptions.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              No upcoming exceptions. Add one if next week’s plan is different from your normal hours.
            </p>
          ) : (
            <ul className="space-y-2">
              {upcomingExceptions.map((ex) => (
                <li
                  key={ex.id}
                  className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <span className="font-medium">{format(parseISO(ex.exceptionDate), "MMM d", { locale: enUS })}</span>
                  <span>{EXCEPTION_TYPE_LABEL[ex.exceptionType]}</span>
                  <span className="text-[var(--color-muted-foreground)]">
                    {formatTimeRange(ex.startTime, ex.endTime)}
                  </span>
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
