-- ============================================================
-- Migration 007 — Bulletproof handle_new_user trigger
--
-- Keep the trigger minimal so it never blocks signup.
-- Company linking is handled by the app (register.tsx / auth callback).
-- SET search_path = public prevents table resolution failures.
-- ON CONFLICT DO NOTHING handles duplicate signup attempts.
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
