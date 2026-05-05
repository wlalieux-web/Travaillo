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
