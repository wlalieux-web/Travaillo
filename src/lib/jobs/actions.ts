"use server";

import { revalidatePath } from "next/cache";
import { RRule } from "rrule";
import { requireAuth, type ActionResult } from "@/lib/supabase/auth-helpers";
import type { CreateJobInput, UpdateJobInput } from "@/lib/jobs/schemas";

const MAX_VISITS = 200;

// ── Helper : upsert assignations ─────────────────────────────
async function upsertAssignments(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  visitId: string,
  assigneeIds: string[],
  primaryId?: string | null,
) {
  if (assigneeIds.length === 0) return;
  await db.from("visit_assignments").delete().eq("visit_id", visitId);
  await db.from("visit_assignments").insert(
    assigneeIds.map((pid) => ({
      visit_id: visitId,
      profile_id: pid,
      is_primary: pid === (primaryId ?? assigneeIds[0]),
    }))
  );
}

// ── Helper : générer les dates de récurrence ─────────────────
function expandRecurrence(
  rruleStr: string,
  startDate: Date,
  endDate: Date | null,
  durationMs: number,
): Array<{ start: Date; end: Date }> {
  const rule = RRule.fromString(
    `DTSTART:${startDate.toISOString().replace(/[-:]/g, "").split(".")[0]}Z\n${rruleStr}`
  );

  const until = endDate ?? new Date(startDate.getTime() + 6 * 30 * 24 * 60 * 60 * 1000);
  const dates = rule.between(startDate, until, true);

  return dates.slice(0, MAX_VISITS).map((d) => ({
    start: d,
    end: new Date(d.getTime() + durationMs),
  }));
}

// ─────────────────────────────────────────────────────────────

export async function createJob(data: CreateJobInput): Promise<ActionResult<{ jobId: string }>> {
  try {
    const { supabase, companyId, userId } = await requireAuth();

    const { data: numRow } = await supabase.rpc("generate_job_number", { p_company: companyId });

    const { data: job, error } = await supabase
      .from("jobs")
      .insert({
        company_id: companyId,
        created_by: userId,
        client_id: data.client_id,
        property_id: data.property_id ?? null,
        quote_id: data.quote_id ?? null,
        number: numRow as string,
        title: data.title,
        description: data.description ?? null,
        type: data.type,
        status: "draft",
        recurrence_rule: data.recurrence_rule ?? null,
        recurrence_start: data.recurrence_start ?? null,
        recurrence_end: data.recurrence_end ?? null,
        estimated_duration_minutes: data.estimated_duration_minutes ?? null,
        estimated_cost: data.estimated_cost ?? null,
        total: data.total ?? 0,
        currency: data.currency ?? "CAD",
        internal_notes: data.internal_notes ?? null,
        client_instructions: data.client_instructions ?? null,
      })
      .select()
      .single();

    if (error) return { ok: false, error: error.message };

    // Créer les visites
    if (data.type === "one_off" && data.first_visit) {
      const v = data.first_visit;
      const { data: visit } = await supabase
        .from("visits")
        .insert({
          company_id: companyId,
          job_id: job.id,
          scheduled_start: v.scheduled_start,
          scheduled_end: v.scheduled_end,
          status: "scheduled",
          sequence_number: 1,
        })
        .select()
        .single();

      if (visit && v.assignee_ids.length > 0) {
        await upsertAssignments(supabase, visit.id, v.assignee_ids, v.primary_assignee_id);
      }
    } else if (data.type === "recurring" && data.recurrence_rule && data.first_visit) {
      const v = data.first_visit;
      const startDt = new Date(v.scheduled_start);
      const endDt = new Date(v.scheduled_end);
      const durationMs = endDt.getTime() - startDt.getTime();
      const recEnd = data.recurrence_end ? new Date(data.recurrence_end) : null;

      const slots = expandRecurrence(data.recurrence_rule, startDt, recEnd, durationMs);

      for (let i = 0; i < slots.length; i++) {
        const { data: visit } = await supabase
          .from("visits")
          .insert({
            company_id: companyId,
            job_id: job.id,
            scheduled_start: slots[i].start.toISOString(),
            scheduled_end: slots[i].end.toISOString(),
            status: "scheduled",
            sequence_number: i + 1,
          })
          .select()
          .single();

        if (visit && v.assignee_ids.length > 0) {
          await upsertAssignments(supabase, visit.id, v.assignee_ids, v.primary_assignee_id);
        }
      }
    }

    // Passer en "scheduled" si on a des visites
    await supabase.from("jobs").update({ status: "scheduled" }).eq("id", job.id);

    revalidatePath("/jobs");
    revalidatePath("/calendar");
    return { ok: true, data: { jobId: job.id } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

export async function updateJob(id: string, data: UpdateJobInput): Promise<ActionResult> {
  try {
    const { supabase, companyId } = await requireAuth();

    const { error } = await supabase
      .from("jobs")
      .update({
        client_id: data.client_id,
        property_id: data.property_id ?? null,
        title: data.title,
        description: data.description ?? null,
        estimated_duration_minutes: data.estimated_duration_minutes ?? null,
        estimated_cost: data.estimated_cost ?? null,
        total: data.total ?? 0,
        internal_notes: data.internal_notes ?? null,
        client_instructions: data.client_instructions ?? null,
      })
      .eq("id", id)
      .eq("company_id", companyId);

    if (error) return { ok: false, error: error.message };

    revalidatePath(`/jobs/${id}`);
    revalidatePath("/jobs");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

export async function updateJobRecurrence(
  id: string,
  newRrule: string,
  mode: "this_and_future" | "all",
  fromVisitStart?: string,
): Promise<ActionResult<{ created: number }>> {
  try {
    const { supabase, companyId } = await requireAuth();

    // Vérifier ownership
    const { data: job } = await supabase.from("jobs").select("*").eq("id", id).eq("company_id", companyId).single();
    if (!job) return { ok: false, error: "Job introuvable" };

    // Récupérer les assignations du premier futur slot pour les réappliquer
    const cutoff = mode === "this_and_future" && fromVisitStart ? fromVisitStart : new Date().toISOString();

    const { data: futureVisits } = await supabase
      .from("visits")
      .select("id, visit_assignments(profile_id, is_primary)")
      .eq("job_id", id)
      .gte("scheduled_start", cutoff)
      .in("status", ["scheduled", "rescheduled"])
      .order("scheduled_start");

    // Récupérer les assignées de la première visite future
    const firstAssignments = (futureVisits?.[0] as any)?.visit_assignments ?? [];
    const assigneeIds = firstAssignments.map((a: any) => a.profile_id);
    const primaryId = firstAssignments.find((a: any) => a.is_primary)?.profile_id ?? null;

    // Supprimer les visites futures non commencées
    if (futureVisits?.length) {
      await supabase
        .from("visits")
        .delete()
        .in("id", futureVisits.map((v: any) => v.id));
    }

    // Regénérer depuis cutoff
    const startDt = new Date(cutoff);
    const durationMs = (job.estimated_duration_minutes ?? 60) * 60 * 1000;
    const recEnd = job.recurrence_end ? new Date(job.recurrence_end) : null;
    const slots = expandRecurrence(newRrule, startDt, recEnd, durationMs);

    // Mettre à jour la règle sur le job
    await supabase.from("jobs").update({ recurrence_rule: newRrule }).eq("id", id);

    let created = 0;
    for (let i = 0; i < slots.length; i++) {
      const { data: visit } = await supabase
        .from("visits")
        .insert({
          company_id: companyId,
          job_id: id,
          scheduled_start: slots[i].start.toISOString(),
          scheduled_end: slots[i].end.toISOString(),
          status: "scheduled",
          sequence_number: i + 1,
        })
        .select()
        .single();

      if (visit && assigneeIds.length > 0) {
        await upsertAssignments(supabase, visit.id, assigneeIds, primaryId);
      }
      created++;
    }

    revalidatePath(`/jobs/${id}`);
    revalidatePath("/calendar");
    return { ok: true, data: { created } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

export async function cancelJob(id: string): Promise<ActionResult> {
  try {
    const { supabase, companyId } = await requireAuth();

    const { error } = await supabase
      .from("jobs")
      .update({ status: "cancelled" })
      .eq("id", id)
      .eq("company_id", companyId);

    if (error) return { ok: false, error: error.message };

    // Annuler les visites futures
    await supabase
      .from("visits")
      .update({ status: "cancelled" })
      .eq("job_id", id)
      .in("status", ["scheduled", "rescheduled"]);

    revalidatePath(`/jobs/${id}`);
    revalidatePath("/jobs");
    revalidatePath("/calendar");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

export async function deleteJob(id: string): Promise<ActionResult> {
  try {
    const { supabase, companyId } = await requireAuth();

    const { error } = await supabase.from("jobs").delete().eq("id", id).eq("company_id", companyId);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/jobs");
    revalidatePath("/calendar");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

export async function convertQuoteToJob(quoteId: string): Promise<ActionResult<{ jobId: string }>> {
  try {
    const { supabase, companyId, userId } = await requireAuth();

    const { data: quote } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", quoteId)
      .eq("company_id", companyId)
      .single();

    if (!quote) return { ok: false, error: "Devis introuvable" };
    if (quote.status !== "approved") return { ok: false, error: "Seuls les devis approuvés peuvent être convertis en job" };

    const { data: numRow } = await supabase.rpc("generate_job_number", { p_company: companyId });

    const { data: job, error } = await supabase
      .from("jobs")
      .insert({
        company_id: companyId,
        created_by: userId,
        client_id: quote.client_id,
        property_id: quote.property_id,
        quote_id: quoteId,
        number: numRow as string,
        title: quote.title ?? `Job depuis ${quote.number}`,
        type: "one_off",
        status: "draft",
        total: quote.total,
        currency: quote.currency,
        client_instructions: quote.intro_message,
      })
      .select()
      .single();

    if (error) return { ok: false, error: error.message };

    // Marquer le devis comme converti
    await supabase.from("quotes").update({ status: "converted" }).eq("id", quoteId);

    revalidatePath("/jobs");
    revalidatePath(`/quotes/${quoteId}`);
    return { ok: true, data: { jobId: job.id } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}
