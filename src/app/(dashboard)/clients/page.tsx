import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { ClientsTable } from "@/components/clients/clients-table";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; type?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user?.id ?? "")
    .single();

  const companyId = (profile as { company_id: string | null } | null)?.company_id ?? "";

  let query = supabase
    .from("clients")
    .select("*", { count: "exact" })
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (params.status) query = query.eq("status", params.status as "active" | "inactive" | "prospect" | "archived");
  if (params.type) query = query.eq("type", params.type as "residential" | "commercial");
  if (params.q) query = query.textSearch("search_vector", params.q, { type: "websearch" });

  const { data: clients, count } = await query;

  return (
    <div>
      <Topbar title="Clients" action={{ label: "Nouveau client", href: "/clients/new" }} />
      <div className="p-6">
        <ClientsTable clients={clients ?? []} total={count ?? 0} />
      </div>
    </div>
  );
}
