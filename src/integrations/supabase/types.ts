export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      ambassadors: {
        Row: {
          city_id: string | null
          created_at: string | null
          full_name: string
          id: string
          is_published: boolean | null
          languages: string[] | null
          linkedin_url: string | null
          photo_url: string | null
          profile_id: string | null
          slug: string
          study_programs: string[] | null
          testimonial: string | null
          university_id: string | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          city_id?: string | null
          created_at?: string | null
          full_name: string
          id?: string
          is_published?: boolean | null
          languages?: string[] | null
          linkedin_url?: string | null
          photo_url?: string | null
          profile_id?: string | null
          slug: string
          study_programs?: string[] | null
          testimonial?: string | null
          university_id?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          city_id?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          is_published?: boolean | null
          languages?: string[] | null
          linkedin_url?: string | null
          photo_url?: string | null
          profile_id?: string | null
          slug?: string
          study_programs?: string[] | null
          testimonial?: string | null
          university_id?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ambassadors_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassadors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassadors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassadors_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      application_periods: {
        Row: {
          application_end_date: string
          application_start_date: string
          created_at: string
          id: string
          intake_season: Database["public"]["Enums"]["intake_season"]
          intake_year: number
          is_active: boolean | null
          notes: string | null
          program_id: string
          semester_start_date: string
          updated_at: string
        }
        Insert: {
          application_end_date: string
          application_start_date: string
          created_at?: string
          id?: string
          intake_season: Database["public"]["Enums"]["intake_season"]
          intake_year: number
          is_active?: boolean | null
          notes?: string | null
          program_id: string
          semester_start_date: string
          updated_at?: string
        }
        Update: {
          application_end_date?: string
          application_start_date?: string
          created_at?: string
          id?: string
          intake_season?: Database["public"]["Enums"]["intake_season"]
          intake_year?: number
          is_active?: boolean | null
          notes?: string | null
          program_id?: string
          semester_start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_data: Json | null
          old_data: Json | null
          operation: string
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          operation: string
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          operation?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cities: {
        Row: {
          country_code: string
          created_at: string | null
          id: string
          lat: number | null
          lng: number | null
          metadata: Json | null
          name: string
          search_doc: Json | null
          slug: string
          state: string | null
        }
        Insert: {
          country_code?: string
          created_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          metadata?: Json | null
          name: string
          search_doc?: Json | null
          slug: string
          state?: string | null
        }
        Update: {
          country_code?: string
          created_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          metadata?: Json | null
          name?: string
          search_doc?: Json | null
          slug?: string
          state?: string | null
        }
        Relationships: []
      }
      matches: {
        Row: {
          compatibility_score: number
          components: Json | null
          created_at: string
          id: string
          match_reasons: string[] | null
          profile_id: string
          program_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          compatibility_score: number
          components?: Json | null
          created_at?: string
          id?: string
          match_reasons?: string[] | null
          profile_id: string
          program_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          compatibility_score?: number
          components?: Json | null
          created_at?: string
          id?: string
          match_reasons?: string[] | null
          profile_id?: string
          program_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          career_goals: string | null
          country_code: string | null
          created_at: string
          credits_taken: number | null
          current_education_level: string | null
          current_field_of_study: string | null
          current_gpa: number | null
          current_institution: string | null
          date_of_birth: string | null
          email: string | null
          full_name: string | null
          gender: string | null
          id: string
          language_certificates: string[] | null
          nationality: string | null
          phone: string | null
          preferred_cities: string[] | null
          preferred_degree_type: string | null
          preferred_fields: string[] | null
          thesis_topic: string | null
          updated_at: string
        }
        Insert: {
          career_goals?: string | null
          country_code?: string | null
          created_at?: string
          credits_taken?: number | null
          current_education_level?: string | null
          current_field_of_study?: string | null
          current_gpa?: number | null
          current_institution?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          language_certificates?: string[] | null
          nationality?: string | null
          phone?: string | null
          preferred_cities?: string[] | null
          preferred_degree_type?: string | null
          preferred_fields?: string[] | null
          thesis_topic?: string | null
          updated_at?: string
        }
        Update: {
          career_goals?: string | null
          country_code?: string | null
          created_at?: string
          credits_taken?: number | null
          current_education_level?: string | null
          current_field_of_study?: string | null
          current_gpa?: number | null
          current_institution?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          language_certificates?: string[] | null
          nationality?: string | null
          phone?: string | null
          preferred_cities?: string[] | null
          preferred_degree_type?: string | null
          preferred_fields?: string[] | null
          thesis_topic?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      program_deadlines: {
        Row: {
          application_deadline: string
          created_at: string | null
          id: string
          intake: string
          notes: string | null
          program_id: string
        }
        Insert: {
          application_deadline: string
          created_at?: string | null
          id?: string
          intake: string
          notes?: string | null
          program_id: string
        }
        Update: {
          application_deadline?: string
          created_at?: string | null
          id?: string
          intake?: string
          notes?: string | null
          program_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_deadlines_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_matches: {
        Row: {
          components: Json | null
          created_at: string | null
          profile_id: string
          program_id: string
          score: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          components?: Json | null
          created_at?: string | null
          profile_id: string
          program_id: string
          score?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          components?: Json | null
          created_at?: string | null
          profile_id?: string
          program_id?: string
          score?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_matches_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_matches_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_matches_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_requirements: {
        Row: {
          created_at: string | null
          details: Json
          id: string
          program_id: string
          requirement_type: string
        }
        Insert: {
          created_at?: string | null
          details?: Json
          id?: string
          program_id: string
          requirement_type: string
        }
        Update: {
          created_at?: string | null
          details?: Json
          id?: string
          program_id?: string
          requirement_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_requirements_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          application_deadline: string | null
          country_code: string | null
          created_at: string
          degree_level: Database["public"]["Enums"]["degree_level"] | null
          degree_type: string
          delivery_mode: string | null
          description: string | null
          duration_semesters: number
          ects_credits: number | null
          field_of_study: string
          id: string
          language_of_instruction: string[] | null
          language_requirements: string[] | null
          metadata: Json | null
          minimum_gpa: number | null
          name: string
          prerequisites: string[] | null
          published: boolean | null
          search_doc: Json | null
          semester_start: string | null
          slug: string | null
          tuition_fees: number | null
          uni_assist_required: boolean | null
          university_id: string
        }
        Insert: {
          application_deadline?: string | null
          country_code?: string | null
          created_at?: string
          degree_level?: Database["public"]["Enums"]["degree_level"] | null
          degree_type: string
          delivery_mode?: string | null
          description?: string | null
          duration_semesters: number
          ects_credits?: number | null
          field_of_study: string
          id?: string
          language_of_instruction?: string[] | null
          language_requirements?: string[] | null
          metadata?: Json | null
          minimum_gpa?: number | null
          name: string
          prerequisites?: string[] | null
          published?: boolean | null
          search_doc?: Json | null
          semester_start?: string | null
          slug?: string | null
          tuition_fees?: number | null
          uni_assist_required?: boolean | null
          university_id: string
        }
        Update: {
          application_deadline?: string | null
          country_code?: string | null
          created_at?: string
          degree_level?: Database["public"]["Enums"]["degree_level"] | null
          degree_type?: string
          delivery_mode?: string | null
          description?: string | null
          duration_semesters?: number
          ects_credits?: number | null
          field_of_study?: string
          id?: string
          language_of_instruction?: string[] | null
          language_requirements?: string[] | null
          metadata?: Json | null
          minimum_gpa?: number | null
          name?: string
          prerequisites?: string[] | null
          published?: boolean | null
          search_doc?: Json | null
          semester_start?: string | null
          slug?: string | null
          tuition_fees?: number | null
          uni_assist_required?: boolean | null
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "programs_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_programs: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          program_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          program_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          program_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_programs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_programs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_programs_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      service_packages: {
        Row: {
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          package_type: Database["public"]["Enums"]["package_type"]
          price_eur: number
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          package_type: Database["public"]["Enums"]["package_type"]
          price_eur?: number
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          package_type?: Database["public"]["Enums"]["package_type"]
          price_eur?: number
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      student_academics: {
        Row: {
          created_at: string | null
          curriculum: string | null
          ects_total: number | null
          extras: Json | null
          gpa_de: number | null
          gpa_min_pass: number | null
          gpa_raw: number | null
          gpa_scale_max: number | null
          language_certificates: Json | null
          prev_major: string | null
          profile_id: string
          target_intake: string | null
          target_level: Database["public"]["Enums"]["degree_level"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          curriculum?: string | null
          ects_total?: number | null
          extras?: Json | null
          gpa_de?: number | null
          gpa_min_pass?: number | null
          gpa_raw?: number | null
          gpa_scale_max?: number | null
          language_certificates?: Json | null
          prev_major?: string | null
          profile_id: string
          target_intake?: string | null
          target_level?: Database["public"]["Enums"]["degree_level"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          curriculum?: string | null
          ects_total?: number | null
          extras?: Json | null
          gpa_de?: number | null
          gpa_min_pass?: number | null
          gpa_raw?: number | null
          gpa_scale_max?: number | null
          language_certificates?: Json | null
          prev_major?: string | null
          profile_id?: string
          target_intake?: string | null
          target_level?: Database["public"]["Enums"]["degree_level"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_academics_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_academics_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "safe_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      universities: {
        Row: {
          city: string
          city_id: string | null
          country_code: string | null
          created_at: string
          external_refs: Json | null
          id: string
          lat: number | null
          lng: number | null
          logo_url: string | null
          name: string
          ranking: number | null
          slug: string | null
          type: string | null
          website: string | null
        }
        Insert: {
          city: string
          city_id?: string | null
          country_code?: string | null
          created_at?: string
          external_refs?: Json | null
          id?: string
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name: string
          ranking?: number | null
          slug?: string | null
          type?: string | null
          website?: string | null
        }
        Update: {
          city?: string
          city_id?: string | null
          country_code?: string | null
          created_at?: string
          external_refs?: Json | null
          id?: string
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name?: string
          ranking?: number | null
          slug?: string | null
          type?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "universities_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_applications: {
        Row: {
          application_period_id: string
          applied_at: string | null
          created_at: string
          id: string
          metadata: Json | null
          profile_id: string
          program_id: string
          service_package_id: string | null
          status: Database["public"]["Enums"]["application_status"] | null
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          application_period_id: string
          applied_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          profile_id: string
          program_id: string
          service_package_id?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          application_period_id?: string
          applied_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          profile_id?: string
          program_id?: string
          service_package_id?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          profile_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          profile_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string | null
          id?: string
          profile_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      watchlist: {
        Row: {
          created_at: string | null
          profile_id: string
          program_id: string
        }
        Insert: {
          created_at?: string | null
          profile_id: string
          program_id: string
        }
        Update: {
          created_at?: string | null
          profile_id?: string
          program_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watchlist_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watchlist_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      safe_profiles: {
        Row: {
          career_goals: string | null
          country_code: string | null
          created_at: string | null
          credits_taken: number | null
          current_education_level: string | null
          current_field_of_study: string | null
          current_gpa: number | null
          current_institution: string | null
          date_of_birth: string | null
          email: string | null
          full_name: string | null
          gender: string | null
          id: string | null
          language_certificates: string[] | null
          nationality: string | null
          phone: string | null
          preferred_cities: string[] | null
          preferred_degree_type: string | null
          preferred_fields: string[] | null
          thesis_topic: string | null
          updated_at: string | null
        }
        Insert: {
          career_goals?: string | null
          country_code?: string | null
          created_at?: string | null
          credits_taken?: number | null
          current_education_level?: string | null
          current_field_of_study?: string | null
          current_gpa?: number | null
          current_institution?: string | null
          date_of_birth?: never
          email?: never
          full_name?: never
          gender?: string | null
          id?: string | null
          language_certificates?: string[] | null
          nationality?: string | null
          phone?: never
          preferred_cities?: string[] | null
          preferred_degree_type?: string | null
          preferred_fields?: string[] | null
          thesis_topic?: string | null
          updated_at?: string | null
        }
        Update: {
          career_goals?: string | null
          country_code?: string | null
          created_at?: string | null
          credits_taken?: number | null
          current_education_level?: string | null
          current_field_of_study?: string | null
          current_gpa?: number | null
          current_institution?: string | null
          date_of_birth?: never
          email?: never
          full_name?: never
          gender?: string | null
          id?: string | null
          language_certificates?: string[] | null
          nationality?: string | null
          phone?: never
          preferred_cities?: string[] | null
          preferred_degree_type?: string | null
          preferred_fields?: string[] | null
          thesis_topic?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_access_profile: {
        Args: { profile_id: string }
        Returns: boolean
      }
      get_current_application_period: {
        Args: { program_uuid: string }
        Returns: {
          application_end_date: string
          application_start_date: string
          id: string
          intake_season: Database["public"]["Enums"]["intake_season"]
          intake_year: number
          semester_start_date: string
          status: string
        }[]
      }
      get_next_application_period: {
        Args: { program_uuid: string }
        Returns: {
          application_end_date: string
          application_start_date: string
          id: string
          intake_season: Database["public"]["Enums"]["intake_season"]
          intake_year: number
          semester_start_date: string
        }[]
      }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      has_role_by_profile: {
        Args: {
          _profile_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      secure_update_profile: {
        Args: { new_data: Json; profile_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role:
        | "student"
        | "parent"
        | "school_counselor"
        | "university_staff"
        | "company_sales"
        | "company_admissions"
        | "marketing"
        | "admin"
      application_status:
        | "not_started"
        | "in_progress"
        | "submitted"
        | "under_review"
        | "accepted"
        | "rejected"
        | "waitlisted"
      degree_level: "bachelor" | "master"
      intake_season: "winter" | "summer" | "spring" | "fall"
      package_type: "basic" | "standard" | "premium" | "vip"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "student",
        "parent",
        "school_counselor",
        "university_staff",
        "company_sales",
        "company_admissions",
        "marketing",
        "admin",
      ],
      application_status: [
        "not_started",
        "in_progress",
        "submitted",
        "under_review",
        "accepted",
        "rejected",
        "waitlisted",
      ],
      degree_level: ["bachelor", "master"],
      intake_season: ["winter", "summer", "spring", "fall"],
      package_type: ["basic", "standard", "premium", "vip"],
    },
  },
} as const
