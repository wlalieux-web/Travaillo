"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, type ActionResult } from "@/lib/supabase/auth-helpers";
import type { CreateVisitInput, MoveVisitInput } from "@/lib/jobs/schemas";

async function upsertAssignments(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  visitId: string,
  assigneeIds: string[],
  primaryId?: string | null,
) {
  await db.from("visit_assignments").delete().eq("visit_id", visitId);
  if (assigneeIds.length === 0) return;
  await db.from("visit_assignments").insert(
    assigneeIds.map((pid) => ({
      visit_id: visitId,
      profile_id: pid,
      is_primary: pid === (primaryId ?? assigneeIds[0]),
    }))
  );
}

export async function createVisit(data: CreateVisitInput): Promise<ActionResult<{ visitId: string }>> {
  try {
    const { supabase, companyId } = await requireAuth();

    // Vérifier ownership du job
    const { data: job } = await supabase.from("jobs").select("id").eq("id", data.job_id).eq("company_id", companyId).single();
    if (!job) return { ok: false, error: "Job introuvable" };

    // Détecter conflits
    for (const pid of data.assignee_ids) {
      const { data: conflict } = await supabase.rpc("technician_has_conflict", {
        p_profile: pid,
        p_start: data.scheduled_start,
        p_end: data.scheduled_end,
        p_exclude_visit: null,
      });
      if (conflict) {
        return { ok: false, error: `Conflit de planning pour le technicien assigné` };
      }
    }

    const { data: visit, error } = await supabase
      .from("visits")
      .insert({
        company_id: companyId,
        job_id: data.job_id,
        scheduled_start: data.scheduled_start,
        scheduled_end: data.scheduled_end,
        status: "scheduled",
        sequence_number: data.sequence_number ?? null,
        override_address: data.override_address ?? null,
      })
      .select()
      .single();

    if (error) return { ok: false, error: error.message };

    if (data.assignee_ids.length > 0) {
      await upsertAssignments(supabase, visit.id, data.assignee_ids, data.primary_assignee_id);
    }

    revalidatePath("/calendar");
    revalidatePath(`/jobs/${data.job_id}`);
    return { ok: true, data: { visitId: visit.id } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

export async function moveVisit(
  id: string,
  data: MoveVisitInput,
): Promise<ActionResult> {
  try {
    const { supabase, companyId } = await requireAuth();

    // Vérifier ownership
    const { data: visit } = await supabase.from("visits").select("job_id").eq("id", id).eq("company_id", companyId).single();
    if (!visit) return { ok: false, error: "Visite introuvable" };

    const assigneeIds = data.assignee_ids ?? [];

    // Vérifier conflits (en excluant la visite elle-même)
    for (const pid of assigneeIds) {
      const { data: conflict } = await supabase.rpc("technician_has_conflict", {
        p_profile: pid,
        p_start: data.scheduled_start,
        p_end: data.scheduled_end,
        p_exclude_visit: id,
      });
      if (conflict) {
        return { ok: false, error: `Conflit de planning pour un technicien assigné` };
      }
    }

    const { error } = await supabase
      .from("visits")
      .update({
        scheduled_start: data.scheduled_start,
        scheduled_end: data.scheduled_end,
      })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    if (data.assignee_ids !== undefined) {
      await upsertAssignments(supabase, id, assigneeIds, data.primary_assignee_id);
    }

    revalidatePath("/calendar");
    revalidatePath(`/jobs/${visit.job_id}`);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

export async function assignVisit(
  visitId: string,
  profileIds: string[],
  primaryProfileId?: string | null,
): Promise<ActionResult> {
  try {
    const { supabase, companyId } = await requireAuth();
    const { data: visit } = await supabase.from("visits").select("job_id, scheduled_start, scheduled_end").eq("id", visitId).eq("company_id", companyId).single();
    if (!visit) return { ok: false, error: "Visite introuvable" };

    for (const pid of profileIds) {
      const { data: conflict } = await supabase.rpc("technician_has_conflict", {
        p_profile: pid, p_start: visit.scheduled_start, p_end: visit.scheduled_end, p_exclude_visit: visitId,
      });
      if (conflict) return { ok: false, error: `Conflit de planning détecté` };
    }

    await upsertAssignments(supabase, visitId, profileIds, primaryProfileId);
    revalidatePath("/calendar");
    revalidatePath(`/jobs/${visit.job_id}`);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

export async function markEnRoute(visitId: string): Promise<ActionResult> {
  try {
    const { supabase, companyId } = await requireAuth();
    const { error } = await supabase
      .from("visits")
      .update({ status: "en_route", on_the_way_at: new Date().toISOString() })
      .eq("id", visitId)
      .eq("company_id", companyId)
      .eq("status", "scheduled");

    if (error) return { ok: false, error: error.message };
    // Stub notification : en production → envoi SMS/email au client (Module 4)
    console.log(`[STUB] Notification "en route" pour visite ${visitId}`);
    revalidatePath("/calendar");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

export async function markArrived(visitId: string): Promise<ActionResult> {
  try {
    const { supabase, companyId } = await requireAuth();
    const { error } = await supabase
      .from("visits")
      .update({ status: "in_progress", arrived_at: new Date().toISOString(), actual_start: new Date().toISOString() })
      .eq("id", visitId)
      .eq("company_id", companyId);

    if (error) return { ok: false, error: error.message };
    revalidatePath("/calendar");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

export async function completeVisit(
  visitId: string,
  notes?: string,
  signatureUrl?: string,
): Promise<ActionResult> {
  try {
    const { supabase, companyId } = await requireAuth();

    const { data: visit } = await supabase.from("visits").select("job_id").eq("id", visitId).eq("company_id", companyId).single();
    if (!visit) return { ok: false, error: "Visite introuvable" };

    const { error } = await supabase
      .from("visits")
      .update({
        status: "completed",
        actual_end: new Date().toISOString(),
        technician_notes: notes ?? null,
        client_signature_url: signatureUrl ?? null,
      })
      .eq("id", visitId);

    if (error) return { ok: false, error: error.message };

    // Vérifier si toutes les visites du job sont complétées
    const { data: openVisits } = await supabase
      .from("visits")
      .select("id")
      .eq("job_id", visit.job_id)
      .not("status", "in", '("completed","cancelled","no_show","archived")');

    if (!openVisits?.length) {
      await supabase.from("jobs").update({ status: "completed" }).eq("id", visit.job_id);
    }

    revalidatePath("/calendar");
    revalidatePath(`/jobs/${visit.job_id}`);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

export async function rescheduleVisit(
  visitId: string,
  newStart: string,
  newEnd: string,
): Promise<ActionResult> {
  try {
    const { supabase, companyId } = await requireAuth();

    const { data: visit } = await supabase.from("visits").select("job_id, visit_assignments(profile_id)").eq("id", visitId).eq("company_id", companyId).single();
    if (!visit) return { ok: false, error: "Visite introuvable" };

    // Vérifier conflits pour les techniciens assignés
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const assigneeIds = ((visit as any).visit_assignments ?? []).map((a: any) => a.profile_id);
    for (const pid of assigneeIds) {
      const { data: conflict } = await supabase.rpc("technician_has_conflict", {
        p_profile: pid, p_start: newStart, p_end: newEnd, p_exclude_visit: visitId,
      });
      if (conflict) return { ok: false, error: "Conflit de planning détecté pour un technicien assigné" };
    }

    const { error } = await supabase
      .from("visits")
      .update({ scheduled_start: newStart, scheduled_end: newEnd, status: "rescheduled" })
      .eq("id", visitId);

    if (error) return { ok: false, error: error.message };
    revalidatePath("/calendar");
    revalidatePath(`/jobs/${visit.job_id}`);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}
