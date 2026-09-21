import { Suspense } from "react";
import {
  getExceptions,
  getUser,
  getAvailability,
  listTeams,
  listUsers,
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

export default async function AdminExceptionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = params.status ?? "PENDING";
  const teams = listTeams();
  const students = listUsers({ role: "student" });
  let exceptions = getExceptions();

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
    const memberIds = new Set(
      students.filter((s) => s.teamId === params.team).map((s) => s.id)
    );
    exceptions = exceptions.filter((e) => memberIds.has(e.userId));
  }
  if (params.from) {
    exceptions = exceptions.filter((e) => e.exceptionDate >= params.from!);
  }
  if (params.to) {
    exceptions = exceptions.filter((e) => e.exceptionDate <= params.to!);
  }

  exceptions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Exceptions</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Review requested changes against each student’s normal schedule
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <ExceptionFilters
          teams={teams}
          students={students.map((s) => ({
            id: s.id,
            name: `${s.firstName} ${s.lastName}`,
          }))}
          basePath="/admin/exceptions"
        />
      </Suspense>

      {exceptions.length === 0 ? (
        <EmptyState
          title="No exceptions match these filters"
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
            const preview = previewExceptionOnDate(
              recurring,
              allExceptions,
              ex,
              ex.exceptionDate
            );
            return (
              <ExceptionReviewCard
                key={ex.id}
                exception={ex}
                studentName={`${student?.firstName ?? ""} ${student?.lastName ?? ""}`.trim()}
                teamName={student?.teamName}
                normalBlocks={normalBlocks}
                previewBlocks={preview}
                canReview
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
