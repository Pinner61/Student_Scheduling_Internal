import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { canViewUserSchedule } from "@/lib/services/data-service";
import { StudentScheduleDetail } from "@/features/users/student-schedule-detail";

export default async function SupervisorStudentDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const user = await getSessionUser();
  if (!user) return null;
  const { userId } = await params;
  if (!canViewUserSchedule(user, userId)) notFound();
  return <StudentScheduleDetail userId={userId} />;
}
