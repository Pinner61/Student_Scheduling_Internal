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
  getCurrentPeriod,
} from "@/lib/services/data-service";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExceptionStatusBadge } from "@/components/schedule/exception-status-badge";
import { WeekScheduleGrid } from "@/components/schedule/week-schedule-grid";
import { WorkModeBadge } from "@/components/schedule/work-mode-badge";
import { formatTimeRange, formatWeekRange, formatLongWeekday } from "@/lib/utils/time";
import { EXCEPTION_TYPE_LABEL } from "@/components/schedule/schedule-language";
import { ShareAvailabilityButton } from "@/features/availability/share-availability-button";
import { ScheduleLifecycleBar } from "@/features/schedule/schedule-lifecycle-bar";

export default async function ScheduleHomePage() {
  const user = await getSessionUser();
  if (!user) return null;

  const weekStart = getCurrentWeekStart();
  const exceptions = getExceptions(user.id);
  const approvedExceptions = exceptions.filter((e) => e.status === "APPROVED");
  const weekSchedule = getEffectiveWeekSchedule(user.id, weekStart);
  const today = getTodayDateString();
  const nowTime = getNowTimeString();
  const todayBlocks = weekSchedule.get(today) ?? [];
  const isWorkingNow = isCurrentlyWorking(todayBlocks, nowTime);
  const profile = getUser(user.id);
  const settings = getSettings();
  const recurring = getAvailability(user.id);
  const period = getCurrentPeriod() ?? null;

  const weekDates = Array.from({ length: 5 }, (_, i) =>
    format(addDays(parseISO(weekStart), i), "yyyy-MM-dd")
  );

  const todayHasException = approvedExceptions.some((e) => e.exceptionDate === today);
  const upcomingExceptions = approvedExceptions
    .filter((e) => e.exceptionDate >= today)
    .sort((a, b) => a.exceptionDate.localeCompare(b.exceptionDate))
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <ScheduleLifecycleBar
          period={period}
          submissionStatus={profile?.submissionStatus ?? "DRAFT"}
          submittedAt={profile?.submittedAt ?? null}
        />
        <div className="flex flex-wrap gap-2">
          <ShareAvailabilityButton ranges={recurring} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today</CardTitle>
          <CardDescription>
            {formatLongWeekday(today)}
            {todayHasException ? " · Schedule adjusted by an approved exception" : ""}
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
            Week of {formatWeekRange(weekStart)}. Approved exceptions overlay your normal weekly
            availability. Pending requests stay on the Exceptions page until a supervisor reviews them.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <WeekScheduleGrid
            weekDates={weekDates}
            scheduleByDate={weekSchedule}
            workingDayStart={settings.workingDayStart}
            workingDayEnd={settings.workingDayEnd}
            intervalMinutes={settings.schedulingIntervalMinutes}
            today={today}
            approvedExceptions={approvedExceptions}
          />
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Striped amber blocks are approved unavailability. An amber outline marks an approved mode
            change. Empty time is unavailable.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Approved changes this week</CardTitle>
            <CardDescription>
              Only approved exceptions appear here and on the weekly schedule.
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
              No approved upcoming exceptions. Pending requests appear under Exceptions → Pending
              Supervisor Approval.
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
