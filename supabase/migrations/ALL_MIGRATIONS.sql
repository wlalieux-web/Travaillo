-- ============================================================
-- NexaService CRM - Schéma initial
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- pour la recherche full-text

-- ============================================================
-- COMPANIES (tenant principal)
-- ============================================================
create table companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text,
  phone text,
  address text,
  city text,
  country text default 'CA',
  currency text default 'CAD',
  timezone text default 'America/Toronto',
  logo_url text,
  plan text default 'free' check (plan in ('free', 'starter', 'pro', 'enterprise')),
  stripe_customer_id text,
  trial_ends_at timestamptz default (now() + interval '14 days'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- PROFILES (étend auth.users, lié à une company)
-- ============================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  role text not null default 'technician' check (role in ('owner', 'admin', 'technician', 'office')),
  first_name text,
  last_name text,
  email text,
  phone text,
  avatar_url text,
  color text default '#6366f1', -- couleur dans le calendrier
  is_active boolean default true,
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- CLIENTS
-- ============================================================
create type client_type as enum ('residential', 'commercial');
create type client_status as enum ('active', 'inactive', 'prospect', 'archived');

create table clients (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  type client_type default 'residential',
  status client_status default 'active',
  -- Personne ou entreprise
  first_name text,
  last_name text,
  company_name text,
  email text,
  phone text,
  phone_alt text,
  -- Adresse de facturation
  billing_address text,
  billing_city text,
  billing_province text,
  billing_postal_code text,
  billing_country text default 'CA',
  -- Infos CRM
  tags text[] default '{}',
  source text, -- 'referral', 'google', 'facebook', 'door_knock', etc.
  notes text,
  -- Facturation
  balance numeric(10,2) default 0,
  -- Métadonnées
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  -- Recherche full-text
  search_vector tsvector generated always as (
    to_tsvector('french',
      coalesce(first_name, '') || ' ' ||
      coalesce(last_name, '') || ' ' ||
      coalesce(company_name, '') || ' ' ||
      coalesce(email, '') || ' ' ||
      coalesce(phone, '')
    )
  ) stored
);

create index clients_company_id_idx on clients(company_id);
create index clients_search_idx on clients using gin(search_vector);
create index clients_tags_idx on clients using gin(tags);

-- ============================================================
-- PROPERTIES (adresses de service, 1 client peut en avoir N)
-- ============================================================
create table properties (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  name text, -- ex: "Résidence principale", "Chalet"
  address text not null,
  city text,
  province text,
  postal_code text,
  country text default 'CA',
  -- Infos terrain
  property_type text, -- 'house', 'condo', 'commercial', 'other'
  size_sqft integer,
  notes text,
  is_primary boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index properties_client_id_idx on properties(client_id);
create index properties_company_id_idx on properties(company_id);

-- ============================================================
-- CLIENT NOTES (fil de conversation interne)
-- ============================================================
create table client_notes (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  author_id uuid references profiles(id),
  content text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- CLIENT ATTACHMENTS
-- ============================================================
create table client_attachments (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  uploaded_by uuid references profiles(id),
  file_name text not null,
  file_url text not null,
  file_size integer,
  mime_type text,
  created_at timestamptz default now()
);

-- ============================================================
-- TRIGGERS: updated_at automatique
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger companies_updated_at before update on companies
  for each row execute function update_updated_at();
create trigger profiles_updated_at before update on profiles
  for each row execute function update_updated_at();
create trigger clients_updated_at before update on clients
  for each row execute function update_updated_at();
create trigger properties_updated_at before update on properties
  for each row execute function update_updated_at();

-- ============================================================
-- TRIGGER: Créer profil automatiquement à l'inscription
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table companies enable row level security;
alter table profiles enable row level security;
alter table clients enable row level security;
alter table properties enable row level security;
alter table client_notes enable row level security;
alter table client_attachments enable row level security;

-- Helper: récupérer le company_id de l'utilisateur courant
create or replace function auth_company_id()
returns uuid as $$
  select company_id from profiles where id = auth.uid()
$$ language sql security definer stable;

-- Companies: seulement la sienne
create policy "company_select" on companies for select
  using (id = auth_company_id());
create policy "company_update" on companies for update
  using (id = auth_company_id());

-- Profiles: ceux de sa company
create policy "profiles_select" on profiles for select
  using (company_id = auth_company_id());
create policy "profiles_update" on profiles for update
  using (id = auth.uid());

-- Clients: ceux de sa company
create policy "clients_all" on clients for all
  using (company_id = auth_company_id());

-- Properties: ceux de sa company
create policy "properties_all" on properties for all
  using (company_id = auth_company_id());

-- Notes: ceux de sa company
create policy "notes_all" on client_notes for all
  using (company_id = auth_company_id());

-- Attachments: ceux de sa company
create policy "attachments_all" on client_attachments for all
  using (company_id = auth_company_id());
-- ============================================================
-- Module Devis (Quotes) — Migration 002
-- ============================================================

create type quote_status as enum (
  'draft','sent','viewed','approved','rejected','expired','converted','archived'
);

create table quotes (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  client_id uuid not null references clients(id) on delete restrict,
  property_id uuid references properties(id) on delete set null,
  created_by uuid references profiles(id),
  -- Numérotation
  number text not null,                     -- ex "Q-2026-0042"
  -- État
  status quote_status not null default 'draft',
  -- Dates
  issued_at date,
  valid_until date,
  viewed_at timestamptz,
  responded_at timestamptz,
  signed_at timestamptz,
  signed_name text,
  signed_ip text,
  -- Contenu
  title text,
  intro_message text,
  internal_notes text,
  terms text,
  -- Devise et taxes
  currency text not null default 'CAD',
  tax_mode text not null default 'qc'
    check (tax_mode in ('qc','eu','us','none','custom')),
  -- Totaux (dénormalisés pour perf, recalculés à chaque save)
  subtotal numeric(12,2) not null default 0,
  discount_type text check (discount_type in ('percent','fixed')),
  discount_value numeric(12,2) default 0,
  discount_amount numeric(12,2) default 0,
  tax_total numeric(12,2) default 0,
  total numeric(12,2) not null default 0,
  -- Dépôt requis
  deposit_required boolean default false,
  deposit_type text check (deposit_type in ('percent','fixed')),
  deposit_value numeric(12,2) default 0,
  deposit_amount numeric(12,2) default 0,
  -- Métadonnées
  pdf_url text,
  public_token text unique default replace(gen_random_uuid()::text,'-',''),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (company_id, number)
);

create index quotes_company_id_idx on quotes(company_id);
create index quotes_client_id_idx on quotes(client_id);
create index quotes_status_idx on quotes(status);
create index quotes_public_token_idx on quotes(public_token);

create table quote_items (
  id uuid primary key default uuid_generate_v4(),
  quote_id uuid not null references quotes(id) on delete cascade,
  position integer not null,
  description text not null,
  long_description text,
  quantity numeric(10,2) not null default 1,
  unit text default 'unité',
  unit_price numeric(12,2) not null default 0,
  tax_rate_pct numeric(5,3) default 0,
  is_optional boolean default false,
  is_selected boolean default true,
  line_total numeric(12,2) not null default 0,
  created_at timestamptz default now()
);

create index quote_items_quote_id_idx on quote_items(quote_id);

create table quote_attachments (
  id uuid primary key default uuid_generate_v4(),
  quote_id uuid not null references quotes(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  mime_type text,
  created_at timestamptz default now()
);

create table quote_templates (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  description text,
  items jsonb not null default '[]',
  created_at timestamptz default now()
);

-- Trigger updated_at
create trigger quotes_updated_at before update on quotes
  for each row execute function update_updated_at();

-- Numérotation séquentielle par company et par année : Q-AAAA-NNNN
create or replace function generate_quote_number(p_company uuid)
returns text as $$
declare
  y text := to_char(now(),'YYYY');
  n int;
begin
  select coalesce(max(substring(number from 'Q-'||y||'-(\d+)')::int),0)+1
    into n from quotes
    where company_id = p_company and number like 'Q-'||y||'-%';
  return 'Q-'||y||'-'||lpad(n::text,4,'0');
end;
$$ language plpgsql;

-- RLS
alter table quotes enable row level security;
alter table quote_items enable row level security;
alter table quote_attachments enable row level security;
alter table quote_templates enable row level security;

create policy "quotes_all" on quotes for all
  using (company_id = auth_company_id());

-- Lecture publique via public_token (pour page client)
create policy "quotes_public_read" on quotes for select
  to anon
  using (status in ('sent','viewed','approved','rejected'));

create policy "quote_items_all" on quote_items for all
  using (exists (
    select 1 from quotes q where q.id = quote_items.quote_id
      and q.company_id = auth_company_id()
  ));

-- Lecture publique des items via token
create policy "quote_items_public_read" on quote_items for select
  to anon
  using (exists (
    select 1 from quotes q where q.id = quote_items.quote_id
      and q.status in ('sent','viewed','approved','rejected')
  ));

create policy "quote_attachments_all" on quote_attachments for all
  using (exists (
    select 1 from quotes q where q.id = quote_attachments.quote_id
      and q.company_id = auth_company_id()
  ));

create policy "quote_templates_all" on quote_templates for all
  using (company_id = auth_company_id());
-- ============================================================
-- Module Jobs & Pointage — Migration 003
-- ============================================================

-- ENUMS
create type job_type as enum ('one_off','recurring');
create type job_status as enum ('draft','scheduled','in_progress','completed','cancelled','archived');
create type visit_status as enum ('scheduled','en_route','in_progress','completed','cancelled','rescheduled','no_show');
create type clock_source as enum ('app','web','manual','kiosk');

-- ── JOBS ─────────────────────────────────────────────────────
create table jobs (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  client_id uuid not null references clients(id) on delete restrict,
  property_id uuid references properties(id) on delete set null,
  quote_id uuid references quotes(id) on delete set null,
  number text not null,
  title text not null,
  description text,
  type job_type not null default 'one_off',
  status job_status not null default 'draft',
  recurrence_rule text,
  recurrence_start date,
  recurrence_end date,
  estimated_duration_minutes integer,
  estimated_cost numeric(12,2),
  total numeric(12,2) default 0,
  currency text default 'CAD',
  internal_notes text,
  client_instructions text,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (company_id, number)
);
create index jobs_company_id_idx on jobs(company_id);
create index jobs_client_id_idx on jobs(client_id);
create index jobs_status_idx on jobs(status);

-- ── VISITES ───────────────────────────────────────────────────
create table visits (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  actual_start timestamptz,
  actual_end timestamptz,
  status visit_status not null default 'scheduled',
  sequence_number integer,
  override_address text,
  override_lat numeric(10,7),
  override_lng numeric(10,7),
  client_notified_at timestamptz,
  on_the_way_at timestamptz,
  arrived_at timestamptz,
  technician_notes text,
  client_signature_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (scheduled_end > scheduled_start)
);
create index visits_job_id_idx on visits(job_id);
create index visits_company_id_idx on visits(company_id);
create index visits_scheduled_start_idx on visits(scheduled_start);

-- ── ASSIGNATIONS ─────────────────────────────────────────────
create table visit_assignments (
  visit_id uuid not null references visits(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  is_primary boolean default false,
  assigned_at timestamptz default now(),
  primary key (visit_id, profile_id)
);
create index visit_assignments_profile_id_idx on visit_assignments(profile_id);

-- ── PHOTOS ────────────────────────────────────────────────────
create table visit_photos (
  id uuid primary key default uuid_generate_v4(),
  visit_id uuid not null references visits(id) on delete cascade,
  uploaded_by uuid references profiles(id),
  url text not null,
  type text check (type in ('before','during','after','other')),
  caption text,
  taken_at timestamptz default now()
);

-- ── FORMULAIRES TERRAIN ───────────────────────────────────────
create table visit_forms (
  id uuid primary key default uuid_generate_v4(),
  visit_id uuid not null references visits(id) on delete cascade,
  fields jsonb not null default '[]',
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- ── POINTAGES ─────────────────────────────────────────────────
create table time_entries (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  visit_id uuid references visits(id) on delete set null,
  job_id uuid references jobs(id) on delete set null,
  clock_in_at timestamptz not null,
  clock_out_at timestamptz,
  clock_in_lat numeric(10,7),
  clock_in_lng numeric(10,7),
  clock_in_accuracy_m integer,
  clock_out_lat numeric(10,7),
  clock_out_lng numeric(10,7),
  clock_out_accuracy_m integer,
  duration_minutes integer generated always as (
    case when clock_out_at is null then null
         else cast(extract(epoch from (clock_out_at - clock_in_at))/60 as integer) end
  ) stored,
  break_minutes integer default 0,
  billable boolean default true,
  hourly_rate numeric(8,2),
  approved_at timestamptz,
  approved_by uuid references profiles(id),
  edited_by uuid references profiles(id),
  edited_at timestamptz,
  edit_reason text,
  notes text,
  source clock_source default 'app',
  created_at timestamptz default now()
);
create index time_entries_profile_id_idx on time_entries(profile_id);
create index time_entries_company_id_idx on time_entries(company_id);
create index time_entries_visit_id_idx on time_entries(visit_id);
create index time_entries_clock_in_idx on time_entries(clock_in_at);

-- ── PAUSES ────────────────────────────────────────────────────
create table breaks (
  id uuid primary key default uuid_generate_v4(),
  time_entry_id uuid not null references time_entries(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz,
  duration_minutes integer generated always as (
    case when end_at is null then null
         else cast(extract(epoch from (end_at - start_at))/60 as integer) end
  ) stored,
  type text default 'unpaid' check (type in ('paid','unpaid'))
);
create index breaks_time_entry_id_idx on breaks(time_entry_id);

-- ── NUMÉROTATION JOBS ─────────────────────────────────────────
create or replace function generate_job_number(p_company uuid)
returns text as $$
declare
  y text := to_char(now(),'YYYY');
  n int;
begin
  select coalesce(max(substring(number from 'J-'||y||'-(\d+)')::int),0)+1
    into n from jobs
    where company_id = p_company and number like 'J-'||y||'-%';
  return 'J-'||y||'-'||lpad(n::text,4,'0');
end;
$$ language plpgsql;

-- ── TRIGGERS updated_at ───────────────────────────────────────
create trigger jobs_updated_at before update on jobs
  for each row execute function update_updated_at();
create trigger visits_updated_at before update on visits
  for each row execute function update_updated_at();

-- ── DÉTECTION CONFLITS ────────────────────────────────────────
create or replace function technician_has_conflict(
  p_profile uuid,
  p_start timestamptz,
  p_end timestamptz,
  p_exclude_visit uuid default null
) returns boolean as $$
  select exists(
    select 1 from visit_assignments va
    join visits v on v.id = va.visit_id
    where va.profile_id = p_profile
      and v.status not in ('cancelled','completed','no_show')
      and (p_exclude_visit is null or v.id <> p_exclude_visit)
      and tstzrange(v.scheduled_start, v.scheduled_end, '[)')
       && tstzrange(p_start, p_end, '[)')
  )
$$ language sql stable;

-- ── RLS ──────────────────────────────────────────────────────
alter table jobs enable row level security;
alter table visits enable row level security;
alter table visit_assignments enable row level security;
alter table visit_photos enable row level security;
alter table visit_forms enable row level security;
alter table time_entries enable row level security;
alter table breaks enable row level security;

create policy "jobs_all" on jobs for all
  using (company_id = auth_company_id());

create policy "visits_all" on visits for all
  using (company_id = auth_company_id());

create policy "visit_assignments_all" on visit_assignments for all
  using (exists (
    select 1 from visits v where v.id = visit_assignments.visit_id
      and v.company_id = auth_company_id()
  ));

create policy "visit_photos_all" on visit_photos for all
  using (exists (
    select 1 from visits v where v.id = visit_photos.visit_id
      and v.company_id = auth_company_id()
  ));

create policy "visit_forms_all" on visit_forms for all
  using (exists (
    select 1 from visits v where v.id = visit_forms.visit_id
      and v.company_id = auth_company_id()
  ));

-- Technicien voit ses propres time_entries, manager voit tout
create policy "time_entries_self" on time_entries for all
  using (
    company_id = auth_company_id()
    and (
      profile_id = auth.uid()
      or (select role from profiles where id = auth.uid()) in ('owner','admin','office')
    )
  );

create policy "breaks_via_time_entry" on breaks for all
  using (exists (
    select 1 from time_entries te where te.id = breaks.time_entry_id
      and te.company_id = auth_company_id()
      and (
        te.profile_id = auth.uid()
        or (select role from profiles where id = auth.uid()) in ('owner','admin','office')
      )
  ));
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
