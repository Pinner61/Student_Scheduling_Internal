export const MIN_PASSWORD_LENGTH = 8;

export function validatePassword(password: string, confirmation?: string): string | null {
  if (!password) return "Enter a password.";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Your password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (confirmation !== undefined && password !== confirmation) {
    return "Your passwords do not match.";
  }
  return null;
}
