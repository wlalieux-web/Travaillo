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
