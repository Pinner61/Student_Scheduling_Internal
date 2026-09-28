import { z } from "zod";
import { timeToMinutes } from "@/lib/utils/time";
import { validateAvailabilityRanges } from "@/lib/schedule/engine";
import type { AppSettings, WorkMode } from "@/types";

export const periodFormSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required.").max(80),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date is required."),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date is required."),
  })
  .refine((value) => value.endDate > value.startDate, {
    message: "End date must be after start date.",
    path: ["endDate"],
  });

export const userOnboardingSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(80),
  lastName: z.string().trim().min(1, "Last name is required.").max(80),
  email: z
    .string()
    .trim()
    .transform((value) => value.toLowerCase())
    .refine((value) => /^[^\s@]+@asu\.edu$/i.test(value), "Please use your @asu.edu email address."),
  role: z.enum(["student", "supervisor", "administrator"]),
  teamId: z.string().nullable().optional(),
  supervisorId: z.string().nullable().optional(),
  status: z.enum(["active", "inactive", "pending"]).optional(),
});

const timeSchema = z.string().regex(/^\d{2}:\d{2}$/, "Use HH:mm time.");

export function isAlignedToInterval(time: string, intervalMinutes: number): boolean {
  return timeToMinutes(time) % intervalMinutes === 0;
}

export function validateTimeBlock(
  startTime: string,
  endTime: string,
  settings: Pick<AppSettings, "workingDayStart" | "workingDayEnd" | "schedulingIntervalMinutes">
): string[] {
  const errors: string[] = [];
  if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
    errors.push("End time must be after start time.");
  }
  if (!isAlignedToInterval(startTime, settings.schedulingIntervalMinutes)) {
    errors.push(`Start time must align to ${settings.schedulingIntervalMinutes}-minute blocks.`);
  }
  if (!isAlignedToInterval(endTime, settings.schedulingIntervalMinutes)) {
    errors.push(`End time must align to ${settings.schedulingIntervalMinutes}-minute blocks.`);
  }
  if (
    timeToMinutes(startTime) < timeToMinutes(settings.workingDayStart) ||
    timeToMinutes(endTime) > timeToMinutes(settings.workingDayEnd)
  ) {
    errors.push(
      `Time must be within working hours (${settings.workingDayStart}–${settings.workingDayEnd}).`
    );
  }
  return errors;
}

export function validateAvailabilityInput(
  ranges: { dayOfWeek: number; startTime: string; endTime: string; workMode: WorkMode }[],
  settings: AppSettings
): string[] {
  const intervalErrors: string[] = [];
  for (const range of ranges) {
    if (!isAlignedToInterval(range.startTime, settings.schedulingIntervalMinutes)) {
      intervalErrors.push(
        `Times must align to ${settings.schedulingIntervalMinutes}-minute blocks.`
      );
      break;
    }
    if (!isAlignedToInterval(range.endTime, settings.schedulingIntervalMinutes)) {
      intervalErrors.push(
        `Times must align to ${settings.schedulingIntervalMinutes}-minute blocks.`
      );
      break;
    }
  }
  return [
    ...intervalErrors,
    ...validateAvailabilityRanges(ranges, settings.workingDayStart, settings.workingDayEnd),
  ];
}

export const commonAvailabilityQuerySchema = z
  .object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    durationMinutes: z.number().int().positive(),
    workMode: z.enum(["OFFICE", "REMOTE", "all"]).optional(),
    teamId: z.string().optional(),
    studentIds: z.array(z.string()).optional(),
  })
  .refine((value) => value.endDate >= value.startDate, {
    message: "End date must be on or after the start date.",
    path: ["endDate"],
  });

export { timeSchema };
export type UserOnboardingInput = z.infer<typeof userOnboardingSchema>;
export type PeriodFormInput = z.infer<typeof periodFormSchema>;
