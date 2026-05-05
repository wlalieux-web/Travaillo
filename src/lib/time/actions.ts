"use server";

import { revalidatePath } from "next/cache";
import { startOfWeek, endOfWeek, parseISO } from "date-fns";
import { requireAuth, requireRole, type ActionResult } from "@/lib/supabase/auth-helpers";
import type { EditTimeEntryInput, ClockInInput } from "@/lib/time/schemas";
import type { TimeEntryWithRelations, WeekSummary } from "@/lib/time/types";

// ── Clock In ─────────────────────────────────────────────────
export async function clockIn(input: ClockInInput): Promise<ActionResult<{ entryId: string }>> {
  try {
    const { supabase, userId, companyId } = await requireAuth();

    // Vérifier qu'il n'y a pas déjà un pointage ouvert
    const { data: open } = await supabase
      .from("time_entries")
      .select("id, clock_in_at")
      .eq("profile_id", userId)
      .eq("company_id", companyId)
      .is("clock_out_at", null)
      .maybeSingle();

    if (open) {
      return { ok: false, error: `Pointage déjà ouvert depuis ${new Date(open.clock_in_at).toLocaleTimeString("fr-CA")}. Pointez la sortie d'abord.` };
    }

    // Récupérer le taux horaire du profil
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    const { data: entry, error } = await supabase
      .from("time_entries")
      .insert({
        company_id: companyId,
        profile_id: userId,
        visit_id: input.visit_id ?? null,
        job_id: input.job_id ?? null,
        clock_in_at: new Date().toISOString(),
        clock_in_lat: input.lat ?? null,
        clock_in_lng: input.lng ?? null,
        clock_in_accuracy_m: input.accuracy_m ?? null,
        source: "web",
        billable: true,
      })
      .select()
      .single();

    if (error) return { ok: false, error: error.message };

    revalidatePath("/timesheet");
    return { ok: true, data: { entryId: entry.id } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

// ── Clock Out ────────────────────────────────────────────────
export async function clockOut(geo?: { lat: number; lng: number; accuracy_m: number }): Promise<ActionResult<{ minutes: number }>> {
  try {
    const { supabase, userId, companyId } = await requireAuth();

    const { data: open } = await supabase
      .from("time_entries")
      .select("id, clock_in_at, break_minutes")
      .eq("profile_id", userId)
      .eq("company_id", companyId)
      .is("clock_out_at", null)
      .maybeSingle();

    if (!open) return { ok: false, error: "Aucun pointage ouvert trouvé" };

    // Fermer les pauses ouvertes
    await supabase
      .from("breaks")
      .update({ end_at: new Date().toISOString() })
      .eq("time_entry_id", open.id)
      .is("end_at", null);

    const now = new Date();
    const { error } = await supabase
      .from("time_entries")
      .update({
        clock_out_at: now.toISOString(),
        clock_out_lat: geo?.lat ?? null,
        clock_out_lng: geo?.lng ?? null,
        clock_out_accuracy_m: geo?.accuracy_m ?? null,
      })
      .eq("id", open.id);

    if (error) return { ok: false, error: error.message };

    const minutes = Math.round((now.getTime() - new Date(open.clock_in_at).getTime()) / 60000);
    revalidatePath("/timesheet");
    return { ok: true, data: { minutes } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

// ── Pauses ───────────────────────────────────────────────────
export async function startBreak(type: "paid" | "unpaid" = "unpaid"): Promise<ActionResult<{ breakId: string }>> {
  try {
    const { supabase, userId, companyId } = await requireAuth();

    const { data: open } = await supabase
      .from("time_entries")
      .select("id")
      .eq("profile_id", userId)
      .eq("company_id", companyId)
      .is("clock_out_at", null)
      .maybeSingle();

    if (!open) return { ok: false, error: "Aucun pointage ouvert" };

    // Vérifier qu'il n'y a pas de pause déjà ouverte
    const { data: openBreak } = await supabase
      .from("breaks")
      .select("id")
      .eq("time_entry_id", open.id)
      .is("end_at", null)
      .maybeSingle();

    if (openBreak) return { ok: false, error: "Une pause est déjà en cours" };

    const { data: brk, error } = await supabase
      .from("breaks")
      .insert({ time_entry_id: open.id, start_at: new Date().toISOString(), type })
      .select()
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: { breakId: brk.id } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

export async function endBreak(): Promise<ActionResult<{ minutes: number }>> {
  try {
    const { supabase, userId, companyId } = await requireAuth();

    const { data: open } = await supabase
      .from("time_entries")
      .select("id")
      .eq("profile_id", userId)
      .eq("company_id", companyId)
      .is("clock_out_at", null)
      .maybeSingle();

    if (!open) return { ok: false, error: "Aucun pointage ouvert" };

    const { data: openBreak } = await supabase
      .from("breaks")
      .select("id, start_at, type")
      .eq("time_entry_id", open.id)
      .is("end_at", null)
      .maybeSingle();

    if (!openBreak) return { ok: false, error: "Aucune pause en cours" };

    const now = new Date();
    const minutes = Math.round((now.getTime() - new Date(openBreak.start_at).getTime()) / 60000);

    await supabase.from("breaks").update({ end_at: now.toISOString() }).eq("id", openBreak.id);

    // Incrémenter break_minutes sur l'entrée si pause non payée
    if (openBreak.type === "unpaid") {
      const { data: entry } = await supabase.from("time_entries").select("break_minutes").eq("id", open.id).single();
      await supabase.from("time_entries").update({ break_minutes: ((entry as any)?.break_minutes ?? 0) + minutes }).eq("id", open.id);
    }

    return { ok: true, data: { minutes } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

// ── Édition (admin seulement) ─────────────────────────────────
export async function editTimeEntry(id: string, data: EditTimeEntryInput): Promise<ActionResult> {
  try {
    const ctx = await requireAuth();
    requireRole(ctx, ["owner", "admin"]);
    const { supabase, userId, companyId } = ctx;

    const { error } = await supabase
      .from("time_entries")
      .update({
        clock_in_at: data.clock_in_at,
        clock_out_at: data.clock_out_at ?? null,
        break_minutes: data.break_minutes,
        billable: data.billable,
        notes: data.notes ?? null,
        edited_by: userId,
        edited_at: new Date().toISOString(),
        edit_reason: data.edit_reason,
      })
      .eq("id", id)
      .eq("company_id", companyId);

    if (error) return { ok: false, error: error.message };
    revalidatePath("/timesheet");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

// ── Approbation ───────────────────────────────────────────────
export async function approveTimeEntry(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireAuth();
    requireRole(ctx, ["owner", "admin", "office"]);
    const { supabase, userId, companyId } = ctx;

    const { error } = await supabase
      .from("time_entries")
      .update({ approved_at: new Date().toISOString(), approved_by: userId })
      .eq("id", id)
      .eq("company_id", companyId)
      .is("approved_at", null);

    if (error) return { ok: false, error: error.message };
    revalidatePath("/timesheet/team");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

export async function bulkApproveWeek(profileId: string, weekStart: string): Promise<ActionResult<{ count: number }>> {
  try {
    const ctx = await requireAuth();
    requireRole(ctx, ["owner", "admin", "office"]);
    const { supabase, userId, companyId } = ctx;

    const start = startOfWeek(parseISO(weekStart), { weekStartsOn: 1 });
    const end = endOfWeek(start, { weekStartsOn: 1 });

    const { data, error } = await supabase
      .from("time_entries")
      .update({ approved_at: new Date().toISOString(), approved_by: userId })
      .eq("profile_id", profileId)
      .eq("company_id", companyId)
      .gte("clock_in_at", start.toISOString())
      .lte("clock_in_at", end.toISOString())
      .is("approved_at", null)
      .select();

    if (error) return { ok: false, error: error.message };
    revalidatePath("/timesheet/team");
    return { ok: true, data: { count: data?.length ?? 0 } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

// ── Lecture ───────────────────────────────────────────────────
export async function listMyTimeEntries(weekStart: string): Promise<ActionResult<WeekSummary>> {
  try {
    const { supabase, userId, companyId } = await requireAuth();

    const start = startOfWeek(parseISO(weekStart), { weekStartsOn: 1 });
    const end = endOfWeek(start, { weekStartsOn: 1 });

    const { data: entries, error } = await supabase
      .from("time_entries")
      .select("*, visits(scheduled_start, jobs(title, number)), breaks(*)")
      .eq("profile_id", userId)
      .eq("company_id", companyId)
      .gte("clock_in_at", start.toISOString())
      .lte("clock_in_at", end.toISOString())
      .order("clock_in_at");

    if (error) return { ok: false, error: error.message };

    const typedEntries = (entries ?? []) as TimeEntryWithRelations[];
    const total_minutes = typedEntries.reduce((s, e) => s + (e.duration_minutes ?? 0), 0);
    const billable_minutes = typedEntries.filter((e) => e.billable).reduce((s, e) => s + (e.duration_minutes ?? 0), 0);
    const break_minutes = typedEntries.reduce((s, e) => s + (e.break_minutes ?? 0), 0);

    return { ok: true, data: { total_minutes, billable_minutes, break_minutes, entries: typedEntries } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

export async function listTeamTimeEntriesPending(): Promise<ActionResult<TimeEntryWithRelations[]>> {
  try {
    const ctx = await requireAuth();
    requireRole(ctx, ["owner", "admin", "office"]);
    const { supabase, companyId } = ctx;

    const { data, error } = await supabase
      .from("time_entries")
      .select("*, profiles(first_name, last_name, avatar_url, color), visits(scheduled_start, jobs(title, number))")
      .eq("company_id", companyId)
      .is("approved_at", null)
      .not("clock_out_at", "is", null)
      .order("clock_in_at", { ascending: false });

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: (data ?? []) as TimeEntryWithRelations[] };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

export async function listTeamWeekEntries(weekStart: string): Promise<ActionResult<TimeEntryWithRelations[]>> {
  try {
    const ctx = await requireAuth();
    requireRole(ctx, ["owner", "admin", "office"]);
    const { supabase, companyId } = ctx;

    const start = startOfWeek(parseISO(weekStart), { weekStartsOn: 1 });
    const end = endOfWeek(start, { weekStartsOn: 1 });

    const { data, error } = await supabase
      .from("time_entries")
      .select("*, profiles(id, first_name, last_name, avatar_url, color), breaks(*)")
      .eq("company_id", companyId)
      .gte("clock_in_at", start.toISOString())
      .lte("clock_in_at", end.toISOString())
      .order("clock_in_at");

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: (data ?? []) as TimeEntryWithRelations[] };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

export async function getTeamOpenEntries(): Promise<ActionResult<TimeEntryWithRelations[]>> {
  try {
    const ctx = await requireAuth();
    requireRole(ctx, ["owner", "admin", "office"]);
    const { supabase, companyId } = ctx;

    const { data, error } = await supabase
      .from("time_entries")
      .select("*, profiles(id, first_name, last_name, avatar_url, color)")
      .eq("company_id", companyId)
      .is("clock_out_at", null);

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: (data ?? []) as TimeEntryWithRelations[] };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

/** Entrée ouverte du user courant (pour le widget) */
export async function getMyOpenEntry(): Promise<ActionResult<{ id: string; clock_in_at: string; visit_id: string | null } | null>> {
  try {
    const { supabase, userId, companyId } = await requireAuth();

    const { data } = await supabase
      .from("time_entries")
      .select("id, clock_in_at, visit_id")
      .eq("profile_id", userId)
      .eq("company_id", companyId)
      .is("clock_out_at", null)
      .maybeSingle();

    return { ok: true, data: data ?? null };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}
