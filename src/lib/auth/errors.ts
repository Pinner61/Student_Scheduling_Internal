import { AppError } from "@/lib/errors";

export const ACCOUNT_DISABLED_MESSAGE =
  "This account has been deactivated. Contact your administrator.";
export const INVALID_CREDENTIALS_MESSAGE = "Incorrect email or password.";
export const DUPLICATE_ACCOUNT_MESSAGE = "This email already has an account. Sign in instead.";
export const PENDING_ACCOUNT_MESSAGE =
  "This account is not active yet. Use your invitation link or confirm your ASU email.";
export const AUTH_NOT_CONFIGURED_MESSAGE =
  "Account sign-in is not configured in this environment.";

export function mapSupabaseAuthError(message: string | undefined): string {
  const value = (message ?? "").toLowerCase();
  if (!value) return "Unable to complete that request. Try again.";
  if (value.includes("invalid login") || value.includes("invalid credentials")) {
    return INVALID_CREDENTIALS_MESSAGE;
  }
  if (value.includes("already registered") || value.includes("already been registered")) {
    return DUPLICATE_ACCOUNT_MESSAGE;
  }
  if (value.includes("email not confirmed") || value.includes("confirm")) {
    return "Check your ASU email to confirm your account before signing in.";
  }
  if (value.includes("user banned") || value.includes("disabled")) {
    return ACCOUNT_DISABLED_MESSAGE;
  }
  if (value.includes("password")) {
    return "Your password must meet the security requirements.";
  }
  return "Unable to complete that request. Try again.";
}

export function assertActiveProfileStatus(status: string): void {
  if (status === "inactive") {
    throw new AppError(ACCOUNT_DISABLED_MESSAGE, "unauthorized");
  }
  if (status === "pending") {
    throw new AppError(PENDING_ACCOUNT_MESSAGE, "unauthorized");
  }
}
