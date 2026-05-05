import { z } from "zod";

export const EditTimeEntrySchema = z.object({
  clock_in_at: z.string(),
  clock_out_at: z.string().nullable().optional(),
  break_minutes: z.number().int().min(0).default(0),
  billable: z.boolean().default(true),
  notes: z.string().optional(),
  edit_reason: z.string().min(5, "Raison de modification requise (min. 5 caractères)"),
});

export const ClockInSchema = z.object({
  visit_id: z.string().uuid().nullable().optional(),
  job_id: z.string().uuid().nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  accuracy_m: z.number().int().nullable().optional(),
});

export type EditTimeEntryInput = z.infer<typeof EditTimeEntrySchema>;
export type ClockInInput = z.infer<typeof ClockInSchema>;
