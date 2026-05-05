import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { JobsTable } from "@/components/jobs/jobs-table";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const { data: { user } } = await supabase.auth.getUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles").select("company_id").eq("id", user?.id ?? "").single() as { data: { company_id: string } | null };
  const companyId = profile?.company_id ?? "";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("jobs")
    .select(`
      *,
      clients(first_name, last_name, company_name),
      properties(address, city)
    `, { count: "exact" })
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (params.status) query = query.eq("status", params.status);
  if (params.q) query = query.or(`title.ilike.%${params.q}%,number.ilike.%${params.q}%`);

  const { data: jobs, count } = await query;

  // Récupérer la prochaine visite pour chaque job
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jobsWithNextVisit = await Promise.all((jobs ?? []).map(async (job: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: nextVisit } = await (supabase as any)
      .from("visits")
      .select("scheduled_start, scheduled_end, status")
      .eq("job_id", job.id)
      .gte("scheduled_start", new Date().toISOString())
      .not("status", "in", '("cancelled","completed","no_show")')
      .order("scheduled_start")
      .limit(1)
      .maybeSingle();
    return { ...job, next_visit: nextVisit ?? null };
  }));

  return (
    <div>
      <Topbar title="Jobs" action={{ label: "Nouveau job", href: "/jobs/new" }} />
      <div className="p-6">
        <JobsTable jobs={jobsWithNextVisit} total={count ?? 0} />
      </div>
    </div>
  );
}
