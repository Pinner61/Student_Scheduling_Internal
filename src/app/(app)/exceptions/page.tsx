import { format, parseISO } from "date-fns";
import { enUS } from "date-fns/locale";
import { getSessionUser } from "@/lib/auth/session";
import { getAvailability, getExceptions, getUser, getCurrentPeriod } from "@/lib/services/data-service";
import { ExceptionForm } from "@/features/exceptions/exception-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ExceptionStatusBadge } from "@/components/schedule/exception-status-badge";
import { ExceptionActions } from "@/features/exceptions/exception-actions";
import { formatTimeRange } from "@/lib/utils/time";
import { EmptyState } from "@/components/ui/empty-state";
import { studentVisibleExceptions } from "@/lib/schedule/exceptions";
import { EXCEPTION_TYPE_LABEL } from "@/components/schedule/schedule-language";
import { canCreateException } from "@/lib/schedule/periods";
import type { ScheduleException } from "@/types";

function ExceptionListItem({
  exception,
  reviewerName,
  showCancel,
}: {
  exception: ScheduleException;
  reviewerName?: string | null;
  showCancel?: boolean;
}) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-[var(--color-border)] p-3">
      <div className="space-y-1 text-sm">
        <div className="font-medium">
          {format(parseISO(exception.exceptionDate), "EEEE, MMM d, yyyy", { locale: enUS })}
        </div>
        <div>{formatTimeRange(exception.startTime, exception.endTime)}</div>
        <div className="text-[var(--color-muted-foreground)]">
          {EXCEPTION_TYPE_LABEL[exception.exceptionType] ?? exception.exceptionType}
        </div>
        {exception.reason && (
          <div className="text-[var(--color-muted-foreground)]">{exception.reason}</div>
        )}
        {exception.status === "DECLINED" && exception.reviewNote && (
          <p className="rounded-md bg-red-50 px-2 py-1 text-red-900">
            Rejection reason: {exception.reviewNote}
            {reviewerName ? ` · ${reviewerName}` : ""}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <ExceptionStatusBadge status={exception.status} />
        {showCancel && exception.status === "PENDING" && (
          <ExceptionActions exceptionId={exception.id} action="cancel" />
        )}
      </div>
    </li>
  );
}

export default async function ExceptionsPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const period = getCurrentPeriod();
  const visible = studentVisibleExceptions(getExceptions(user.id)).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
  const pending = visible.filter((e) => e.status === "PENDING");
  const approved = visible.filter((e) => e.status === "APPROVED");
  const rejected = visible.filter((e) => e.status === "DECLINED");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Exceptions</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Exceptions temporarily override your normal weekly availability for a specific date.
          Pending requests do not change your weekly schedule until they are approved.
        </p>
      </div>

      {period && canCreateException(period) ? (
        <ExceptionForm recurring={getAvailability(user.id)} />
      ) : (
        <p className="text-sm" role="status">
          Exception requests are not available while this schedule period is{" "}
          {period?.status.toLowerCase() ?? "unavailable"}.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pending Supervisor Approval</CardTitle>
          <CardDescription>
            These requests are waiting for review and are not shown on your weekly schedule.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <EmptyState
              title="No pending requests"
              description="When you submit an exception, it stays here until a supervisor approves or rejects it."
            />
          ) : (
            <ul className="space-y-3">
              {pending.map((ex) => (
                <ExceptionListItem key={ex.id} exception={ex} showCancel />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Approved</CardTitle>
          <CardDescription>
            Approved exceptions appear on your weekly schedule for the affected date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {approved.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">No approved exceptions.</p>
          ) : (
            <ul className="space-y-3">
              {approved.map((ex) => (
                <ExceptionListItem key={ex.id} exception={ex} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rejected</CardTitle>
          <CardDescription>
            Rejected requests stay visible here for 14 days, then drop off this list. The record is
            kept for supervisors and administrators.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rejected.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              No recently rejected exceptions.
            </p>
          ) : (
            <ul className="space-y-3">
              {rejected.map((ex) => {
                const reviewer = ex.reviewedBy ? getUser(ex.reviewedBy) : undefined;
                return (
                  <ExceptionListItem
                    key={ex.id}
                    exception={ex}
                    reviewerName={
                      reviewer ? `${reviewer.firstName} ${reviewer.lastName}` : null
                    }
                  />
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
