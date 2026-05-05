# Module 2 — Prompt Claude Code

> **Comment l'utiliser** : dans Claude Code à la racine de `test-magic`, tape :
> `Lis docs/MODULE-2-JOBS-CALENDAR-PROMPT.md et execute le prompt entre les triples backticks. Suis-le exactement.`

> **Scope** : Jobs (ponctuels + récurrents) + Calendrier multi-vues + Pointage (Clock in/out) + Feuilles de temps + Approbation manager.
>
> **Estimation** : 4000-6000 lignes de code, 2 migrations, ~30 fichiers nouveaux. Compte 3-5h de travail collaboratif. C'est gros — laisse Claude Code procéder par phases.

---

```text
TÂCHE : Construire le MODULE 2 de NexaService — Jobs, Calendrier, Pointage et Feuilles de temps.

CONTEXTE PROJET (à relire à chaque session)
- Stack : Next.js 16 (App Router) + React 19 + TypeScript + Tailwind 4 + Supabase + shadcn/ui + Framer Motion + Zod + React Hook Form + sonner
- Multi-tenant : chaque ligne BD a company_id, RLS via auth_company_id()
- Lis AGENTS.md AVANT de coder (Next.js 16 a des breaking changes, lis aussi node_modules/next/dist/docs/)
- Modules existants : Auth, Profiles, Companies, Clients (avec properties, notes, attachments), DEVIS (quotes, quote_items, quote_attachments, quote_templates avec public token et signatures)
- Examine src/app/(dashboard)/clients/* et src/app/(dashboard)/quotes/* (si existant) pour respecter les patterns
- Design system : dark theme (#020c05), accents emerald/teal, borders emerald-900/20-30, cards bg-white/[0.02], rounded-2xl, animations Framer Motion, icons lucide-react, toasts sonner

DÉPENDANCES À INSTALLER
- @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities (drag and drop calendrier)
- date-fns date-fns-tz (manipulation dates avec timezone)
- rrule (récurrence iCal)
- mapbox-gl @types/mapbox-gl (vue carte — set token via NEXT_PUBLIC_MAPBOX_TOKEN, créer un placeholder dans .env.local.example)
- react-signature-canvas (utilisé déjà au Module 1, vérifie)
- Si déjà présentes, ne pas réinstaller

PROCÈDE EN PHASES (livre une phase à la fois, attends ma validation avant la suivante si phase critique)

═══════════════════════════════════════════
PHASE 1 — SCHÉMA SUPABASE (migration 003_jobs_and_time.sql)
═══════════════════════════════════════════

Crée supabase/migrations/003_jobs_and_time.sql :

-- ENUMS
create type job_type as enum ('one_off','recurring');
create type job_status as enum ('draft','scheduled','in_progress','completed','cancelled','archived');
create type visit_status as enum ('scheduled','en_route','in_progress','completed','cancelled','rescheduled','no_show');
create type clock_source as enum ('app','web','manual','kiosk');

-- JOBS
create table jobs (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  client_id uuid not null references clients(id) on delete restrict,
  property_id uuid references properties(id) on delete set null,
  quote_id uuid references quotes(id) on delete set null,
  number text not null,                          -- J-2026-0001
  title text not null,
  description text,
  type job_type not null default 'one_off',
  status job_status not null default 'draft',
  -- Récurrence (one_off : null, recurring : RRULE iCal-compatible)
  recurrence_rule text,                          -- ex 'FREQ=WEEKLY;BYDAY=MO,WE,FR'
  recurrence_start date,
  recurrence_end date,                           -- null = sans fin
  -- Estimation
  estimated_duration_minutes integer,
  estimated_cost numeric(12,2),
  -- Tarification (héritée du devis ou éditée manuellement)
  total numeric(12,2) default 0,
  currency text default 'CAD',
  -- Instructions terrain
  internal_notes text,
  client_instructions text,
  -- Méta
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (company_id, number)
);
create index jobs_company_id_idx on jobs(company_id);
create index jobs_client_id_idx on jobs(client_id);
create index jobs_status_idx on jobs(status);

-- VISITS (un job = N visites ; une visite est un slot dans le calendrier)
create table visits (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  -- Planification
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  -- Réalité
  actual_start timestamptz,
  actual_end timestamptz,
  status visit_status not null default 'scheduled',
  -- Position dans la séquence (pour récurrents)
  sequence_number integer,
  -- Position GPS de la visite si différente de la propriété
  override_address text,
  override_lat numeric(10,7),
  override_lng numeric(10,7),
  -- Notification client
  client_notified_at timestamptz,
  on_the_way_at timestamptz,
  arrived_at timestamptz,
  -- Notes terrain
  technician_notes text,
  client_signature_url text,
  -- Méta
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (scheduled_end > scheduled_start)
);
create index visits_job_id_idx on visits(job_id);
create index visits_company_id_idx on visits(company_id);
create index visits_scheduled_start_idx on visits(scheduled_start);

-- ASSIGNMENTS (technicien <-> visite, many-to-many)
create table visit_assignments (
  visit_id uuid not null references visits(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  is_primary boolean default false,              -- responsable principal de la visite
  assigned_at timestamptz default now(),
  primary key (visit_id, profile_id)
);
create index visit_assignments_profile_id_idx on visit_assignments(profile_id);

-- PHOTOS (avant / pendant / après)
create table visit_photos (
  id uuid primary key default uuid_generate_v4(),
  visit_id uuid not null references visits(id) on delete cascade,
  uploaded_by uuid references profiles(id),
  url text not null,
  type text check (type in ('before','during','after','other')),
  caption text,
  taken_at timestamptz default now()
);

-- CHECKLIST / FORMULAIRE TERRAIN par visite
create table visit_forms (
  id uuid primary key default uuid_generate_v4(),
  visit_id uuid not null references visits(id) on delete cascade,
  fields jsonb not null default '[]',            -- [{key, label, type:checkbox|text|number, value, required}]
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- POINTAGES
create table time_entries (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  visit_id uuid references visits(id) on delete set null,
  job_id uuid references jobs(id) on delete set null,
  -- Horodatage
  clock_in_at timestamptz not null,
  clock_out_at timestamptz,
  -- Géolocalisation
  clock_in_lat numeric(10,7),
  clock_in_lng numeric(10,7),
  clock_in_accuracy_m integer,
  clock_out_lat numeric(10,7),
  clock_out_lng numeric(10,7),
  clock_out_accuracy_m integer,
  -- Calcul
  duration_minutes integer generated always as (
    case when clock_out_at is null then null
         else cast(extract(epoch from (clock_out_at - clock_in_at))/60 as integer) end
  ) stored,
  break_minutes integer default 0,
  billable boolean default true,
  hourly_rate numeric(8,2),
  -- Approbation
  approved_at timestamptz,
  approved_by uuid references profiles(id),
  -- Audit édition
  edited_by uuid references profiles(id),
  edited_at timestamptz,
  edit_reason text,
  -- Méta
  notes text,
  source clock_source default 'app',
  created_at timestamptz default now()
);
create index time_entries_profile_id_idx on time_entries(profile_id);
create index time_entries_company_id_idx on time_entries(company_id);
create index time_entries_visit_id_idx on time_entries(visit_id);
create index time_entries_clock_in_idx on time_entries(clock_in_at);

-- PAUSES
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

-- NUMÉROTATION JOBS
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

-- TRIGGERS updated_at
create trigger jobs_updated_at before update on jobs
  for each row execute function update_updated_at();
create trigger visits_updated_at before update on visits
  for each row execute function update_updated_at();

-- DÉTECTION CONFLITS (helper) : retourne true si un technicien est déjà booké sur ce créneau
create or replace function technician_has_conflict(
  p_profile uuid, p_start timestamptz, p_end timestamptz, p_exclude_visit uuid default null
) returns boolean as $$
  select exists(
    select 1 from visit_assignments va
    join visits v on v.id = va.visit_id
    where va.profile_id = p_profile
      and v.status not in ('cancelled','completed')
      and (p_exclude_visit is null or v.id <> p_exclude_visit)
      and tstzrange(v.scheduled_start, v.scheduled_end, '[)')
       && tstzrange(p_start, p_end, '[)')
  )
$$ language sql stable;

-- RLS
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

-- Time entries : un technicien ne voit QUE ses propres pointages, sauf admin/owner
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

ARRÊTE-TOI à la fin de cette phase. Confirme : tables créées, RLS appliqué, fonction generate_job_number testée. Donne la commande exacte pour appliquer la migration.

═══════════════════════════════════════════
PHASE 2 — TYPES + SERVER ACTIONS
═══════════════════════════════════════════

a) Étends src/lib/supabase/types.ts avec les nouvelles tables
b) Crée src/lib/jobs/types.ts (Job, Visit, VisitAssignment, VisitStatus, JobStatus)
c) Crée src/lib/jobs/schemas.ts (Zod create/update job, create/move visit)
d) Crée src/lib/time/types.ts (TimeEntry, Break)
e) Crée src/lib/time/schemas.ts

Server actions à implémenter (use server) :

src/lib/jobs/actions.ts :
- createJob(data) : génère numéro, expanse récurrence en visites
  - Si type='recurring', utilise rrule.js pour générer les visits jusqu'à recurrence_end OU 6 mois si end null
  - Cap à 200 visites max par création (anti-explosion BD)
- updateJob(id, data)
- updateJobRecurrence(id, newRrule, mode: 'this_and_future'|'all'): regénère les visites pas encore commencées
- cancelJob(id)
- deleteJob(id)

src/lib/visits/actions.ts :
- createVisit(jobId, scheduled_start, scheduled_end, assignees[])
- moveVisit(id, newStart, newEnd, newAssignees[]): vérifie conflits via technician_has_conflict()
- assignVisit(visitId, profileIds[], primaryProfileId?)
- markEnRoute(visitId): set on_the_way_at, status='en_route', notifie client (stub: log seulement)
- markArrived(visitId): set arrived_at
- completeVisit(visitId, signature?, notes?)
- rescheduleVisit(visitId, newStart, newEnd)

src/lib/time/actions.ts :
- clockIn(visitId?, jobId?, geolocation?: {lat,lng,accuracy})
  - Vérifier qu'il n'y a pas de pointage déjà ouvert (clock_out_at null) pour ce profile
  - Snapshot le hourly_rate du profile
- clockOut(geolocation?)
  - Trouver le pointage ouvert du user, fermer
- startBreak(type='unpaid'|'paid')
- endBreak()
- editTimeEntry(id, data, reason): seulement owner/admin, log edited_by/edited_at/edit_reason
- approveTimeEntry(id), bulkApproveWeek(profileId, weekStart)
- listMyTimeEntries(weekStart): retourne les entries de la semaine du user
- listTeamTimeEntriesPending(): pour managers, entries non approuvées

TOUTES les server actions :
- Vérifient auth.getUser()
- Vérifient que l'objet appartient à la company de l'user
- Pour les actions admin (editTimeEntry, approve...), vérifient profile.role in ('owner','admin')
- Retournent des erreurs typées (pas de throw nu)

═══════════════════════════════════════════
PHASE 3 — JOBS CRUD (pages list + create + detail)
═══════════════════════════════════════════

src/app/(dashboard)/jobs/page.tsx
  - Tableau jobs : Numéro, Titre, Client, Statut (badge coloré), Type, Prochaine visite, Total
  - Filtres : statut, type, client, période
  - Recherche par numéro/titre/client
  - Bouton "Nouveau job" + bouton "Convertir un devis approuvé en job" (si module 1 ready)
  - Empty state engageant

src/app/(dashboard)/jobs/new/page.tsx
  - Form : sélecteur client, sélecteur propriété (filtré par client), titre, description
  - Toggle one-off / récurrent
    - Si récurrent : RRULE builder (fréquence : daily/weekly/monthly, jours de semaine, end date optionnelle)
  - Première visite : date+heure début, durée, assignation techniciens (multi-select avec couleur)
  - Estimation durée + coût
  - Submit → createJob → redirect vers /jobs/[id]

src/app/(dashboard)/jobs/[id]/page.tsx
  - Header : numéro, titre, statut, client (link), property
  - Tabs : Vue d'ensemble | Visites | Photos | Pointages | Notes
  - Vue d'ensemble : résumé + actions (Annuler, Compléter, Supprimer, Dupliquer, Convertir en facture [disabled si pas completed])
  - Visites : timeline verticale des visites (passées + à venir), boutons "Ajouter une visite" / "Voir sur calendrier"
  - Photos : grille avec lightbox
  - Pointages : tableau des time_entries liées au job (somme heures, coût)
  - Notes : internal_notes éditable inline + client_instructions

Composants src/components/jobs/ :
  - jobs-table.tsx
  - job-status-badge.tsx
  - job-form.tsx (create + edit)
  - rrule-builder.tsx (UI pour construire la récurrence)
  - visits-timeline.tsx (liste verticale des visites)
  - assign-technicians-popover.tsx (multi-select avec photos+couleurs)

═══════════════════════════════════════════
PHASE 4 — CALENDRIER (Day + Week + drag-drop)
═══════════════════════════════════════════

src/app/(dashboard)/calendar/page.tsx
  - Header : sélecteur de vue (Jour/Semaine/Mois/Liste/Carte/Dispatch), navigation (<, today, >), date courante, filtres (techniciens, types)
  - Body : composant <Calendar /> qui switch selon vue

src/components/calendar/calendar.tsx (orchestrateur)
src/components/calendar/day-view.tsx
  - Timeline horizontale 6h-22h (configurable)
  - Colonnes par technicien filtré (ou colonne "Tous" si pas filtré)
  - Visites comme blocs colorés (couleur du tech assigné)
  - Drag pour déplacer (entre tech, dans le temps), resize en bas pour ajuster durée
  - Ligne "now" rouge horizontale qui bouge

src/components/calendar/week-view.tsx
  - Grille 7 jours x 24h (zoom horaire)
  - Drag-drop entre jours et heures
  - Click vide pour créer visite (modal rapide)

Drag-and-drop :
  - @dnd-kit/core
  - DndContext au niveau Calendar
  - Optimistic UI : on update le state local immédiatement, on appelle moveVisit en fond
  - Si conflit retourné par le serveur, rollback + toast erreur "Le technicien X est déjà occupé"
  - Affichage visuel des conflits : visite bordée rouge si conflit détecté côté client (avant save)

Realtime :
  - Subscribe à supabase channel sur 'visits' filtré par company_id
  - Si un autre user (dispatcher) bouge une visite, le calendrier se met à jour live
  - Indicateur subtil "Mis à jour il y a 2s par Marc"

src/components/calendar/visit-block.tsx
  - Bloc visuel d'une visite : titre, client, heure, technicien
  - Contextmenu (right-click ou ⋮) : Compléter, Annuler, Reprogrammer, Voir le job

src/components/calendar/quick-create-visit-modal.tsx
  - Modal qui s'ouvre quand on clique sur un slot vide
  - Champs : client (autocomplete), propriété, titre, durée, technicien
  - Submit → crée un job one_off + une visite, ferme modal

═══════════════════════════════════════════
PHASE 5 — VUES CALENDRIER ADDITIONNELLES
═══════════════════════════════════════════

src/components/calendar/month-view.tsx
  - Grille mensuelle classique
  - Click jour → bascule en day-view sur ce jour
  - Limite 3 visites visibles par cellule + "+N de plus"

src/components/calendar/list-view.tsx
  - Liste verticale groupée par jour, mobile-first
  - Cards visite

src/components/calendar/map-view.tsx
  - Carte Mapbox GL (vérifier NEXT_PUBLIC_MAPBOX_TOKEN sinon afficher placeholder + lien doc)
  - Markers par visite, couleur = technicien
  - Popup au click : titre, heure, client
  - Bouton "Optimiser route du jour pour [tech]" → appelle Mapbox Directions API et reorder les visites

src/components/calendar/dispatch-view.tsx
  - Split 60/40 : timeline jour à gauche, carte à droite
  - Hover sur visite → highlight marker carte
  - Drag visite → déplace dans timeline ET met à jour carte

═══════════════════════════════════════════
PHASE 6 — POINTAGE (Clock In / Out)
═══════════════════════════════════════════

src/components/time/clock-in-out-widget.tsx
  - Composant client utilisable n'importe où
  - Affiche état actuel : "Pointé depuis HH:MM (durée Xh Ym)" ou "Non pointé"
  - GROS bouton :
    - Vert "Pointer l'arrivée" si pas pointé
    - Rouge "Pointer le départ" si pointé
  - Sélecteur de visite courante (dropdown des visites du jour assignées au user)
  - Si visite sélectionnée et propriété a coords, demande géolocalisation au clock in
    - navigator.geolocation.getCurrentPosition
    - Compare distance (Haversine) avec property coords
    - Si > 200m, affiche warning "Vous semblez loin du lieu de la visite (X m). Confirmer ?"
  - Auto-refresh du timer toutes les 30s (durée affichée live)

Intégration :
  - Mets le widget dans src/components/layout/topbar.tsx (visible partout dans le dashboard)
  - Aussi accessible via /timesheet (page perso ci-dessous)

src/app/(dashboard)/timesheet/page.tsx
  - Vue "Ma feuille de temps cette semaine"
  - Tableau : 7 colonnes (lun-dim), lignes par job/visite, cellules avec heures pointées
  - Total heures semaine (réalisées, pauses payées, pauses non payées, billables)
  - Bouton "Ajouter une entrée manuelle" (si permis par règlages)
  - Bouton "Demander correction" sur une entrée (envoie message au manager — stub log pour l'instant)

═══════════════════════════════════════════
PHASE 7 — FEUILLES DE TEMPS MANAGER
═══════════════════════════════════════════

src/app/(dashboard)/timesheet/team/page.tsx (visible role in owner/admin/office)
  - Sélecteur semaine (navigation < semaine en cours >)
  - Tableau :
    - Lignes : employés actifs
    - Colonnes : 7 jours + Total + Statut approbation
  - Click cellule → drawer avec détail des time_entries du jour
  - Filtre : "À approuver" / "Approuvé" / "Tous"

src/app/(dashboard)/timesheet/approve/page.tsx
  - Liste des entries non approuvées, groupées par employé
  - Boutons : "Approuver" / "Rejeter" individuel, "Approuver toute la semaine de [employé]"
  - Édition inline : changer heure début/fin avec champ "Raison de la modification" obligatoire

src/components/time/timesheet-table.tsx (réutilisable employé + équipe)
src/components/time/time-entry-edit-modal.tsx
src/components/time/timesheet-export-button.tsx
  - Export CSV format compatible :
    - QuickBooks (template colonnes : Date, Employee, Hours, Job, Notes)
    - Sage 50
    - PayFit (FR : Date, Salarié, Heures, Code activité)
    - Format générique
  - Choix par dropdown
  - Filename : timesheet-YYYY-WW-format.csv

═══════════════════════════════════════════
PHASE 8 — INTÉGRATIONS TRANSVERSES
═══════════════════════════════════════════

a) Sidebar : item "Calendrier" → /calendar (avec icône CalendarDays), item "Pointage" si tech, item "Équipe → Feuilles de temps" si manager
b) Quick action sur dashboard : "Voir le calendrier du jour" + "Mes pointages cette semaine"
c) Dans la page client (déjà existante), onglet "Jobs" qui liste les jobs de ce client
d) Topbar : widget Clock-in compact (juste le bouton + timer si pointé)

═══════════════════════════════════════════
PHASE 9 — TESTS DE FUMÉE (à exécuter avant de me rendre la main)
═══════════════════════════════════════════

1. Crée un job ponctuel pour un client existant, ajoute 1 visite demain 9h-11h, assigne à toi-même
2. Crée un job récurrent : tous les lundis 8h-10h pendant 4 semaines → vérifie que 4 visites sont créées
3. Sur le calendrier vue Semaine : drag la visite de demain vers après-demain → vérifie qu'elle bouge en BD
4. Crée une 2e visite à 9h30 demain assignée à toi → vérifie le warning de conflit
5. Clock in sur la visite de demain (en faisant simuler un mock geoloc à 250m de la propriété si possible) → vérifie le warning
6. Clock out 2 minutes plus tard → vérifie duration_minutes calculé
7. Démarre une pause, ferme-la → vérifie break_minutes
8. Connecte-toi en tant qu'admin, va sur /timesheet/approve, approuve l'entrée
9. Édite une entrée existante → vérifie que edit_reason est obligatoire et que edited_by/edited_at sont remplis
10. Export CSV format QuickBooks → vérifie le contenu
11. RLS : connecte-toi avec un user d'une autre company → la visite n'est PAS visible dans /jobs ni /calendar
12. RLS : connecte-toi en tant que technician → tu vois SEULEMENT tes propres time_entries

═══════════════════════════════════════════
RÈGLES TRANSVERSES (à appliquer partout)
═══════════════════════════════════════════

- Permissions : pas de système granulaire encore (on l'ajoutera Module 1.5/12). Pour l'instant, hardcode :
  - Technician : voit ses propres jobs/visits/time_entries, ne peut pas créer de job, peut clock in/out, peut compléter ses visites
  - Office : peut tout sur jobs/visits, ne peut pas approuver les heures
  - Admin/Owner : tout
- Dates : TOUJOURS stocker en timestamptz UTC, afficher dans la timezone de la company (companies.timezone)
- Use date-fns-tz pour les conversions
- Optimistic updates partout où c'est lourd (drag-drop calendrier, clock in/out)
- Loading states : skeleton loaders, pas de spinner full-page
- Erreurs : toast sonner, jamais de alert()
- Mobile-first : les techniciens utilisent leur téléphone
  - Vues Liste, Day, Clock widget DOIVENT être impeccables sur mobile
  - Touch targets ≥ 44px
- Realtime via Supabase channels pour : visits (calendar live sync), time_entries (manager voit qui pointe en temps réel)
- Server actions : revalidatePath('/calendar'), revalidatePath('/jobs') après mutations
- Code en français (variables, UI, commentaires)
- Pas d'any (sauf last resort + eslint-disable + commentaire)
- Préférer Server Components, "use client" seulement si nécessaire (drag-drop, geoloc, signature, realtime)

À LA FIN DE CHAQUE PHASE
- Liste les fichiers créés/modifiés
- Note explicitement ce que tu as zappé/différé et pourquoi
- Donne les commandes pour tester (URLs à visiter, scénarios)

NE FAIS PAS dans ce module (gardés pour plus tard)
- Génération PDF des bons de travail (Module 3)
- Envoi SMS/email réel "on the way" (Module 4 — pour l'instant juste log + status)
- App mobile native (Module 8 — la PWA suffit pour mobile)
- Système de permissions granulaire (Module 1.5 ou 12)
- Optimisation route avancée multi-jour (juste single day + Mapbox basique pour le Module 2)

DÉMARRE PAR LA PHASE 1. Confirme à chaque phase avant de passer à la suivante pour que je puisse valider.
```

---

## Notes pour toi avant de lancer

### Ce que tu dois préparer avant
1. **Token Mapbox** (gratuit jusqu'à 50k requêtes/mois) :
   - Va sur mapbox.com → créer compte → access tokens
   - Ajoute dans `.env.local` : `NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxxxx`
   - Si tu skip, la vue Carte affichera juste un placeholder, le reste fonctionne

2. **Vérifier les hourly_rates** sur les profiles :
   - Le pointage snapshot le `hourly_rate` du profile au moment du clock-in
   - Si tu as pas encore de champ `hourly_rate` sur `profiles`, ajoute-le dans la migration ou dis à Claude Code de l'ajouter

3. **Au moins 2 profiles techniciens** dans ta company (pour tester l'assignation et les conflits)

### Pendant l'exécution
- Le prompt demande à Claude Code de **livrer phase par phase** avec ta validation. Profite-en pour tester au fur et à mesure.
- Si tu veux aller plus vite, tu peux lui dire "fais les phases 1-3 d'un coup puis arrête-toi" — mais je te recommande pas de tout enchaîner sans pause.
- Les phases 4-5 (calendrier) sont les plus risquées en termes de bugs UI. Teste à fond avant de continuer.

### Quand c'est fini
Reviens me voir et on enchaînera avec **Module 3 — Factures + Paiements (Stripe)** ou **Module 1.5 — Permissions Foundation** (que je recommande fortement avant de continuer à empiler des features).
