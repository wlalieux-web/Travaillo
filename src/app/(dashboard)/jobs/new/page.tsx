import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { JobForm } from "@/components/jobs/job-form";

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const { data: { user } } = await supabase.auth.getUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles").select("company_id").eq("id", user?.id ?? "").single() as { data: { company_id: string } | null };
  const companyId = profile?.company_id ?? "";

  const [{ data: clients }, { data: properties }, { data: technicians }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("clients").select("id, first_name, last_name, company_name").eq("company_id", companyId).in("status", ["active"]).order("first_name"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("properties").select("id, client_id, address, city, name").eq("company_id", companyId),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("profiles").select("id, first_name, last_name, color, avatar_url").eq("company_id", companyId).eq("is_active", true),
  ]);

  return (
    <div>
      <Topbar title="Nouveau job" />
      <div className="p-6">
        <JobForm
          clients={clients ?? []}
          properties={properties ?? []}
          technicians={technicians ?? []}
          defaultClientId={params.client_id}
        />
      </div>
    </div>
  );
}
