import { createClient } from "@/lib/supabase/server";

export interface AuthContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
  userId: string;
  companyId: string;
  role: string;
}

/** Récupère user + company + role. Throw si non authentifié. */
export async function requireAuth(): Promise<AuthContext> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) throw new Error("Non authentifié");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single() as { data: { company_id: string; role: string } | null };

  if (!profile?.company_id) throw new Error("Aucune entreprise associée");

  return {
    supabase,
    userId: user.id,
    companyId: profile.company_id,
    role: profile.role,
  };
}

/** Exige un rôle dans la liste donnée */
export function requireRole(ctx: AuthContext, roles: string[]) {
  if (!roles.includes(ctx.role)) {
    throw new Error("Permissions insuffisantes");
  }
}

/** Résultat typé pour les server actions */
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };
