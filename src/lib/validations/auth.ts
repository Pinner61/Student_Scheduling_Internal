import { z } from "zod";
import { isAsuEmail, normalizeEmail } from "@/lib/auth/email";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/passwords";

const asuEmail = z
  .string()
  .trim()
  .transform(normalizeEmail)
  .refine(isAsuEmail, "Please use your @asu.edu email address.");

export const studentRegisterSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required.").max(80),
    lastName: z.string().trim().min(1, "Last name is required.").max(80),
    email: asuEmail,
    password: z.string().min(MIN_PASSWORD_LENGTH, `Your password must be at least ${MIN_PASSWORD_LENGTH} characters.`),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Your passwords do not match.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: asuEmail,
  password: z.string().min(1, "Enter your password."),
});

export const forgotPasswordSchema = z.object({
  email: asuEmail,
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(MIN_PASSWORD_LENGTH, `Your password must be at least ${MIN_PASSWORD_LENGTH} characters.`),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Your passwords do not match.",
    path: ["confirmPassword"],
  });

export const inviteUserSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(80),
  lastName: z.string().trim().min(1, "Last name is required.").max(80),
  email: asuEmail,
  role: z.enum(["student", "supervisor", "administrator"]),
  teamId: z.string().nullable().optional(),
});

export const activateInviteSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required.").max(80),
    lastName: z.string().trim().min(1, "Last name is required.").max(80),
    password: z.string().min(MIN_PASSWORD_LENGTH, `Your password must be at least ${MIN_PASSWORD_LENGTH} characters.`),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Your passwords do not match.",
    path: ["confirmPassword"],
  });

export type StudentRegisterInput = z.infer<typeof studentRegisterSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
