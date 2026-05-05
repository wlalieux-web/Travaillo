import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single() as { data: { company_id: string | null } | null };

      const metaCompanyId = user.user_metadata?.company_id as string | undefined;

      // Employee: metadata has company_id but profile not linked yet
      if (metaCompanyId && !profile?.company_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("profiles").update({
          company_id: metaCompanyId,
          role: user.user_metadata?.role ?? "technician",
          first_name: user.user_metadata?.first_name,
          last_name: user.user_metadata?.last_name,
          onboarding_completed: true,
        }).eq("id", user.id);

        return NextResponse.redirect(`${origin}/dashboard`);
      }

      // Already linked (owner who completed onboarding, or employee on re-confirm)
      if (profile?.company_id) {
        return NextResponse.redirect(`${origin}/dashboard`);
      }
    }
  }

  // New owner — needs to set up their company
  return NextResponse.redirect(`${origin}/onboarding`);
}
