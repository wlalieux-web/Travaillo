-- ============================================================
-- Migration 005 — Update handle_new_user trigger
-- Pick up company_id and role from signup metadata so employees
-- are linked to their company even when email confirmation is on.
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id uuid;
  v_role text;
BEGIN
  BEGIN
    v_company_id := (new.raw_user_meta_data->>'company_id')::uuid;
  EXCEPTION WHEN others THEN
    v_company_id := NULL;
  END;

  v_role := COALESCE(
    NULLIF(new.raw_user_meta_data->>'role', ''),
    'technician'
  );

  INSERT INTO profiles (
    id, email, first_name, last_name,
    company_id, role, onboarding_completed
  )
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    v_company_id,
    v_role,
    v_company_id IS NOT NULL
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
