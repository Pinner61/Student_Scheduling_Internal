import { z } from "zod";

export const availabilityRangeSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  workMode: z.enum(["OFFICE", "REMOTE"]),
});

export const availabilityFormSchema = z.object({
  ranges: z.array(availabilityRangeSchema).min(0),
});

export const exceptionFormSchema = z.object({
  exceptionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  exceptionType: z.enum([
    "UNAVAILABLE",
    "REMOTE_INSTEAD",
    "OFFICE_INSTEAD",
    "ALTERNATE_AVAILABILITY",
  ]),
  replacementMode: z.enum(["OFFICE", "REMOTE"]).nullable().optional(),
  reason: z.string().max(500).optional(),
});

export type AvailabilityRangeInput = z.infer<typeof availabilityRangeSchema>;
export type ExceptionFormInput = z.infer<typeof exceptionFormSchema>;
