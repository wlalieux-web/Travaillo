import { createClient } from "@/lib/supabase/server";
import { startOfWeek, endOfWeek } from "date-fns";
import { Topbar } from "@/components/layout/topbar";
import { EmployeeView } from "@/components/timesheet/employee-view";
import { AdminView } from "@/components/timesheet/admin-view";

export default async function TimesheetPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("id, first_name, last_name, color, role, company_id")
    .eq("id", user!.id)
    .single() as {
      data: {
        id: string; first_name: string | null; last_name: string | null;
        color: string; role: string; company_id: string;
      } | null
    };

  const isAdmin = ["owner", "admin", "office"].includes(profile?.role ?? "");
  const companyId = profile?.company_id ?? "";

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd   = endOfWeek(weekStart, { weekStartsOn: 1 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: openEntry } = await db
    .from("time_entries")
    .select("id, clock_in_at, visit_id")
    .eq("profile_id", user!.id)
    .eq("company_id", companyId)
    .is("clock_out_at", null)
    .maybeSingle() as { data: { id: string; clock_in_at: string; visit_id: string | null } | null };

  const { data: myEntries } = await db
    .from("time_entries")
    .select("*, breaks(*)")
    .eq("profile_id", user!.id)
    .eq("company_id", companyId)
    .gte("clock_in_at", weekStart.toISOString())
    .lte("clock_in_at", weekEnd.toISOString())
    .order("clock_in_at") as { data: any[] | null };

  let teamMembers:     any[] = [];
  let teamWeekEntries: any[] = [];
  let teamOpenEntries: any[] = [];
  let pendingEntries:  any[] = [];

  if (isAdmin) {
    [teamMembers, teamWeekEntries, teamOpenEntries, pendingEntries] = await Promise.all([
      db.from("profiles")
        .select("id, first_name, last_name, color, avatar_url, role")
        .eq("company_id", companyId).eq("is_active", true).order("first_name")
        .then((r: any) => r.data ?? []),
      db.from("time_entries")
        .select("*, profiles(id,first_name,last_name,avatar_url,color), breaks(*)")
        .eq("company_id", companyId)
        .gte("clock_in_at", weekStart.toISOString())
        .lte("clock_in_at", weekEnd.toISOString())
        .order("clock_in_at")
        .then((r: any) => r.data ?? []),
      db.from("time_entries")
        .select("*, profiles(id,first_name,last_name,avatar_url,color)")
        .eq("company_id", companyId).is("clock_out_at", null)
        .then((r: any) => r.data ?? []),
      db.from("time_entries")
        .select("*, profiles(id,first_name,last_name,avatar_url,color)")
        .eq("company_id", companyId)
        .is("approved_at", null).not("clock_out_at", "is", null)
        .order("clock_in_at", { ascending: false }).limit(50)
        .then((r: any) => r.data ?? []),
    ]);
  }

  return (
    <div>
      <Topbar title="Pointage" />
      <div className="p-6">
        {isAdmin ? (
          <AdminView
            profile={profile!}
            openEntry={openEntry ?? null}
            myEntries={myEntries ?? []}
            teamMembers={teamMembers}
            teamWeekEntries={teamWeekEntries}
            teamOpenEntries={teamOpenEntries}
            pendingEntries={pendingEntries}
            weekStartISO={weekStart.toISOString()}
          />
        ) : (
          <EmployeeView
            profile={profile!}
            openEntry={openEntry ?? null}
            entries={myEntries ?? []}
            weekStartISO={weekStart.toISOString()}
          />
        )}
      </div>
    </div>
  );
}
