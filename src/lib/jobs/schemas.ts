import { z } from "zod";

export const CreateJobSchema = z.object({
  client_id: z.string().uuid("Client requis"),
  property_id: z.string().uuid().nullable().optional(),
  quote_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1, "Titre requis"),
  description: z.string().optional(),
  type: z.enum(["one_off", "recurring"]).default("one_off"),
  // Récurrence (obligatoire si type=recurring)
  recurrence_rule: z.string().nullable().optional(),
  recurrence_start: z.string().nullable().optional(),
  recurrence_end: z.string().nullable().optional(),
  // Estimation
  estimated_duration_minutes: z.number().int().positive().nullable().optional(),
  estimated_cost: z.number().min(0).nullable().optional(),
  total: z.number().min(0).default(0),
  currency: z.string().default("CAD"),
  internal_notes: z.string().optional(),
  client_instructions: z.string().optional(),
  // Première visite (obligatoire pour one_off)
  first_visit: z.object({
    scheduled_start: z.string(),
    scheduled_end: z.string(),
    assignee_ids: z.array(z.string().uuid()).default([]),
    primary_assignee_id: z.string().uuid().nullable().optional(),
  }).optional(),
}).superRefine((data, ctx) => {
  if (data.type === "recurring" && !data.recurrence_rule) {
    ctx.addIssue({ code: "custom", message: "Règle de récurrence requise pour les jobs récurrents", path: ["recurrence_rule"] });
  }
});

export const UpdateJobSchema = CreateJobSchema.partial().omit({ first_visit: true });

export const CreateVisitSchema = z.object({
  job_id: z.string().uuid(),
  scheduled_start: z.string(),
  scheduled_end: z.string(),
  assignee_ids: z.array(z.string().uuid()).default([]),
  primary_assignee_id: z.string().uuid().nullable().optional(),
  override_address: z.string().optional(),
  sequence_number: z.number().int().optional(),
});

export const MoveVisitSchema = z.object({
  scheduled_start: z.string(),
  scheduled_end: z.string(),
  assignee_ids: z.array(z.string().uuid()).optional(),
  primary_assignee_id: z.string().uuid().nullable().optional(),
});

export type CreateJobInput = z.infer<typeof CreateJobSchema>;
export type UpdateJobInput = z.infer<typeof UpdateJobSchema>;
export type CreateVisitInput = z.infer<typeof CreateVisitSchema>;
export type MoveVisitInput = z.infer<typeof MoveVisitSchema>;
