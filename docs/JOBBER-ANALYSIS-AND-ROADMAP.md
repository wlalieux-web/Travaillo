# NexaService — Analyse Jobber + Roadmap + Prompt Claude Code

> **Objectif** : construire un CRM pour services à domicile (home services) **mieux que Jobber**, ciblant le marché **francophone QC + EU**, avec un **pricing agressif**.
>
> **État actuel du projet** : Auth + multi-tenant + module Clients (avec propriétés, notes, attachments) déjà fonctionnels. Sidebar prévoit Devis / Jobs / Factures (pas encore implémentés).

---

## PARTIE 1 — Analyse complète de Jobber

### 1.1 Modules de Jobber (ce qu'ils offrent)

#### A. **Clients (CRM)**
- Profils clients (résidentiel ou commercial) avec contacts multiples
- Propriétés multiples par client (adresses de service distinctes de la facturation)
- Historique complet : devis, jobs, factures, paiements, communications
- Tags et segmentation
- Notes internes vs notes visibles par le client
- Attachments (photos, fichiers)
- Solde courant (balance) par client
- Source du lead (referral, Google, FB, porte-à-porte…)

#### B. **Devis (Quotes)**
- Numérotation auto (Q-0001…)
- Lignes d'items avec quantité, prix unitaire, taxes par ligne
- Items **optionnels** (le client coche pour upgrade)
- Items **obligatoires**
- Templates de devis réutilisables
- Photos et attachments dans le devis
- Message personnalisé pour le client
- E-signature pour approbation
- Dépôts requis (% ou $)
- Validité (date d'expiration)
- Statuts : Draft → Awaiting response → Approved → Converted → Archived
- Envoi par email ou SMS
- Tracking : "vu le 12 mars à 14h32"
- Conversion en job + facture
- PDF généré
- Suivis automatiques (relance auto si pas de réponse en X jours)

#### C. **Jobs (Calendrier / Scheduling)**
- Jobs ponctuels (one-off) ou récurrents (chaque semaine, mois, saison…)
- Visites multiples par job (un job = N visites)
- Drag-and-drop sur calendrier (jour / semaine / mois / liste)
- Assignation à un ou plusieurs techniciens
- Couleur par employé
- Optimisation de routes (Jobber Routing add-on)
- GPS tracking pendant la visite
- Pointage temps (in/out)
- Job costing : matériel + main d'œuvre vs prix vendu
- Custom forms / checklists par type de job
- Photos avant/après depuis l'app mobile
- Signature client de complétion
- Notes terrain
- Notifications client : "votre technicien arrive dans 30 min" + tracking

#### D. **Factures (Invoices)**
- Génération depuis un job complété
- Factures groupées (batch) pour clients récurrents
- Numérotation auto
- Lignes copiées du devis ou du job
- Taxes par ligne ou globales
- Termes de paiement (Net 7, 15, 30, COD)
- Relances automatiques (3 jours avant due, 1 jour après, 7 jours après…)
- PDF + email + lien de paiement
- Statuts : Draft → Sent → Paid → Past due
- Notes de crédit, remboursements

#### E. **Paiements (Jobber Payments)**
- Carte de crédit (powered by Stripe Connect)
- ACH bank transfer
- Stocker méthode de paiement (vault)
- Auto-charge pour clients récurrents
- Tip prompts
- Partial payments
- Frais : ~2.7% + 0.30$ CC, 1% ACH (Jobber Payments) — **opportunité de battre ces frais**

#### F. **Communications**
- Email avec templates
- SMS bidirectionnels (Jobber 2-way SMS, payant)
- Notifications push (app)
- Reminders automatiques :
  - Confirmation de RDV
  - Rappel 24h avant
  - "On the way" (technicien part)
  - Demande de review post-job
- Inbox unifiée (toutes conversations clients)

#### G. **Online Booking**
- Page de booking publique brandée
- Sélection de service, slot, propriété
- Approbation manuelle ou auto-confirmation
- Capture de leads avec formulaires personnalisés
- Intégration au site web

#### H. **Client Hub (portail self-serve)**
- Le client se connecte
- Voit ses devis, factures, jobs
- Approuve un devis
- Paie une facture
- Demande de service supplémentaire
- Historique complet

#### I. **Reports & Insights**
- Revenue par service / client / employé
- Pipeline (valeur des devis en attente)
- Aging des factures (30/60/90 jours)
- Job profitability
- Forecast revenue
- Custom reports (export CSV)

#### J. **Marketing / Automatisations**
- Campagnes email aux clients existants
- Re-engagement (clients inactifs depuis X mois)
- Demandes de review automatiques (vers Google, Yelp…)
- Référral program (Jobber Referrals — payant)

#### K. **App Mobile (technicien)**
- iOS / Android natif
- Voir les jobs du jour
- GPS tracking, time tracking
- Photos avant/après
- Signature client
- Marquer le job complété
- Envoyer la facture sur place
- Mode offline limité

#### L. **Intégrations**
- QuickBooks Online (sync clients, factures, paiements)
- Stripe (via Jobber Payments uniquement, pas direct)
- Google Calendar (one-way sync)
- Mailchimp
- Zapier (5000+ apps)
- API publique (limitée)

#### M. **Team Management**
- Permissions granulaires (Owner, Admin, Office, Technicien)
- Time tracking + timesheets
- Commission tracking (basique)
- 2FA, SSO Google

---

### 1.2 Faiblesses de Jobber (ton terrain de jeu)

| Faiblesse | Opportunité pour NexaService |
|---|---|
| **Localisation FR médiocre** | Vraie traduction native, support TPS/TVQ et TVA EU |
| **UX datée** (UI old-school) | Design moderne (style Linear / Notion / Stripe Dashboard) |
| **Mobile app fonctionnelle mais pas premium** | PWA + app native fluide, animations |
| **Pas d'IA** | IA partout : devis par photo/voix, scheduling intelligent, drafts auto |
| **Frais de paiement élevés** | Stripe direct, partage des frais avec le client en option |
| **Reports limités** | Dashboards customisables avec drill-down |
| **Permissions grossières** (4 rôles fixes) | Permissions fin grain par employé + feature toggles company |
| **Calendrier fonctionnel mais sans charme** | Calendrier custom moderne avec vue Dispatch (timeline + carte) |
| **Pointage basique** | Géofencing, mode kiosque, alertes pauses légales QC/EU, export paie |
| **Setup complexe** | Onboarding guidé en 5 min, templates par secteur |
| **Pricing élevé** ($69-349/mois US) | 50-60% moins cher (29-149$ CAD) en early adopter |
| **Add-ons facturés à part** (SMS, Routing, Marketing…) | Tout inclus dans le plan principal |
| **Conformité QC** : pas de TVQ/TPS native | Tax presets QC + facturation conforme Loi 25 |
| **Pas de mode multi-devises sérieux** | Multi-currency natif (CAD, EUR, CHF) |
| **Client Hub basique** | Portail beautifully designed, branding complet |
| **Automatisations limitées** | Workflow builder visuel (style n8n/Zapier mais natif) |

---

## PARTIE 2 — Roadmap NexaService

### Logique de séquencement
Le flow naturel du métier est : **Lead → Devis → Job → Facture → Paiement**.
On construit dans cet ordre pour que chaque module débloque le suivant.

### Module-par-module

#### ✅ **MODULE 0 — Foundation** (DÉJÀ FAIT)
- Auth Supabase + onboarding
- Multi-tenant (companies + RLS)
- Profiles & rôles
- Module Clients + Properties + Notes + Attachments
- Landing page

#### 🔥 **MODULE 1 — Devis (Quotes)** ← PROCHAIN
**Pourquoi en premier** : on a déjà des clients dans le système, le devis est la porte d'entrée commerciale. Sans devis, pas de revenu trackable.

**Schéma :**
- `quotes` (numéro, client_id, property_id, status, valid_until, currency, subtotal, taxes, total, deposit_required, signed_at, signed_by, viewed_at…)
- `quote_items` (quote_id, position, description, quantity, unit, unit_price, tax_rate, is_optional, optional_selected, total)
- `quote_templates` (lignes pré-faites par secteur)

**Features killer vs Jobber :**
- Génération de devis par voix (dictée → items)
- Génération par photo (snap → IA détecte les prestations)
- Suggestions intelligentes basées sur les devis passés
- Tax presets QC (TPS 5% + TVQ 9.975%) + EU (TVA 20% / 19% / 21%)
- Tracking : lu / approuvé / signé en temps réel
- Real-time multi-currency

#### **MODULE 2 — Jobs + Calendrier**
> **Le calendrier est LE cœur visuel du produit.** C'est l'écran que les patrons et dispatchers ouvriront 50 fois par jour. Il doit être beau, fluide et puissant — c'est un différenciateur majeur vs Jobber dont le calendrier est fonctionnel mais sans charme.

**Schéma :**
- `jobs` (quote_id?, client_id, property_id, type one-off/recurring, start_date, end_date, recurrence_rule iCal RRULE, status, total)
- `visits` (job_id, scheduled_start, scheduled_end, actual_start, actual_end, status, assigned_to[])
- `job_assignments` (visit_id, profile_id)
- `job_forms` (visit_id, fields jsonb pour checklist personnalisée)
- `job_photos` (visit_id, url, taken_at, type before/during/after)

**Features calendrier :**
- **Vue Jour** : timeline horizontale avec colonnes par technicien (drag entre techniciens)
- **Vue Semaine** : grille 7 jours, événements drag-and-drop, redimensionnement à la souris pour ajuster la durée
- **Vue Mois** : aperçu condensé, click pour voir le détail
- **Vue Liste/Agenda** : optimisée mobile
- **Vue Carte** : tous les jobs du jour sur Mapbox avec markers colorés par technicien
- **Vue Dispatch** : split timeline + carte côte à côte, idéal pour le dispatcher du matin
- Filtres : par technicien, par type de service, par statut, par client
- Couleur par technicien (champ `profiles.color` déjà au schéma)
- Indicateur visuel : conflit d'horaire, technicien en retard, visite non assignée
- Drag depuis la liste "non assignées" vers le calendrier
- Récurrence iCal-compatible (jobs hebdo, mensuels, saisonniers — déneigement par ex.)
- Notification client "on the way" avec lien de tracking GPS en temps réel
- Optimisation de routes (Mapbox Directions API + algo TSP simple sur la journée)
- Sync 2-way Google Calendar (option) + iCal feed pour Apple Calendar
- Raccourcis clavier (J=jour, S=semaine, M=mois, N=nouveau)

**Stack technique recommandée :**
- Calendar custom basé sur `@dnd-kit/core` + `date-fns` (plutôt que FullCalendar qui est lourd et peu personnalisable)
- Mapbox GL JS pour la carte
- Drag-and-drop avec optimistic updates (Supabase realtime pour multi-user sync)

#### **MODULE 2B — Pointage (Clock In / Clock Out)**
> **Pourquoi le séparer du Module 2** : c'est un produit dans le produit. Les heures travaillées alimentent la paie, la facturation, le job costing. Une erreur ici coûte cher au boss. Et c'est aussi un piège légal au QC (Loi sur les normes du travail) et en EU.

**Schéma :**

```sql
create type clock_event_type as enum ('clock_in','clock_out','break_start','break_end');

create table time_entries (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  visit_id uuid references visits(id) on delete set null,    -- lien optionnel à un job
  job_id uuid references jobs(id) on delete set null,
  -- Horodatage
  clock_in_at timestamptz not null,
  clock_out_at timestamptz,
  -- Géolocalisation au pointage (anti-fraude, optionnel selon réglages company)
  clock_in_lat numeric(10,7),
  clock_in_lng numeric(10,7),
  clock_in_accuracy_m integer,
  clock_out_lat numeric(10,7),
  clock_out_lng numeric(10,7),
  clock_out_accuracy_m integer,
  -- Calcul
  duration_minutes integer generated always as (
    case when clock_out_at is null then null
         else extract(epoch from (clock_out_at - clock_in_at))/60 end
  ) stored,
  break_minutes integer default 0,
  billable boolean default true,
  hourly_rate numeric(8,2),                  -- snapshot au moment du pointage
  -- Méta
  notes text,
  edited_by uuid references profiles(id),    -- si un manager a édité
  edited_at timestamptz,
  edit_reason text,
  source text default 'app'                  -- 'app','web','manual','kiosk'
    check (source in ('app','web','manual','kiosk')),
  created_at timestamptz default now()
);

create index time_entries_profile_id_idx on time_entries(profile_id);
create index time_entries_company_id_idx on time_entries(company_id);
create index time_entries_visit_id_idx on time_entries(visit_id);

create table breaks (
  id uuid primary key default uuid_generate_v4(),
  time_entry_id uuid not null references time_entries(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz,
  duration_minutes integer,
  type text default 'unpaid' check (type in ('paid','unpaid'))
);
```

**Features :**
- Bouton géant **Clock In / Clock Out** en haut de l'app technicien (un tap)
- Pointage **automatique au démarrage d'une visite** (option activable par le boss)
- **Géofencing** : empêcher (ou alerter) le pointage si le technicien n'est pas à l'adresse du job (dans un rayon configurable, ex 200m)
- **Pauses** trackées séparément (payées vs non payées)
- **Feuille de temps hebdomadaire** par employé — vue tabulaire jour par jour
- **Approbation manager** : toggle "exige approbation manager avant que les heures n'apparaissent en paie" (réglage company)
- **Édition manuelle** : un manager peut éditer une entrée, mais TOUTE édition est loggée (`edited_by`, `edited_at`, `edit_reason`)
- **Mode kiosque** : un iPad partagé au bureau, employés tapent leur PIN — utile pour les équipes sans smartphone
- **Heures supplémentaires** : règles configurables (ex. >40h/semaine = 1.5x au QC, >35h en France)
- **Pauses obligatoires** : alerte légale si un employé travaille >5h sans pause (Loi normes travail QC : 30 min pause après 5h)
- **Export paie** : CSV format compatible Sage 50 / QuickBooks / Nethris (paie QC) / PayFit (FR)
- **Rapprochement** : heures pointées vs heures vendues sur le job → marge réelle, alertes si dépassement

**Vue côté employé (mobile/PWA) :**
- Bouton Clock In avec sélection du job courant
- Affichage du temps en cours (timer live)
- Historique de mes pointages de la semaine
- Demander correction si erreur

**Vue côté manager :**
- Tableau "Qui est pointé maintenant ?" en temps réel
- Map "Où sont mes équipes ?" (si géoloc activée)
- Approuver les feuilles de temps de la semaine
- Éditer / corriger des pointages avec audit trail

#### **MODULE 3 — Factures + Paiements**
**Schéma :**
- `invoices` (numéro, job_id?, client_id, status, due_date, total, balance, payment_terms)
- `invoice_items` (similaire à quote_items)
- `payments` (invoice_id, amount, method card/ach/cash/check, stripe_payment_id, status)
- `payment_methods` (client_id, stripe_pm_id, last4, brand, default)

**Features :**
- Stripe direct (pas via Jobber Payments) → frais réduits
- Auto-charge clients récurrents
- Relances email/SMS auto (cron)
- Batch invoicing
- Notes de crédit, remboursements
- PDF généré server-side

#### **MODULE 4 — Communications**
**Schéma :**
- `conversations` (client_id, channel email/sms/chat)
- `messages` (conversation_id, direction, body, status, sent_at, read_at)
- `templates` (type, content, variables)
- `automations` (trigger, conditions, actions)

**Features :**
- Email (Resend ou Postmark)
- SMS (Twilio + numéros locaux QC/FR)
- Templates avec variables
- Drafts IA contextuelles
- Inbox unifiée

#### **MODULE 5 — Client Hub (portail public)**
- Route `/portal/[token]` magic-link auth
- Voir devis → approuver / signer
- Voir jobs à venir
- Voir factures → payer
- Demander un nouveau service
- Branding par company (logo, couleur)

#### **MODULE 6 — Online Booking**
- Page publique `/book/[company-slug]`
- Sélection service → slot → propriété
- Capture lead + création client + devis pré-rempli

#### **MODULE 7 — Reports & Analytics**
- Dashboards avec recharts
- Revenue / pipeline / aging / job profitability
- Filtres + drill-down
- Export CSV/Excel

#### **MODULE 8 — App Mobile / PWA Technicien**
- PWA installable sur iOS/Android (économise le coût app stores au début)
- Vue jobs du jour
- Time tracking, photos, signature, complétion

#### **MODULE 9 — Automatisations / Workflows**
- Builder visuel de workflows (style n8n light)
- Triggers : nouveau client, devis envoyé, job complété…
- Actions : envoyer email, créer tâche, ajouter tag…

#### **MODULE 10 — Marketing**
- Campagnes email (segmentation depuis tags)
- Demandes de review automatiques (Google/FB)
- Re-engagement (clients inactifs)

#### **MODULE 11 — Intégrations**
- QuickBooks Online (sync), Sage 50 (QC populaire)
- Google Calendar 2-way
- Zapier
- API publique REST + webhooks

#### 🎛️ **MODULE 12 — Admin Panel : Permissions & Feature Toggles par employé**
> **Pourquoi crucial** : un patron de PME ne veut pas que son nouveau technicien voie les marges, supprime des clients par erreur, ou ait accès au module Paie. Jobber a des permissions très grossières (4 rôles fixes). Toi tu vas offrir du **fin grain par employé**, c'est un argument de vente énorme.

**Concept** : 3 couches superposées
1. **Rôle** (déjà existant : owner / admin / technician / office) → définit un preset
2. **Surcharge par employé** → l'admin coche/décoche des permissions individuelles
3. **Plan de la company** → certaines features sont gated par le plan (free/starter/pro/enterprise)

**Schéma :**

```sql
-- Table des permissions disponibles (catalogue référence)
create table permission_catalog (
  key text primary key,                  -- ex 'quotes.view', 'quotes.edit_price', 'invoices.delete'
  label_fr text not null,
  label_en text,
  category text not null,                -- 'quotes','jobs','clients','invoices','team','reports','settings'
  description text,
  default_for_owner boolean default true,
  default_for_admin boolean default true,
  default_for_office boolean default false,
  default_for_technician boolean default false,
  required_plan text                     -- null si dispo tous plans, sinon 'pro','enterprise'
);

-- Surcharges individuelles par employé
create table profile_permissions (
  profile_id uuid not null references profiles(id) on delete cascade,
  permission_key text not null references permission_catalog(key) on delete cascade,
  enabled boolean not null,
  granted_by uuid references profiles(id),
  granted_at timestamptz default now(),
  primary key (profile_id, permission_key)
);

-- Feature flags au niveau company (le boss active/désactive globalement des modules)
create table company_features (
  company_id uuid not null references companies(id) on delete cascade,
  feature_key text not null,             -- ex 'time_tracking', 'gps_tracking', 'client_hub', 'online_booking'
  enabled boolean not null default true,
  config jsonb default '{}',             -- ex pour gps : {"radius_m":200,"enforce":true}
  primary key (company_id, feature_key)
);

-- Helper SQL pour vérifier si un user a une permission
create or replace function user_has_permission(p_key text)
returns boolean as $$
  select coalesce(
    (select enabled from profile_permissions
       where profile_id = auth.uid() and permission_key = p_key),
    case (select role from profiles where id = auth.uid())
      when 'owner'      then (select default_for_owner      from permission_catalog where key = p_key)
      when 'admin'      then (select default_for_admin      from permission_catalog where key = p_key)
      when 'office'     then (select default_for_office     from permission_catalog where key = p_key)
      when 'technician' then (select default_for_technician from permission_catalog where key = p_key)
    end,
    false
  )
$$ language sql security definer stable;
```

**Catalogue de permissions à seed (exemples) :**

| Clé | Catégorie | Owner | Admin | Office | Tech |
|---|---|:-:|:-:|:-:|:-:|
| `clients.view` | Clients | ✅ | ✅ | ✅ | ✅ |
| `clients.edit` | Clients | ✅ | ✅ | ✅ | ❌ |
| `clients.delete` | Clients | ✅ | ✅ | ❌ | ❌ |
| `clients.see_balance` | Clients | ✅ | ✅ | ✅ | ❌ |
| `quotes.view` | Devis | ✅ | ✅ | ✅ | ❌ |
| `quotes.create` | Devis | ✅ | ✅ | ✅ | ❌ |
| `quotes.see_margin` | Devis | ✅ | ✅ | ❌ | ❌ |
| `quotes.delete` | Devis | ✅ | ✅ | ❌ | ❌ |
| `jobs.view_all` | Jobs | ✅ | ✅ | ✅ | ❌ (voit seulement les siens) |
| `jobs.assign` | Jobs | ✅ | ✅ | ✅ | ❌ |
| `jobs.see_price` | Jobs | ✅ | ✅ | ✅ | ❌ |
| `invoices.view` | Factures | ✅ | ✅ | ✅ | ❌ |
| `invoices.create` | Factures | ✅ | ✅ | ✅ | ❌ |
| `invoices.delete` | Factures | ✅ | ❌ | ❌ | ❌ |
| `payments.refund` | Paiements | ✅ | ✅ | ❌ | ❌ |
| `time.clock_self` | Pointage | ✅ | ✅ | ✅ | ✅ |
| `time.edit_others` | Pointage | ✅ | ✅ | ❌ | ❌ |
| `time.approve` | Pointage | ✅ | ✅ | ❌ | ❌ |
| `team.invite` | Équipe | ✅ | ✅ | ❌ | ❌ |
| `team.see_hourly_rates` | Équipe | ✅ | ✅ | ❌ | ❌ |
| `reports.financial` | Rapports | ✅ | ✅ | ❌ | ❌ |
| `reports.team_performance` | Rapports | ✅ | ✅ | ❌ | ❌ |
| `settings.billing` | Réglages | ✅ | ❌ | ❌ | ❌ |
| `settings.integrations` | Réglages | ✅ | ✅ | ❌ | ❌ |

**Feature flags company (que le boss active/désactive globalement) :**

| Clé | Description | Default |
|---|---|---|
| `time_tracking` | Active le module Pointage | `true` |
| `gps_tracking_clock` | Géoloc au clock in/out | `false` |
| `gps_geofencing` | Bloque le clock in hors géofence | `false` |
| `kiosk_mode` | Active le mode kiosque iPad | `false` |
| `break_legal_alerts` | Alertes pauses obligatoires | `true` |
| `overtime_rules` | Calcul auto heures sup | `true` (config 40h/sem QC, 35h FR) |
| `client_hub` | Active le portail client | `true` |
| `online_booking` | Page de booking publique | `false` |
| `auto_invoice_after_job` | Génère facture auto à la complétion | `false` |
| `auto_review_request` | Email demande review post-job | `true` |
| `client_can_choose_optionals` | Items optionnels dans devis | `true` |
| `require_quote_signature` | Force signature avant approbation | `true` |
| `require_timesheet_approval` | Approbation manager avant paie | `true` |

**UI du panneau admin :**

Page `/settings/team` :
- Liste des membres avec rôle, statut (actif/invité/désactivé), dernière activité
- Click sur un membre → drawer/modale avec onglets :
  - **Profil** : nom, email, téléphone, taux horaire, couleur calendrier
  - **Permissions** : liste par catégorie avec toggles, badge "hérité du rôle" vs "surchargé"
    - Bouton "Réinitialiser aux défauts du rôle"
    - Bouton "Verrouiller — empêcher tout changement futur sauf par owner"
  - **Pointage** : peut clock in oui/non, exige géoloc oui/non, taux horaire override
  - **Sécurité** : 2FA forcé, sessions actives, déconnexion forcée

Page `/settings/features` (visible owners + admins) :
- Cards par feature avec toggle
- Pour les features avec config (ex géofencing radius), petit panneau de config qui se déploie
- Indicateur "Disponible avec le plan Pro" si plan insuffisant
- Search + filtre par catégorie

**Application transverse dans le code :**
- Server actions : helper `requirePermission('quotes.delete')` qui throw si l'user n'a pas la permission
- Composants : `<Gate permission="quotes.see_margin">...</Gate>` masque l'UI
- Sidebar : items filtrés selon les permissions de l'utilisateur (un tech voit pas "Factures" si `invoices.view` = false)
- Realtime : si admin change une permission, toast "Tes permissions ont été mises à jour" + refetch

**Audit log obligatoire :**
- Toute modification de permission ou feature flag est loggée dans une table `audit_log`
- Pour la conformité Loi 25 (QC) et RGPD (EU)

---

### Différenciateurs prioritaires (à intégrer transversalement)
1. **Tout en français parfait** (pas du Google Translate)
2. **Taxes QC + EU built-in** (TPS 5%, TVQ 9.975%, TVA 20% etc.)
3. **Prix : 29 / 79 / 149 CAD** (vs Jobber 69 / 169 / 349 USD)
4. **Pas d'add-ons cachés** (SMS, routing, marketing tous inclus dès Pro)
5. **IA native** sur devis et drafts de communication
6. **Onboarding 5 min** avec templates par secteur (paysagement, déneigement, plomberie, ménage, électricité, etc.)

---

## PARTIE 3 — Prompt Claude Code pour MODULE 1 : Devis

> **Comment l'utiliser** : copie-colle ce prompt dans Claude Code à la racine du projet `test-magic`. Claude Code va lire AGENTS.md, examiner le code existant, créer la migration Supabase, les types, les composants UI, les routes serveur et le tout en respectant le design system existant.

---

```text
TÂCHE : Construire le module DEVIS (Quotes) pour le CRM NexaService.

CONTEXTE PROJET :
- Stack : Next.js 16 (App Router) + React 19 + TypeScript + Tailwind 4 + Supabase + shadcn/ui + Framer Motion + Zod + React Hook Form
- Le projet est multi-tenant : chaque ligne BD a un company_id, RLS Supabase isole les tenants via la fonction auth_company_id()
- Lis AGENTS.md AVANT de coder. C'est une version récente de Next.js avec breaking changes. Lis aussi node_modules/next/dist/docs/ pour les conventions actuelles.
- Modules déjà existants : Clients (avec properties, notes, attachments). Examine src/app/(dashboard)/clients/* et src/components/clients/* pour t'aligner sur les patterns existants (composants, naming, structure de fichiers, gestion d'erreurs).

DESIGN SYSTEM (à respecter strictement) :
- Thème dark : background #020c05, accents emerald/teal (emerald-400, teal-400)
- Bordures : border-emerald-900/20 ou /30
- Texte : text-white pour titres, text-white/40 pour secondaires, text-white/70 hover
- Cards : bg-white/[0.02] hover bg-white/[0.05], rounded-2xl, border emerald-900/30
- Animations : Framer Motion sur les apparitions de listes (initial opacity 0 y 20, animate y 0)
- Icons : lucide-react
- Toasts : sonner

OBJECTIF DU MODULE :
Permettre à un utilisateur de créer, envoyer, suivre et gérer des devis pour ses clients. Le devis est la porte d'entrée commerciale. Une fois approuvé, il pourra (Module 2) être converti en job.

LIVRABLES PRÉCIS :

1. MIGRATION SUPABASE
Créer supabase/migrations/002_quotes.sql avec :

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
     tax_mode text not null default 'qc'       -- 'qc' | 'eu' | 'us' | 'none' | 'custom'
       check (tax_mode in ('qc','eu','us','none','custom')),
     -- Totaux (denormalized pour perf, recalculés à chaque save)
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

   create table quote_items (
     id uuid primary key default uuid_generate_v4(),
     quote_id uuid not null references quotes(id) on delete cascade,
     position integer not null,
     description text not null,
     long_description text,
     quantity numeric(10,2) not null default 1,
     unit text default 'unité',
     unit_price numeric(12,2) not null default 0,
     tax_rate_pct numeric(5,3) default 0,        -- ex 14.975 pour QC combiné
     is_optional boolean default false,
     is_selected boolean default true,            -- pour optionnels cochés/décochés
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

   -- Triggers updated_at
   create trigger quotes_updated_at before update on quotes
     for each row execute function update_updated_at();

   -- Fonction de numérotation : Q-AAAA-NNNN par company, séquentiel par année
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

   create policy "quote_items_all" on quote_items for all
     using (exists (
       select 1 from quotes q where q.id = quote_items.quote_id
         and q.company_id = auth_company_id()
     ));

   create policy "quote_attachments_all" on quote_attachments for all
     using (exists (
       select 1 from quotes q where q.id = quote_attachments.quote_id
         and q.company_id = auth_company_id()
     ));

   create policy "quote_templates_all" on quote_templates for all
     using (company_id = auth_company_id());

2. TYPES TYPESCRIPT
   - Étends src/lib/supabase/types.ts avec les nouvelles tables
   - Crée src/lib/quotes/types.ts avec :
     - Quote, QuoteItem, QuoteStatus, TaxMode
     - TAX_PRESETS = { qc: [{label:'TPS', rate:5},{label:'TVQ', rate:9.975}], eu_fr: [{label:'TVA', rate:20}], ... }
   - Schémas Zod dans src/lib/quotes/schemas.ts pour create/update

3. SERVER ACTIONS
   src/lib/quotes/actions.ts (use server) :
   - createQuote(data) → utilise generate_quote_number()
   - updateQuote(id, data)
   - deleteQuote(id)
   - sendQuote(id) → status 'sent', génère un public_token (existant), futur: envoie email
   - markViewed(token) → public, à utiliser depuis page publique
   - approveQuote(id, signature) → status 'approved', signed_at, signed_name
   - rejectQuote(id)
   - duplicateQuote(id)
   Toutes recalculent subtotal / tax_total / total / discount_amount / deposit_amount serveur-side. Ne JAMAIS faire confiance aux totaux envoyés par le client.

4. PAGES
   src/app/(dashboard)/quotes/page.tsx
     - Liste des devis : table responsive avec colonnes Numéro, Client, Date, Statut (badge coloré), Total, Actions (menu)
     - Filtres : statut, client, période
     - Recherche par numéro ou nom client
     - Bouton "Nouveau devis"
     - Empty state engageant si 0 devis

   src/app/(dashboard)/quotes/new/page.tsx
     - Formulaire création (voir composant QuoteEditor)

   src/app/(dashboard)/quotes/[id]/page.tsx
     - Détail / édition d'un devis
     - Sidebar droite : statut + actions (Envoyer, Dupliquer, Convertir en job [disabled si pas approved], Télécharger PDF, Supprimer)
     - Timeline d'événements (créé, envoyé, vu, approuvé)

   src/app/quote/[token]/page.tsx (PUBLIC, hors auth)
     - Vue client du devis avec branding de la company
     - Bouton "Approuver et signer" qui ouvre modal de signature (canvas)
     - Bouton "Refuser"
     - Cocher/décocher les lignes optionnelles → recalcul live
     - Au mount : appelle markViewed(token) une seule fois

5. COMPOSANTS UI
   src/components/quotes/
     - quotes-table.tsx (similaire à clients-table.tsx existant)
     - quote-status-badge.tsx (couleur par statut)
     - quote-editor.tsx (le gros morceau : header avec client/property selector, table d'items éditable inline avec drag-and-drop pour réordonner, totaux à droite, footer avec terms/notes)
     - quote-item-row.tsx (ligne éditable avec quantité, prix, taxe, optionnel toggle)
     - quote-totals-card.tsx (subtotal / discount / taxes / total / dépôt)
     - quote-tax-mode-selector.tsx (dropdown qc/eu/us/none/custom avec preview des taxes)
     - quote-signature-pad.tsx (canvas pour signature client, base64)
     - send-quote-dialog.tsx (futur: composer email, pour l'instant juste copier le lien public)

6. UX EXIGENCES
   - L'éditeur de devis recalcule les totaux EN TEMPS RÉEL côté client (responsive feel) MAIS revalide côté serveur au save
   - Drag-and-drop pour réordonner les items (utilise @dnd-kit/core ou simplement boutons up/down si tu préfères pas ajouter une dépendance)
   - Auto-save draft toutes les 5s (debounced) — sinon explicite "Enregistrer"
   - Touch targets > 44px sur mobile
   - Le numéro de devis est généré côté serveur (jamais côté client)

7. SÉCURITÉ
   - Toutes les pages /quotes/* derrière middleware existant
   - Page publique /quote/[token] : aucune auth, mais ne montre PAS internal_notes ni created_by
   - Server actions : vérifier auth.getUser() ET que la quote.company_id = profile.company_id du user

8. NE FAIS PAS (pour ce module-ci, gardés pour modules suivants) :
   - Génération PDF (sera fait dans Module 3)
   - Envoi email réel (juste copier le lien public pour maintenant)
   - Conversion vers Job (juste un bouton disabled avec tooltip "Disponible bientôt")
   - Génération IA depuis photo/voix (Module 1.5 plus tard)

9. TESTS DE FUMÉE (à faire toi-même avant de me rendre la main)
   - Crée un devis avec 3 items dont 1 optionnel
   - Vérifie que tax_mode='qc' applique TPS+TVQ correctement (14.975% combiné)
   - Marque-le 'sent', copie le lien public, ouvre-le en navigation privée → markViewed s'appelle, optional toggle fonctionne, le total se met à jour, "Approuver" passe le statut à 'approved'
   - Vérifie RLS : connecte-toi avec un autre user d'une autre company → la quote n'est PAS visible

10. À LA FIN
    - Liste les fichiers créés/modifiés
    - Commande exacte pour appliquer la migration (supabase db push ou supabase migration up selon le setup)
    - Noter explicitement ce qui reste TODO pour les modules suivants

CONVENTIONS
- Commits en français, conventional commits ("feat(quotes): ...")
- Pas d'any sauf last resort, et alors avec eslint-disable + commentaire
- Noms de variables et UI en français
- Code et commentaires courts en français OK
- Préférer Server Components quand possible, "use client" seulement où nécessaire (formulaires, drag-and-drop, signature)
```

---

## PARTIE 4 — Comment t'en servir

1. **Sauvegarde ce document** dans le repo (déjà fait : `docs/JOBBER-ANALYSIS-AND-ROADMAP.md`).
2. **Lance Claude Code** dans le dossier `test-magic`.
3. **Copie-colle la PARTIE 3** (le bloc texte du prompt) dans Claude Code.
4. **Laisse-le travailler**, vérifie son output, teste les scénarios de fumée listés.
5. **Reviens me voir** et je te génère le prompt pour le **Module 2 — Jobs / Calendrier**.

### Avant de lancer le prompt, à valider de ton côté
- [ ] Tu as un projet Supabase prêt avec les variables `.env.local` ok
- [ ] La migration 001 est déjà appliquée (les tables clients, properties existent)
- [ ] Tu as au moins 1 client de test dans la BD (pour pouvoir créer un devis)
- [ ] Décide si tu veux `@dnd-kit/core` pour le drag-and-drop ou juste up/down arrows (le prompt laisse le choix au modèle)

### Estimation
Module 1 (Devis) avec ce prompt : ~1500-2500 lignes de code générées, 1 migration, 12-15 fichiers nouveaux, 2-3 modifs. À ton rythme de validation, compte 1-2h de travail collaboratif avec Claude Code.

---

## Récapitulatif rapide de la roadmap mise à jour

| # | Module | Statut |
|---|---|---|
| 0 | Foundation (auth, multi-tenant, clients) | ✅ Fait |
| 1 | Devis (Quotes) | 🔥 Prochain — prompt prêt |
| 2 | Jobs + Calendrier (vue Jour/Semaine/Mois/Carte/Dispatch) | 📅 |
| 2B | Pointage (Clock in/out, géofencing, paie) | ⏱️ |
| 3 | Factures + Paiements (Stripe direct) | 💰 |
| 4 | Communications (email/SMS, templates, drafts IA) | 💬 |
| 5 | Client Hub (portail self-serve) | 🌐 |
| 6 | Online Booking | 📅 |
| 7 | Reports & Analytics | 📊 |
| 8 | App Mobile / PWA Technicien | 📱 |
| 9 | Automatisations / Workflows | ⚡ |
| 10 | Marketing | 📣 |
| 11 | Intégrations (QB, Sage, Calendar, Zapier) | 🔌 |
| 12 | **Admin Panel : Permissions fin grain + Feature toggles** | 🎛️ |

**Note sur l'ordre** : le Module 12 (Admin Panel) peut sembler tardif, mais la **fondation des permissions** (table `permission_catalog` + helper `user_has_permission()` + guards `requirePermission()`) **doit être posée tôt — idéalement en parallèle du Module 1 ou au début du Module 2**. Sinon tu vas devoir refactoriser tout le code chaque module pour insérer les vérifications. La grosse UI du panneau admin peut attendre, mais l'infra technique non.

**Recommandation pratique** : ajoute un mini "Module 1.5 — Permissions Foundation" entre 1 et 2, qui crée juste les tables + helper + composant `<Gate>` + helper server `requirePermission()`. Ça prend 1-2h et ça te sauve des semaines plus tard. Dis-moi et je te génère ce prompt aussi.
