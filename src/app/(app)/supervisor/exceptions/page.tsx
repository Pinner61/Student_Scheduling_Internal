import { Suspense } from "react";
import { getSessionUser } from "@/lib/auth/session";
import {
  getSupervisorTeams,
  getExceptionsForTeam,
  getUser,
  getAvailability,
  getExceptions,
} from "@/lib/services/data-service";
import { previewExceptionOnDate } from "@/lib/schedule/engine";
import { ExceptionReviewCard } from "@/features/exceptions/exception-review-card";
import { ExceptionFilters } from "@/features/exceptions/exception-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    type?: string;
    team?: string;
    student?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function SupervisorExceptionsPage({ searchParams }: PageProps) {
  const user = await getSessionUser();
  if (!user) return null;

  const params = await searchParams;
  const teams = getSupervisorTeams(user.id);
  const status = params.status ?? "PENDING";
  let exceptions = teams
    .flatMap((t) => getExceptionsForTeam(t.id))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  exceptions = Array.from(new Map(exceptions.map((e) => [e.id, e])).values());

  if (status !== "all") {
    exceptions = exceptions.filter((e) => e.status === status);
  }
  if (params.type && params.type !== "all") {
    exceptions = exceptions.filter((e) => e.exceptionType === params.type);
  }
  if (params.student && params.student !== "all") {
    exceptions = exceptions.filter((e) => e.userId === params.student);
  }
  if (params.team && params.team !== "all") {
    const teamExceptions = new Set(getExceptionsForTeam(params.team).map((e) => e.id));
    exceptions = exceptions.filter((e) => teamExceptions.has(e.id));
  }
  if (params.from) exceptions = exceptions.filter((e) => e.exceptionDate >= params.from!);
  if (params.to) exceptions = exceptions.filter((e) => e.exceptionDate <= params.to!);

  const students = exceptions
    .map((e) => getUser(e.userId))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));
  const uniqueStudents = Array.from(new Map(students.map((s) => [s.id, s])).values());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Exceptions</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Review team exception requests against each student’s normal schedule
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <ExceptionFilters
          teams={teams}
          students={uniqueStudents.map((s) => ({
            id: s.id,
            name: `${s.firstName} ${s.lastName}`,
          }))}
          basePath="/supervisor/exceptions"
        />
      </Suspense>

      {exceptions.length === 0 ? (
        <EmptyState
          title="No pending exceptions"
          description="New student requests will appear here."
        />
      ) : (
        <div className="space-y-4">
          {exceptions.map((ex) => {
            const student = getUser(ex.userId);
            const recurring = getAvailability(ex.userId);
            const allExceptions = getExceptions(ex.userId);
            const normalBlocks = recurring.filter(
              (r) => r.dayOfWeek === new Date(`${ex.exceptionDate}T12:00:00`).getDay()
            );
            return (
              <ExceptionReviewCard
                key={ex.id}
                exception={ex}
                studentName={`${student?.firstName ?? ""} ${student?.lastName ?? ""}`.trim()}
                teamName={student?.teamName}
                normalBlocks={normalBlocks}
                previewBlocks={previewExceptionOnDate(
                  recurring,
                  allExceptions,
                  ex,
                  ex.exceptionDate
                )}
                canReview
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
