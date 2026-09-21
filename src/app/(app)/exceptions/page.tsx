import { format, parseISO } from "date-fns";
import { getSessionUser } from "@/lib/auth/session";
import { getAvailability, getExceptions } from "@/lib/services/data-service";
import { ExceptionForm } from "@/features/exceptions/exception-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExceptionStatusBadge } from "@/components/schedule/exception-status-badge";
import { ExceptionActions } from "@/features/exceptions/exception-actions";
import { formatTimeRange } from "@/lib/utils/time";
import { EmptyState } from "@/components/ui/empty-state";

export default async function ExceptionsPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const exceptions = getExceptions(user.id).sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Exceptions</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Exceptions temporarily override your normal weekly availability for a specific date.
        </p>
      </div>

      <ExceptionForm recurring={getAvailability(user.id)} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your exceptions</CardTitle>
        </CardHeader>
        <CardContent>
          {exceptions.length === 0 ? (
            <EmptyState
              title="No exceptions yet"
              description="When you need a one-time schedule change, submit an exception above."
            />
          ) : (
            <ul className="space-y-3">
              {exceptions.map((ex) => (
                <li
                  key={ex.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--color-border)] p-3"
                >
                  <div className="space-y-1 text-sm">
                    <div className="font-medium">
                      {format(parseISO(ex.exceptionDate), "EEEE, MMM d, yyyy")}
                    </div>
                    <div>{formatTimeRange(ex.startTime, ex.endTime)}</div>
                    <div className="capitalize text-[var(--color-muted-foreground)]">
                      {ex.exceptionType.replace(/_/g, " ").toLowerCase()}
                    </div>
                    {ex.reason && (
                      <div className="text-[var(--color-muted-foreground)]">{ex.reason}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <ExceptionStatusBadge status={ex.status} />
                    {ex.status === "PENDING" && (
                      <ExceptionActions exceptionId={ex.id} action="cancel" />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
