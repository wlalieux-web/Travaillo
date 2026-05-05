"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { computeTotals } from "@/lib/quotes/types";
import type { CreateQuoteInput, UpdateQuoteInput, QuoteItemInput } from "@/lib/quotes/schemas";

// ── Helper : récupère le company_id du user courant ──────────
async function getCompanyId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("company_id, id")
    .eq("id", user.id)
    .single() as { data: { company_id: string; id: string } | null };

  if (!profile?.company_id) throw new Error("Aucune entreprise associée");
  return { supabase, companyId: profile.company_id, userId: profile.id };
}

// ── Calcul serveur-side des totaux ───────────────────────────
function calcTotals(data: CreateQuoteInput | UpdateQuoteInput, items: QuoteItemInput[]) {
  return computeTotals(
    items.map((it) => ({ ...it, long_description: it.long_description ?? "" })),
    data.discount_type ?? null,
    data.discount_value ?? 0,
    (data.tax_mode as "qc" | "eu" | "us" | "none" | "custom") ?? "qc",
    0,
    data.deposit_required ?? false,
    data.deposit_type ?? null,
    data.deposit_value ?? 0,
  );
}

// ── Upsert des items ─────────────────────────────────────────
async function upsertItems(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  quoteId: string,
  items: QuoteItemInput[],
) {
  // Supprimer les anciens items
  await supabase.from("quote_items").delete().eq("quote_id", quoteId);

  if (items.length === 0) return;

  const rows = items.map((it, idx) => ({
    quote_id: quoteId,
    position: idx,
    description: it.description,
    long_description: it.long_description || null,
    quantity: it.quantity,
    unit: it.unit || "unité",
    unit_price: it.unit_price,
    tax_rate_pct: it.tax_rate_pct ?? 0,
    is_optional: it.is_optional ?? false,
    is_selected: it.is_selected ?? true,
    line_total: it.quantity * it.unit_price,
  }));

  await supabase.from("quote_items").insert(rows);
}

// ─────────────────────────────────────────────────────────────

export async function createQuote(data: CreateQuoteInput) {
  const { supabase, companyId, userId } = await getCompanyId();

  const { subtotal, discountAmount, taxTotal, total, depositAmount } = calcTotals(data, data.items);

  // Numéro généré côté serveur
  const { data: numRow } = await supabase
    .rpc("generate_quote_number", { p_company: companyId });
  const number = numRow as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: quote, error } = await (supabase as any)
    .from("quotes")
    .insert({
      company_id: companyId,
      created_by: userId,
      client_id: data.client_id,
      property_id: data.property_id ?? null,
      number,
      title: data.title ?? null,
      intro_message: data.intro_message ?? null,
      internal_notes: data.internal_notes ?? null,
      terms: data.terms ?? null,
      issued_at: data.issued_at ?? new Date().toISOString().slice(0, 10),
      valid_until: data.valid_until ?? null,
      currency: data.currency ?? "CAD",
      tax_mode: data.tax_mode ?? "qc",
      discount_type: data.discount_type ?? null,
      discount_value: data.discount_value ?? 0,
      discount_amount: discountAmount,
      tax_total: taxTotal,
      subtotal,
      total,
      deposit_required: data.deposit_required ?? false,
      deposit_type: data.deposit_type ?? null,
      deposit_value: data.deposit_value ?? 0,
      deposit_amount: depositAmount,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await upsertItems(supabase, quote.id, data.items);

  revalidatePath("/quotes");
  return { quoteId: quote.id };
}

export async function updateQuote(id: string, data: UpdateQuoteInput) {
  const { supabase, companyId } = await getCompanyId();

  // Vérifier que la quote appartient à la company
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from("quotes")
    .select("id, company_id")
    .eq("id", id)
    .single();
  if (!existing || existing.company_id !== companyId) throw new Error("Accès refusé");

  const items = data.items ?? [];
  const { subtotal, discountAmount, taxTotal, total, depositAmount } = calcTotals(data, items);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("quotes")
    .update({
      client_id: data.client_id,
      property_id: data.property_id ?? null,
      title: data.title ?? null,
      intro_message: data.intro_message ?? null,
      internal_notes: data.internal_notes ?? null,
      terms: data.terms ?? null,
      issued_at: data.issued_at ?? null,
      valid_until: data.valid_until ?? null,
      currency: data.currency ?? "CAD",
      tax_mode: data.tax_mode ?? "qc",
      discount_type: data.discount_type ?? null,
      discount_value: data.discount_value ?? 0,
      discount_amount: discountAmount,
      tax_total: taxTotal,
      subtotal,
      total,
      deposit_required: data.deposit_required ?? false,
      deposit_type: data.deposit_type ?? null,
      deposit_value: data.deposit_value ?? 0,
      deposit_amount: depositAmount,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  if (items.length > 0) {
    await upsertItems(supabase, id, items);
  }

  revalidatePath(`/quotes/${id}`);
  revalidatePath("/quotes");
}

export async function deleteQuote(id: string) {
  const { supabase, companyId } = await getCompanyId();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("quotes")
    .delete()
    .eq("id", id)
    .eq("company_id", companyId);

  if (error) throw new Error(error.message);

  revalidatePath("/quotes");
}

export async function sendQuote(id: string) {
  const { supabase, companyId } = await getCompanyId();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: quote, error } = await (supabase as any)
    .from("quotes")
    .update({ status: "sent" })
    .eq("id", id)
    .eq("company_id", companyId)
    .select("public_token")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/quotes/${id}`);
  revalidatePath("/quotes");

  return { publicToken: quote.public_token as string };
}

export async function markViewed(token: string) {
  // Action publique — pas d'auth requise
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("quotes")
    .update({ status: "viewed", viewed_at: new Date().toISOString() })
    .eq("public_token", token)
    .eq("status", "sent"); // seulement si encore 'sent' (idempotent)
}

export async function approveQuote(
  token: string,
  signedName: string,
  signatureData: string, // base64 canvas
  selectedItemIds: string[], // IDs des optionnels cochés par le client
) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: quote, error: fetchErr } = await (supabase as any)
    .from("quotes")
    .select("id, company_id, status, tax_mode, discount_type, discount_value, deposit_required, deposit_type, deposit_value")
    .eq("public_token", token)
    .single();

  if (fetchErr || !quote) throw new Error("Devis introuvable");
  if (!["sent", "viewed"].includes(quote.status)) throw new Error("Ce devis ne peut plus être approuvé");

  // Mettre à jour is_selected pour les optionnels selon les choix du client
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: items } = await (supabase as any)
    .from("quote_items")
    .select("id, is_optional, quantity, unit_price")
    .eq("quote_id", quote.id);

  if (items) {
    for (const item of items) {
      if (item.is_optional) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from("quote_items")
          .update({ is_selected: selectedItemIds.includes(item.id) })
          .eq("id", item.id);
      }
    }

    // Recalcul des totaux avec les sélections du client
    const drafts = items.map((it: { id: string; is_optional: boolean; quantity: number; unit_price: number }) => ({
      id: it.id,
      position: 0,
      description: "",
      long_description: "",
      quantity: it.quantity,
      unit: "",
      unit_price: it.unit_price,
      tax_rate_pct: 0,
      is_optional: it.is_optional,
      is_selected: it.is_optional ? selectedItemIds.includes(it.id) : true,
    }));

    const { subtotal, discountAmount, taxTotal, total, depositAmount } = computeTotals(
      drafts,
      quote.discount_type,
      quote.discount_value ?? 0,
      quote.tax_mode,
      0,
      quote.deposit_required,
      quote.deposit_type,
      quote.deposit_value ?? 0,
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("quotes")
      .update({
        status: "approved",
        signed_at: new Date().toISOString(),
        signed_name: signedName,
        responded_at: new Date().toISOString(),
        subtotal,
        discount_amount: discountAmount,
        tax_total: taxTotal,
        total,
        deposit_amount: depositAmount,
      })
      .eq("id", quote.id);
  }
}

export async function rejectQuote(token: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("quotes")
    .update({ status: "rejected", responded_at: new Date().toISOString() })
    .eq("public_token", token)
    .in("status", ["sent", "viewed"]);
}

export async function duplicateQuote(id: string) {
  const { supabase, companyId, userId } = await getCompanyId();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: original } = await (supabase as any)
    .from("quotes")
    .select("*")
    .eq("id", id)
    .eq("company_id", companyId)
    .single();

  if (!original) throw new Error("Devis introuvable");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: items } = await (supabase as any)
    .from("quote_items")
    .select("*")
    .eq("quote_id", id)
    .order("position");

  const { data: numRow } = await supabase
    .rpc("generate_quote_number", { p_company: companyId });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: copy, error } = await (supabase as any)
    .from("quotes")
    .insert({
      company_id: companyId,
      created_by: userId,
      client_id: original.client_id,
      property_id: original.property_id,
      number: numRow as string,
      status: "draft",
      title: original.title ? `Copie — ${original.title}` : "Copie",
      intro_message: original.intro_message,
      internal_notes: original.internal_notes,
      terms: original.terms,
      issued_at: new Date().toISOString().slice(0, 10),
      valid_until: original.valid_until,
      currency: original.currency,
      tax_mode: original.tax_mode,
      discount_type: original.discount_type,
      discount_value: original.discount_value,
      discount_amount: original.discount_amount,
      tax_total: original.tax_total,
      subtotal: original.subtotal,
      total: original.total,
      deposit_required: original.deposit_required,
      deposit_type: original.deposit_type,
      deposit_value: original.deposit_value,
      deposit_amount: original.deposit_amount,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (items?.length) {
    await supabase.from("quote_items").insert(
      items.map(({ id: _id, quote_id: _qid, created_at: _ca, ...rest }: Record<string, unknown>) => ({
        ...rest,
        quote_id: copy.id,
      }))
    );
  }

  revalidatePath("/quotes");
  return { quoteId: copy.id };
}
