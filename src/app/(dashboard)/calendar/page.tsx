import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { CalendarView } from "@/components/calendar/calendar-view";

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("company_id")
    .eq("id", user?.id ?? "")
    .single() as { data: { company_id: string } | null };

  const companyId = profile?.company_id ?? "";

  // Visites des 60 prochains jours
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date();
  to.setDate(to.getDate() + 60);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: visits } = await (supabase as any)
    .from("visits")
    .select(`
      *,
      visit_assignments(
        profile_id,
        is_primary,
        profiles(first_name, last_name, color, avatar_url)
      ),
      jobs(
        id,
        title,
        number,
        clients(first_name, last_name, company_name),
        properties(address, city)
      )
    `)
    .eq("company_id", companyId)
    .gte("scheduled_start", from.toISOString())
    .lte("scheduled_start", to.toISOString())
    .not("status", "in", '("archived")')
    .order("scheduled_start");

  return (
    <div>
      <Topbar title="Calendrier" action={{ label: "Nouveau job", href: "/jobs/new" }} />
      <div className="p-6">
        <CalendarView visits={visits ?? []} />
      </div>
    </div>
  );
}
