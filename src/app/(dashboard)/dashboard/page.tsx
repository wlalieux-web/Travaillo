import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { DashboardStats } from "@/components/dashboard/stats";
import { RecentClients } from "@/components/dashboard/recent-clients";
import { QuickActions } from "@/components/dashboard/quick-actions";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("*, companies(*)")
    .eq("id", user?.id ?? "")
    .single() as { data: { first_name: string | null; company_id: string | null; companies: { name: string } | null } | null };

  const companyId = profile?.company_id ?? "";

  const [{ count: clientCount }, { count: activeCount }] = await Promise.all([
    supabase.from("clients").select("*", { count: "exact", head: true }).eq("company_id", companyId),
    supabase.from("clients").select("*", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "active"),
  ]);

  const { data: recentClients } = await supabase
    .from("clients")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div>
      <Topbar title="Tableau de bord" />
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Bonjour, {profile?.first_name ?? "là"} 👋
          </h2>
          <p className="text-white/40 text-sm mt-1">
            Voici ce qui se passe aujourd'hui dans{" "}
            <span className="text-violet-400">{profile?.companies?.name ?? "votre entreprise"}</span>
          </p>
        </div>

        <DashboardStats clientCount={clientCount ?? 0} activeCount={activeCount ?? 0} />
        <QuickActions />
        <RecentClients clients={recentClients ?? []} />
      </div>
    </div>
  );
}
