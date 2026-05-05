import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicQuoteView } from "@/components/quotes/public-quote-view";
import { markViewed } from "@/lib/quotes/actions";

export default async function PublicQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  // Lecture publique : pas de vérification auth
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: quote } = await (supabase as any)
    .from("quotes")
    .select(`
      id, number, status, title, intro_message, terms,
      issued_at, valid_until, currency, tax_mode,
      subtotal, discount_type, discount_value, discount_amount,
      tax_total, total, deposit_required, deposit_amount,
      public_token, signed_name, signed_at,
      clients(first_name, last_name, company_name),
      companies(name, logo_url, phone, email, city)
    `)
    .eq("public_token", token)
    .single();

  if (!quote) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: items } = await (supabase as any)
    .from("quote_items")
    .select("id, position, description, long_description, quantity, unit, unit_price, tax_rate_pct, is_optional, is_selected, line_total")
    .eq("quote_id", quote.id)
    .order("position");

  // Marquer comme "vu" si encore en statut sent (idempotent)
  if (quote.status === "sent") {
    await markViewed(token);
  }

  return <PublicQuoteView quote={quote} items={items ?? []} token={token} />;
}
