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
      matches: {
        Row: {
          compatibility_score: number
          created_at: string
          id: string
          match_reasons: string[] | null
          profile_id: string
          program_id: string
        }
        Insert: {
          compatibility_score: number
          created_at?: string
          id?: string
          match_reasons?: string[] | null
          profile_id: string
          program_id: string
        }
        Update: {
          compatibility_score?: number
          created_at?: string
          id?: string
          match_reasons?: string[] | null
          profile_id?: string
          program_id?: string
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
          created_at: string
          credits_taken: number | null
          current_education_level: string | null
          current_field_of_study: string | null
          current_gpa: number | null
          current_institution: string | null
          email: string | null
          full_name: string | null
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
          created_at?: string
          credits_taken?: number | null
          current_education_level?: string | null
          current_field_of_study?: string | null
          current_gpa?: number | null
          current_institution?: string | null
          email?: string | null
          full_name?: string | null
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
          created_at?: string
          credits_taken?: number | null
          current_education_level?: string | null
          current_field_of_study?: string | null
          current_gpa?: number | null
          current_institution?: string | null
          email?: string | null
          full_name?: string | null
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
      programs: {
        Row: {
          application_deadline: string | null
          created_at: string
          degree_type: string
          description: string | null
          duration_semesters: number
          ects_credits: number | null
          field_of_study: string
          id: string
          language_requirements: string[] | null
          minimum_gpa: number | null
          name: string
          prerequisites: string[] | null
          semester_start: string | null
          tuition_fees: number | null
          university_id: string
        }
        Insert: {
          application_deadline?: string | null
          created_at?: string
          degree_type: string
          description?: string | null
          duration_semesters: number
          ects_credits?: number | null
          field_of_study: string
          id?: string
          language_requirements?: string[] | null
          minimum_gpa?: number | null
          name: string
          prerequisites?: string[] | null
          semester_start?: string | null
          tuition_fees?: number | null
          university_id: string
        }
        Update: {
          application_deadline?: string | null
          created_at?: string
          degree_type?: string
          description?: string | null
          duration_semesters?: number
          ects_credits?: number | null
          field_of_study?: string
          id?: string
          language_requirements?: string[] | null
          minimum_gpa?: number | null
          name?: string
          prerequisites?: string[] | null
          semester_start?: string | null
          tuition_fees?: number | null
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
            foreignKeyName: "saved_programs_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      universities: {
        Row: {
          city: string
          created_at: string
          id: string
          logo_url: string | null
          name: string
          ranking: number | null
          type: string | null
          website: string | null
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          ranking?: number | null
          type?: string | null
          website?: string | null
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          ranking?: number | null
          type?: string | null
          website?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
