import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getRoleHomePath } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";

export default async function SupervisorLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "supervisor" && user.role !== "administrator") {
    redirect(getRoleHomePath(user.role));
  }
  return children;
}
