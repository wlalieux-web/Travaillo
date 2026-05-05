import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { QuoteEditor } from "@/components/quotes/quote-editor";

export default async function NewQuotePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("company_id")
    .eq("id", user?.id ?? "")
    .single() as { data: { company_id: string } | null };

  const companyId = profile?.company_id ?? "";

  const [{ data: clients }, { data: properties }] = await Promise.all([
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

  return (
    <div>
      <Topbar title="Nouveau devis" />
      <div className="p-6">
        <QuoteEditor clients={clients ?? []} properties={properties ?? []} />
      </div>
    </div>
  );
}
