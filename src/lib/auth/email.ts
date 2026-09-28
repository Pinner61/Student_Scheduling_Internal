const ASU_EMAIL = /^[^\s@]+@asu\.edu$/i;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isAsuEmail(email: string): boolean {
  return ASU_EMAIL.test(normalizeEmail(email));
}

export function asuEmailError(email: string): string | null {
  const value = normalizeEmail(email);
  if (!value) return "Enter your ASU email address.";
  if (!ASU_EMAIL.test(value)) return "Please use your @asu.edu email address.";
  return null;
}
