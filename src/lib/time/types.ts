export type ClockSource = "app" | "web" | "manual" | "kiosk";

export interface TimeEntry {
  id: string;
  company_id: string;
  profile_id: string;
  visit_id: string | null;
  job_id: string | null;
  clock_in_at: string;
  clock_out_at: string | null;
  clock_in_lat: number | null;
  clock_in_lng: number | null;
  clock_in_accuracy_m: number | null;
  clock_out_lat: number | null;
  clock_out_lng: number | null;
  clock_out_accuracy_m: number | null;
  duration_minutes: number | null; // généré par BD
  break_minutes: number;
  billable: boolean;
  hourly_rate: number | null;
  approved_at: string | null;
  approved_by: string | null;
  edited_by: string | null;
  edited_at: string | null;
  edit_reason: string | null;
  notes: string | null;
  source: ClockSource;
  created_at: string;
}

export interface Break {
  id: string;
  time_entry_id: string;
  start_at: string;
  end_at: string | null;
  duration_minutes: number | null; // généré par BD
  type: "paid" | "unpaid";
}

/** Résumé d'une semaine pour un profil */
export interface WeekSummary {
  total_minutes: number;
  billable_minutes: number;
  break_minutes: number;
  entries: TimeEntryWithRelations[];
}

export interface TimeEntryWithRelations extends TimeEntry {
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    color: string;
  } | null;
  visits?: {
    scheduled_start: string;
    jobs?: { title: string; number: string } | null;
  } | null;
  breaks?: Break[];
}
