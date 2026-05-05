import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { QuotesTable } from "@/components/quotes/quotes-table";

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const { data: { user } } = await supabase.auth.getUser();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("company_id")
    .eq("id", user?.id ?? "")
    .single() as { data: { company_id: string } | null };

  const companyId = profile?.company_id ?? "";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("quotes")
    .select("*, clients(first_name, last_name, company_name)", { count: "exact" })
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (params.status) query = query.eq("status", params.status);
  if (params.q) {
    query = query.or(
      `number.ilike.%${params.q}%`
    );
  }

  const { data: quotes, count } = await query;

  return (
    <div>
      <Topbar title="Devis" action={{ label: "Nouveau devis", href: "/quotes/new" }} />
      <div className="p-6">
        <QuotesTable quotes={quotes ?? []} total={count ?? 0} />
      </div>
    </div>
  );
}
