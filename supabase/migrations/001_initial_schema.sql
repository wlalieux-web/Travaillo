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
