import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SEAT_LIMITS: Record<string, number> = {
  free: 1, starter: 5, pro: 25, enterprise: 9999,
};

export async function POST(request: Request) {
  const { code } = await request.json().catch(() => ({ code: "" }));

  if (!code?.trim()) {
    return NextResponse.json({ valid: false, error: "Code manquant" });
  }

  // Service role bypasses RLS — safe here because this is server-side only
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const clean = code.trim().toLowerCase().replace(/\s+/g, "");

  const { data: company, error } = await supabase
    .from("companies")
    .select("id, name, plan")
    .eq("invite_code", clean)
    .single();

  if (error || !company) {
    return NextResponse.json({ valid: false, error: "Code invalide" });
  }

  const { count: members } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("company_id", company.id)
    .eq("is_active", true);

  const seats = SEAT_LIMITS[company.plan] ?? 3;
  const memberCount = members ?? 0;

  return NextResponse.json({
    valid: true,
    id: company.id,
    name: company.name,
    plan: company.plan,
    can_add: memberCount < seats,
    seats,
    members: memberCount,
  });
}
