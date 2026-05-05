-- ============================================================
-- Migration 004 — Invite codes & seat limits
-- ============================================================

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS invite_code text UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', '');

CREATE INDEX IF NOT EXISTS companies_invite_code_idx ON companies(invite_code);

UPDATE companies SET invite_code = replace(gen_random_uuid()::text, '-', '')
  WHERE invite_code IS NULL;

-- Limite de sièges par plan
CREATE OR REPLACE FUNCTION company_seat_limit(p_plan text)
RETURNS integer LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_plan
    WHEN 'free'        THEN 1
    WHEN 'starter'     THEN 5
    WHEN 'pro'         THEN 25
    WHEN 'enterprise'  THEN 9999
    ELSE 3
  END
$$;

-- Membres actifs dans une company
CREATE OR REPLACE FUNCTION company_member_count(p_company uuid)
RETURNS integer LANGUAGE sql STABLE AS $$
  SELECT COUNT(*)::int FROM profiles
  WHERE company_id = p_company AND is_active = true
$$;

-- Vérifie si la company peut encore accueillir un membre
CREATE OR REPLACE FUNCTION company_can_add_member(p_company uuid)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT company_member_count(p_company) < company_seat_limit(
    (SELECT plan FROM companies WHERE id = p_company)
  )
$$;
