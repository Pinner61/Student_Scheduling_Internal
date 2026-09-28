import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getRoleHomePath } from "@/lib/auth/rbac";
import { StudentRegisterForm } from "@/components/auth/student-register-form";

export const dynamic = "force-dynamic";

export default async function StudentRegisterPage() {
  const user = await getSessionUser();
  if (user) redirect(getRoleHomePath(user.role));
  return <StudentRegisterForm />;
}
