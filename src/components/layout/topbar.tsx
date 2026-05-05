import { Bell, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ClockWidget } from "@/components/time/clock-widget";

interface TopbarProps {
  title: string;
  action?: { label: string; href: string };
}

export async function Topbar({ title, action }: TopbarProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let openEntry = null;
  let todayVisits: Array<{ id: string; scheduled_start: string; jobs: { title: string } | null }> = [];

  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: open } = await (supabase as any)
      .from("time_entries")
      .select("id, clock_in_at, visit_id")
      .eq("profile_id", user.id)
      .is("clock_out_at", null)
      .maybeSingle();

    openEntry = open ?? null;

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: visits } = await (supabase as any)
      .from("visits")
      .select("id, scheduled_start, jobs(title)")
      .eq("company_id", (await (supabase as any).from("profiles").select("company_id").eq("id", user.id).single()).data?.company_id ?? "")
      .gte("scheduled_start", todayStart.toISOString())
      .lte("scheduled_start", todayEnd.toISOString())
      .not("status", "in", '("cancelled","completed","no_show")')
      .order("scheduled_start");

    todayVisits = visits ?? [];
  }

  return (
    <header className="h-16 border-b border-emerald-900/20 bg-[#020c05]/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-30">
      <h1 className="text-white font-semibold text-lg">{title}</h1>
      <div className="flex items-center gap-3">
        {/* Widget pointage */}
        <ClockWidget initialOpen={openEntry} todayVisits={todayVisits} />

        <button className="relative w-8 h-8 rounded-lg bg-white/[0.03] border border-emerald-900/20 flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500" />
        </button>
        {action && (
          <a href={action.href} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors shadow-[0_0_15px_rgba(16,185,129,0.25)]">
            <Plus className="h-4 w-4" /> {action.label}
          </a>
        )}
      </div>
    </header>
  );
}
