export type JobType = "one_off" | "recurring";
export type JobStatus = "draft" | "scheduled" | "in_progress" | "completed" | "cancelled" | "archived";
export type VisitStatus = "scheduled" | "en_route" | "in_progress" | "completed" | "cancelled" | "rescheduled" | "no_show";

export interface Job {
  id: string;
  company_id: string;
  client_id: string;
  property_id: string | null;
  quote_id: string | null;
  number: string;
  title: string;
  description: string | null;
  type: JobType;
  status: JobStatus;
  recurrence_rule: string | null;
  recurrence_start: string | null;
  recurrence_end: string | null;
  estimated_duration_minutes: number | null;
  estimated_cost: number | null;
  total: number;
  currency: string;
  internal_notes: string | null;
  client_instructions: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Visit {
  id: string;
  company_id: string;
  job_id: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start: string | null;
  actual_end: string | null;
  status: VisitStatus;
  sequence_number: number | null;
  override_address: string | null;
  override_lat: number | null;
  override_lng: number | null;
  client_notified_at: string | null;
  on_the_way_at: string | null;
  arrived_at: string | null;
  technician_notes: string | null;
  client_signature_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface VisitAssignment {
  visit_id: string;
  profile_id: string;
  is_primary: boolean;
  assigned_at: string;
}

export interface VisitPhoto {
  id: string;
  visit_id: string;
  uploaded_by: string | null;
  url: string;
  type: "before" | "during" | "after" | "other" | null;
  caption: string | null;
  taken_at: string;
}

export interface VisitForm {
  id: string;
  visit_id: string;
  fields: FormField[];
  completed_at: string | null;
  created_at: string;
}

export interface FormField {
  key: string;
  label: string;
  type: "checkbox" | "text" | "number";
  value: string | boolean | number | null;
  required: boolean;
}

/** Job avec relations jointes pour l'affichage */
export interface JobWithRelations extends Job {
  clients?: {
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
  } | null;
  properties?: {
    address: string;
    city: string | null;
    lat?: number | null;
    lng?: number | null;
  } | null;
  next_visit?: Visit | null;
}

/** Visite avec relations jointes */
export interface VisitWithRelations extends Visit {
  jobs?: {
    title: string;
    number: string;
    clients?: {
      first_name: string | null;
      last_name: string | null;
      company_name: string | null;
    } | null;
    properties?: {
      address: string;
      city: string | null;
      override_lat?: number | null;
      override_lng?: number | null;
    } | null;
  } | null;
  visit_assignments?: Array<{
    profile_id: string;
    is_primary: boolean;
    profiles?: {
      first_name: string | null;
      last_name: string | null;
      color: string;
      avatar_url: string | null;
    } | null;
  }>;
}
