import { notFound } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { JobDetail } from "@/components/jobs/job-detail";

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles").select("company_id").eq("id", user?.id ?? "").single() as { data: { company_id: string } | null };
  const companyId = profile?.company_id ?? "";

  const [{ data: job }, { data: visits }, { data: timeEntries }, { data: technicians }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("jobs").select("*, clients(first_name, last_name, company_name), properties(address, city, name)").eq("id", id).eq("company_id", companyId).single(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("visits").select("*, visit_assignments(profile_id, is_primary, profiles(first_name, last_name, color, avatar_url))").eq("job_id", id).order("scheduled_start"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("time_entries").select("*, profiles(first_name, last_name, color)").eq("job_id", id).order("clock_in_at", { ascending: false }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("profiles").select("id, first_name, last_name, color, avatar_url").eq("company_id", companyId).eq("is_active", true),
  ]);

  if (!job) notFound();

  return (
    <div>
      <Topbar title={`Job ${job.number}`} />
      <div className="p-6">
        <JobDetail
          job={job}
          visits={visits ?? []}
          timeEntries={timeEntries ?? []}
          technicians={technicians ?? []}
        />
      </div>
    </div>
  );
}
