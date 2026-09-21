import { format, parseISO } from "date-fns";
import type { RecurringAvailability, ScheduleBlock, ScheduleException } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExceptionStatusBadge } from "@/components/schedule/exception-status-badge";
import { ExceptionActions } from "@/features/exceptions/exception-actions";
import { formatTimeRange } from "@/lib/utils/time";

interface ExceptionReviewCardProps {
  exception: ScheduleException;
  studentName: string;
  teamName?: string | null;
  submittedLabel?: string;
  normalBlocks: RecurringAvailability[];
  previewBlocks: ScheduleBlock[];
  canReview: boolean;
  showCancel?: boolean;
}

export function ExceptionReviewCard({
  exception,
  studentName,
  teamName,
  submittedLabel,
  normalBlocks,
  previewBlocks,
  canReview,
  showCancel = false,
}: ExceptionReviewCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">{studentName}</CardTitle>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {teamName ? `${teamName} · ` : ""}
            {submittedLabel ??
              `Submitted ${format(parseISO(exception.createdAt), "MMM d, yyyy")}`}
          </p>
        </div>
        <ExceptionStatusBadge status={exception.status} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <h4 className="mb-1 font-medium">Requested change</h4>
            <p>{format(parseISO(exception.exceptionDate), "MMM d, yyyy")}</p>
            <p>{formatTimeRange(exception.startTime, exception.endTime)}</p>
            <p className="capitalize">
              {exception.exceptionType.replace(/_/g, " ").toLowerCase()}
            </p>
            {exception.reason && (
              <p className="mt-1 text-[var(--color-muted-foreground)]">{exception.reason}</p>
            )}
          </div>
          <div>
            <h4 className="mb-1 font-medium">Normal schedule</h4>
            {normalBlocks.length === 0 ? (
              <p className="text-[var(--color-muted-foreground)]">No recurring blocks</p>
            ) : (
              normalBlocks.map((b) => (
                <p key={b.id}>
                  {formatTimeRange(b.startTime, b.endTime)} ({b.workMode})
                </p>
              ))
            )}
          </div>
          <div>
            <h4 className="mb-1 font-medium">Resulting schedule</h4>
            {previewBlocks.length === 0 ? (
              <p className="text-[var(--color-muted-foreground)]">No work scheduled</p>
            ) : (
              previewBlocks.map((b, i) => (
                <p key={`${b.startTime}-${i}`}>
                  {formatTimeRange(b.startTime, b.endTime)} ({b.workMode})
                </p>
              ))
            )}
          </div>
        </div>
        {exception.reviewedBy && exception.reviewedAt && (
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Reviewed {format(parseISO(exception.reviewedAt), "MMM d, yyyy")}
            {exception.reviewNote ? ` · ${exception.reviewNote}` : ""}
          </p>
        )}
        {canReview && exception.status === "PENDING" && (
          <ExceptionActions exceptionId={exception.id} action="approve" />
        )}
        {showCancel && exception.status === "PENDING" && (
          <ExceptionActions exceptionId={exception.id} action="cancel" />
        )}
      </CardContent>
    </Card>
  );
}
