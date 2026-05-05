-- ============================================================
-- Migration 006 — RLS fixes & validate_invite_code RPC
-- ============================================================

-- Fix 1: owners need to INSERT a company during onboarding
CREATE POLICY "company_insert" ON companies FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Fix 2: users must always be able to read their own profile,
--        even before they have a company (onboarding / auth callback)
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (id = auth.uid() OR company_id = auth_company_id());

-- Fix 3: validate an invite code without requiring a session.
--        The function runs as SECURITY DEFINER (admin) so it bypasses RLS.
--        The client calls: supabase.rpc('validate_invite_code', { p_code: '...' })
CREATE OR REPLACE FUNCTION validate_invite_code(p_code text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id      uuid;
  v_name    text;
  v_plan    text;
  v_members int;
  v_seats   int;
  v_clean   text;
BEGIN
  v_clean := lower(regexp_replace(p_code, '\s', '', 'g'));

  SELECT id, name, plan
  INTO   v_id, v_name, v_plan
  FROM   companies
  WHERE  invite_code = v_clean;

  IF NOT FOUND THEN
    RETURN json_build_object('valid', false);
  END IF;

  SELECT count(*)::int INTO v_members
  FROM   profiles
  WHERE  company_id = v_id AND is_active = true;

  v_seats := company_seat_limit(v_plan);

  RETURN json_build_object(
    'valid',   true,
    'id',      v_id,
    'name',    v_name,
    'plan',    v_plan,
    'can_add', v_members < v_seats,
    'seats',   v_seats,
    'members', v_members
  );
END;
$$;
