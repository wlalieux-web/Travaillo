import { notFound } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { QuoteEditor } from "@/components/quotes/quote-editor";
import { QuoteDetailSidebar } from "@/components/quotes/quote-detail-sidebar";

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("company_id")
    .eq("id", user?.id ?? "")
    .single() as { data: { company_id: string } | null };

  const companyId = profile?.company_id ?? "";

  const [{ data: quote }, { data: items }, { data: clients }, { data: properties }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("quotes").select("*").eq("id", id).eq("company_id", companyId).single(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("quote_items").select("*").eq("quote_id", id).order("position"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("clients")
      .select("id, first_name, last_name, company_name")
      .eq("company_id", companyId)
      .eq("status", "active")
      .order("first_name"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("properties")
      .select("id, client_id, address, city, name")
      .eq("company_id", companyId),
  ]);

  if (!quote) notFound();

  return (
    <div>
      <Topbar title={`Devis ${quote.number}`} />
      <div className="p-6 grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3">
          <QuoteEditor
            quote={quote}
            initialItems={items ?? []}
            clients={clients ?? []}
            properties={properties ?? []}
          />
        </div>
        <div>
          <QuoteDetailSidebar quote={quote} />
        </div>
      </div>
    </div>
  );
}
