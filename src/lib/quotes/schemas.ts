import { z } from "zod";

export const QuoteItemSchema = z.object({
  id: z.string(),
  position: z.number().int().min(0),
  description: z.string().min(1, "Description requise"),
  long_description: z.string().default(""),
  quantity: z.number().positive("Quantité > 0"),
  unit: z.string().default("unité"),
  unit_price: z.number().min(0),
  tax_rate_pct: z.number().min(0).max(100).default(0),
  is_optional: z.boolean().default(false),
  is_selected: z.boolean().default(true),
});

export const CreateQuoteSchema = z.object({
  client_id: z.string().uuid("Client requis"),
  property_id: z.string().uuid().nullable().optional(),
  title: z.string().optional(),
  intro_message: z.string().optional(),
  internal_notes: z.string().optional(),
  terms: z.string().optional(),
  issued_at: z.string().nullable().optional(),
  valid_until: z.string().nullable().optional(),
  currency: z.string().default("CAD"),
  tax_mode: z.enum(["qc", "eu", "us", "none", "custom"]).default("qc"),
  discount_type: z.enum(["percent", "fixed"]).nullable().optional(),
  discount_value: z.number().min(0).default(0),
  deposit_required: z.boolean().default(false),
  deposit_type: z.enum(["percent", "fixed"]).nullable().optional(),
  deposit_value: z.number().min(0).default(0),
  items: z.array(QuoteItemSchema).min(1, "Au moins un item requis"),
});

export const UpdateQuoteSchema = CreateQuoteSchema.partial().extend({
  status: z.enum(["draft", "sent", "viewed", "approved", "rejected", "expired", "converted", "archived"]).optional(),
});

export type CreateQuoteInput = z.infer<typeof CreateQuoteSchema>;
export type UpdateQuoteInput = z.infer<typeof UpdateQuoteSchema>;
export type QuoteItemInput = z.infer<typeof QuoteItemSchema>;
