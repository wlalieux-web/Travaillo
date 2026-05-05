export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ClientType = "residential" | "commercial";
export type ClientStatus = "active" | "inactive" | "prospect" | "archived";
export type UserRole = "owner" | "admin" | "technician" | "office";
export type CompanyPlan = "free" | "starter" | "pro" | "enterprise";

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          phone: string | null;
          address: string | null;
          city: string | null;
          country: string;
          currency: string;
          timezone: string;
          logo_url: string | null;
          plan: CompanyPlan;
          stripe_customer_id: string | null;
          trial_ends_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["companies"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["companies"]["Insert"]>;
      };
      profiles: {
        Row: {
          id: string;
          company_id: string | null;
          role: UserRole;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          phone: string | null;
          avatar_url: string | null;
          color: string;
          is_active: boolean;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      clients: {
        Row: {
          id: string;
          company_id: string;
          type: ClientType;
          status: ClientStatus;
          first_name: string | null;
          last_name: string | null;
          company_name: string | null;
          email: string | null;
          phone: string | null;
          phone_alt: string | null;
          billing_address: string | null;
          billing_city: string | null;
          billing_province: string | null;
          billing_postal_code: string | null;
          billing_country: string;
          tags: string[];
          source: string | null;
          notes: string | null;
          balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["clients"]["Row"], "id" | "created_at" | "updated_at" | "balance">;
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
      };
      properties: {
        Row: {
          id: string;
          company_id: string;
          client_id: string;
          name: string | null;
          address: string;
          city: string | null;
          province: string | null;
          postal_code: string | null;
          country: string;
          property_type: string | null;
          size_sqft: number | null;
          notes: string | null;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["properties"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["properties"]["Insert"]>;
      };
      client_notes: {
        Row: {
          id: string;
          company_id: string;
          client_id: string;
          author_id: string | null;
          content: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["client_notes"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["client_notes"]["Insert"]>;
      };
      client_attachments: {
        Row: {
          id: string;
          company_id: string;
          client_id: string;
          uploaded_by: string | null;
          file_name: string;
          file_url: string;
          file_size: number | null;
          mime_type: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["client_attachments"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["client_attachments"]["Insert"]>;
      };
    };
  };
}

export type Company = Database["public"]["Tables"]["companies"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type Property = Database["public"]["Tables"]["properties"]["Row"];
export type ClientNote = Database["public"]["Tables"]["client_notes"]["Row"];
