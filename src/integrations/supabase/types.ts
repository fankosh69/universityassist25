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
      academic_preferences: {
        Row: {
          accommodation_preferences: Json | null
          budget_range: string | null
          career_goals: string | null
          created_at: string
          id: string
          preferred_cities: string[] | null
          preferred_degree_type: string | null
          preferred_fields: string[] | null
          preferred_language_of_instruction: string[] | null
          preferred_start_date: string | null
          study_motivations: string[] | null
          updated_at: string
        }
        Insert: {
          accommodation_preferences?: Json | null
          budget_range?: string | null
          career_goals?: string | null
          created_at?: string
          id: string
          preferred_cities?: string[] | null
          preferred_degree_type?: string | null
          preferred_fields?: string[] | null
          preferred_language_of_instruction?: string[] | null
          preferred_start_date?: string | null
          study_motivations?: string[] | null
          updated_at?: string
        }
        Update: {
          accommodation_preferences?: Json | null
          budget_range?: string | null
          career_goals?: string | null
          created_at?: string
          id?: string
          preferred_cities?: string[] | null
          preferred_degree_type?: string | null
          preferred_fields?: string[] | null
          preferred_language_of_instruction?: string[] | null
          preferred_start_date?: string | null
          study_motivations?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      admission_patterns: {
        Row: {
          confidence_level: string | null
          country_filter: string | null
          generated_at: string | null
          generated_by_ai_model: string | null
          id: string
          insights: Json
          last_updated: string | null
          pattern_type: string
          program_id: string | null
          sample_size: number | null
          university_id: string | null
        }
        Insert: {
          confidence_level?: string | null
          country_filter?: string | null
          generated_at?: string | null
          generated_by_ai_model?: string | null
          id?: string
          insights: Json
          last_updated?: string | null
          pattern_type: string
          program_id?: string | null
          sample_size?: number | null
          university_id?: string | null
        }
        Update: {
          confidence_level?: string | null
          country_filter?: string | null
          generated_at?: string | null
          generated_by_ai_model?: string | null
          id?: string
          insights?: Json
          last_updated?: string | null
          pattern_type?: string
          program_id?: string | null
          sample_size?: number | null
          university_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admission_patterns_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admission_patterns_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      admission_requirements_by_country: {
        Row: {
          accepts_english: boolean | null
          additional_notes: string | null
          aps_certificate_required: boolean | null
          country_code: string
          country_name: string
          created_at: string | null
          degree_level: Database["public"]["Enums"]["degree_level"]
          direct_admission_criteria: Json | null
          education_system: Database["public"]["Enums"]["education_system"]
          entrance_exam_required: boolean | null
          id: string
          last_updated: string | null
          min_english_level: string | null
          min_german_level: string | null
          required_documents: string[] | null
          source_url: string | null
          studienkolleg_criteria: Json | null
        }
        Insert: {
          accepts_english?: boolean | null
          additional_notes?: string | null
          aps_certificate_required?: boolean | null
          country_code: string
          country_name: string
          created_at?: string | null
          degree_level: Database["public"]["Enums"]["degree_level"]
          direct_admission_criteria?: Json | null
          education_system: Database["public"]["Enums"]["education_system"]
          entrance_exam_required?: boolean | null
          id?: string
          last_updated?: string | null
          min_english_level?: string | null
          min_german_level?: string | null
          required_documents?: string[] | null
          source_url?: string | null
          studienkolleg_criteria?: Json | null
        }
        Update: {
          accepts_english?: boolean | null
          additional_notes?: string | null
          aps_certificate_required?: boolean | null
          country_code?: string
          country_name?: string
          created_at?: string | null
          degree_level?: Database["public"]["Enums"]["degree_level"]
          direct_admission_criteria?: Json | null
          education_system?: Database["public"]["Enums"]["education_system"]
          entrance_exam_required?: boolean | null
          id?: string
          last_updated?: string | null
          min_english_level?: string | null
          min_german_level?: string | null
          required_documents?: string[] | null
          source_url?: string | null
          studienkolleg_criteria?: Json | null
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          collected_data: Json | null
          created_at: string | null
          id: string
          profile_completion_progress: Json | null
          profile_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          collected_data?: Json | null
          created_at?: string | null
          id?: string
          profile_completion_progress?: Json | null
          profile_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          collected_data?: Json | null
          created_at?: string | null
          id?: string
          profile_completion_progress?: Json | null
          profile_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
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
            foreignKeyName: "ambassadors_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "city_stats"
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
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          operation?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_private_profile_data: {
        Row: {
          country_code: string | null
          created_at: string | null
          data_processing_consent: boolean | null
          date_of_birth: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          full_name: string | null
          gender: string | null
          id: string | null
          last_security_audit: string | null
          marketing_consent: boolean | null
          nationality: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string | null
          data_processing_consent?: boolean | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string | null
          last_security_audit?: string | null
          marketing_consent?: boolean | null
          nationality?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string | null
          data_processing_consent?: boolean | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string | null
          last_security_audit?: string | null
          marketing_consent?: boolean | null
          nationality?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cities: {
        Row: {
          city_type: string | null
          country_code: string
          created_at: string | null
          description: string | null
          fts: unknown
          id: string
          keywords: string[] | null
          lat: number | null
          lng: number | null
          metadata: Json | null
          name: string
          population_asof: string | null
          population_total: number | null
          region: string | null
          region_code: string | null
          region_id: string | null
          search_doc: Json | null
          slug: string
          state: string | null
          wikidata_qid: string | null
        }
        Insert: {
          city_type?: string | null
          country_code?: string
          created_at?: string | null
          description?: string | null
          fts?: unknown
          id?: string
          keywords?: string[] | null
          lat?: number | null
          lng?: number | null
          metadata?: Json | null
          name: string
          population_asof?: string | null
          population_total?: number | null
          region?: string | null
          region_code?: string | null
          region_id?: string | null
          search_doc?: Json | null
          slug: string
          state?: string | null
          wikidata_qid?: string | null
        }
        Update: {
          city_type?: string | null
          country_code?: string
          created_at?: string | null
          description?: string | null
          fts?: unknown
          id?: string
          keywords?: string[] | null
          lat?: number | null
          lng?: number | null
          metadata?: Json | null
          name?: string
          population_asof?: string | null
          population_total?: number | null
          region?: string | null
          region_code?: string | null
          region_id?: string | null
          search_doc?: Json | null
          slug?: string
          state?: string | null
          wikidata_qid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cities_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      consultations: {
        Row: {
          consultation_type: string
          contacted_at: string | null
          created_at: string
          id: string
          notes: Json | null
          profile_id: string
          program_id: string
          status: string
          updated_at: string
        }
        Insert: {
          consultation_type?: string
          contacted_at?: string | null
          created_at?: string
          id?: string
          notes?: Json | null
          profile_id: string
          program_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          consultation_type?: string
          contacted_at?: string | null
          created_at?: string
          id?: string
          notes?: Json | null
          profile_id?: string
          program_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          contract_data: Json | null
          contract_number: string
          contract_template_url: string | null
          created_at: string | null
          id: string
          profile_id: string
          sales_lead_id: string | null
          sent_at: string | null
          sent_by: string | null
          service_package_id: string | null
          signature_ip: string | null
          signed_at: string | null
          signed_contract_url: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          contract_data?: Json | null
          contract_number: string
          contract_template_url?: string | null
          created_at?: string | null
          id?: string
          profile_id: string
          sales_lead_id?: string | null
          sent_at?: string | null
          sent_by?: string | null
          service_package_id?: string | null
          signature_ip?: string | null
          signed_at?: string | null
          signed_contract_url?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          contract_data?: Json | null
          contract_number?: string
          contract_template_url?: string | null
          created_at?: string | null
          id?: string
          profile_id?: string
          sales_lead_id?: string | null
          sent_at?: string | null
          sent_by?: string | null
          service_package_id?: string | null
          signature_ip?: string | null
          signed_at?: string | null
          signed_contract_url?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_sales_lead_id_fkey"
            columns: ["sales_lead_id"]
            isOneToOne: false
            referencedRelation: "sales_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_service_package_id_fkey"
            columns: ["service_package_id"]
            isOneToOne: false
            referencedRelation: "service_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      document_extractions: {
        Row: {
          admin_corrections: Json | null
          document_id: string
          extracted_at: string | null
          extracted_courses: Json | null
          extracted_dates: Json | null
          extracted_gpa: number | null
          extracted_language_scores: Json | null
          extraction_method: string | null
          id: string
          ocr_confidence_score: number | null
          raw_text: string | null
          reviewed_at: string | null
          reviewed_by_admin: boolean | null
          structured_data: Json | null
        }
        Insert: {
          admin_corrections?: Json | null
          document_id: string
          extracted_at?: string | null
          extracted_courses?: Json | null
          extracted_dates?: Json | null
          extracted_gpa?: number | null
          extracted_language_scores?: Json | null
          extraction_method?: string | null
          id?: string
          ocr_confidence_score?: number | null
          raw_text?: string | null
          reviewed_at?: string | null
          reviewed_by_admin?: boolean | null
          structured_data?: Json | null
        }
        Update: {
          admin_corrections?: Json | null
          document_id?: string
          extracted_at?: string | null
          extracted_courses?: Json | null
          extracted_dates?: Json | null
          extracted_gpa?: number | null
          extracted_language_scores?: Json | null
          extraction_method?: string | null
          id?: string
          ocr_confidence_score?: number | null
          raw_text?: string | null
          reviewed_at?: string | null
          reviewed_by_admin?: boolean | null
          structured_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "document_extractions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "student_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      eligibility_checks: {
        Row: {
          check_date: string | null
          country_of_origin: string
          education_system: Database["public"]["Enums"]["education_system"]
          eligibility_status: Database["public"]["Enums"]["eligibility_pathway"]
          eligible_programs: string[] | null
          grades_data: Json | null
          has_aps_certificate: boolean | null
          highest_education_level: string
          id: string
          ip_address: unknown
          language_certificates: Json | null
          missing_requirements: string[] | null
          profile_id: string | null
          recommended_actions: string[] | null
          target_degree_level: Database["public"]["Enums"]["degree_level"]
          user_agent: string | null
        }
        Insert: {
          check_date?: string | null
          country_of_origin: string
          education_system: Database["public"]["Enums"]["education_system"]
          eligibility_status: Database["public"]["Enums"]["eligibility_pathway"]
          eligible_programs?: string[] | null
          grades_data?: Json | null
          has_aps_certificate?: boolean | null
          highest_education_level: string
          id?: string
          ip_address?: unknown
          language_certificates?: Json | null
          missing_requirements?: string[] | null
          profile_id?: string | null
          recommended_actions?: string[] | null
          target_degree_level: Database["public"]["Enums"]["degree_level"]
          user_agent?: string | null
        }
        Update: {
          check_date?: string | null
          country_of_origin?: string
          education_system?: Database["public"]["Enums"]["education_system"]
          eligibility_status?: Database["public"]["Enums"]["eligibility_pathway"]
          eligible_programs?: string[] | null
          grades_data?: Json | null
          has_aps_certificate?: boolean | null
          highest_education_level?: string
          id?: string
          ip_address?: unknown
          language_certificates?: Json | null
          missing_requirements?: string[] | null
          profile_id?: string | null
          recommended_actions?: string[] | null
          target_degree_level?: Database["public"]["Enums"]["degree_level"]
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eligibility_checks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fields_of_study: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          level: number
          name: string
          name_ar: string | null
          name_de: string | null
          parent_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          level: number
          name: string
          name_ar?: string | null
          name_de?: string | null
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          level?: number
          name?: string
          name_ar?: string | null
          name_de?: string | null
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fields_of_study_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "fields_of_study"
            referencedColumns: ["id"]
          },
        ]
      }
      historical_applications: {
        Row: {
          acceptance_conditions: string | null
          additional_test_scores: Json | null
          application_date: string | null
          application_semester: string | null
          country_of_origin: string
          created_at: string | null
          created_by: string | null
          curriculum: string | null
          data_completeness_score: number | null
          education_level: string
          extra_qualifications: Json | null
          gpa_converted_german: number | null
          gpa_min_pass: number | null
          gpa_raw: number | null
          gpa_scale_max: number | null
          had_aps_certificate: boolean | null
          id: string
          language_certificates: Json | null
          nationality: string
          notes: string | null
          outcome: string
          passed_studienkolleg: boolean | null
          previous_degree_field: string | null
          program_id: string | null
          program_name: string
          rejection_reason: string | null
          student_identifier: string | null
          university_name: string
          updated_at: string | null
          verified_by_admin: boolean | null
          work_experience_years: number | null
        }
        Insert: {
          acceptance_conditions?: string | null
          additional_test_scores?: Json | null
          application_date?: string | null
          application_semester?: string | null
          country_of_origin: string
          created_at?: string | null
          created_by?: string | null
          curriculum?: string | null
          data_completeness_score?: number | null
          education_level: string
          extra_qualifications?: Json | null
          gpa_converted_german?: number | null
          gpa_min_pass?: number | null
          gpa_raw?: number | null
          gpa_scale_max?: number | null
          had_aps_certificate?: boolean | null
          id?: string
          language_certificates?: Json | null
          nationality: string
          notes?: string | null
          outcome: string
          passed_studienkolleg?: boolean | null
          previous_degree_field?: string | null
          program_id?: string | null
          program_name: string
          rejection_reason?: string | null
          student_identifier?: string | null
          university_name: string
          updated_at?: string | null
          verified_by_admin?: boolean | null
          work_experience_years?: number | null
        }
        Update: {
          acceptance_conditions?: string | null
          additional_test_scores?: Json | null
          application_date?: string | null
          application_semester?: string | null
          country_of_origin?: string
          created_at?: string | null
          created_by?: string | null
          curriculum?: string | null
          data_completeness_score?: number | null
          education_level?: string
          extra_qualifications?: Json | null
          gpa_converted_german?: number | null
          gpa_min_pass?: number | null
          gpa_raw?: number | null
          gpa_scale_max?: number | null
          had_aps_certificate?: boolean | null
          id?: string
          language_certificates?: Json | null
          nationality?: string
          notes?: string | null
          outcome?: string
          passed_studienkolleg?: boolean | null
          previous_degree_field?: string | null
          program_id?: string | null
          program_name?: string
          rejection_reason?: string | null
          student_identifier?: string | null
          university_name?: string
          updated_at?: string | null
          verified_by_admin?: boolean | null
          work_experience_years?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "historical_applications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historical_applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      hubspot_sync_log: {
        Row: {
          error_message: string | null
          hubspot_contact_id: string | null
          id: string
          profile_id: string | null
          request_data: Json | null
          response_data: Json | null
          sync_status: string | null
          sync_type: string | null
          synced_at: string | null
        }
        Insert: {
          error_message?: string | null
          hubspot_contact_id?: string | null
          id?: string
          profile_id?: string | null
          request_data?: Json | null
          response_data?: Json | null
          sync_status?: string | null
          sync_type?: string | null
          synced_at?: string | null
        }
        Update: {
          error_message?: string | null
          hubspot_contact_id?: string | null
          id?: string
          profile_id?: string | null
          request_data?: Json | null
          response_data?: Json | null
          sync_status?: string | null
          sync_type?: string | null
          synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hubspot_sync_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_egp: number
          amount_eur: number | null
          created_at: string | null
          currency: string | null
          due_date: string | null
          id: string
          invoice_data: Json | null
          invoice_number: string
          issued_at: string | null
          issued_by: string | null
          paid_at: string | null
          payment_method: string | null
          paymob_transaction_id: string | null
          profile_id: string
          sales_lead_id: string | null
          service_package_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount_egp: number
          amount_eur?: number | null
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_data?: Json | null
          invoice_number: string
          issued_at?: string | null
          issued_by?: string | null
          paid_at?: string | null
          payment_method?: string | null
          paymob_transaction_id?: string | null
          profile_id: string
          sales_lead_id?: string | null
          service_package_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_egp?: number
          amount_eur?: number | null
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_data?: Json | null
          invoice_number?: string
          issued_at?: string | null
          issued_by?: string | null
          paid_at?: string | null
          payment_method?: string | null
          paymob_transaction_id?: string | null
          profile_id?: string
          sales_lead_id?: string | null
          service_package_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_sales_lead_id_fkey"
            columns: ["sales_lead_id"]
            isOneToOne: false
            referencedRelation: "sales_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_service_package_id_fkey"
            columns: ["service_package_id"]
            isOneToOne: false
            referencedRelation: "service_packages"
            referencedColumns: ["id"]
          },
        ]
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
      program_shortlists: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          message: string | null
          sent_at: string | null
          status: string
          student_profile_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          message?: string | null
          sent_at?: string | null
          status?: string
          student_profile_id: string
          title?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          message?: string | null
          sent_at?: string | null
          status?: string
          student_profile_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      programs: {
        Row: {
          application_deadline: string | null
          application_method: string | null
          country_code: string | null
          created_at: string
          degree_level: Database["public"]["Enums"]["degree_level"] | null
          degree_type: string
          delivery_mode: string | null
          description: string | null
          duration_semesters: number
          ects_credits: number | null
          field_of_study: string
          field_of_study_id: string | null
          id: string
          language_of_instruction: string[] | null
          language_requirements: string[] | null
          metadata: Json | null
          minimum_gpa: number | null
          name: string
          prerequisites: string[] | null
          program_url: string | null
          published: boolean | null
          recognition_weeks_before: number | null
          search_doc: Json | null
          semester_fees: number | null
          semester_start: string | null
          slug: string | null
          summer_application_open_date: string | null
          summer_deadline: string | null
          summer_intake: boolean | null
          uni_assist_required: boolean | null
          university_id: string
          winter_application_open_date: string | null
          winter_deadline: string | null
          winter_intake: boolean | null
        }
        Insert: {
          application_deadline?: string | null
          application_method?: string | null
          country_code?: string | null
          created_at?: string
          degree_level?: Database["public"]["Enums"]["degree_level"] | null
          degree_type: string
          delivery_mode?: string | null
          description?: string | null
          duration_semesters: number
          ects_credits?: number | null
          field_of_study: string
          field_of_study_id?: string | null
          id?: string
          language_of_instruction?: string[] | null
          language_requirements?: string[] | null
          metadata?: Json | null
          minimum_gpa?: number | null
          name: string
          prerequisites?: string[] | null
          program_url?: string | null
          published?: boolean | null
          recognition_weeks_before?: number | null
          search_doc?: Json | null
          semester_fees?: number | null
          semester_start?: string | null
          slug?: string | null
          summer_application_open_date?: string | null
          summer_deadline?: string | null
          summer_intake?: boolean | null
          uni_assist_required?: boolean | null
          university_id: string
          winter_application_open_date?: string | null
          winter_deadline?: string | null
          winter_intake?: boolean | null
        }
        Update: {
          application_deadline?: string | null
          application_method?: string | null
          country_code?: string | null
          created_at?: string
          degree_level?: Database["public"]["Enums"]["degree_level"] | null
          degree_type?: string
          delivery_mode?: string | null
          description?: string | null
          duration_semesters?: number
          ects_credits?: number | null
          field_of_study?: string
          field_of_study_id?: string | null
          id?: string
          language_of_instruction?: string[] | null
          language_requirements?: string[] | null
          metadata?: Json | null
          minimum_gpa?: number | null
          name?: string
          prerequisites?: string[] | null
          program_url?: string | null
          published?: boolean | null
          recognition_weeks_before?: number | null
          search_doc?: Json | null
          semester_fees?: number | null
          semester_start?: string | null
          slug?: string | null
          summer_application_open_date?: string | null
          summer_deadline?: string | null
          summer_intake?: boolean | null
          uni_assist_required?: boolean | null
          university_id?: string
          winter_application_open_date?: string | null
          winter_deadline?: string | null
          winter_intake?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "programs_field_of_study_id_fkey"
            columns: ["field_of_study_id"]
            isOneToOne: false
            referencedRelation: "fields_of_study"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      public_profiles: {
        Row: {
          academic_year: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          education_level: string | null
          field_of_study: string | null
          id: string
          institution_name: string | null
          is_profile_complete: boolean | null
          updated_at: string
          visibility_settings: Json | null
        }
        Insert: {
          academic_year?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          education_level?: string | null
          field_of_study?: string | null
          id: string
          institution_name?: string | null
          is_profile_complete?: boolean | null
          updated_at?: string
          visibility_settings?: Json | null
        }
        Update: {
          academic_year?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          education_level?: string | null
          field_of_study?: string | null
          id?: string
          institution_name?: string | null
          is_profile_complete?: boolean | null
          updated_at?: string
          visibility_settings?: Json | null
        }
        Relationships: []
      }
      regions: {
        Row: {
          country_code: string
          created_at: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          country_code?: string
          created_at?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          country_code?: string
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sales_leads: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          current_stage_id: string | null
          evaluated_at: string | null
          evaluated_by: string | null
          evaluation_required: boolean | null
          evaluation_status: string | null
          id: string
          last_contact_date: string | null
          lead_source: string | null
          next_follow_up: string | null
          notes: Json | null
          payment_enabled: boolean | null
          profile_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          current_stage_id?: string | null
          evaluated_at?: string | null
          evaluated_by?: string | null
          evaluation_required?: boolean | null
          evaluation_status?: string | null
          id?: string
          last_contact_date?: string | null
          lead_source?: string | null
          next_follow_up?: string | null
          notes?: Json | null
          payment_enabled?: boolean | null
          profile_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          current_stage_id?: string | null
          evaluated_at?: string | null
          evaluated_by?: string | null
          evaluation_required?: boolean | null
          evaluation_status?: string | null
          id?: string
          last_contact_date?: string | null
          lead_source?: string | null
          next_follow_up?: string | null
          notes?: Json | null
          payment_enabled?: boolean | null
          profile_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_leads_current_stage_id_fkey"
            columns: ["current_stage_id"]
            isOneToOne: false
            referencedRelation: "sales_pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_leads_evaluated_by_fkey"
            columns: ["evaluated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_leads_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_pipeline_stages: {
        Row: {
          color_hex: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          stage_order: number
          updated_at: string | null
        }
        Insert: {
          color_hex?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          stage_order: number
          updated_at?: string | null
        }
        Update: {
          color_hex?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          stage_order?: number
          updated_at?: string | null
        }
        Relationships: []
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
      shortlist_programs: {
        Row: {
          created_at: string | null
          id: string
          program_id: string
          shortlist_id: string
          sort_order: number | null
          staff_notes: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          program_id: string
          shortlist_id: string
          sort_order?: number | null
          staff_notes?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          program_id?: string
          shortlist_id?: string
          sort_order?: number | null
          staff_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shortlist_programs_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortlist_programs_shortlist_id_fkey"
            columns: ["shortlist_id"]
            isOneToOne: false
            referencedRelation: "program_shortlists"
            referencedColumns: ["id"]
          },
        ]
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
        ]
      }
      student_documents: {
        Row: {
          file_name: string
          file_path: string
          file_size_kb: number | null
          file_type: string
          historical_application_id: string | null
          id: string
          mime_type: string | null
          ocr_completed_at: string | null
          ocr_status: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          file_name: string
          file_path: string
          file_size_kb?: number | null
          file_type: string
          historical_application_id?: string | null
          id?: string
          mime_type?: string | null
          ocr_completed_at?: string | null
          ocr_status?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          file_name?: string
          file_path?: string
          file_size_kb?: number | null
          file_type?: string
          historical_application_id?: string | null
          id?: string
          mime_type?: string | null
          ocr_completed_at?: string | null
          ocr_status?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_documents_historical_application_id_fkey"
            columns: ["historical_application_id"]
            isOneToOne: false
            referencedRelation: "historical_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      testsprite_tests: {
        Row: {
          created_at: string
          description: string | null
          duration: number | null
          id: string
          last_run: string | null
          name: string
          status: string
          testsprite_id: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration?: number | null
          id?: string
          last_run?: string | null
          name: string
          status?: string
          testsprite_id: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration?: number | null
          id?: string
          last_run?: string | null
          name?: string
          status?: string
          testsprite_id?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      universities: {
        Row: {
          city: string
          city_id: string | null
          control_type: string | null
          created_at: string
          external_refs: Json | null
          fts: unknown
          id: string
          keywords: string[] | null
          lat: number | null
          lng: number | null
          logo_url: string | null
          name: string
          ranking: number | null
          region: string | null
          region_id: string | null
          search_doc: Json | null
          slug: string | null
          type: string | null
          website: string | null
        }
        Insert: {
          city: string
          city_id?: string | null
          control_type?: string | null
          created_at?: string
          external_refs?: Json | null
          fts?: unknown
          id?: string
          keywords?: string[] | null
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name: string
          ranking?: number | null
          region?: string | null
          region_id?: string | null
          search_doc?: Json | null
          slug?: string | null
          type?: string | null
          website?: string | null
        }
        Update: {
          city?: string
          city_id?: string | null
          control_type?: string | null
          created_at?: string
          external_refs?: Json | null
          fts?: unknown
          id?: string
          keywords?: string[] | null
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name?: string
          ranking?: number | null
          region?: string | null
          region_id?: string | null
          search_doc?: Json | null
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
          {
            foreignKeyName: "universities_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "city_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "universities_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_applications: {
        Row: {
          admissions_decision: string | null
          admissions_decision_date: string | null
          admissions_decision_notes: string | null
          application_notes: Json | null
          application_period_id: string
          applied_at: string | null
          assigned_admissions_officer: string | null
          created_at: string
          documents_verified: boolean | null
          id: string
          last_reminder_sent: string | null
          metadata: Json | null
          profile_id: string
          program_id: string
          reminders_count: number | null
          service_package_id: string | null
          status: Database["public"]["Enums"]["application_status"] | null
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          admissions_decision?: string | null
          admissions_decision_date?: string | null
          admissions_decision_notes?: string | null
          application_notes?: Json | null
          application_period_id: string
          applied_at?: string | null
          assigned_admissions_officer?: string | null
          created_at?: string
          documents_verified?: boolean | null
          id?: string
          last_reminder_sent?: string | null
          metadata?: Json | null
          profile_id: string
          program_id: string
          reminders_count?: number | null
          service_package_id?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          admissions_decision?: string | null
          admissions_decision_date?: string | null
          admissions_decision_notes?: string | null
          application_notes?: Json | null
          application_period_id?: string
          applied_at?: string | null
          assigned_admissions_officer?: string | null
          created_at?: string
          documents_verified?: boolean | null
          id?: string
          last_reminder_sent?: string | null
          metadata?: Json | null
          profile_id?: string
          program_id?: string
          reminders_count?: number | null
          service_package_id?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_applications_assigned_admissions_officer_fkey"
            columns: ["assigned_admissions_officer"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      city_stats: {
        Row: {
          city_type: string | null
          country_code: string | null
          id: string | null
          name: string | null
          population_asof: string | null
          population_total: number | null
          region: string | null
          slug: string | null
          uni_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_access_profile: { Args: { profile_id: string }; Returns: boolean }
      check_profile_access_rate_limit: { Args: never; Returns: boolean }
      check_profile_access_rights: {
        Args: { profile_uuid: string }
        Returns: Json
      }
      check_qa_users_setup: {
        Args: never
        Returns: {
          email: string
          profile_exists: boolean
          roles: string[]
          user_exists: boolean
        }[]
      }
      count_programs_by_field: { Args: { field_id: string }; Returns: number }
      enhanced_validate_profile_access: { Args: never; Returns: boolean }
      export_my_profile_data: { Args: never; Returns: Json }
      get_admin_dashboard_stats: { Args: never; Returns: Json }
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
      get_field_descendants: {
        Args: { field_id: string }
        Returns: {
          descendant_id: string
        }[]
      }
      get_masked_academic_summary: {
        Args: { target_profile_id: string }
        Returns: Json
      }
      get_masked_profile_data: {
        Args: { profile_uuid?: string }
        Returns: {
          created_at: string
          display_name: string
          education_level: string
          field_of_study: string
          id: string
          masked_email: string
          masked_phone: string
          nationality: string
        }[]
      }
      get_masked_profile_display: {
        Args: { profile_uuid: string }
        Returns: {
          display_name: string
          education_level: string
          field_of_study: string
          id: string
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
      get_profile_summary: { Args: { profile_uuid: string }; Returns: Json }
      get_public_profile_display: {
        Args: { profile_uuid: string }
        Returns: {
          display_name: string
          education_level: string
          field_of_study: string
          id: string
          institution_name: string
          is_profile_complete: boolean
        }[]
      }
      get_safe_profile_data: {
        Args: { profile_uuid: string }
        Returns: {
          career_goals: string
          created_at: string
          credits_taken: number
          current_education_level: string
          current_field_of_study: string
          current_gpa: number
          current_institution: string
          date_of_birth: string
          email: string
          full_name: string
          gender: string
          id: string
          language_certificates: string[]
          nationality: string
          phone: string
          preferred_cities: string[]
          preferred_degree_type: string
          preferred_fields: string[]
          thesis_topic: string
          updated_at: string
        }[]
      }
      get_secure_academic_data: {
        Args: { target_profile_id: string }
        Returns: Json
      }
      get_secure_complete_profile: {
        Args: { profile_uuid: string }
        Returns: {
          bio: string
          career_goals: string
          created_at: string
          date_of_birth: string
          display_name: string
          education_level: string
          email: string
          field_of_study: string
          full_name: string
          gender: string
          id: string
          institution_name: string
          is_profile_complete: boolean
          nationality: string
          phone: string
          preferred_cities: string[]
          preferred_degree_type: string
          preferred_fields: string[]
          updated_at: string
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
      profile_access_guide: { Args: never; Returns: string }
      request_emergency_admin_access: {
        Args: { reason: string; target_profile_id?: string }
        Returns: Json
      }
      request_emergency_profile_access: {
        Args: { justification: string; target_profile_id: string }
        Returns: Json
      }
      search_cities: {
        Args: { q: string }
        Returns: {
          country_code: string
          id: string
          name: string
          population_asof: string
          population_total: number
          region: string
          slug: string
          uni_count: number
        }[]
      }
      secure_update_academic_data: {
        Args: { target_profile_id: string; update_data: Json }
        Returns: Json
      }
      secure_update_profile: {
        Args: { new_data: Json; profile_id: string }
        Returns: Json
      }
      secure_update_separated_profile: {
        Args: {
          academic_data?: Json
          private_data?: Json
          profile_uuid: string
          public_data?: Json
        }
        Returns: Json
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      slugify: { Args: { txt: string }; Returns: string }
      ultra_secure_profile_update: {
        Args: { target_profile_id: string; update_data: Json }
        Returns: Json
      }
      validate_profile_access: { Args: never; Returns: boolean }
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
        | "counselor"
      application_status:
        | "not_started"
        | "in_progress"
        | "submitted"
        | "under_review"
        | "accepted"
        | "rejected"
        | "waitlisted"
      degree_level: "bachelor" | "master"
      education_system:
        | "abitur"
        | "a_levels"
        | "ib"
        | "us_high_school"
        | "indian_higher_secondary"
        | "chinese_gaokao"
        | "french_baccalaureat"
        | "other"
      eligibility_pathway:
        | "direct_admission"
        | "studienkolleg_required"
        | "not_eligible"
        | "conditional"
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
        "counselor",
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
      education_system: [
        "abitur",
        "a_levels",
        "ib",
        "us_high_school",
        "indian_higher_secondary",
        "chinese_gaokao",
        "french_baccalaureat",
        "other",
      ],
      eligibility_pathway: [
        "direct_admission",
        "studienkolleg_required",
        "not_eligible",
        "conditional",
      ],
      intake_season: ["winter", "summer", "spring", "fall"],
      package_type: ["basic", "standard", "premium", "vip"],
    },
  },
} as const
