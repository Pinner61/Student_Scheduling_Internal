import { PeriodManager } from "@/features/periods/period-manager";
import { listPeriods } from "@/lib/services/data-service";

export default async function AdminPeriodsPage() {
  const periods = listPeriods();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Schedule Periods</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Create and open scheduling windows. Student availability belongs to a period, so Fall
          remains independent from Spring.
        </p>
      </div>
      <PeriodManager periods={periods} />
    </div>
  );
}
