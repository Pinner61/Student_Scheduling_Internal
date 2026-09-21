import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getRoleHomePath } from "@/lib/auth/rbac";

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  redirect(getRoleHomePath(user.role));
}
