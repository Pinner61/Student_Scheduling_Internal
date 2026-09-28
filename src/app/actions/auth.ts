"use server";

import { redirect } from "next/navigation";
import { toUserFacingError } from "@/lib/errors";
import { getRoleHomePath } from "@/lib/auth/rbac";
import { requireRole, requireUser, setSessionCookie, clearSessionCookie, getSessionUser } from "@/lib/auth/session";
import {
  activateInvitation,
  cancelInvitation,
  inviteUserAccount,
  PASSWORD_RESET_NOTICE,
  registerStudent,
  requestPasswordReset,
  resendInvitation,
  signInWithPassword,
  updateAuthenticatedPassword,
} from "@/lib/auth/service";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import {
  activateInviteSchema,
  forgotPasswordSchema,
  inviteUserSchema,
  loginSchema,
  resetPasswordSchema,
  studentRegisterSchema,
} from "@/lib/validations/auth";
import { revalidatePath } from "next/cache";

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter your ASU email and password." };
  }

  try {
    const profile = await signInWithPassword(parsed.data.email, parsed.data.password);
    await setSessionCookie(profile);
  } catch (error) {
    return { error: toUserFacingError(error, "Incorrect email or password.") };
  }

  const user = await getSessionUser();
  redirect(user ? getRoleHomePath(user.role) : "/login");
}

export async function registerStudentAction(formData: FormData) {
  const parsed = studentRegisterSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the registration form and try again." };
  }

  try {
    const result = await registerStudent(parsed.data);
    if (result.needsEmailConfirmation) {
      return { confirmationRequired: true, email: result.profile.email };
    }
    await setSessionCookie(result.profile);
  } catch (error) {
    return { error: toUserFacingError(error, "Unable to create that account.") };
  }

  const user = await getSessionUser();
  redirect(user ? getRoleHomePath(user.role) : "/schedule");
}

export async function forgotPasswordAction(formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please use your @asu.edu email address." };
  }
  await requestPasswordReset(parsed.data.email);
  return { success: true, message: PASSWORD_RESET_NOTICE };
}

export async function resetPasswordAction(formData: FormData) {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Your password must meet the security requirements." };
  }
  try {
    await updateAuthenticatedPassword(parsed.data.password);
    return { success: true };
  } catch (error) {
    return { error: toUserFacingError(error, "This reset link is invalid or has expired.") };
  }
}

export async function activateInvitationAction(token: string, formData: FormData) {
  const parsed = activateInviteSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the activation form and try again." };
  }
  try {
    const profile = await activateInvitation(token, parsed.data);
    await setSessionCookie(profile);
  } catch (error) {
    return { error: toUserFacingError(error, "Unable to activate that invitation.") };
  }
  const user = await getSessionUser();
  redirect(user ? getRoleHomePath(user.role) : "/login");
}

export async function inviteUserAction(data: {
  firstName: string;
  lastName: string;
  email: string;
  role: "student" | "supervisor" | "administrator";
  teamId: string | null;
}) {
  try {
    const actor = await requireUser();
    requireRole(actor, "administrator");
    const parsed = inviteUserSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Check the invitation details and try again." };
    }
    const result = await inviteUserAccount(actor, parsed.data);
    revalidatePath("/admin/users");
    return {
      success: true as const,
      activateUrl: result.activateUrl,
      emailSent: result.emailSent,
      email: result.profile.email,
    };
  } catch (error) {
    return { error: toUserFacingError(error, "Unable to create that invitation.") };
  }
}

export async function resendInvitationAction(invitationId: string) {
  try {
    const actor = await requireUser();
    requireRole(actor, "administrator");
    const result = await resendInvitation(actor, invitationId);
    revalidatePath("/admin/users");
    return { success: true as const, activateUrl: result.activateUrl, emailSent: result.emailSent };
  } catch (error) {
    return { error: toUserFacingError(error, "Unable to reissue that invitation.") };
  }
}

export async function cancelInvitationAction(invitationId: string) {
  try {
    const actor = await requireUser();
    requireRole(actor, "administrator");
    await cancelInvitation(actor, invitationId);
    revalidatePath("/admin/users");
    return { success: true as const };
  } catch (error) {
    return { error: toUserFacingError(error, "Unable to cancel that invitation.") };
  }
}

export async function logoutAction() {
  const supabase = await tryCreateSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  await clearSessionCookie();
  redirect("/login");
}
