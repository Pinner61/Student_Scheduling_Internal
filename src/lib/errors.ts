export type AppErrorCode =
  | "unauthorized"
  | "validation"
  | "not_found"
  | "conflict"
  | "unavailable";

export class AppError extends Error {
  readonly code: AppErrorCode;

  constructor(message: string, code: AppErrorCode = "validation") {
    super(message);
    this.name = "AppError";
    this.code = code;
  }
}

export function toUserFacingError(error: unknown, fallback = "Something went wrong. Try again."): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error && error.message === "Unauthorized") {
    return "You don’t have permission to do that.";
  }
  return fallback;
}
