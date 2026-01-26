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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
          vendor_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          vendor_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "pending_vendor_approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          input_tokens: number | null
          investor_id: string | null
          model: string | null
          operation: string
          output_tokens: number | null
          result: Json | null
          startup_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_tokens?: number | null
          investor_id?: string | null
          model?: string | null
          operation: string
          output_tokens?: number | null
          result?: Json | null
          startup_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_tokens?: number | null
          investor_id?: string | null
          model?: string | null
          operation?: string
          output_tokens?: number | null
          result?: Json | null
          startup_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_logs_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investor_engagement_summary"
            referencedColumns: ["investor_id"]
          },
          {
            foreignKeyName: "ai_logs_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_logs_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "approved_startups_for_matching"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_logs_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "recent_funding_activity"
            referencedColumns: ["startup_id"]
          },
          {
            foreignKeyName: "ai_logs_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startup_momentum_dashboard"
            referencedColumns: ["startup_id"]
          },
          {
            foreignKeyName: "ai_logs_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startup_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_recommendations: {
        Row: {
          ai_model: string | null
          confidence_score: number | null
          cost_difference: number | null
          final_config: Json | null
          id: string
          original_config: Json | null
          reasoning: string | null
          recommendation_type: string
          recommended_config: Json | null
          responded_at: string | null
          roi_difference: number | null
          savings_difference: number | null
          session_id: string
          shown_at: string
          user_action: string | null
          wizard_session_id: string | null
        }
        Insert: {
          ai_model?: string | null
          confidence_score?: number | null
          cost_difference?: number | null
          final_config?: Json | null
          id?: string
          original_config?: Json | null
          reasoning?: string | null
          recommendation_type: string
          recommended_config?: Json | null
          responded_at?: string | null
          roi_difference?: number | null
          savings_difference?: number | null
          session_id: string
          shown_at?: string
          user_action?: string | null
          wizard_session_id?: string | null
        }
        Update: {
          ai_model?: string | null
          confidence_score?: number | null
          cost_difference?: number | null
          final_config?: Json | null
          id?: string
          original_config?: Json | null
          reasoning?: string | null
          recommendation_type?: string
          recommended_config?: Json | null
          responded_at?: string | null
          roi_difference?: number | null
          savings_difference?: number | null
          session_id?: string
          shown_at?: string
          user_action?: string | null
          wizard_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_wizard_session_id_fkey"
            columns: ["wizard_session_id"]
            isOneToOne: false
            referencedRelation: "wizard_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_subscriptions: {
        Row: {
          alert_types: string[] | null
          confirmation_token: string | null
          confirmed: boolean | null
          created_at: string | null
          email: string
          email_enabled: boolean | null
          email_frequency: string | null
          id: string
          is_active: boolean | null
          last_notification_sent: string | null
          min_relevance_score: number | null
          notify_on_excellent_deals: boolean | null
          notify_on_price_drops: boolean | null
          price_drop_threshold_percent: number | null
          regions: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          alert_types?: string[] | null
          confirmation_token?: string | null
          confirmed?: boolean | null
          created_at?: string | null
          email: string
          email_enabled?: boolean | null
          email_frequency?: string | null
          id?: string
          is_active?: boolean | null
          last_notification_sent?: string | null
          min_relevance_score?: number | null
          notify_on_excellent_deals?: boolean | null
          notify_on_price_drops?: boolean | null
          price_drop_threshold_percent?: number | null
          regions?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          alert_types?: string[] | null
          confirmation_token?: string | null
          confirmed?: boolean | null
          created_at?: string | null
          email?: string
          email_enabled?: boolean | null
          email_frequency?: string | null
          id?: string
          is_active?: boolean | null
          last_notification_sent?: string | null
          min_relevance_score?: number | null
          notify_on_excellent_deals?: boolean | null
          notify_on_price_drops?: boolean | null
          price_drop_threshold_percent?: number | null
          regions?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      battery_pricing: {
        Row: {
          chemistry: string
          created_at: string | null
          date: string
          id: number
          includes: string[]
          pricePerKWh: number
          region: string
          source: string
          systemSize: string
        }
        Insert: {
          chemistry: string
          created_at?: string | null
          date: string
          id?: number
          includes: string[]
          pricePerKWh: number
          region: string
          source: string
          systemSize: string
        }
        Update: {
          chemistry?: string
          created_at?: string | null
          date?: string
          id?: number
          includes?: string[]
          pricePerKWh?: number
          region?: string
          source?: string
          systemSize?: string
        }
        Relationships: []
      }
      business_lookup_cache: {
        Row: {
          api_response: Json | null
          business_name: string
          category: string | null
          city: string | null
          confidence_score: number | null
          country: string | null
          created_at: string | null
          data_source: string | null
          google_photo_reference: string | null
          google_photo_url: string | null
          google_place_id: string | null
          id: string
          industry_slug: string | null
          last_looked_up: string | null
          logo_source: string | null
          logo_url: string | null
          lookup_count: number | null
          phone: string | null
          postal_code: string | null
          search_key: string
          state: string | null
          street_address: string | null
          updated_at: string | null
          verification_date: string | null
          verification_status: string | null
          website: string | null
        }
        Insert: {
          api_response?: Json | null
          business_name: string
          category?: string | null
          city?: string | null
          confidence_score?: number | null
          country?: string | null
          created_at?: string | null
          data_source?: string | null
          google_photo_reference?: string | null
          google_photo_url?: string | null
          google_place_id?: string | null
          id?: string
          industry_slug?: string | null
          last_looked_up?: string | null
          logo_source?: string | null
          logo_url?: string | null
          lookup_count?: number | null
          phone?: string | null
          postal_code?: string | null
          search_key: string
          state?: string | null
          street_address?: string | null
          updated_at?: string | null
          verification_date?: string | null
          verification_status?: string | null
          website?: string | null
        }
        Update: {
          api_response?: Json | null
          business_name?: string
          category?: string | null
          city?: string | null
          confidence_score?: number | null
          country?: string | null
          created_at?: string | null
          data_source?: string | null
          google_photo_reference?: string | null
          google_photo_url?: string | null
          google_place_id?: string | null
          id?: string
          industry_slug?: string | null
          last_looked_up?: string | null
          logo_source?: string | null
          logo_url?: string | null
          lookup_count?: number | null
          phone?: string | null
          postal_code?: string | null
          search_key?: string
          state?: string | null
          street_address?: string | null
          updated_at?: string | null
          verification_date?: string | null
          verification_status?: string | null
          website?: string | null
        }
        Relationships: []
      }
      business_size_tiers: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          industry_slug: string
          is_active: boolean | null
          max_value: number | null
          min_value: number | null
          questionnaire_depth: string | null
          size_field: string
          target_question_count: number | null
          tier: string
          tier_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          industry_slug: string
          is_active?: boolean | null
          max_value?: number | null
          min_value?: number | null
          questionnaire_depth?: string | null
          size_field: string
          target_question_count?: number | null
          tier: string
          tier_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          industry_slug?: string
          is_active?: boolean | null
          max_value?: number | null
          min_value?: number | null
          questionnaire_depth?: string | null
          size_field?: string
          target_question_count?: number | null
          tier?: string
          tier_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      calculation_audit_log: {
        Row: {
          created_at: string | null
          environment: string | null
          id: string
          inputs: Json
          is_valid: boolean
          outputs: Json
          score: number
          session_id: string | null
          validation_result: Json
          validator_version: string | null
          warnings_count: number
        }
        Insert: {
          created_at?: string | null
          environment?: string | null
          id?: string
          inputs: Json
          is_valid?: boolean
          outputs: Json
          score?: number
          session_id?: string | null
          validation_result: Json
          validator_version?: string | null
          warnings_count?: number
        }
        Update: {
          created_at?: string | null
          environment?: string | null
          id?: string
          inputs?: Json
          is_valid?: boolean
          outputs?: Json
          score?: number
          session_id?: string | null
          validation_result?: Json
          validator_version?: string | null
          warnings_count?: number
        }
        Relationships: []
      }
      calculation_cache: {
        Row: {
          calculation_results: Json
          calculation_type: string
          calculation_version: string | null
          created_at: string | null
          execution_time_ms: number | null
          expires_at: string | null
          id: string
          input_data: Json
          input_hash: string
        }
        Insert: {
          calculation_results: Json
          calculation_type: string
          calculation_version?: string | null
          created_at?: string | null
          execution_time_ms?: number | null
          expires_at?: string | null
          id?: string
          input_data: Json
          input_hash: string
        }
        Update: {
          calculation_results?: Json
          calculation_type?: string
          calculation_version?: string | null
          created_at?: string | null
          execution_time_ms?: number | null
          expires_at?: string | null
          id?: string
          input_data?: Json
          input_hash?: string
        }
        Relationships: []
      }
      calculation_constants: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          effective_date: string | null
          expiration_date: string | null
          id: string
          key: string
          last_verified_at: string | null
          source: string | null
          updated_at: string | null
          value_json: Json | null
          value_numeric: number | null
          value_text: string | null
          value_type: string
          verified_by: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          effective_date?: string | null
          expiration_date?: string | null
          id?: string
          key: string
          last_verified_at?: string | null
          source?: string | null
          updated_at?: string | null
          value_json?: Json | null
          value_numeric?: number | null
          value_text?: string | null
          value_type: string
          verified_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          effective_date?: string | null
          expiration_date?: string | null
          id?: string
          key?: string
          last_verified_at?: string | null
          source?: string | null
          updated_at?: string | null
          value_json?: Json | null
          value_numeric?: number | null
          value_text?: string | null
          value_type?: string
          verified_by?: string | null
        }
        Relationships: []
      }
      calculation_formulas: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          example_calculation: string | null
          formula_category: string
          formula_expression: string
          formula_key: string
          formula_name: string
          formula_variables: Json
          id: string
          industry_standard_reference: string | null
          is_active: boolean | null
          notes: string | null
          output_variables: Json
          reference_sources: string | null
          updated_at: string | null
          updated_by: string | null
          validated_at: string | null
          validated_by: string | null
          validation_status: string | null
          variables: Json | null
          version: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          example_calculation?: string | null
          formula_category: string
          formula_expression: string
          formula_key: string
          formula_name: string
          formula_variables: Json
          id?: string
          industry_standard_reference?: string | null
          is_active?: boolean | null
          notes?: string | null
          output_variables: Json
          reference_sources?: string | null
          updated_at?: string | null
          updated_by?: string | null
          validated_at?: string | null
          validated_by?: string | null
          validation_status?: string | null
          variables?: Json | null
          version?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          example_calculation?: string | null
          formula_category?: string
          formula_expression?: string
          formula_key?: string
          formula_name?: string
          formula_variables?: Json
          id?: string
          industry_standard_reference?: string | null
          is_active?: boolean | null
          notes?: string | null
          output_variables?: Json
          reference_sources?: string | null
          updated_at?: string | null
          updated_by?: string | null
          validated_at?: string | null
          validated_by?: string | null
          validation_status?: string | null
          variables?: Json | null
          version?: string | null
        }
        Relationships: []
      }
      collected_market_prices: {
        Row: {
          capacity_range_max: number | null
          capacity_range_min: number | null
          confidence_score: number | null
          currency: string | null
          equipment_type: string
          extracted_at: string | null
          extraction_method: string | null
          id: string
          is_verified: boolean | null
          price_date: string
          price_per_unit: number
          product_name: string | null
          raw_text: string | null
          region: string | null
          source_id: string | null
          technology: string | null
          unit: string
          verification_notes: string | null
        }
        Insert: {
          capacity_range_max?: number | null
          capacity_range_min?: number | null
          confidence_score?: number | null
          currency?: string | null
          equipment_type: string
          extracted_at?: string | null
          extraction_method?: string | null
          id?: string
          is_verified?: boolean | null
          price_date: string
          price_per_unit: number
          product_name?: string | null
          raw_text?: string | null
          region?: string | null
          source_id?: string | null
          technology?: string | null
          unit: string
          verification_notes?: string | null
        }
        Update: {
          capacity_range_max?: number | null
          capacity_range_min?: number | null
          confidence_score?: number | null
          currency?: string | null
          equipment_type?: string
          extracted_at?: string | null
          extraction_method?: string | null
          id?: string
          is_verified?: boolean | null
          price_date?: string
          price_per_unit?: number
          product_name?: string | null
          raw_text?: string | null
          region?: string | null
          source_id?: string | null
          technology?: string | null
          unit?: string
          verification_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collected_market_prices_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "market_data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      configuration_best_practices: {
        Row: {
          created_at: string | null
          cycles_per_year: number
          id: number
          industry_standard: string
          last_updated: string
          recommended_chemistry: string[]
          recommended_duration_hrs_max: number
          recommended_duration_hrs_min: number
          recommended_duration_hrs_typical: number
          recommended_power_mw_max: number
          recommended_power_mw_min: number
          recommended_power_mw_typical: number
          round_trip_efficiency: number
          safety_factor: number
          source: string
          use_case: string
        }
        Insert: {
          created_at?: string | null
          cycles_per_year: number
          id?: number
          industry_standard: string
          last_updated: string
          recommended_chemistry: string[]
          recommended_duration_hrs_max: number
          recommended_duration_hrs_min: number
          recommended_duration_hrs_typical: number
          recommended_power_mw_max: number
          recommended_power_mw_min: number
          recommended_power_mw_typical: number
          round_trip_efficiency: number
          safety_factor: number
          source: string
          use_case: string
        }
        Update: {
          created_at?: string | null
          cycles_per_year?: number
          id?: number
          industry_standard?: string
          last_updated?: string
          recommended_chemistry?: string[]
          recommended_duration_hrs_max?: number
          recommended_duration_hrs_min?: number
          recommended_duration_hrs_typical?: number
          recommended_power_mw_max?: number
          recommended_power_mw_min?: number
          recommended_power_mw_typical?: number
          round_trip_efficiency?: number
          safety_factor?: number
          source?: string
          use_case?: string
        }
        Relationships: []
      }
      configuration_equipment: {
        Row: {
          configuration_id: string | null
          created_at: string | null
          custom_hours_per_day: number | null
          custom_power_kw: number | null
          equipment_template_id: string | null
          id: string
          notes: string | null
          quantity: number | null
          simultaneity_factor: number | null
        }
        Insert: {
          configuration_id?: string | null
          created_at?: string | null
          custom_hours_per_day?: number | null
          custom_power_kw?: number | null
          equipment_template_id?: string | null
          id?: string
          notes?: string | null
          quantity?: number | null
          simultaneity_factor?: number | null
        }
        Update: {
          configuration_id?: string | null
          created_at?: string | null
          custom_hours_per_day?: number | null
          custom_power_kw?: number | null
          equipment_template_id?: string | null
          id?: string
          notes?: string | null
          quantity?: number | null
          simultaneity_factor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "configuration_equipment_configuration_id_fkey"
            columns: ["configuration_id"]
            isOneToOne: false
            referencedRelation: "use_case_configurations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "configuration_equipment_equipment_template_id_fkey"
            columns: ["equipment_template_id"]
            isOneToOne: false
            referencedRelation: "equipment_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_questions: {
        Row: {
          created_at: string | null
          default_value: string | null
          display_order: number | null
          energy_impact_kwh: number | null
          field_name: string
          help_text: string | null
          icon_name: string | null
          id: string
          is_advanced: boolean
          is_required: boolean | null
          max_value: number | null
          metadata: Json | null
          min_value: number | null
          options: Json | null
          placeholder: string | null
          question_text: string
          question_tier: string | null
          question_type: string
          section_name: string | null
          use_case_id: string | null
          validation_regex: string | null
        }
        Insert: {
          created_at?: string | null
          default_value?: string | null
          display_order?: number | null
          energy_impact_kwh?: number | null
          field_name: string
          help_text?: string | null
          icon_name?: string | null
          id?: string
          is_advanced?: boolean
          is_required?: boolean | null
          max_value?: number | null
          metadata?: Json | null
          min_value?: number | null
          options?: Json | null
          placeholder?: string | null
          question_text: string
          question_tier?: string | null
          question_type: string
          section_name?: string | null
          use_case_id?: string | null
          validation_regex?: string | null
        }
        Update: {
          created_at?: string | null
          default_value?: string | null
          display_order?: number | null
          energy_impact_kwh?: number | null
          field_name?: string
          help_text?: string | null
          icon_name?: string | null
          id?: string
          is_advanced?: boolean
          is_required?: boolean | null
          max_value?: number | null
          metadata?: Json | null
          min_value?: number | null
          options?: Json | null
          placeholder?: string | null
          question_text?: string
          question_tier?: string | null
          question_type?: string
          section_name?: string | null
          use_case_id?: string | null
          validation_regex?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_questions_use_case_id_fkey"
            columns: ["use_case_id"]
            isOneToOne: false
            referencedRelation: "use_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      data_collection_log: {
        Row: {
          collection_date: string
          created_at: string | null
          duration_seconds: number | null
          error_message: string | null
          id: number
          items_collected: number | null
          status: string
        }
        Insert: {
          collection_date: string
          created_at?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          id?: number
          items_collected?: number | null
          status: string
        }
        Update: {
          collection_date?: string
          created_at?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          id?: number
          items_collected?: number | null
          status?: string
        }
        Relationships: []
      }
      data_update_schedule: {
        Row: {
          api_endpoint: string | null
          auto_update_enabled: boolean | null
          created_at: string | null
          description: string | null
          id: string
          last_updated: string | null
          next_update_due: string | null
          owner: string | null
          primary_source: string | null
          primary_source_url: string | null
          secondary_sources: string[] | null
          table_name: string
          update_frequency: string
          updated_at: string | null
        }
        Insert: {
          api_endpoint?: string | null
          auto_update_enabled?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          last_updated?: string | null
          next_update_due?: string | null
          owner?: string | null
          primary_source?: string | null
          primary_source_url?: string | null
          secondary_sources?: string[] | null
          table_name: string
          update_frequency: string
          updated_at?: string | null
        }
        Update: {
          api_endpoint?: string | null
          auto_update_enabled?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          last_updated?: string | null
          next_update_due?: string | null
          owner?: string | null
          primary_source?: string | null
          primary_source_url?: string | null
          secondary_sources?: string[] | null
          table_name?: string
          update_frequency?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      depreciation_schedules: {
        Row: {
          applies_to: string[] | null
          asset_class: string
          bonus_depreciation_eligible: boolean | null
          bonus_rate_2024: number | null
          bonus_rate_2025: number | null
          bonus_rate_2026: number | null
          convention: string | null
          created_at: string | null
          data_source: string | null
          depreciation_method: string
          effective_date: string | null
          id: string
          irs_asset_class: string | null
          recovery_years: number
          updated_at: string | null
          year_1: number
          year_10: number | null
          year_11: number | null
          year_12: number | null
          year_13: number | null
          year_14: number | null
          year_15: number | null
          year_16: number | null
          year_17: number | null
          year_18: number | null
          year_19: number | null
          year_2: number | null
          year_20: number | null
          year_21: number | null
          year_3: number | null
          year_4: number | null
          year_5: number | null
          year_6: number | null
          year_7: number | null
          year_8: number | null
          year_9: number | null
        }
        Insert: {
          applies_to?: string[] | null
          asset_class: string
          bonus_depreciation_eligible?: boolean | null
          bonus_rate_2024?: number | null
          bonus_rate_2025?: number | null
          bonus_rate_2026?: number | null
          convention?: string | null
          created_at?: string | null
          data_source?: string | null
          depreciation_method: string
          effective_date?: string | null
          id?: string
          irs_asset_class?: string | null
          recovery_years: number
          updated_at?: string | null
          year_1: number
          year_10?: number | null
          year_11?: number | null
          year_12?: number | null
          year_13?: number | null
          year_14?: number | null
          year_15?: number | null
          year_16?: number | null
          year_17?: number | null
          year_18?: number | null
          year_19?: number | null
          year_2?: number | null
          year_20?: number | null
          year_21?: number | null
          year_3?: number | null
          year_4?: number | null
          year_5?: number | null
          year_6?: number | null
          year_7?: number | null
          year_8?: number | null
          year_9?: number | null
        }
        Update: {
          applies_to?: string[] | null
          asset_class?: string
          bonus_depreciation_eligible?: boolean | null
          bonus_rate_2024?: number | null
          bonus_rate_2025?: number | null
          bonus_rate_2026?: number | null
          convention?: string | null
          created_at?: string | null
          data_source?: string | null
          depreciation_method?: string
          effective_date?: string | null
          id?: string
          irs_asset_class?: string | null
          recovery_years?: number
          updated_at?: string | null
          year_1?: number
          year_10?: number | null
          year_11?: number | null
          year_12?: number | null
          year_13?: number | null
          year_14?: number | null
          year_15?: number | null
          year_16?: number | null
          year_17?: number | null
          year_18?: number | null
          year_19?: number | null
          year_2?: number | null
          year_20?: number | null
          year_21?: number | null
          year_3?: number | null
          year_4?: number | null
          year_5?: number | null
          year_6?: number | null
          year_7?: number | null
          year_8?: number | null
          year_9?: number | null
        }
        Relationships: []
      }
      discovered_startups: {
        Row: {
          article_url: string | null
          confidence_score: number | null
          created_at: string | null
          description: string | null
          discovered_at: string | null
          funding_amount: string | null
          funding_stage: string | null
          god_score: number | null
          god_score_breakdown: Json | null
          god_score_reasoning: string[] | null
          id: string
          imported_at: string | null
          imported_to_startups: boolean | null
          investors_mentioned: string[] | null
          market_size: string | null
          name: string
          problem: string | null
          scraper_run_id: string | null
          sectors: string[] | null
          solution: string | null
          source_article_id: string | null
          startup_id: string | null
          team_companies: string[] | null
          value_proposition: string | null
          website: string | null
        }
        Insert: {
          article_url?: string | null
          confidence_score?: number | null
          created_at?: string | null
          description?: string | null
          discovered_at?: string | null
          funding_amount?: string | null
          funding_stage?: string | null
          god_score?: number | null
          god_score_breakdown?: Json | null
          god_score_reasoning?: string[] | null
          id?: string
          imported_at?: string | null
          imported_to_startups?: boolean | null
          investors_mentioned?: string[] | null
          market_size?: string | null
          name: string
          problem?: string | null
          scraper_run_id?: string | null
          sectors?: string[] | null
          solution?: string | null
          source_article_id?: string | null
          startup_id?: string | null
          team_companies?: string[] | null
          value_proposition?: string | null
          website?: string | null
        }
        Update: {
          article_url?: string | null
          confidence_score?: number | null
          created_at?: string | null
          description?: string | null
          discovered_at?: string | null
          funding_amount?: string | null
          funding_stage?: string | null
          god_score?: number | null
          god_score_breakdown?: Json | null
          god_score_reasoning?: string[] | null
          id?: string
          imported_at?: string | null
          imported_to_startups?: boolean | null
          investors_mentioned?: string[] | null
          market_size?: string | null
          name?: string
          problem?: string | null
          scraper_run_id?: string | null
          sectors?: string[] | null
          solution?: string | null
          source_article_id?: string | null
          startup_id?: string | null
          team_companies?: string[] | null
          value_proposition?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discovered_startups_scraper_run_id_fkey"
            columns: ["scraper_run_id"]
            isOneToOne: false
            referencedRelation: "scraper_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      embedding_model_versions: {
        Row: {
          archived_at: string | null
          avg_match_score: number | null
          created_at: string | null
          deployed_at: string | null
          deployment_percentage: number | null
          deployment_status: string
          huggingface_model_id: string | null
          id: string
          model_name: string
          training_data_count: number | null
          version_number: number
        }
        Insert: {
          archived_at?: string | null
          avg_match_score?: number | null
          created_at?: string | null
          deployed_at?: string | null
          deployment_percentage?: number | null
          deployment_status: string
          huggingface_model_id?: string | null
          id?: string
          model_name: string
          training_data_count?: number | null
          version_number: number
        }
        Update: {
          archived_at?: string | null
          avg_match_score?: number | null
          created_at?: string | null
          deployed_at?: string | null
          deployment_percentage?: number | null
          deployment_status?: string
          huggingface_model_id?: string | null
          id?: string
          model_name?: string
          training_data_count?: number | null
          version_number?: number
        }
        Relationships: []
      }
      embedding_performance_metrics: {
        Row: {
          avg_success_score: number | null
          id: string
          intro_rate: number | null
          investment_rate: number | null
          matches_generated: number | null
          measured_at: string | null
          meeting_rate: number | null
          model_version_id: string
        }
        Insert: {
          avg_success_score?: number | null
          id?: string
          intro_rate?: number | null
          investment_rate?: number | null
          matches_generated?: number | null
          measured_at?: string | null
          meeting_rate?: number | null
          model_version_id: string
        }
        Update: {
          avg_success_score?: number | null
          id?: string
          intro_rate?: number | null
          investment_rate?: number | null
          matches_generated?: number | null
          measured_at?: string | null
          meeting_rate?: number | null
          model_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "embedding_performance_metrics_model_version_id_fkey"
            columns: ["model_version_id"]
            isOneToOne: false
            referencedRelation: "embedding_model_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      energy_price_alerts: {
        Row: {
          alert_level: string | null
          alert_type: string
          baseline_price: number | null
          created_at: string | null
          currency: string | null
          deal_name: string | null
          deal_summary: string | null
          extracted_at: string | null
          extracted_by: string | null
          id: string
          industry_sector: string | null
          is_below_market: boolean | null
          market_impact: string | null
          notification_sent: boolean | null
          notification_sent_at: string | null
          price_difference_percent: number | null
          price_trend: string | null
          price_unit: string
          price_value: number
          project_location: string | null
          project_size_mw: number | null
          publish_date: string | null
          relevance_score: number | null
          source_publisher: string | null
          source_title: string
          source_url: string | null
          technology_type: string | null
          updated_at: string | null
          vendor_company: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          alert_level?: string | null
          alert_type: string
          baseline_price?: number | null
          created_at?: string | null
          currency?: string | null
          deal_name?: string | null
          deal_summary?: string | null
          extracted_at?: string | null
          extracted_by?: string | null
          id?: string
          industry_sector?: string | null
          is_below_market?: boolean | null
          market_impact?: string | null
          notification_sent?: boolean | null
          notification_sent_at?: string | null
          price_difference_percent?: number | null
          price_trend?: string | null
          price_unit: string
          price_value: number
          project_location?: string | null
          project_size_mw?: number | null
          publish_date?: string | null
          relevance_score?: number | null
          source_publisher?: string | null
          source_title: string
          source_url?: string | null
          technology_type?: string | null
          updated_at?: string | null
          vendor_company?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          alert_level?: string | null
          alert_type?: string
          baseline_price?: number | null
          created_at?: string | null
          currency?: string | null
          deal_name?: string | null
          deal_summary?: string | null
          extracted_at?: string | null
          extracted_by?: string | null
          id?: string
          industry_sector?: string | null
          is_below_market?: boolean | null
          market_impact?: string | null
          notification_sent?: boolean | null
          notification_sent_at?: string | null
          price_difference_percent?: number | null
          price_trend?: string | null
          price_unit?: string
          price_value?: number
          project_location?: string | null
          project_size_mw?: number | null
          publish_date?: string | null
          relevance_score?: number | null
          source_publisher?: string | null
          source_title?: string
          source_url?: string | null
          technology_type?: string | null
          updated_at?: string | null
          vendor_company?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      energy_price_trends: {
        Row: {
          avg_price: number
          confidence_level: string | null
          country: string | null
          created_at: string | null
          id: string
          max_price: number
          median_price: number | null
          min_price: number
          period_end: string
          period_start: string
          price_change_percent: number | null
          region: string | null
          sample_size: number | null
          time_period: string
          trend_direction: string | null
          trend_type: string
          updated_at: string | null
        }
        Insert: {
          avg_price: number
          confidence_level?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          max_price: number
          median_price?: number | null
          min_price: number
          period_end: string
          period_start: string
          price_change_percent?: number | null
          region?: string | null
          sample_size?: number | null
          time_period: string
          trend_direction?: string | null
          trend_type: string
          updated_at?: string | null
        }
        Update: {
          avg_price?: number
          confidence_level?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          max_price?: number
          median_price?: number | null
          min_price?: number
          period_end?: string
          period_start?: string
          price_change_percent?: number | null
          region?: string | null
          sample_size?: number | null
          time_period?: string
          trend_direction?: string | null
          trend_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      equipment_database: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          data_source: string | null
          description: string | null
          display_order: number | null
          duty_cycle: number
          id: string
          is_active: boolean | null
          manufacturer: string | null
          model: string | null
          name: string
          power_kw: number
          show_in_ui: boolean | null
          updated_at: string | null
          use_case_template_id: string
          validation_notes: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          data_source?: string | null
          description?: string | null
          display_order?: number | null
          duty_cycle: number
          id?: string
          is_active?: boolean | null
          manufacturer?: string | null
          model?: string | null
          name: string
          power_kw: number
          show_in_ui?: boolean | null
          updated_at?: string | null
          use_case_template_id: string
          validation_notes?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          data_source?: string | null
          description?: string | null
          display_order?: number | null
          duty_cycle?: number
          id?: string
          is_active?: boolean | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          power_kw?: number
          show_in_ui?: boolean | null
          updated_at?: string | null
          use_case_template_id?: string
          validation_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_database_use_case_template_id_fkey"
            columns: ["use_case_template_id"]
            isOneToOne: false
            referencedRelation: "use_case_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_database_use_case_template_id_fkey"
            columns: ["use_case_template_id"]
            isOneToOne: false
            referencedRelation: "v_use_case_templates_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_pricing: {
        Row: {
          confidence_level: string | null
          created_at: string | null
          effective_date: string | null
          equipment_type: string
          expiration_date: string | null
          id: string
          is_active: boolean | null
          manufacturer: string
          max_capacity_mw: number | null
          min_capacity_mw: number | null
          model: string | null
          notes: string | null
          price_per_kw: number | null
          price_per_kwh: number | null
          price_per_mva: number | null
          price_per_watt: number | null
          quote_reference: string | null
          region: string | null
          source: string | null
          updated_at: string | null
          vendor_contact: string | null
          vendor_name: string | null
        }
        Insert: {
          confidence_level?: string | null
          created_at?: string | null
          effective_date?: string | null
          equipment_type: string
          expiration_date?: string | null
          id?: string
          is_active?: boolean | null
          manufacturer: string
          max_capacity_mw?: number | null
          min_capacity_mw?: number | null
          model?: string | null
          notes?: string | null
          price_per_kw?: number | null
          price_per_kwh?: number | null
          price_per_mva?: number | null
          price_per_watt?: number | null
          quote_reference?: string | null
          region?: string | null
          source?: string | null
          updated_at?: string | null
          vendor_contact?: string | null
          vendor_name?: string | null
        }
        Update: {
          confidence_level?: string | null
          created_at?: string | null
          effective_date?: string | null
          equipment_type?: string
          expiration_date?: string | null
          id?: string
          is_active?: boolean | null
          manufacturer?: string
          max_capacity_mw?: number | null
          min_capacity_mw?: number | null
          model?: string | null
          notes?: string | null
          price_per_kw?: number | null
          price_per_kwh?: number | null
          price_per_mva?: number | null
          price_per_watt?: number | null
          quote_reference?: string | null
          region?: string | null
          source?: string | null
          updated_at?: string | null
          vendor_contact?: string | null
          vendor_name?: string | null
        }
        Relationships: []
      }
      equipment_pricing_tiers: {
        Row: {
          base_price: number
          confidence_level: string | null
          created_at: string | null
          data_source: string
          effective_date: string | null
          equipment_type: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          manufacturer: string | null
          model: string | null
          notes: string | null
          price_unit: string
          size_max: number | null
          size_min: number | null
          size_unit: string | null
          source_date: string | null
          source_url: string | null
          specifications: Json | null
          tier_name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          base_price: number
          confidence_level?: string | null
          created_at?: string | null
          data_source?: string
          effective_date?: string | null
          equipment_type: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          manufacturer?: string | null
          model?: string | null
          notes?: string | null
          price_unit: string
          size_max?: number | null
          size_min?: number | null
          size_unit?: string | null
          source_date?: string | null
          source_url?: string | null
          specifications?: Json | null
          tier_name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          base_price?: number
          confidence_level?: string | null
          created_at?: string | null
          data_source?: string
          effective_date?: string | null
          equipment_type?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          manufacturer?: string | null
          model?: string | null
          notes?: string | null
          price_unit?: string
          size_max?: number | null
          size_min?: number | null
          size_unit?: string | null
          source_date?: string | null
          source_url?: string | null
          specifications?: Json | null
          tier_name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      equipment_templates: {
        Row: {
          created_at: string | null
          duty_cycle_percent: number | null
          efficiency_percent: number | null
          equipment_category: string
          equipment_name: string
          id: string
          industry_standard: string | null
          is_active: boolean | null
          load_profile_type: string | null
          nameplate_power_kw: number
          operating_hours_per_day: number | null
          power_factor: number | null
          standby_power_kw: number | null
          startup_surge_multiplier: number | null
          typical_power_kw: number | null
          updated_at: string | null
          validation_source: string | null
        }
        Insert: {
          created_at?: string | null
          duty_cycle_percent?: number | null
          efficiency_percent?: number | null
          equipment_category: string
          equipment_name: string
          id?: string
          industry_standard?: string | null
          is_active?: boolean | null
          load_profile_type?: string | null
          nameplate_power_kw: number
          operating_hours_per_day?: number | null
          power_factor?: number | null
          standby_power_kw?: number | null
          startup_surge_multiplier?: number | null
          typical_power_kw?: number | null
          updated_at?: string | null
          validation_source?: string | null
        }
        Update: {
          created_at?: string | null
          duty_cycle_percent?: number | null
          efficiency_percent?: number | null
          equipment_category?: string
          equipment_name?: string
          id?: string
          industry_standard?: string | null
          is_active?: boolean | null
          load_profile_type?: string | null
          nameplate_power_kw?: number
          operating_hours_per_day?: number | null
          power_factor?: number | null
          standby_power_kw?: number | null
          startup_surge_multiplier?: number | null
          typical_power_kw?: number | null
          updated_at?: string | null
          validation_source?: string | null
        }
        Relationships: []
      }
      equipment_vendors: {
        Row: {
          calendar_life_years: number | null
          capacity_kw: number | null
          capacity_kwh: number | null
          chemistry: string | null
          country_of_origin: string | null
          created_at: string | null
          cycle_life: number | null
          data_source: string | null
          depth_of_discharge: number | null
          effective_date: string | null
          id: string
          lead_time_weeks: number | null
          min_order_quantity: number | null
          price_per_unit: number
          price_unit: string
          product_model: string | null
          product_name: string | null
          region_availability: string[] | null
          round_trip_efficiency: number | null
          tier: string | null
          ul_certifications: string[] | null
          ul_listed: boolean | null
          updated_at: string | null
          vendor_name: string
          vendor_type: string
          warranty_years: number | null
        }
        Insert: {
          calendar_life_years?: number | null
          capacity_kw?: number | null
          capacity_kwh?: number | null
          chemistry?: string | null
          country_of_origin?: string | null
          created_at?: string | null
          cycle_life?: number | null
          data_source?: string | null
          depth_of_discharge?: number | null
          effective_date?: string | null
          id?: string
          lead_time_weeks?: number | null
          min_order_quantity?: number | null
          price_per_unit: number
          price_unit: string
          product_model?: string | null
          product_name?: string | null
          region_availability?: string[] | null
          round_trip_efficiency?: number | null
          tier?: string | null
          ul_certifications?: string[] | null
          ul_listed?: boolean | null
          updated_at?: string | null
          vendor_name: string
          vendor_type: string
          warranty_years?: number | null
        }
        Update: {
          calendar_life_years?: number | null
          capacity_kw?: number | null
          capacity_kwh?: number | null
          chemistry?: string | null
          country_of_origin?: string | null
          created_at?: string | null
          cycle_life?: number | null
          data_source?: string | null
          depth_of_discharge?: number | null
          effective_date?: string | null
          id?: string
          lead_time_weeks?: number | null
          min_order_quantity?: number | null
          price_per_unit?: number
          price_unit?: string
          product_model?: string | null
          product_name?: string | null
          region_availability?: string[] | null
          round_trip_efficiency?: number | null
          tier?: string | null
          ul_certifications?: string[] | null
          ul_listed?: boolean | null
          updated_at?: string | null
          vendor_name?: string
          vendor_type?: string
          warranty_years?: number | null
        }
        Relationships: []
      }
      ev_charger_catalog: {
        Row: {
          amperage: number | null
          charger_class: string
          charger_type: string
          connector_type: string | null
          created_at: string | null
          data_source: string | null
          effective_date: string | null
          efficiency: number | null
          example_vendors: string[] | null
          hardware_cost_max: number
          hardware_cost_min: number
          hardware_cost_typical: number
          id: string
          install_cost_max: number
          install_cost_min: number
          install_cost_typical: number
          make_ready_cost_max: number | null
          make_ready_cost_min: number | null
          make_ready_cost_typical: number | null
          power_kw: number
          sessions_per_day: number | null
          simultaneous_charging: boolean | null
          typical_rate_per_kwh: number | null
          typical_session_fee: number | null
          typical_session_kwh: number | null
          typical_utilization: number | null
          updated_at: string | null
          voltage: number | null
        }
        Insert: {
          amperage?: number | null
          charger_class: string
          charger_type: string
          connector_type?: string | null
          created_at?: string | null
          data_source?: string | null
          effective_date?: string | null
          efficiency?: number | null
          example_vendors?: string[] | null
          hardware_cost_max: number
          hardware_cost_min: number
          hardware_cost_typical: number
          id?: string
          install_cost_max: number
          install_cost_min: number
          install_cost_typical: number
          make_ready_cost_max?: number | null
          make_ready_cost_min?: number | null
          make_ready_cost_typical?: number | null
          power_kw: number
          sessions_per_day?: number | null
          simultaneous_charging?: boolean | null
          typical_rate_per_kwh?: number | null
          typical_session_fee?: number | null
          typical_session_kwh?: number | null
          typical_utilization?: number | null
          updated_at?: string | null
          voltage?: number | null
        }
        Update: {
          amperage?: number | null
          charger_class?: string
          charger_type?: string
          connector_type?: string | null
          created_at?: string | null
          data_source?: string | null
          effective_date?: string | null
          efficiency?: number | null
          example_vendors?: string[] | null
          hardware_cost_max?: number
          hardware_cost_min?: number
          hardware_cost_typical?: number
          id?: string
          install_cost_max?: number
          install_cost_min?: number
          install_cost_typical?: number
          make_ready_cost_max?: number | null
          make_ready_cost_min?: number | null
          make_ready_cost_typical?: number | null
          power_kw?: number
          sessions_per_day?: number | null
          simultaneous_charging?: boolean | null
          typical_rate_per_kwh?: number | null
          typical_session_fee?: number | null
          typical_session_kwh?: number | null
          typical_utilization?: number | null
          updated_at?: string | null
          voltage?: number | null
        }
        Relationships: []
      }
      file_attachments: {
        Row: {
          created_at: string | null
          expires_at: string | null
          file_path: string
          file_size: number
          file_url: string | null
          filename: string
          id: string
          is_public: boolean | null
          mime_type: string
          original_filename: string
          related_id: string | null
          related_table: string | null
          scan_result: string | null
          uploaded_by: string | null
          virus_scanned: boolean | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          file_path: string
          file_size: number
          file_url?: string | null
          filename: string
          id?: string
          is_public?: boolean | null
          mime_type: string
          original_filename: string
          related_id?: string | null
          related_table?: string | null
          scan_result?: string | null
          uploaded_by?: string | null
          virus_scanned?: boolean | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          file_path?: string
          file_size?: number
          file_url?: string | null
          filename?: string
          id?: string
          is_public?: boolean | null
          mime_type?: string
          original_filename?: string
          related_id?: string | null
          related_table?: string | null
          scan_result?: string | null
          uploaded_by?: string | null
          virus_scanned?: boolean | null
        }
        Relationships: []
      }
      financing_options: {
        Row: {
          created_at: string | null
          id: number
          incentivesIncluded: string[]
          interestRate: number | null
          lastUpdated: string
          maxProjectSize: number | null
          minProjectSize: number | null
          provider: string
          region: string[]
          requirements: string[]
          sector: string[]
          term: number
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          incentivesIncluded: string[]
          interestRate?: number | null
          lastUpdated: string
          maxProjectSize?: number | null
          minProjectSize?: number | null
          provider: string
          region: string[]
          requirements: string[]
          sector: string[]
          term: number
          type: string
        }
        Update: {
          created_at?: string | null
          id?: number
          incentivesIncluded?: string[]
          interestRate?: number | null
          lastUpdated?: string
          maxProjectSize?: number | null
          minProjectSize?: number | null
          provider?: string
          region?: string[]
          requirements?: string[]
          sector?: string[]
          term?: number
          type?: string
        }
        Relationships: []
      }
      funding_rounds: {
        Row: {
          amount_usd: number
          announced_date: string
          confidence_score: number | null
          created_at: string | null
          id: string
          lead_investors: string[] | null
          news_headline: string | null
          participating_investors: string[] | null
          round_type: string
          source: string
          source_url: string | null
          startup_id: string | null
          startup_name: string
          updated_at: string | null
          valuation_usd: number | null
        }
        Insert: {
          amount_usd: number
          announced_date: string
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          lead_investors?: string[] | null
          news_headline?: string | null
          participating_investors?: string[] | null
          round_type: string
          source: string
          source_url?: string | null
          startup_id?: string | null
          startup_name: string
          updated_at?: string | null
          valuation_usd?: number | null
        }
        Update: {
          amount_usd?: number
          announced_date?: string
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          lead_investors?: string[] | null
          news_headline?: string | null
          participating_investors?: string[] | null
          round_type?: string
          source?: string
          source_url?: string | null
          startup_id?: string | null
          startup_name?: string
          updated_at?: string | null
          valuation_usd?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "funding_rounds_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "approved_startups_for_matching"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funding_rounds_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "recent_funding_activity"
            referencedColumns: ["startup_id"]
          },
          {
            foreignKeyName: "funding_rounds_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startup_momentum_dashboard"
            referencedColumns: ["startup_id"]
          },
          {
            foreignKeyName: "funding_rounds_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startup_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_suggestion_rules: {
        Row: {
          active: boolean | null
          climate_risk: string
          confidence: number
          created_at: string | null
          grid_stress: string | null
          id: string
          industry_slug: string
          rationale: string
          source: string
          suggested_goals: string[]
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          climate_risk: string
          confidence: number
          created_at?: string | null
          grid_stress?: string | null
          id?: string
          industry_slug: string
          rationale: string
          source: string
          suggested_goals: string[]
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          climate_risk?: string
          confidence?: number
          created_at?: string | null
          grid_stress?: string | null
          id?: string
          industry_slug?: string
          rationale?: string
          source?: string
          suggested_goals?: string[]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_suggestion_rules_industry_slug_fkey"
            columns: ["industry_slug"]
            isOneToOne: false
            referencedRelation: "use_cases"
            referencedColumns: ["slug"]
          },
        ]
      }
      incentive_programs: {
        Row: {
          applicationLink: string | null
          created_at: string | null
          deadline: string | null
          eligibility: string[]
          id: number
          lastUpdated: string
          name: string
          region: string
          state: string | null
          status: string
          type: string
          value: string
        }
        Insert: {
          applicationLink?: string | null
          created_at?: string | null
          deadline?: string | null
          eligibility: string[]
          id?: number
          lastUpdated: string
          name: string
          region: string
          state?: string | null
          status: string
          type: string
          value: string
        }
        Update: {
          applicationLink?: string | null
          created_at?: string | null
          deadline?: string | null
          eligibility?: string[]
          id?: number
          lastUpdated?: string
          name?: string
          region?: string
          state?: string | null
          status?: string
          type?: string
          value?: string
        }
        Relationships: []
      }
      industry_configs: {
        Row: {
          bess_duration_hours: number
          created_at: string
          critical_load_percent: number
          generator_required: boolean | null
          id: string
          industry: string
          load_factor: number
          load_method: string
          name: string
          solar_recommended: boolean | null
          subtypes: Json | null
          unit_field: string | null
          updated_at: string
          watts_per_unit: number
        }
        Insert: {
          bess_duration_hours?: number
          created_at?: string
          critical_load_percent?: number
          generator_required?: boolean | null
          id?: string
          industry: string
          load_factor: number
          load_method: string
          name: string
          solar_recommended?: boolean | null
          subtypes?: Json | null
          unit_field?: string | null
          updated_at?: string
          watts_per_unit: number
        }
        Update: {
          bess_duration_hours?: number
          created_at?: string
          critical_load_percent?: number
          generator_required?: boolean | null
          id?: string
          industry?: string
          load_factor?: number
          load_method?: string
          name?: string
          solar_recommended?: boolean | null
          subtypes?: Json | null
          unit_field?: string | null
          updated_at?: string
          watts_per_unit?: number
        }
        Relationships: []
      }
      industry_keyword_mappings: {
        Row: {
          active: boolean | null
          case_sensitive: boolean | null
          confidence_weight: number
          created_at: string | null
          id: string
          industry_slug: string
          is_exact_match: boolean | null
          keyword: string
        }
        Insert: {
          active?: boolean | null
          case_sensitive?: boolean | null
          confidence_weight: number
          created_at?: string | null
          id?: string
          industry_slug: string
          is_exact_match?: boolean | null
          keyword: string
        }
        Update: {
          active?: boolean | null
          case_sensitive?: boolean | null
          confidence_weight?: number
          created_at?: string | null
          id?: string
          industry_slug?: string
          is_exact_match?: boolean | null
          keyword?: string
        }
        Relationships: [
          {
            foreignKeyName: "industry_keyword_mappings_industry_slug_fkey"
            columns: ["industry_slug"]
            isOneToOne: false
            referencedRelation: "use_cases"
            referencedColumns: ["slug"]
          },
        ]
      }
      industry_news: {
        Row: {
          category: string
          created_at: string | null
          id: number
          publishDate: string
          relevanceScore: number
          source: string
          summary: string
          title: string
          url: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: number
          publishDate: string
          relevanceScore: number
          source: string
          summary: string
          title: string
          url: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: number
          publishDate?: string
          relevanceScore?: number
          source?: string
          summary?: string
          title?: string
          url?: string
        }
        Relationships: []
      }
      industry_power_profiles: {
        Row: {
          avg_demand_charge: number | null
          avg_electricity_rate: number | null
          data_source: string | null
          id: string
          industry_slug: string
          last_updated: string | null
          load_profile_type: string | null
          peak_demand_timing: string | null
          recommended_backup_hours: number | null
          recommended_battery_kwh_per_unit: number | null
          recommended_solar_kw_per_unit: number | null
          typical_monthly_kwh: number | null
          typical_payback_years: number | null
          typical_peak_demand_kw: number | null
          unit_name: string | null
          unit_plural: string | null
        }
        Insert: {
          avg_demand_charge?: number | null
          avg_electricity_rate?: number | null
          data_source?: string | null
          id?: string
          industry_slug: string
          last_updated?: string | null
          load_profile_type?: string | null
          peak_demand_timing?: string | null
          recommended_backup_hours?: number | null
          recommended_battery_kwh_per_unit?: number | null
          recommended_solar_kw_per_unit?: number | null
          typical_monthly_kwh?: number | null
          typical_payback_years?: number | null
          typical_peak_demand_kw?: number | null
          unit_name?: string | null
          unit_plural?: string | null
        }
        Update: {
          avg_demand_charge?: number | null
          avg_electricity_rate?: number | null
          data_source?: string | null
          id?: string
          industry_slug?: string
          last_updated?: string | null
          load_profile_type?: string | null
          peak_demand_timing?: string | null
          recommended_backup_hours?: number | null
          recommended_battery_kwh_per_unit?: number | null
          recommended_solar_kw_per_unit?: number | null
          typical_monthly_kwh?: number | null
          typical_payback_years?: number | null
          typical_peak_demand_kw?: number | null
          unit_name?: string | null
          unit_plural?: string | null
        }
        Relationships: []
      }
      intelligence_events: {
        Row: {
          confidence: number | null
          correction_value: string | null
          created_at: string
          event_category: string
          event_type: string
          id: string
          input_data: Json
          ip_hash: string | null
          output_data: Json
          processing_time_ms: number | null
          user_agent: string | null
          user_session_id: string | null
          was_correct: boolean | null
          wizard_step: number
        }
        Insert: {
          confidence?: number | null
          correction_value?: string | null
          created_at?: string
          event_category: string
          event_type: string
          id?: string
          input_data: Json
          ip_hash?: string | null
          output_data: Json
          processing_time_ms?: number | null
          user_agent?: string | null
          user_session_id?: string | null
          was_correct?: boolean | null
          wizard_step?: number
        }
        Update: {
          confidence?: number | null
          correction_value?: string | null
          created_at?: string
          event_category?: string
          event_type?: string
          id?: string
          input_data?: Json
          ip_hash?: string | null
          output_data?: Json
          processing_time_ms?: number | null
          user_agent?: string | null
          user_session_id?: string | null
          was_correct?: boolean | null
          wizard_step?: number
        }
        Relationships: []
      }
      international_cities: {
        Row: {
          city_name: string
          country_code: string
          created_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          population: number | null
          tier: number | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          city_name: string
          country_code: string
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          population?: number | null
          tier?: number | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          city_name?: string
          country_code?: string
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          population?: number | null
          tier?: number | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "international_cities_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "international_countries"
            referencedColumns: ["country_code"]
          },
        ]
      }
      international_countries: {
        Row: {
          country_code: string
          country_name: string
          created_at: string | null
          currency_symbol: string | null
          currency_to_usd: number | null
          data_source: string | null
          electricity_rate_usd: number | null
          flag_emoji: string | null
          last_updated: string | null
          peak_sun_hours: number | null
          solar_rating: string | null
          wind_potential: string | null
        }
        Insert: {
          country_code: string
          country_name: string
          created_at?: string | null
          currency_symbol?: string | null
          currency_to_usd?: number | null
          data_source?: string | null
          electricity_rate_usd?: number | null
          flag_emoji?: string | null
          last_updated?: string | null
          peak_sun_hours?: number | null
          solar_rating?: string | null
          wind_potential?: string | null
        }
        Update: {
          country_code?: string
          country_name?: string
          created_at?: string | null
          currency_symbol?: string | null
          currency_to_usd?: number | null
          data_source?: string | null
          electricity_rate_usd?: number | null
          flag_emoji?: string | null
          last_updated?: string | null
          peak_sun_hours?: number | null
          solar_rating?: string | null
          wind_potential?: string | null
        }
        Relationships: []
      }
      intro_timing_recommendations: {
        Row: {
          created_at: string | null
          factors_considered: Json | null
          id: string
          match_id: string
          optimal_intro_time: string
          reasoning: Json
          timing_score: number
        }
        Insert: {
          created_at?: string | null
          factors_considered?: Json | null
          id?: string
          match_id: string
          optimal_intro_time: string
          reasoning: Json
          timing_score: number
        }
        Update: {
          created_at?: string | null
          factors_considered?: Json | null
          id?: string
          match_id?: string
          optimal_intro_time?: string
          reasoning?: Json
          timing_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "intro_timing_recommendations_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "startup_investor_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intro_timing_recommendations_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "successful_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_behavior_patterns: {
        Row: {
          activity_level_score: number | null
          avg_response_time_hours: number | null
          id: string
          investor_id: string
          last_active_date: string | null
          preferred_contact_day: string | null
          preferred_contact_hour: number | null
          successful_introductions: number | null
          total_interactions: number | null
          updated_at: string | null
        }
        Insert: {
          activity_level_score?: number | null
          avg_response_time_hours?: number | null
          id?: string
          investor_id: string
          last_active_date?: string | null
          preferred_contact_day?: string | null
          preferred_contact_hour?: number | null
          successful_introductions?: number | null
          total_interactions?: number | null
          updated_at?: string | null
        }
        Update: {
          activity_level_score?: number | null
          avg_response_time_hours?: number | null
          id?: string
          investor_id?: string
          last_active_date?: string | null
          preferred_contact_day?: string | null
          preferred_contact_hour?: number | null
          successful_introductions?: number | null
          total_interactions?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investor_behavior_patterns_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: true
            referencedRelation: "investor_engagement_summary"
            referencedColumns: ["investor_id"]
          },
          {
            foreignKeyName: "investor_behavior_patterns_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: true
            referencedRelation: "investors"
            referencedColumns: ["id"]
          },
        ]
      }
      investors: {
        Row: {
          aum: string | null
          bio: string | null
          board_seats: number | null
          check_size_max: number | null
          check_size_min: number | null
          created_at: string | null
          email: string | null
          embedding: string | null
          exits: number | null
          firm: string | null
          fund_size: string | null
          geography: string | null
          id: string
          investment_pace: number | null
          last_enrichment_date: string | null
          last_investment_date: string | null
          leads_rounds: boolean | null
          linkedin: string | null
          location: string | null
          name: string
          notable_investments: string[] | null
          partners: Json | null
          portfolio_size: number | null
          sector_focus: string[] | null
          stage_focus: string[] | null
          status: string | null
          tagline: string | null
          twitter: string | null
          type: string | null
          unicorns: number | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          aum?: string | null
          bio?: string | null
          board_seats?: number | null
          check_size_max?: number | null
          check_size_min?: number | null
          created_at?: string | null
          email?: string | null
          embedding?: string | null
          exits?: number | null
          firm?: string | null
          fund_size?: string | null
          geography?: string | null
          id?: string
          investment_pace?: number | null
          last_enrichment_date?: string | null
          last_investment_date?: string | null
          leads_rounds?: boolean | null
          linkedin?: string | null
          location?: string | null
          name: string
          notable_investments?: string[] | null
          partners?: Json | null
          portfolio_size?: number | null
          sector_focus?: string[] | null
          stage_focus?: string[] | null
          status?: string | null
          tagline?: string | null
          twitter?: string | null
          type?: string | null
          unicorns?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          aum?: string | null
          bio?: string | null
          board_seats?: number | null
          check_size_max?: number | null
          check_size_min?: number | null
          created_at?: string | null
          email?: string | null
          embedding?: string | null
          exits?: number | null
          firm?: string | null
          fund_size?: string | null
          geography?: string | null
          id?: string
          investment_pace?: number | null
          last_enrichment_date?: string | null
          last_investment_date?: string | null
          leads_rounds?: boolean | null
          linkedin?: string | null
          location?: string | null
          name?: string
          notable_investments?: string[] | null
          partners?: Json | null
          portfolio_size?: number | null
          sector_focus?: string[] | null
          stage_focus?: string[] | null
          status?: string | null
          tagline?: string | null
          twitter?: string | null
          type?: string | null
          unicorns?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      iso_market_prices: {
        Row: {
          bess_eligible: boolean | null
          created_at: string | null
          data_period: string | null
          data_source: string | null
          id: string
          iso_name: string
          iso_region: string
          last_updated: string | null
          market_type: string | null
          min_capacity_mw: number | null
          min_duration_hours: number | null
          price_average: number | null
          price_high: number | null
          price_low: number | null
          price_per_mw_year: number | null
          price_per_mwh: number | null
          price_unit: string
          service_type: string
          settlement_period: string | null
          trend: string | null
          updated_at: string | null
          yoy_change_percent: number | null
        }
        Insert: {
          bess_eligible?: boolean | null
          created_at?: string | null
          data_period?: string | null
          data_source?: string | null
          id?: string
          iso_name: string
          iso_region: string
          last_updated?: string | null
          market_type?: string | null
          min_capacity_mw?: number | null
          min_duration_hours?: number | null
          price_average?: number | null
          price_high?: number | null
          price_low?: number | null
          price_per_mw_year?: number | null
          price_per_mwh?: number | null
          price_unit: string
          service_type: string
          settlement_period?: string | null
          trend?: string | null
          updated_at?: string | null
          yoy_change_percent?: number | null
        }
        Update: {
          bess_eligible?: boolean | null
          created_at?: string | null
          data_period?: string | null
          data_source?: string | null
          id?: string
          iso_name?: string
          iso_region?: string
          last_updated?: string | null
          market_type?: string | null
          min_capacity_mw?: number | null
          min_duration_hours?: number | null
          price_average?: number | null
          price_high?: number | null
          price_low?: number | null
          price_per_mw_year?: number | null
          price_per_mwh?: number | null
          price_unit?: string
          service_type?: string
          settlement_period?: string | null
          trend?: string | null
          updated_at?: string | null
          yoy_change_percent?: number | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          company: string | null
          created_at: string
          email: string
          format: string | null
          id: string
          name: string
          phone: string | null
          source: string
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          format?: string | null
          id?: string
          name: string
          phone?: string | null
          source?: string
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          format?: string | null
          id?: string
          name?: string
          phone?: string | null
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      market_data_sources: {
        Row: {
          added_by: string | null
          content_type: string
          created_at: string | null
          data_frequency: string | null
          equipment_categories: string[]
          feed_url: string | null
          fetch_error_count: number | null
          id: string
          is_active: boolean | null
          last_fetch_at: string | null
          last_fetch_status: string | null
          name: string
          notes: string | null
          regions: string[] | null
          reliability_score: number | null
          scrape_config: Json | null
          source_type: string
          total_data_points: number | null
          updated_at: string | null
          url: string
        }
        Insert: {
          added_by?: string | null
          content_type: string
          created_at?: string | null
          data_frequency?: string | null
          equipment_categories?: string[]
          feed_url?: string | null
          fetch_error_count?: number | null
          id?: string
          is_active?: boolean | null
          last_fetch_at?: string | null
          last_fetch_status?: string | null
          name: string
          notes?: string | null
          regions?: string[] | null
          reliability_score?: number | null
          scrape_config?: Json | null
          source_type: string
          total_data_points?: number | null
          updated_at?: string | null
          url: string
        }
        Update: {
          added_by?: string | null
          content_type?: string
          created_at?: string | null
          data_frequency?: string | null
          equipment_categories?: string[]
          feed_url?: string | null
          fetch_error_count?: number | null
          id?: string
          is_active?: boolean | null
          last_fetch_at?: string | null
          last_fetch_status?: string | null
          name?: string
          notes?: string | null
          regions?: string[] | null
          reliability_score?: number | null
          scrape_config?: Json | null
          source_type?: string
          total_data_points?: number | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      market_inferences: {
        Row: {
          analysis_date: string
          bess_configurations: Json | null
          confidence: number | null
          created_at: string | null
          data_points_analyzed: number | null
          decision_indicators: Json | null
          emerging_opportunities: Json | null
          id: string
          industry_adoption: Json | null
          market_trends: Json | null
          ml_model_version: string | null
          overall_sentiment: string | null
          pricing_update_recommendations: Json | null
          requires_pricing_update: boolean | null
          sources: string[] | null
          updated_at: string | null
        }
        Insert: {
          analysis_date: string
          bess_configurations?: Json | null
          confidence?: number | null
          created_at?: string | null
          data_points_analyzed?: number | null
          decision_indicators?: Json | null
          emerging_opportunities?: Json | null
          id?: string
          industry_adoption?: Json | null
          market_trends?: Json | null
          ml_model_version?: string | null
          overall_sentiment?: string | null
          pricing_update_recommendations?: Json | null
          requires_pricing_update?: boolean | null
          sources?: string[] | null
          updated_at?: string | null
        }
        Update: {
          analysis_date?: string
          bess_configurations?: Json | null
          confidence?: number | null
          created_at?: string | null
          data_points_analyzed?: number | null
          decision_indicators?: Json | null
          emerging_opportunities?: Json | null
          id?: string
          industry_adoption?: Json | null
          market_trends?: Json | null
          ml_model_version?: string | null
          overall_sentiment?: string | null
          pricing_update_recommendations?: Json | null
          requires_pricing_update?: boolean | null
          sources?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      market_pricing: {
        Row: {
          category: string
          confidence: number | null
          created_at: string
          current_price: number
          effective_date: string | null
          id: string
          item: string
          previous_price: number | null
          scraped_at: string
          source: string
          source_url: string | null
          unit: string
        }
        Insert: {
          category: string
          confidence?: number | null
          created_at?: string
          current_price: number
          effective_date?: string | null
          id?: string
          item: string
          previous_price?: number | null
          scraped_at?: string
          source: string
          source_url?: string | null
          unit: string
        }
        Update: {
          category?: string
          confidence?: number | null
          created_at?: string
          current_price?: number
          effective_date?: string | null
          id?: string
          item?: string
          previous_price?: number | null
          scraped_at?: string
          source?: string
          source_url?: string | null
          unit?: string
        }
        Relationships: []
      }
      market_pricing_data: {
        Row: {
          confidence_level: string | null
          created_at: string | null
          currency: string | null
          data_date: string
          data_source: string
          equipment_type: string
          id: string
          metadata: Json | null
          notes: string | null
          price_per_unit: number
          region: string
          trend_direction: string | null
          unit_type: string
          updated_at: string | null
        }
        Insert: {
          confidence_level?: string | null
          created_at?: string | null
          currency?: string | null
          data_date: string
          data_source: string
          equipment_type: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          price_per_unit: number
          region: string
          trend_direction?: string | null
          unit_type: string
          updated_at?: string | null
        }
        Update: {
          confidence_level?: string | null
          created_at?: string | null
          currency?: string | null
          data_date?: string
          data_source?: string
          equipment_type?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          price_per_unit?: number
          region?: string
          trend_direction?: string | null
          unit_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      match_feedback: {
        Row: {
          created_at: string | null
          created_by: string
          feedback_date: string
          feedback_type: string
          id: string
          investment_amount: number | null
          investor_id: string
          match_id: string
          notes: string | null
          startup_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          feedback_date: string
          feedback_type: string
          id?: string
          investment_amount?: number | null
          investor_id: string
          match_id: string
          notes?: string | null
          startup_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          feedback_date?: string
          feedback_type?: string
          id?: string
          investment_amount?: number | null
          investor_id?: string
          match_id?: string
          notes?: string | null
          startup_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_feedback_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investor_engagement_summary"
            referencedColumns: ["investor_id"]
          },
          {
            foreignKeyName: "match_feedback_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_feedback_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "startup_investor_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_feedback_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "successful_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_feedback_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "approved_startups_for_matching"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_feedback_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "recent_funding_activity"
            referencedColumns: ["startup_id"]
          },
          {
            foreignKeyName: "match_feedback_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startup_momentum_dashboard"
            referencedColumns: ["startup_id"]
          },
          {
            foreignKeyName: "match_feedback_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startup_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      matching_queue: {
        Row: {
          attempts: number | null
          created_at: string | null
          error_message: string | null
          id: string
          processed_at: string | null
          startup_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          processed_at?: string | null
          startup_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          processed_at?: string | null
          startup_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matching_queue_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: true
            referencedRelation: "approved_startups_for_matching"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matching_queue_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: true
            referencedRelation: "recent_funding_activity"
            referencedColumns: ["startup_id"]
          },
          {
            foreignKeyName: "matching_queue_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: true
            referencedRelation: "startup_momentum_dashboard"
            referencedColumns: ["startup_id"]
          },
          {
            foreignKeyName: "matching_queue_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: true
            referencedRelation: "startup_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          job_type: string
          metadata: Json | null
          records_processed: number | null
          records_total: number | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          job_type: string
          metadata?: Json | null
          records_processed?: number | null
          records_total?: number | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          job_type?: string
          metadata?: Json | null
          records_processed?: number | null
          records_total?: number | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      peer_benchmarks: {
        Row: {
          active: boolean | null
          confidence: string
          created_at: string | null
          display_text: string
          id: string
          industry_slug: string
          last_updated: string | null
          metric_name: string
          sample_size: number
          source: string
          state: string
          unit: string
          value_max: number
          value_min: number
        }
        Insert: {
          active?: boolean | null
          confidence: string
          created_at?: string | null
          display_text: string
          id?: string
          industry_slug: string
          last_updated?: string | null
          metric_name: string
          sample_size: number
          source: string
          state: string
          unit: string
          value_max: number
          value_min: number
        }
        Update: {
          active?: boolean | null
          confidence?: string
          created_at?: string | null
          display_text?: string
          id?: string
          industry_slug?: string
          last_updated?: string | null
          metric_name?: string
          sample_size?: number
          source?: string
          state?: string
          unit?: string
          value_max?: number
          value_min?: number
        }
        Relationships: [
          {
            foreignKeyName: "peer_benchmarks_industry_slug_fkey"
            columns: ["industry_slug"]
            isOneToOne: false
            referencedRelation: "use_cases"
            referencedColumns: ["slug"]
          },
        ]
      }
      power_profiles: {
        Row: {
          anonymous_id: string | null
          completed_checks: string[] | null
          created_at: string | null
          id: string
          last_activity_at: string | null
          level: number | null
          points: number | null
          total_downloads: number | null
          total_quotes_generated: number | null
          unlocked_features: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          anonymous_id?: string | null
          completed_checks?: string[] | null
          created_at?: string | null
          id?: string
          last_activity_at?: string | null
          level?: number | null
          points?: number | null
          total_downloads?: number | null
          total_quotes_generated?: number | null
          unlocked_features?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          anonymous_id?: string | null
          completed_checks?: string[] | null
          created_at?: string | null
          id?: string
          last_activity_at?: string | null
          level?: number | null
          points?: number | null
          total_downloads?: number | null
          total_quotes_generated?: number | null
          unlocked_features?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      pricing_audit_log: {
        Row: {
          change_reason: string | null
          changed_at: string | null
          changed_by: string | null
          config_key: string
          id: string
          new_value: Json | null
          old_value: Json | null
        }
        Insert: {
          change_reason?: string | null
          changed_at?: string | null
          changed_by?: string | null
          config_key: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Update: {
          change_reason?: string | null
          changed_at?: string | null
          changed_by?: string | null
          config_key?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Relationships: []
      }
      pricing_configurations: {
        Row: {
          confidence_level: string | null
          config_category: string
          config_data: Json
          config_key: string
          created_at: string | null
          data_source: string | null
          description: string | null
          effective_date: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          size_max_kw: number | null
          size_max_mwh: number | null
          size_min_kw: number | null
          size_min_mwh: number | null
          updated_at: string | null
          updated_by: string | null
          vendor_notes: string | null
          version: string | null
        }
        Insert: {
          confidence_level?: string | null
          config_category: string
          config_data: Json
          config_key: string
          created_at?: string | null
          data_source?: string | null
          description?: string | null
          effective_date?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          size_max_kw?: number | null
          size_max_mwh?: number | null
          size_min_kw?: number | null
          size_min_mwh?: number | null
          updated_at?: string | null
          updated_by?: string | null
          vendor_notes?: string | null
          version?: string | null
        }
        Update: {
          confidence_level?: string | null
          config_category?: string
          config_data?: Json
          config_key?: string
          created_at?: string | null
          data_source?: string | null
          description?: string | null
          effective_date?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          size_max_kw?: number | null
          size_max_mwh?: number | null
          size_min_kw?: number | null
          size_min_mwh?: number | null
          updated_at?: string | null
          updated_by?: string | null
          vendor_notes?: string | null
          version?: string | null
        }
        Relationships: []
      }
      pricing_history: {
        Row: {
          change_reason: string | null
          effective_date: string
          id: string
          lead_time_weeks: number | null
          market_notes: string | null
          price_per_kw: number | null
          price_per_kwh: number | null
          product_id: string
          recorded_at: string | null
          recorded_by: string | null
          vendor_id: string
        }
        Insert: {
          change_reason?: string | null
          effective_date: string
          id?: string
          lead_time_weeks?: number | null
          market_notes?: string | null
          price_per_kw?: number | null
          price_per_kwh?: number | null
          product_id: string
          recorded_at?: string | null
          recorded_by?: string | null
          vendor_id: string
        }
        Update: {
          change_reason?: string | null
          effective_date?: string
          id?: string
          lead_time_weeks?: number | null
          market_notes?: string | null
          price_per_kw?: number | null
          price_per_kwh?: number | null
          product_id?: string
          recorded_at?: string | null
          recorded_by?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "pending_product_approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vendor_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_history_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "pending_vendor_approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_history_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_history_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_policies: {
        Row: {
          age_decay_factor: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          equipment_type: string
          frequency_weights: Json
          id: string
          industry_ceiling: Json | null
          industry_floor: Json | null
          industry_guidance_weight: number | null
          is_active: boolean | null
          min_data_points: number | null
          name: string
          outlier_std_threshold: number | null
          priority: number | null
          regional_multipliers: Json | null
          reliability_multiplier: number | null
          source_weights: Json
          updated_at: string | null
        }
        Insert: {
          age_decay_factor?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          equipment_type: string
          frequency_weights?: Json
          id?: string
          industry_ceiling?: Json | null
          industry_floor?: Json | null
          industry_guidance_weight?: number | null
          is_active?: boolean | null
          min_data_points?: number | null
          name: string
          outlier_std_threshold?: number | null
          priority?: number | null
          regional_multipliers?: Json | null
          reliability_multiplier?: number | null
          source_weights?: Json
          updated_at?: string | null
        }
        Update: {
          age_decay_factor?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          equipment_type?: string
          frequency_weights?: Json
          id?: string
          industry_ceiling?: Json | null
          industry_floor?: Json | null
          industry_guidance_weight?: number | null
          is_active?: boolean | null
          min_data_points?: number | null
          name?: string
          outlier_std_threshold?: number | null
          priority?: number | null
          regional_multipliers?: Json | null
          reliability_multiplier?: number | null
          source_weights?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      pricing_scenarios: {
        Row: {
          configuration_id: string | null
          created_at: string | null
          demand_charge_kw: number | null
          id: string
          monthly_service_charge: number | null
          off_peak_rate_kwh: number | null
          peak_rate_kwh: number | null
          region: string
          renewable_energy_credit: number | null
          scenario_name: string
          shoulder_rate_kwh: number | null
          tou_schedule: Json | null
        }
        Insert: {
          configuration_id?: string | null
          created_at?: string | null
          demand_charge_kw?: number | null
          id?: string
          monthly_service_charge?: number | null
          off_peak_rate_kwh?: number | null
          peak_rate_kwh?: number | null
          region: string
          renewable_energy_credit?: number | null
          scenario_name: string
          shoulder_rate_kwh?: number | null
          tou_schedule?: Json | null
        }
        Update: {
          configuration_id?: string | null
          created_at?: string | null
          demand_charge_kw?: number | null
          id?: string
          monthly_service_charge?: number | null
          off_peak_rate_kwh?: number | null
          peak_rate_kwh?: number | null
          region?: string
          renewable_energy_credit?: number | null
          scenario_name?: string
          shoulder_rate_kwh?: number | null
          tou_schedule?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_scenarios_configuration_id_fkey"
            columns: ["configuration_id"]
            isOneToOne: false
            referencedRelation: "use_case_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_update_approvals: {
        Row: {
          applied_at: string | null
          applied_by: string | null
          applied_value: number | null
          approved_at: string | null
          approved_by: string | null
          change_percent: number
          component: string
          confidence: number | null
          created_at: string | null
          current_value: number
          evidence: Json | null
          id: string
          inference_id: string | null
          notes: string | null
          reasoning: string | null
          recommended_value: number
          rejection_reason: string | null
          requested_at: string | null
          requested_by: string | null
          status: string | null
          updated_at: string | null
          urgency: string | null
        }
        Insert: {
          applied_at?: string | null
          applied_by?: string | null
          applied_value?: number | null
          approved_at?: string | null
          approved_by?: string | null
          change_percent: number
          component: string
          confidence?: number | null
          created_at?: string | null
          current_value: number
          evidence?: Json | null
          id?: string
          inference_id?: string | null
          notes?: string | null
          reasoning?: string | null
          recommended_value: number
          rejection_reason?: string | null
          requested_at?: string | null
          requested_by?: string | null
          status?: string | null
          updated_at?: string | null
          urgency?: string | null
        }
        Update: {
          applied_at?: string | null
          applied_by?: string | null
          applied_value?: number | null
          approved_at?: string | null
          approved_by?: string | null
          change_percent?: number
          component?: string
          confidence?: number | null
          created_at?: string | null
          current_value?: number
          evidence?: Json | null
          id?: string
          inference_id?: string | null
          notes?: string | null
          reasoning?: string | null
          recommended_value?: number
          rejection_reason?: string | null
          requested_at?: string | null
          requested_by?: string | null
          status?: string | null
          updated_at?: string | null
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_update_approvals_inference_id_fkey"
            columns: ["inference_id"]
            isOneToOne: false
            referencedRelation: "market_inferences"
            referencedColumns: ["id"]
          },
        ]
      }
      product_catalog: {
        Row: {
          availability: string
          capacity: number | null
          category: string
          certifications: string[]
          chemistry: string | null
          created_at: string | null
          cycleLife: number
          efficiency: number | null
          id: number
          lastUpdated: string
          leadTimeDays: number | null
          manufacturer: string
          model: string
          power: number | null
          price: number | null
          warranty: number
        }
        Insert: {
          availability: string
          capacity?: number | null
          category: string
          certifications: string[]
          chemistry?: string | null
          created_at?: string | null
          cycleLife: number
          efficiency?: number | null
          id?: number
          lastUpdated: string
          leadTimeDays?: number | null
          manufacturer: string
          model: string
          power?: number | null
          price?: number | null
          warranty: number
        }
        Update: {
          availability?: string
          capacity?: number | null
          category?: string
          certifications?: string[]
          chemistry?: string | null
          created_at?: string | null
          cycleLife?: number
          efficiency?: number | null
          id?: number
          lastUpdated?: string
          leadTimeDays?: number | null
          manufacturer?: string
          model?: string
          power?: number | null
          price?: number | null
          warranty?: number
        }
        Relationships: []
      }
      quote_views: {
        Row: {
          id: string
          quote_id: string
          referrer: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          viewed_at: string
          viewer_fingerprint: string | null
          viewer_ip: string | null
        }
        Insert: {
          id?: string
          quote_id: string
          referrer?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          viewed_at?: string
          viewer_fingerprint?: string | null
          viewer_ip?: string | null
        }
        Update: {
          id?: string
          quote_id?: string
          referrer?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          viewed_at?: string
          viewer_fingerprint?: string | null
          viewer_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_views_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_views_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "saved_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      recommended_applications: {
        Row: {
          application_name: string
          benefit_description: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          suitability_score: number | null
          use_case_id: string | null
        }
        Insert: {
          application_name: string
          benefit_description?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          suitability_score?: number | null
          use_case_id?: string | null
        }
        Update: {
          application_name?: string
          benefit_description?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          suitability_score?: number | null
          use_case_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recommended_applications_use_case_id_fkey"
            columns: ["use_case_id"]
            isOneToOne: false
            referencedRelation: "use_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      regulatory_updates: {
        Row: {
          affected_equipment: string[] | null
          affected_sectors: string[] | null
          announced_date: string | null
          created_at: string | null
          effective_date: string | null
          expiration_date: string | null
          financial_impact: Json | null
          full_text: string | null
          id: string
          jurisdiction: string
          regulation_type: string
          source_name: string | null
          source_url: string | null
          status: string | null
          summary: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          affected_equipment?: string[] | null
          affected_sectors?: string[] | null
          announced_date?: string | null
          created_at?: string | null
          effective_date?: string | null
          expiration_date?: string | null
          financial_impact?: Json | null
          full_text?: string | null
          id?: string
          jurisdiction: string
          regulation_type: string
          source_name?: string | null
          source_url?: string | null
          status?: string | null
          summary?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          affected_equipment?: string[] | null
          affected_sectors?: string[] | null
          announced_date?: string | null
          created_at?: string | null
          effective_date?: string | null
          expiration_date?: string | null
          financial_impact?: Json | null
          full_text?: string | null
          id?: string
          jurisdiction?: string
          regulation_type?: string
          source_name?: string | null
          source_url?: string | null
          status?: string | null
          summary?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      rfq_responses: {
        Row: {
          currency: string | null
          evaluated_at: string | null
          evaluated_by: string | null
          evaluation_notes: string | null
          evaluation_score: number | null
          id: string
          lead_time_weeks: number
          pricing_breakdown: Json
          proposal_document_url: string | null
          proposal_filename: string | null
          rfq_id: string
          status: string | null
          submitted_at: string | null
          supporting_docs: Json | null
          technical_proposal: string | null
          total_price: number
          updated_at: string | null
          value_proposition: string | null
          vendor_id: string
          warranty_years: number
        }
        Insert: {
          currency?: string | null
          evaluated_at?: string | null
          evaluated_by?: string | null
          evaluation_notes?: string | null
          evaluation_score?: number | null
          id?: string
          lead_time_weeks: number
          pricing_breakdown: Json
          proposal_document_url?: string | null
          proposal_filename?: string | null
          rfq_id: string
          status?: string | null
          submitted_at?: string | null
          supporting_docs?: Json | null
          technical_proposal?: string | null
          total_price: number
          updated_at?: string | null
          value_proposition?: string | null
          vendor_id: string
          warranty_years: number
        }
        Update: {
          currency?: string | null
          evaluated_at?: string | null
          evaluated_by?: string | null
          evaluation_notes?: string | null
          evaluation_score?: number | null
          id?: string
          lead_time_weeks?: number
          pricing_breakdown?: Json
          proposal_document_url?: string | null
          proposal_filename?: string | null
          rfq_id?: string
          status?: string | null
          submitted_at?: string | null
          supporting_docs?: Json | null
          technical_proposal?: string | null
          total_price?: number
          updated_at?: string | null
          value_proposition?: string | null
          vendor_id?: string
          warranty_years?: number
        }
        Relationships: [
          {
            foreignKeyName: "rfq_responses_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_responses_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "pending_vendor_approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_responses_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_responses_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      rfqs: {
        Row: {
          closed_at: string | null
          country: string | null
          created_at: string | null
          created_by: string
          delivery_deadline: string | null
          due_date: string
          duration_hours: number
          id: string
          invited_vendors: string[] | null
          location: string
          preferred_chemistry: string | null
          project_name: string
          project_start_date: string | null
          requirements: string | null
          response_count: number | null
          rfq_number: string
          state_province: string | null
          status: string | null
          system_size_mw: number
          target_specialties: string[] | null
          updated_at: string | null
        }
        Insert: {
          closed_at?: string | null
          country?: string | null
          created_at?: string | null
          created_by: string
          delivery_deadline?: string | null
          due_date: string
          duration_hours: number
          id?: string
          invited_vendors?: string[] | null
          location: string
          preferred_chemistry?: string | null
          project_name: string
          project_start_date?: string | null
          requirements?: string | null
          response_count?: number | null
          rfq_number: string
          state_province?: string | null
          status?: string | null
          system_size_mw: number
          target_specialties?: string[] | null
          updated_at?: string | null
        }
        Update: {
          closed_at?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string
          delivery_deadline?: string | null
          due_date?: string
          duration_hours?: number
          id?: string
          invited_vendors?: string[] | null
          location?: string
          preferred_chemistry?: string | null
          project_name?: string
          project_start_date?: string | null
          requirements?: string | null
          response_count?: number | null
          rfq_number?: string
          state_province?: string | null
          status?: string | null
          system_size_mw?: number
          target_specialties?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rss_articles: {
        Row: {
          category: string | null
          created_at: string | null
          headline: string
          id: string
          mentioned_companies: string[] | null
          processed: boolean | null
          published_at: string | null
          source: string | null
          source_url: string | null
          summary: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          headline: string
          id?: string
          mentioned_companies?: string[] | null
          processed?: boolean | null
          published_at?: string | null
          source?: string | null
          source_url?: string | null
          summary?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          headline?: string
          id?: string
          mentioned_companies?: string[] | null
          processed?: boolean | null
          published_at?: string | null
          source?: string | null
          source_url?: string | null
          summary?: string | null
        }
        Relationships: []
      }
      rss_sources: {
        Row: {
          active: boolean | null
          articles_count: number | null
          auth_password: string | null
          auth_username: string | null
          category: string
          connection_status: string | null
          created_at: string | null
          id: string
          last_checked: string | null
          last_error: string | null
          last_scraped: string | null
          name: string
          requires_auth: boolean | null
          updated_at: string | null
          url: string
        }
        Insert: {
          active?: boolean | null
          articles_count?: number | null
          auth_password?: string | null
          auth_username?: string | null
          category: string
          connection_status?: string | null
          created_at?: string | null
          id?: string
          last_checked?: string | null
          last_error?: string | null
          last_scraped?: string | null
          name: string
          requires_auth?: boolean | null
          updated_at?: string | null
          url: string
        }
        Update: {
          active?: boolean | null
          articles_count?: number | null
          auth_password?: string | null
          auth_username?: string | null
          category?: string
          connection_status?: string | null
          created_at?: string | null
          id?: string
          last_checked?: string | null
          last_error?: string | null
          last_scraped?: string | null
          name?: string
          requires_auth?: boolean | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      saved_projects: {
        Row: {
          calculation_version: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          duration_hours: number | null
          estimated_cost: number | null
          id: string
          is_public: boolean | null
          last_accessed: string | null
          location: string | null
          power_mw: number | null
          project_data: Json
          project_name: string
          project_type: string | null
          status: string | null
          tags: string[] | null
          template_version: string | null
          updated_at: string | null
          use_case: string | null
          use_case_template_id: string | null
          user_id: string | null
        }
        Insert: {
          calculation_version?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          duration_hours?: number | null
          estimated_cost?: number | null
          id?: string
          is_public?: boolean | null
          last_accessed?: string | null
          location?: string | null
          power_mw?: number | null
          project_data: Json
          project_name: string
          project_type?: string | null
          status?: string | null
          tags?: string[] | null
          template_version?: string | null
          updated_at?: string | null
          use_case?: string | null
          use_case_template_id?: string | null
          user_id?: string | null
        }
        Update: {
          calculation_version?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          duration_hours?: number | null
          estimated_cost?: number | null
          id?: string
          is_public?: boolean | null
          last_accessed?: string | null
          location?: string | null
          power_mw?: number | null
          project_data?: Json
          project_name?: string
          project_type?: string | null
          status?: string | null
          tags?: string[] | null
          template_version?: string | null
          updated_at?: string | null
          use_case?: string | null
          use_case_template_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_projects_use_case_template_id_fkey"
            columns: ["use_case_template_id"]
            isOneToOne: false
            referencedRelation: "use_case_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_projects_use_case_template_id_fkey"
            columns: ["use_case_template_id"]
            isOneToOne: false
            referencedRelation: "v_use_case_templates_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_quotes: {
        Row: {
          annual_savings: number | null
          created_at: string
          description: string | null
          duration_hours: number | null
          id: string
          is_archived: boolean | null
          is_favorite: boolean | null
          last_viewed_at: string | null
          location: string | null
          parent_quote_id: string | null
          payback_years: number | null
          quote_name: string
          share_expires_at: string | null
          share_token: string | null
          solar_mw: number | null
          storage_mw: number | null
          system_configuration: Json
          template_selected: string | null
          total_cost: number | null
          updated_at: string
          user_id: string
          version: number | null
        }
        Insert: {
          annual_savings?: number | null
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_archived?: boolean | null
          is_favorite?: boolean | null
          last_viewed_at?: string | null
          location?: string | null
          parent_quote_id?: string | null
          payback_years?: number | null
          quote_name: string
          share_expires_at?: string | null
          share_token?: string | null
          solar_mw?: number | null
          storage_mw?: number | null
          system_configuration: Json
          template_selected?: string | null
          total_cost?: number | null
          updated_at?: string
          user_id: string
          version?: number | null
        }
        Update: {
          annual_savings?: number | null
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_archived?: boolean | null
          is_favorite?: boolean | null
          last_viewed_at?: string | null
          location?: string | null
          parent_quote_id?: string | null
          payback_years?: number | null
          quote_name?: string
          share_expires_at?: string | null
          share_token?: string | null
          solar_mw?: number | null
          storage_mw?: number | null
          system_configuration?: Json
          template_selected?: string | null
          total_cost?: number | null
          updated_at?: string
          user_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_quotes_parent_quote_id_fkey"
            columns: ["parent_quote_id"]
            isOneToOne: false
            referencedRelation: "quotes_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_quotes_parent_quote_id_fkey"
            columns: ["parent_quote_id"]
            isOneToOne: false
            referencedRelation: "saved_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      score_history: {
        Row: {
          change_reason: string | null
          created_at: string | null
          id: string
          new_score: number | null
          old_score: number | null
          startup_id: string | null
        }
        Insert: {
          change_reason?: string | null
          created_at?: string | null
          id?: string
          new_score?: number | null
          old_score?: number | null
          startup_id?: string | null
        }
        Update: {
          change_reason?: string | null
          created_at?: string | null
          id?: string
          new_score?: number | null
          old_score?: number | null
          startup_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "score_history_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "approved_startups_for_matching"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_history_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "recent_funding_activity"
            referencedColumns: ["startup_id"]
          },
          {
            foreignKeyName: "score_history_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startup_momentum_dashboard"
            referencedColumns: ["startup_id"]
          },
          {
            foreignKeyName: "score_history_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startup_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      scrape_jobs: {
        Row: {
          consecutive_failures: number | null
          created_at: string | null
          id: string
          is_enabled: boolean | null
          items_found: number | null
          items_new: number | null
          job_type: string
          last_error: string | null
          last_run_at: string | null
          last_run_duration_ms: number | null
          last_run_status: string | null
          max_retries: number | null
          min_interval_minutes: number | null
          prices_extracted: number | null
          priority: number | null
          schedule_cron: string | null
          source_id: string | null
          updated_at: string | null
        }
        Insert: {
          consecutive_failures?: number | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          items_found?: number | null
          items_new?: number | null
          job_type: string
          last_error?: string | null
          last_run_at?: string | null
          last_run_duration_ms?: number | null
          last_run_status?: string | null
          max_retries?: number | null
          min_interval_minutes?: number | null
          prices_extracted?: number | null
          priority?: number | null
          schedule_cron?: string | null
          source_id?: string | null
          updated_at?: string | null
        }
        Update: {
          consecutive_failures?: number | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          items_found?: number | null
          items_new?: number | null
          job_type?: string
          last_error?: string | null
          last_run_at?: string | null
          last_run_duration_ms?: number | null
          last_run_status?: string | null
          max_retries?: number | null
          min_interval_minutes?: number | null
          prices_extracted?: number | null
          priority?: number | null
          schedule_cron?: string | null
          source_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      scraped_articles: {
        Row: {
          author: string | null
          companies_mentioned: string[] | null
          equipment_mentioned: string[] | null
          fetched_at: string | null
          full_content: string | null
          id: string
          is_processed: boolean | null
          prices_extracted: Json | null
          processed_at: string | null
          processing_error: string | null
          published_at: string | null
          regions_mentioned: string[] | null
          regulations_mentioned: Json | null
          relevance_score: number | null
          sentiment: string | null
          source_id: string | null
          summary: string | null
          title: string
          topics: string[] | null
          url: string
        }
        Insert: {
          author?: string | null
          companies_mentioned?: string[] | null
          equipment_mentioned?: string[] | null
          fetched_at?: string | null
          full_content?: string | null
          id?: string
          is_processed?: boolean | null
          prices_extracted?: Json | null
          processed_at?: string | null
          processing_error?: string | null
          published_at?: string | null
          regions_mentioned?: string[] | null
          regulations_mentioned?: Json | null
          relevance_score?: number | null
          sentiment?: string | null
          source_id?: string | null
          summary?: string | null
          title: string
          topics?: string[] | null
          url: string
        }
        Update: {
          author?: string | null
          companies_mentioned?: string[] | null
          equipment_mentioned?: string[] | null
          fetched_at?: string | null
          full_content?: string | null
          id?: string
          is_processed?: boolean | null
          prices_extracted?: Json | null
          processed_at?: string | null
          processing_error?: string | null
          published_at?: string | null
          regions_mentioned?: string[] | null
          regulations_mentioned?: Json | null
          relevance_score?: number | null
          sentiment?: string | null
          source_id?: string | null
          summary?: string | null
          title?: string
          topics?: string[] | null
          url?: string
        }
        Relationships: []
      }
      scraper_runs: {
        Row: {
          articles_fetched: number | null
          completed_at: string | null
          errors: Json | null
          id: string
          investors_discovered: number | null
          metadata: Json | null
          run_type: string
          started_at: string
          startups_discovered: number | null
          startups_imported: number | null
          status: string
          triggered_by: string | null
        }
        Insert: {
          articles_fetched?: number | null
          completed_at?: string | null
          errors?: Json | null
          id?: string
          investors_discovered?: number | null
          metadata?: Json | null
          run_type: string
          started_at?: string
          startups_discovered?: number | null
          startups_imported?: number | null
          status?: string
          triggered_by?: string | null
        }
        Update: {
          articles_fetched?: number | null
          completed_at?: string | null
          errors?: Json | null
          id?: string
          investors_discovered?: number | null
          metadata?: Json | null
          run_type?: string
          started_at?: string
          startups_discovered?: number | null
          startups_imported?: number | null
          status?: string
          triggered_by?: string | null
        }
        Relationships: []
      }
      smb_leads: {
        Row: {
          assigned_to: string | null
          business_data: Json | null
          city: string | null
          company_name: string | null
          contact_name: string | null
          created_at: string | null
          email: string | null
          id: string
          landing_page: string | null
          last_activity_at: string | null
          notes: string | null
          phone: string | null
          power_profile_level: number | null
          power_profile_points: number | null
          quote_id: string | null
          quote_summary: Json | null
          referral_source: string | null
          site_slug: string
          state: string | null
          status: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          assigned_to?: string | null
          business_data?: Json | null
          city?: string | null
          company_name?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          landing_page?: string | null
          last_activity_at?: string | null
          notes?: string | null
          phone?: string | null
          power_profile_level?: number | null
          power_profile_points?: number | null
          quote_id?: string | null
          quote_summary?: Json | null
          referral_source?: string | null
          site_slug: string
          state?: string | null
          status?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          assigned_to?: string | null
          business_data?: Json | null
          city?: string | null
          company_name?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          landing_page?: string | null
          last_activity_at?: string | null
          notes?: string | null
          phone?: string | null
          power_profile_level?: number | null
          power_profile_points?: number | null
          quote_id?: string | null
          quote_summary?: Json | null
          referral_source?: string | null
          site_slug?: string
          state?: string | null
          status?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      smb_sites: {
        Row: {
          created_at: string | null
          domain: string | null
          favicon_url: string | null
          features: Json | null
          google_analytics_id: string | null
          id: string
          industry_category: string | null
          is_active: boolean | null
          launched_at: string | null
          logo_url: string | null
          meta_description: string | null
          meta_title: string | null
          name: string
          primary_color: string | null
          secondary_color: string | null
          slug: string
          tagline: string | null
          updated_at: string | null
          use_case_slug: string | null
        }
        Insert: {
          created_at?: string | null
          domain?: string | null
          favicon_url?: string | null
          features?: Json | null
          google_analytics_id?: string | null
          id?: string
          industry_category?: string | null
          is_active?: boolean | null
          launched_at?: string | null
          logo_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          primary_color?: string | null
          secondary_color?: string | null
          slug: string
          tagline?: string | null
          updated_at?: string | null
          use_case_slug?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string | null
          favicon_url?: string | null
          features?: Json | null
          google_analytics_id?: string | null
          id?: string
          industry_category?: string | null
          is_active?: boolean | null
          launched_at?: string | null
          logo_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string
          tagline?: string | null
          updated_at?: string | null
          use_case_slug?: string | null
        }
        Relationships: []
      }
      solar_data_cache: {
        Row: {
          annual_dhi: number | null
          annual_dni: number | null
          annual_ghi: number | null
          api_response: Json | null
          city_name: string | null
          country_code: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          last_updated: string | null
          latitude: number
          longitude: number
          peak_sun_hours: number
          solar_rating: string | null
          source: string | null
          zip_code: string | null
        }
        Insert: {
          annual_dhi?: number | null
          annual_dni?: number | null
          annual_ghi?: number | null
          api_response?: Json | null
          city_name?: string | null
          country_code?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_updated?: string | null
          latitude: number
          longitude: number
          peak_sun_hours: number
          solar_rating?: string | null
          source?: string | null
          zip_code?: string | null
        }
        Update: {
          annual_dhi?: number | null
          annual_dni?: number | null
          annual_ghi?: number | null
          api_response?: Json | null
          city_name?: string | null
          country_code?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_updated?: string | null
          latitude?: number
          longitude?: number
          peak_sun_hours?: number
          solar_rating?: string | null
          source?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      startup_investor_matches: {
        Row: {
          confidence_level: string | null
          contacted_at: string | null
          created_at: string | null
          created_by: string | null
          feedback_received: boolean | null
          fit_analysis: Json | null
          id: string
          intro_email_body: string | null
          intro_email_subject: string | null
          intro_requested_at: string | null
          investor_id: string
          last_interaction: string | null
          match_score: number | null
          reasoning: string | null
          similarity_score: number | null
          startup_id: string
          status: string | null
          success_score: number | null
          updated_at: string | null
          user_id: string | null
          viewed_at: string | null
          why_you_match: string[] | null
        }
        Insert: {
          confidence_level?: string | null
          contacted_at?: string | null
          created_at?: string | null
          created_by?: string | null
          feedback_received?: boolean | null
          fit_analysis?: Json | null
          id?: string
          intro_email_body?: string | null
          intro_email_subject?: string | null
          intro_requested_at?: string | null
          investor_id: string
          last_interaction?: string | null
          match_score?: number | null
          reasoning?: string | null
          similarity_score?: number | null
          startup_id: string
          status?: string | null
          success_score?: number | null
          updated_at?: string | null
          user_id?: string | null
          viewed_at?: string | null
          why_you_match?: string[] | null
        }
        Update: {
          confidence_level?: string | null
          contacted_at?: string | null
          created_at?: string | null
          created_by?: string | null
          feedback_received?: boolean | null
          fit_analysis?: Json | null
          id?: string
          intro_email_body?: string | null
          intro_email_subject?: string | null
          intro_requested_at?: string | null
          investor_id?: string
          last_interaction?: string | null
          match_score?: number | null
          reasoning?: string | null
          similarity_score?: number | null
          startup_id?: string
          status?: string | null
          success_score?: number | null
          updated_at?: string | null
          user_id?: string | null
          viewed_at?: string | null
          why_you_match?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "startup_investor_matches_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investor_engagement_summary"
            referencedColumns: ["investor_id"]
          },
          {
            foreignKeyName: "startup_investor_matches_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "startup_investor_matches_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "approved_startups_for_matching"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "startup_investor_matches_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "recent_funding_activity"
            referencedColumns: ["startup_id"]
          },
          {
            foreignKeyName: "startup_investor_matches_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startup_momentum_dashboard"
            referencedColumns: ["startup_id"]
          },
          {
            foreignKeyName: "startup_investor_matches_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startup_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_momentum_scores: {
        Row: {
          avg_sentiment_30d: number | null
          calculated_at: string | null
          funding_recency_score: number | null
          hiring_activity_score: number | null
          id: string
          momentum_score: number
          news_count_30d: number | null
          product_launch_recent: boolean | null
          startup_id: string
        }
        Insert: {
          avg_sentiment_30d?: number | null
          calculated_at?: string | null
          funding_recency_score?: number | null
          hiring_activity_score?: number | null
          id?: string
          momentum_score: number
          news_count_30d?: number | null
          product_launch_recent?: boolean | null
          startup_id: string
        }
        Update: {
          avg_sentiment_30d?: number | null
          calculated_at?: string | null
          funding_recency_score?: number | null
          hiring_activity_score?: number | null
          id?: string
          momentum_score?: number
          news_count_30d?: number | null
          product_launch_recent?: boolean | null
          startup_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "startup_momentum_scores_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "approved_startups_for_matching"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "startup_momentum_scores_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "recent_funding_activity"
            referencedColumns: ["startup_id"]
          },
          {
            foreignKeyName: "startup_momentum_scores_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startup_momentum_dashboard"
            referencedColumns: ["startup_id"]
          },
          {
            foreignKeyName: "startup_momentum_scores_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startup_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_news: {
        Row: {
          category: string | null
          created_at: string | null
          headline: string
          id: string
          published_date: string
          sentiment_score: number | null
          source: string
          startup_id: string | null
          startup_name: string
          summary: string | null
          url: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          headline: string
          id?: string
          published_date: string
          sentiment_score?: number | null
          source: string
          startup_id?: string | null
          startup_name: string
          summary?: string | null
          url: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          headline?: string
          id?: string
          published_date?: string
          sentiment_score?: number | null
          source?: string
          startup_id?: string | null
          startup_name?: string
          summary?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "startup_news_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "approved_startups_for_matching"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "startup_news_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "recent_funding_activity"
            referencedColumns: ["startup_id"]
          },
          {
            foreignKeyName: "startup_news_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startup_momentum_dashboard"
            referencedColumns: ["startup_id"]
          },
          {
            foreignKeyName: "startup_news_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startup_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_uploads: {
        Row: {
          created_at: string | null
          embedding: string | null
          growth_rate_monthly: number | null
          has_demo: boolean | null
          has_technical_cofounder: boolean | null
          id: string
          industries: string[] | null
          is_launched: boolean | null
          linkedin: string | null
          location: string | null
          market_score: number | null
          market_size: string | null
          mrr: number | null
          name: string
          pitch: string | null
          problem: string | null
          product_score: number | null
          raise_amount: string | null
          raise_type: string | null
          revenue_annual: number | null
          sectors: string[] | null
          solution: string | null
          source_type: string
          stage: string | null
          status: string | null
          submitted_email: string | null
          tagline: string | null
          team_companies: string[] | null
          team_score: number | null
          team_size: number | null
          total_god_score: number | null
          traction_score: number | null
          updated_at: string | null
          value_proposition: string | null
          vision_score: number | null
          website: string | null
        }
        Insert: {
          created_at?: string | null
          embedding?: string | null
          growth_rate_monthly?: number | null
          has_demo?: boolean | null
          has_technical_cofounder?: boolean | null
          id?: string
          industries?: string[] | null
          is_launched?: boolean | null
          linkedin?: string | null
          location?: string | null
          market_score?: number | null
          market_size?: string | null
          mrr?: number | null
          name: string
          pitch?: string | null
          problem?: string | null
          product_score?: number | null
          raise_amount?: string | null
          raise_type?: string | null
          revenue_annual?: number | null
          sectors?: string[] | null
          solution?: string | null
          source_type?: string
          stage?: string | null
          status?: string | null
          submitted_email?: string | null
          tagline?: string | null
          team_companies?: string[] | null
          team_score?: number | null
          team_size?: number | null
          total_god_score?: number | null
          traction_score?: number | null
          updated_at?: string | null
          value_proposition?: string | null
          vision_score?: number | null
          website?: string | null
        }
        Update: {
          created_at?: string | null
          embedding?: string | null
          growth_rate_monthly?: number | null
          has_demo?: boolean | null
          has_technical_cofounder?: boolean | null
          id?: string
          industries?: string[] | null
          is_launched?: boolean | null
          linkedin?: string | null
          location?: string | null
          market_score?: number | null
          market_size?: string | null
          mrr?: number | null
          name?: string
          pitch?: string | null
          problem?: string | null
          product_score?: number | null
          raise_amount?: string | null
          raise_type?: string | null
          revenue_annual?: number | null
          sectors?: string[] | null
          solution?: string | null
          source_type?: string
          stage?: string | null
          status?: string | null
          submitted_email?: string | null
          tagline?: string | null
          team_companies?: string[] | null
          team_score?: number | null
          team_size?: number | null
          total_god_score?: number | null
          traction_score?: number | null
          updated_at?: string | null
          value_proposition?: string | null
          vision_score?: number | null
          website?: string | null
        }
        Relationships: []
      }
      startup_valuations: {
        Row: {
          calculated_at: string | null
          calculation_method: string
          confidence_score: number
          estimated_valuation_usd: number
          factors: Json | null
          id: string
          is_active: boolean | null
          startup_id: string
          valid_until: string | null
        }
        Insert: {
          calculated_at?: string | null
          calculation_method: string
          confidence_score?: number
          estimated_valuation_usd: number
          factors?: Json | null
          id?: string
          is_active?: boolean | null
          startup_id: string
          valid_until?: string | null
        }
        Update: {
          calculated_at?: string | null
          calculation_method?: string
          confidence_score?: number
          estimated_valuation_usd?: number
          factors?: Json | null
          id?: string
          is_active?: boolean | null
          startup_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "startup_valuations_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "approved_startups_for_matching"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "startup_valuations_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "recent_funding_activity"
            referencedColumns: ["startup_id"]
          },
          {
            foreignKeyName: "startup_valuations_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startup_momentum_dashboard"
            referencedColumns: ["startup_id"]
          },
          {
            foreignKeyName: "startup_valuations_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startup_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      state_incentives: {
        Row: {
          administering_agency: string | null
          application_url: string | null
          budget_remaining: number | null
          created_at: string | null
          eligible_sectors: string[] | null
          eligible_technologies: string[] | null
          equity_incentive_per_kwh: number | null
          equity_program: boolean | null
          fire_zone_eligible: boolean | null
          funding_status: string | null
          id: string
          incentive_per_kw: number | null
          incentive_per_kwh: number | null
          incentive_percent: number | null
          income_restricted: boolean | null
          is_active: boolean | null
          max_incentive: number | null
          max_system_size_kwh: number | null
          min_system_size_kwh: number | null
          notes: string | null
          program_end_date: string | null
          program_name: string
          program_start_date: string | null
          program_type: string
          requires_solar_pairing: boolean | null
          source: string | null
          state_code: string
          state_name: string
          updated_at: string | null
        }
        Insert: {
          administering_agency?: string | null
          application_url?: string | null
          budget_remaining?: number | null
          created_at?: string | null
          eligible_sectors?: string[] | null
          eligible_technologies?: string[] | null
          equity_incentive_per_kwh?: number | null
          equity_program?: boolean | null
          fire_zone_eligible?: boolean | null
          funding_status?: string | null
          id?: string
          incentive_per_kw?: number | null
          incentive_per_kwh?: number | null
          incentive_percent?: number | null
          income_restricted?: boolean | null
          is_active?: boolean | null
          max_incentive?: number | null
          max_system_size_kwh?: number | null
          min_system_size_kwh?: number | null
          notes?: string | null
          program_end_date?: string | null
          program_name: string
          program_start_date?: string | null
          program_type: string
          requires_solar_pairing?: boolean | null
          source?: string | null
          state_code: string
          state_name: string
          updated_at?: string | null
        }
        Update: {
          administering_agency?: string | null
          application_url?: string | null
          budget_remaining?: number | null
          created_at?: string | null
          eligible_sectors?: string[] | null
          eligible_technologies?: string[] | null
          equity_incentive_per_kwh?: number | null
          equity_program?: boolean | null
          fire_zone_eligible?: boolean | null
          funding_status?: string | null
          id?: string
          incentive_per_kw?: number | null
          incentive_per_kwh?: number | null
          incentive_percent?: number | null
          income_restricted?: boolean | null
          is_active?: boolean | null
          max_incentive?: number | null
          max_system_size_kwh?: number | null
          min_system_size_kwh?: number | null
          notes?: string | null
          program_end_date?: string | null
          program_name?: string
          program_start_date?: string | null
          program_type?: string
          requires_solar_pairing?: boolean | null
          source?: string | null
          state_code?: string
          state_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      state_solar_data: {
        Row: {
          annual_production_factor: number | null
          avg_demand_charge: number | null
          avg_electricity_rate: number | null
          avg_irradiance_kwh_m2_day: number | null
          best_tilt_angle: number | null
          capacity_factor_kwh_per_kw: number
          created_at: string
          id: string
          peak_sun_hours: number
          solar_rating: string | null
          source: string | null
          state_code: string
          state_name: string
          updated_at: string
        }
        Insert: {
          annual_production_factor?: number | null
          avg_demand_charge?: number | null
          avg_electricity_rate?: number | null
          avg_irradiance_kwh_m2_day?: number | null
          best_tilt_angle?: number | null
          capacity_factor_kwh_per_kw: number
          created_at?: string
          id?: string
          peak_sun_hours: number
          solar_rating?: string | null
          source?: string | null
          state_code: string
          state_name: string
          updated_at?: string
        }
        Update: {
          annual_production_factor?: number | null
          avg_demand_charge?: number | null
          avg_electricity_rate?: number | null
          avg_irradiance_kwh_m2_day?: number | null
          best_tilt_angle?: number | null
          capacity_factor_kwh_per_kw?: number
          created_at?: string
          id?: string
          peak_sun_hours?: number
          solar_rating?: string | null
          source?: string | null
          state_code?: string
          state_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      sub_industries: {
        Row: {
          backup_multiplier: number | null
          created_at: string | null
          description: string | null
          display_order: number | null
          ev_affinity: number | null
          icon: string | null
          id: string
          industry_slug: string
          is_active: boolean | null
          load_multiplier: number | null
          name: string
          size_unit: string | null
          solar_affinity: number | null
          sub_industry_slug: string
          typical_size_max: number | null
          typical_size_min: number | null
          updated_at: string | null
        }
        Insert: {
          backup_multiplier?: number | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          ev_affinity?: number | null
          icon?: string | null
          id?: string
          industry_slug: string
          is_active?: boolean | null
          load_multiplier?: number | null
          name: string
          size_unit?: string | null
          solar_affinity?: number | null
          sub_industry_slug: string
          typical_size_max?: number | null
          typical_size_min?: number | null
          updated_at?: string | null
        }
        Update: {
          backup_multiplier?: number | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          ev_affinity?: number | null
          icon?: string | null
          id?: string
          industry_slug?: string
          is_active?: boolean | null
          load_multiplier?: number | null
          name?: string
          size_unit?: string | null
          solar_affinity?: number | null
          sub_industry_slug?: string
          typical_size_max?: number | null
          typical_size_min?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_config: {
        Row: {
          config_key: string
          config_type: string | null
          config_value: Json
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          config_key: string
          config_type?: string | null
          config_value: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          config_key?: string
          config_type?: string | null
          config_value?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      use_case_analytics: {
        Row: {
          calculated_results: Json
          created_at: string | null
          estimated_cost: number | null
          estimated_savings: number | null
          id: string
          input_data: Json
          payback_years: number | null
          recommended_size_mw: number | null
          roi_percentage: number | null
          use_case_id: string | null
          user_id: string | null
          was_project_saved: boolean | null
          was_quote_created: boolean | null
        }
        Insert: {
          calculated_results: Json
          created_at?: string | null
          estimated_cost?: number | null
          estimated_savings?: number | null
          id?: string
          input_data: Json
          payback_years?: number | null
          recommended_size_mw?: number | null
          roi_percentage?: number | null
          use_case_id?: string | null
          user_id?: string | null
          was_project_saved?: boolean | null
          was_quote_created?: boolean | null
        }
        Update: {
          calculated_results?: Json
          created_at?: string | null
          estimated_cost?: number | null
          estimated_savings?: number | null
          id?: string
          input_data?: Json
          payback_years?: number | null
          recommended_size_mw?: number | null
          roi_percentage?: number | null
          use_case_id?: string | null
          user_id?: string | null
          was_project_saved?: boolean | null
          was_quote_created?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "use_case_analytics_use_case_id_fkey"
            columns: ["use_case_id"]
            isOneToOne: false
            referencedRelation: "use_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      use_case_configurations: {
        Row: {
          annual_operating_days: number | null
          base_load_kw: number | null
          config_name: string
          created_at: string | null
          daily_operating_hours: number | null
          demand_charge_sensitivity: string | null
          diversity_factor: number | null
          energy_arbitrage_potential: string | null
          id: string
          is_default: boolean | null
          load_factor: number | null
          load_profile_data: Json | null
          max_duration_hours: number | null
          min_duration_hours: number | null
          peak_load_kw: number | null
          preferred_duration_hours: number | null
          profile_type: string | null
          recommended_duration_hours: number | null
          typical_load_kw: number | null
          typical_savings_percent: number | null
          updated_at: string | null
          use_case_id: string | null
        }
        Insert: {
          annual_operating_days?: number | null
          base_load_kw?: number | null
          config_name: string
          created_at?: string | null
          daily_operating_hours?: number | null
          demand_charge_sensitivity?: string | null
          diversity_factor?: number | null
          energy_arbitrage_potential?: string | null
          id?: string
          is_default?: boolean | null
          load_factor?: number | null
          load_profile_data?: Json | null
          max_duration_hours?: number | null
          min_duration_hours?: number | null
          peak_load_kw?: number | null
          preferred_duration_hours?: number | null
          profile_type?: string | null
          recommended_duration_hours?: number | null
          typical_load_kw?: number | null
          typical_savings_percent?: number | null
          updated_at?: string | null
          use_case_id?: string | null
        }
        Update: {
          annual_operating_days?: number | null
          base_load_kw?: number | null
          config_name?: string
          created_at?: string | null
          daily_operating_hours?: number | null
          demand_charge_sensitivity?: string | null
          diversity_factor?: number | null
          energy_arbitrage_potential?: string | null
          id?: string
          is_default?: boolean | null
          load_factor?: number | null
          load_profile_data?: Json | null
          max_duration_hours?: number | null
          min_duration_hours?: number | null
          peak_load_kw?: number | null
          preferred_duration_hours?: number | null
          profile_type?: string | null
          recommended_duration_hours?: number | null
          typical_load_kw?: number | null
          typical_savings_percent?: number | null
          updated_at?: string | null
          use_case_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "use_case_configurations_use_case_id_fkey"
            columns: ["use_case_id"]
            isOneToOne: false
            referencedRelation: "use_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      use_case_templates: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          avg_rating: number | null
          category: string | null
          changelog: string | null
          created_at: string | null
          created_by: string | null
          custom_questions: Json | null
          description: string | null
          display_order: number | null
          financial_params: Json
          icon: string | null
          id: string
          image_url: string | null
          industry_standards: Json | null
          is_active: boolean | null
          name: string
          power_profile: Json
          previous_version_id: string | null
          recommended_applications: string[] | null
          required_tier: string | null
          slug: string
          solar_compatibility: Json | null
          times_saved: number | null
          times_used: number | null
          total_ratings: number | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          avg_rating?: number | null
          category?: string | null
          changelog?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_questions?: Json | null
          description?: string | null
          display_order?: number | null
          financial_params: Json
          icon?: string | null
          id?: string
          image_url?: string | null
          industry_standards?: Json | null
          is_active?: boolean | null
          name: string
          power_profile: Json
          previous_version_id?: string | null
          recommended_applications?: string[] | null
          required_tier?: string | null
          slug: string
          solar_compatibility?: Json | null
          times_saved?: number | null
          times_used?: number | null
          total_ratings?: number | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          avg_rating?: number | null
          category?: string | null
          changelog?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_questions?: Json | null
          description?: string | null
          display_order?: number | null
          financial_params?: Json
          icon?: string | null
          id?: string
          image_url?: string | null
          industry_standards?: Json | null
          is_active?: boolean | null
          name?: string
          power_profile?: Json
          previous_version_id?: string | null
          recommended_applications?: string[] | null
          required_tier?: string | null
          slug?: string
          solar_compatibility?: Json | null
          times_saved?: number | null
          times_used?: number | null
          total_ratings?: number | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "use_case_templates_previous_version_id_fkey"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "use_case_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "use_case_templates_previous_version_id_fkey"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "v_use_case_templates_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      use_cases: {
        Row: {
          average_payback_years: number | null
          average_roi: number | null
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          image_url: string | null
          industry_standards: Json | null
          is_active: boolean | null
          last_used: string | null
          name: string
          required_tier: string | null
          slug: string
          updated_at: string | null
          updated_by: string | null
          usage_count: number | null
          validation_sources: string[] | null
        }
        Insert: {
          average_payback_years?: number | null
          average_roi?: number | null
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          image_url?: string | null
          industry_standards?: Json | null
          is_active?: boolean | null
          last_used?: string | null
          name: string
          required_tier?: string | null
          slug: string
          updated_at?: string | null
          updated_by?: string | null
          usage_count?: number | null
          validation_sources?: string[] | null
        }
        Update: {
          average_payback_years?: number | null
          average_roi?: number | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          image_url?: string | null
          industry_standards?: Json | null
          is_active?: boolean | null
          last_used?: string | null
          name?: string
          required_tier?: string | null
          slug?: string
          updated_at?: string | null
          updated_by?: string | null
          usage_count?: number | null
          validation_sources?: string[] | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          company_name: string | null
          created_at: string
          description: string | null
          email: string
          email_verified: boolean | null
          full_name: string | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          login_count: number | null
          matches_remaining: number | null
          matches_used: number | null
          phone: string | null
          plan: string | null
          plan_expires_at: string | null
          plan_started_at: string | null
          preferences: Json | null
          role: string | null
          updated_at: string
          user_type: string | null
          website: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          description?: string | null
          email: string
          email_verified?: boolean | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          last_login_at?: string | null
          login_count?: number | null
          matches_remaining?: number | null
          matches_used?: number | null
          phone?: string | null
          plan?: string | null
          plan_expires_at?: string | null
          plan_started_at?: string | null
          preferences?: Json | null
          role?: string | null
          updated_at?: string
          user_type?: string | null
          website?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string
          description?: string | null
          email?: string
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          login_count?: number | null
          matches_remaining?: number | null
          matches_used?: number | null
          phone?: string | null
          plan?: string | null
          plan_expires_at?: string | null
          plan_started_at?: string | null
          preferences?: Json | null
          role?: string | null
          updated_at?: string
          user_type?: string | null
          website?: string | null
        }
        Relationships: []
      }
      utility_rates: {
        Row: {
          commercial_rate: number
          created_at: string | null
          data_source: string | null
          demand_charge: number | null
          effective_date: string | null
          has_demand_charge: boolean | null
          has_tou: boolean | null
          id: string
          industrial_rate: number
          net_metering_available: boolean | null
          net_metering_type: string | null
          off_peak_rate: number | null
          part_peak_rate: number | null
          peak_demand_charge: number | null
          peak_hours: string | null
          peak_rate: number | null
          residential_rate: number
          solar_potential: string | null
          state_code: string
          state_name: string
          updated_at: string | null
          utility_id: string | null
          utility_name: string | null
          wind_potential: string | null
          zip_prefix: string | null
        }
        Insert: {
          commercial_rate: number
          created_at?: string | null
          data_source?: string | null
          demand_charge?: number | null
          effective_date?: string | null
          has_demand_charge?: boolean | null
          has_tou?: boolean | null
          id?: string
          industrial_rate: number
          net_metering_available?: boolean | null
          net_metering_type?: string | null
          off_peak_rate?: number | null
          part_peak_rate?: number | null
          peak_demand_charge?: number | null
          peak_hours?: string | null
          peak_rate?: number | null
          residential_rate: number
          solar_potential?: string | null
          state_code: string
          state_name: string
          updated_at?: string | null
          utility_id?: string | null
          utility_name?: string | null
          wind_potential?: string | null
          zip_prefix?: string | null
        }
        Update: {
          commercial_rate?: number
          created_at?: string | null
          data_source?: string | null
          demand_charge?: number | null
          effective_date?: string | null
          has_demand_charge?: boolean | null
          has_tou?: boolean | null
          id?: string
          industrial_rate?: number
          net_metering_available?: boolean | null
          net_metering_type?: string | null
          off_peak_rate?: number | null
          part_peak_rate?: number | null
          peak_demand_charge?: number | null
          peak_hours?: string | null
          peak_rate?: number | null
          residential_rate?: number
          solar_potential?: string | null
          state_code?: string
          state_name?: string
          updated_at?: string | null
          utility_id?: string | null
          utility_name?: string | null
          wind_potential?: string | null
          zip_prefix?: string | null
        }
        Relationships: []
      }
      vendor_notifications: {
        Row: {
          created_at: string | null
          email_sent: boolean | null
          email_sent_at: string | null
          id: string
          is_read: boolean | null
          message: string
          read_at: string | null
          related_product_id: string | null
          related_rfq_id: string | null
          title: string
          type: string
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          read_at?: string | null
          related_product_id?: string | null
          related_rfq_id?: string | null
          title: string
          type: string
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          read_at?: string | null
          related_product_id?: string | null
          related_rfq_id?: string | null
          title?: string
          type?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_notifications_related_product_id_fkey"
            columns: ["related_product_id"]
            isOneToOne: false
            referencedRelation: "pending_product_approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_notifications_related_product_id_fkey"
            columns: ["related_product_id"]
            isOneToOne: false
            referencedRelation: "vendor_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_notifications_related_rfq_id_fkey"
            columns: ["related_rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_notifications_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "pending_vendor_approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_notifications_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_notifications_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_products: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          capacity_kwh: number | null
          certification_docs: Json | null
          certifications: string[] | null
          chemistry: string | null
          created_at: string | null
          currency: string | null
          datasheet_filename: string | null
          datasheet_url: string | null
          efficiency_percent: number | null
          id: string
          lead_time_weeks: number
          manufacturer: string
          minimum_order_quantity: number | null
          model: string
          power_kw: number | null
          price_per_kw: number | null
          price_per_kwh: number | null
          product_category: string
          rejection_reason: string | null
          status: string | null
          times_quoted: number | null
          times_selected: number | null
          updated_at: string | null
          vendor_id: string
          voltage_v: number | null
          warranty_years: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          capacity_kwh?: number | null
          certification_docs?: Json | null
          certifications?: string[] | null
          chemistry?: string | null
          created_at?: string | null
          currency?: string | null
          datasheet_filename?: string | null
          datasheet_url?: string | null
          efficiency_percent?: number | null
          id?: string
          lead_time_weeks: number
          manufacturer: string
          minimum_order_quantity?: number | null
          model: string
          power_kw?: number | null
          price_per_kw?: number | null
          price_per_kwh?: number | null
          product_category: string
          rejection_reason?: string | null
          status?: string | null
          times_quoted?: number | null
          times_selected?: number | null
          updated_at?: string | null
          vendor_id: string
          voltage_v?: number | null
          warranty_years: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          capacity_kwh?: number | null
          certification_docs?: Json | null
          certifications?: string[] | null
          chemistry?: string | null
          created_at?: string | null
          currency?: string | null
          datasheet_filename?: string | null
          datasheet_url?: string | null
          efficiency_percent?: number | null
          id?: string
          lead_time_weeks?: number
          manufacturer?: string
          minimum_order_quantity?: number | null
          model?: string
          power_kw?: number | null
          price_per_kw?: number | null
          price_per_kwh?: number | null
          product_category?: string
          rejection_reason?: string | null
          status?: string | null
          times_quoted?: number | null
          times_selected?: number | null
          updated_at?: string | null
          vendor_id?: string
          voltage_v?: number | null
          warranty_years?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendor_products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "pending_vendor_approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string | null
          approved_at: string | null
          approved_by: string | null
          approved_submissions: number | null
          company_name: string
          contact_name: string
          created_at: string | null
          description: string | null
          email: string
          id: string
          last_login: string | null
          password_hash: string
          phone: string | null
          quotes_included_count: number | null
          specialty: string
          status: string | null
          total_submissions: number | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          approved_submissions?: number | null
          company_name: string
          contact_name: string
          created_at?: string | null
          description?: string | null
          email: string
          id?: string
          last_login?: string | null
          password_hash: string
          phone?: string | null
          quotes_included_count?: number | null
          specialty: string
          status?: string | null
          total_submissions?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          approved_submissions?: number | null
          company_name?: string
          contact_name?: string
          created_at?: string | null
          description?: string | null
          email?: string
          id?: string
          last_login?: string | null
          password_hash?: string
          phone?: string | null
          quotes_included_count?: number | null
          specialty?: string
          status?: string | null
          total_submissions?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      weather_impact_coefficients: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          impact_description: string
          impact_max: number
          impact_metric: string
          impact_min: number
          industry_slug: string | null
          source: string
          unit: string
          updated_at: string | null
          weather_risk_type: string
          why_it_matters: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          impact_description: string
          impact_max: number
          impact_metric: string
          impact_min: number
          industry_slug?: string | null
          source: string
          unit: string
          updated_at?: string | null
          weather_risk_type: string
          why_it_matters: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          impact_description?: string
          impact_max?: number
          impact_metric?: string
          impact_min?: number
          industry_slug?: string | null
          source?: string
          unit?: string
          updated_at?: string | null
          weather_risk_type?: string
          why_it_matters?: string
        }
        Relationships: [
          {
            foreignKeyName: "weather_impact_coefficients_industry_slug_fkey"
            columns: ["industry_slug"]
            isOneToOne: false
            referencedRelation: "use_cases"
            referencedColumns: ["slug"]
          },
        ]
      }
      wizard_events: {
        Row: {
          event_category: string | null
          event_data: Json | null
          event_type: string
          id: string
          session_id: string
          step_name: string | null
          step_number: number | null
          timestamp: string
          wizard_session_id: string | null
        }
        Insert: {
          event_category?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          session_id: string
          step_name?: string | null
          step_number?: number | null
          timestamp?: string
          wizard_session_id?: string | null
        }
        Update: {
          event_category?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          session_id?: string
          step_name?: string | null
          step_number?: number | null
          timestamp?: string
          wizard_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wizard_events_wizard_session_id_fkey"
            columns: ["wizard_session_id"]
            isOneToOne: false
            referencedRelation: "wizard_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      wizard_sessions: {
        Row: {
          ai_recommendation_data: Json | null
          ai_recommendations_accepted: boolean | null
          ai_recommendations_shown: boolean | null
          browser: string | null
          completed_at: string | null
          completed_successfully: boolean | null
          created_at: string
          device_type: string | null
          duration_hours: number | null
          duration_seconds: number | null
          electricity_rate: number | null
          exit_step: number | null
          generator_mw: number | null
          id: string
          lead_captured: boolean | null
          lead_id: string | null
          location: string | null
          os: string | null
          quote_annual_savings: number | null
          quote_format: string | null
          quote_generated: boolean | null
          quote_roi_years: number | null
          quote_total_cost: number | null
          referrer: string | null
          session_id: string
          solar_mw: number | null
          steps_completed: number | null
          steps_total: number | null
          storage_mw: number | null
          system_configuration: Json | null
          template_selected: string | null
          updated_at: string
          use_case_answers: Json | null
          user_agent: string | null
          user_fingerprint: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          wind_mw: number | null
        }
        Insert: {
          ai_recommendation_data?: Json | null
          ai_recommendations_accepted?: boolean | null
          ai_recommendations_shown?: boolean | null
          browser?: string | null
          completed_at?: string | null
          completed_successfully?: boolean | null
          created_at?: string
          device_type?: string | null
          duration_hours?: number | null
          duration_seconds?: number | null
          electricity_rate?: number | null
          exit_step?: number | null
          generator_mw?: number | null
          id?: string
          lead_captured?: boolean | null
          lead_id?: string | null
          location?: string | null
          os?: string | null
          quote_annual_savings?: number | null
          quote_format?: string | null
          quote_generated?: boolean | null
          quote_roi_years?: number | null
          quote_total_cost?: number | null
          referrer?: string | null
          session_id: string
          solar_mw?: number | null
          steps_completed?: number | null
          steps_total?: number | null
          storage_mw?: number | null
          system_configuration?: Json | null
          template_selected?: string | null
          updated_at?: string
          use_case_answers?: Json | null
          user_agent?: string | null
          user_fingerprint?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          wind_mw?: number | null
        }
        Update: {
          ai_recommendation_data?: Json | null
          ai_recommendations_accepted?: boolean | null
          ai_recommendations_shown?: boolean | null
          browser?: string | null
          completed_at?: string | null
          completed_successfully?: boolean | null
          created_at?: string
          device_type?: string | null
          duration_hours?: number | null
          duration_seconds?: number | null
          electricity_rate?: number | null
          exit_step?: number | null
          generator_mw?: number | null
          id?: string
          lead_captured?: boolean | null
          lead_id?: string | null
          location?: string | null
          os?: string | null
          quote_annual_savings?: number | null
          quote_format?: string | null
          quote_generated?: boolean | null
          quote_roi_years?: number | null
          quote_total_cost?: number | null
          referrer?: string | null
          session_id?: string
          solar_mw?: number | null
          steps_completed?: number | null
          steps_total?: number | null
          storage_mw?: number | null
          system_configuration?: Json | null
          template_selected?: string | null
          updated_at?: string
          use_case_answers?: Json | null
          user_agent?: string | null
          user_fingerprint?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          wind_mw?: number | null
        }
        Relationships: []
      }
      zip_codes: {
        Row: {
          area_code: string | null
          city: string
          county: string | null
          created_at: string | null
          latitude: number | null
          longitude: number | null
          state_code: string
          state_name: string
          timezone: string | null
          updated_at: string | null
          zip_code: string
        }
        Insert: {
          area_code?: string | null
          city: string
          county?: string | null
          created_at?: string | null
          latitude?: number | null
          longitude?: number | null
          state_code: string
          state_name: string
          timezone?: string | null
          updated_at?: string | null
          zip_code: string
        }
        Update: {
          area_code?: string | null
          city?: string
          county?: string | null
          created_at?: string | null
          latitude?: number | null
          longitude?: number | null
          state_code?: string
          state_name?: string
          timezone?: string | null
          updated_at?: string | null
          zip_code?: string
        }
        Relationships: []
      }
    }
    Views: {
      active_state_incentives: {
        Row: {
          application_url: string | null
          equity_incentive_per_kwh: number | null
          equity_program: boolean | null
          funding_status: string | null
          incentive_per_kwh: number | null
          incentive_percent: number | null
          max_incentive: number | null
          program_name: string | null
          program_type: string | null
          state_code: string | null
          state_name: string | null
        }
        Insert: {
          application_url?: string | null
          equity_incentive_per_kwh?: number | null
          equity_program?: boolean | null
          funding_status?: string | null
          incentive_per_kwh?: never
          incentive_percent?: never
          max_incentive?: never
          program_name?: string | null
          program_type?: string | null
          state_code?: string | null
          state_name?: string | null
        }
        Update: {
          application_url?: string | null
          equity_incentive_per_kwh?: number | null
          equity_program?: boolean | null
          funding_status?: string | null
          incentive_per_kwh?: never
          incentive_percent?: never
          max_incentive?: never
          program_name?: string | null
          program_type?: string | null
          state_code?: string | null
          state_name?: string | null
        }
        Relationships: []
      }
      ai_recommendation_effectiveness: {
        Row: {
          accepted: number | null
          avg_confidence: number | null
          avg_confidence_when_accepted: number | null
          modified: number | null
          recommendation_date: string | null
          recommendation_type: string | null
          rejected: number | null
          total_recommendations: number | null
        }
        Relationships: []
      }
      approved_startups_for_matching: {
        Row: {
          created_at: string | null
          id: string | null
          industries: string[] | null
          location: string | null
          market_score: number | null
          name: string | null
          product_score: number | null
          revenue_annual: number | null
          sectors: string[] | null
          stage: string | null
          team_score: number | null
          total_god_score: number | null
          traction_score: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          industries?: never
          location?: never
          market_score?: never
          name?: string | null
          product_score?: never
          revenue_annual?: never
          sectors?: never
          stage?: string | null
          team_score?: never
          total_god_score?: never
          traction_score?: never
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          industries?: never
          location?: never
          market_score?: never
          name?: string | null
          product_score?: never
          revenue_annual?: never
          sectors?: never
          stage?: string | null
          team_score?: never
          total_god_score?: never
          traction_score?: never
          updated_at?: string | null
        }
        Relationships: []
      }
      calculation_anomalies: {
        Row: {
          created_at: string | null
          equipment_cost: string | null
          id: string | null
          location: string | null
          payback_years: string | null
          score: number | null
          storage_mw: string | null
          total_cost: string | null
          use_case: string | null
          warnings: Json | null
          warnings_count: number | null
        }
        Relationships: []
      }
      calculation_validation_summary: {
        Row: {
          avg_score: number | null
          avg_warnings: number | null
          compliance_rate: number | null
          date: string | null
          invalid_count: number | null
          total_validations: number | null
          unique_sessions: number | null
          valid_count: number | null
        }
        Relationships: []
      }
      daily_scraper_stats: {
        Row: {
          failed_runs: number | null
          run_date: string | null
          successful_runs: number | null
          total_articles: number | null
          total_runs: number | null
          total_startups_discovered: number | null
          total_startups_imported: number | null
        }
        Relationships: []
      }
      investor_engagement_summary: {
        Row: {
          activity_level_score: number | null
          avg_response_time_hours: number | null
          firm: string | null
          investor_id: string | null
          investor_name: string | null
          preferred_contact_day: string | null
          preferred_contact_hour: number | null
          success_rate_pct: number | null
          successful_introductions: number | null
          total_interactions: number | null
        }
        Relationships: []
      }
      market_pricing_analysis: {
        Row: {
          avg_lead_time: number | null
          avg_price_kwh: number | null
          avg_warranty: number | null
          max_price_kwh: number | null
          min_price_kwh: number | null
          product_category: string | null
          product_count: number | null
        }
        Relationships: []
      }
      match_performance_metrics: {
        Row: {
          avg_match_score: number | null
          avg_success_score: number | null
          failed_matches: number | null
          matches_with_feedback: number | null
          successful_matches: number | null
          total_matches: number | null
          unique_investors: number | null
          unique_startups: number | null
        }
        Relationships: []
      }
      match_quality_summary: {
        Row: {
          avg_match_score: number | null
          avg_similarity: number | null
          avg_success_score: number | null
          cold_matches: number | null
          hot_matches: number | null
          matches_with_feedback: number | null
          super_hot_matches: number | null
          total_matches: number | null
          unique_investors: number | null
          unique_startups: number | null
          warm_matches: number | null
        }
        Relationships: []
      }
      pending_product_approvals: {
        Row: {
          created_at: string | null
          id: string | null
          lead_time_weeks: number | null
          manufacturer: string | null
          model: string | null
          price_per_kw: number | null
          price_per_kwh: number | null
          product_category: string | null
          vendor_email: string | null
          vendor_name: string | null
        }
        Relationships: []
      }
      pending_vendor_approvals: {
        Row: {
          company_name: string | null
          contact_name: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string | null
          specialty: string | null
        }
        Insert: {
          company_name?: string | null
          contact_name?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string | null
          specialty?: string | null
        }
        Update: {
          company_name?: string | null
          contact_name?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string | null
          specialty?: string | null
        }
        Relationships: []
      }
      quotes_with_stats: {
        Row: {
          annual_savings: number | null
          created_at: string | null
          description: string | null
          duration_hours: number | null
          id: string | null
          is_archived: boolean | null
          is_favorite: boolean | null
          last_viewed: string | null
          last_viewed_at: string | null
          location: string | null
          parent_quote_id: string | null
          payback_years: number | null
          quote_name: string | null
          share_expires_at: string | null
          share_token: string | null
          solar_mw: number | null
          storage_mw: number | null
          system_configuration: Json | null
          template_selected: string | null
          total_cost: number | null
          updated_at: string | null
          user_id: string | null
          version: number | null
          view_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_quotes_parent_quote_id_fkey"
            columns: ["parent_quote_id"]
            isOneToOne: false
            referencedRelation: "quotes_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_quotes_parent_quote_id_fkey"
            columns: ["parent_quote_id"]
            isOneToOne: false
            referencedRelation: "saved_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      recent_funding_activity: {
        Row: {
          amount_usd: number | null
          announced_date: string | null
          lead_investors: string[] | null
          round_type: string | null
          source: string | null
          startup_id: string | null
          startup_name: string | null
          valuation_usd: number | null
        }
        Relationships: []
      }
      solar_data_current: {
        Row: {
          annual_dhi: number | null
          annual_dni: number | null
          annual_ghi: number | null
          api_response: Json | null
          city_name: string | null
          country_code: string | null
          created_at: string | null
          expires_at: string | null
          id: string | null
          last_updated: string | null
          latitude: number | null
          longitude: number | null
          peak_sun_hours: number | null
          solar_rating: string | null
          source: string | null
          zip_code: string | null
        }
        Insert: {
          annual_dhi?: number | null
          annual_dni?: number | null
          annual_ghi?: number | null
          api_response?: Json | null
          city_name?: string | null
          country_code?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          last_updated?: string | null
          latitude?: number | null
          longitude?: number | null
          peak_sun_hours?: number | null
          solar_rating?: string | null
          source?: string | null
          zip_code?: string | null
        }
        Update: {
          annual_dhi?: number | null
          annual_dni?: number | null
          annual_ghi?: number | null
          api_response?: Json | null
          city_name?: string | null
          country_code?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          last_updated?: string | null
          latitude?: number | null
          longitude?: number | null
          peak_sun_hours?: number | null
          solar_rating?: string | null
          source?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      startup_momentum_dashboard: {
        Row: {
          avg_sentiment_30d: number | null
          estimated_valuation_usd: number | null
          funding_recency_score: number | null
          momentum_score: number | null
          momentum_updated: string | null
          news_count_30d: number | null
          stage: string | null
          startup_id: string | null
          startup_name: string | null
          valuation_confidence: number | null
        }
        Relationships: []
      }
      successful_matches: {
        Row: {
          confidence_level: string | null
          contacted_at: string | null
          created_at: string | null
          created_by: string | null
          feedback_date: string | null
          feedback_received: boolean | null
          fit_analysis: Json | null
          id: string | null
          intro_email_body: string | null
          intro_email_subject: string | null
          intro_requested_at: string | null
          investment_amount: number | null
          investor_id: string | null
          investor_name: string | null
          investor_sectors: string[] | null
          investor_stages: string[] | null
          investor_type: string | null
          last_interaction: string | null
          latest_feedback: string | null
          match_score: number | null
          reasoning: string | null
          similarity_score: number | null
          startup_id: string | null
          startup_industries: string[] | null
          startup_name: string | null
          startup_stage: string | null
          status: string | null
          success_score: number | null
          updated_at: string | null
          user_id: string | null
          viewed_at: string | null
          why_you_match: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "startup_investor_matches_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investor_engagement_summary"
            referencedColumns: ["investor_id"]
          },
          {
            foreignKeyName: "startup_investor_matches_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "startup_investor_matches_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "approved_startups_for_matching"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "startup_investor_matches_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "recent_funding_activity"
            referencedColumns: ["startup_id"]
          },
          {
            foreignKeyName: "startup_investor_matches_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startup_momentum_dashboard"
            referencedColumns: ["startup_id"]
          },
          {
            foreignKeyName: "startup_investor_matches_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startup_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quote_summary: {
        Row: {
          archived_quotes: number | null
          favorite_quotes: number | null
          last_quote_date: string | null
          total_project_value: number | null
          total_quotes: number | null
          user_id: string | null
        }
        Relationships: []
      }
      utility_rates_detailed: {
        Row: {
          commercial_rate: number | null
          created_at: string | null
          data_source: string | null
          demand_charge: number | null
          effective_date: string | null
          has_demand_charge: boolean | null
          has_tou: boolean | null
          id: string | null
          industrial_rate: number | null
          net_metering_available: boolean | null
          net_metering_type: string | null
          off_peak_rate: number | null
          part_peak_rate: number | null
          peak_demand_charge: number | null
          peak_hours: string | null
          peak_rate: number | null
          residential_rate: number | null
          solar_potential: string | null
          state_code: string | null
          state_name: string | null
          updated_at: string | null
          utility_id: string | null
          utility_name: string | null
          wind_potential: string | null
          zip_prefix: string | null
        }
        Insert: {
          commercial_rate?: number | null
          created_at?: string | null
          data_source?: string | null
          demand_charge?: number | null
          effective_date?: string | null
          has_demand_charge?: boolean | null
          has_tou?: boolean | null
          id?: string | null
          industrial_rate?: number | null
          net_metering_available?: boolean | null
          net_metering_type?: string | null
          off_peak_rate?: number | null
          part_peak_rate?: number | null
          peak_demand_charge?: number | null
          peak_hours?: string | null
          peak_rate?: number | null
          residential_rate?: number | null
          solar_potential?: string | null
          state_code?: string | null
          state_name?: string | null
          updated_at?: string | null
          utility_id?: string | null
          utility_name?: string | null
          wind_potential?: string | null
          zip_prefix?: string | null
        }
        Update: {
          commercial_rate?: number | null
          created_at?: string | null
          data_source?: string | null
          demand_charge?: number | null
          effective_date?: string | null
          has_demand_charge?: boolean | null
          has_tou?: boolean | null
          id?: string | null
          industrial_rate?: number | null
          net_metering_available?: boolean | null
          net_metering_type?: string | null
          off_peak_rate?: number | null
          part_peak_rate?: number | null
          peak_demand_charge?: number | null
          peak_hours?: string | null
          peak_rate?: number | null
          residential_rate?: number | null
          solar_potential?: string | null
          state_code?: string | null
          state_name?: string | null
          updated_at?: string | null
          utility_id?: string | null
          utility_name?: string | null
          wind_potential?: string | null
          zip_prefix?: string | null
        }
        Relationships: []
      }
      utility_rates_summary: {
        Row: {
          avg_commercial_rate: number | null
          avg_demand_charge: number | null
          last_updated: string | null
          max_commercial_rate: number | null
          min_commercial_rate: number | null
          solar_potentials: string | null
          state_code: string | null
          state_name: string | null
          tou_utilities_count: number | null
          utility_count: number | null
          wind_potentials: string | null
        }
        Relationships: []
      }
      v_current_equipment_pricing: {
        Row: {
          base_price: number | null
          confidence_level: string | null
          data_source: string | null
          effective_date: string | null
          equipment_type: string | null
          id: string | null
          manufacturer: string | null
          model: string | null
          price_unit: string | null
          size_max: number | null
          size_min: number | null
          size_unit: string | null
          source_date: string | null
          specifications: Json | null
          tier_name: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      v_popular_use_cases: {
        Row: {
          avg_rating: number | null
          category: string | null
          name: string | null
          popularity_score: number | null
          slug: string | null
          times_saved: number | null
          times_used: number | null
        }
        Relationships: []
      }
      v_pricing_dashboard: {
        Row: {
          confidence_level: string | null
          config_category: string | null
          config_data: Json | null
          config_key: string | null
          data_source: string | null
          description: string | null
          id: string | null
          is_active: boolean | null
          size_max_kw: number | null
          size_max_mwh: number | null
          size_min_kw: number | null
          size_min_mwh: number | null
          updated_at: string | null
          vendor_notes: string | null
          version: string | null
        }
        Insert: {
          confidence_level?: string | null
          config_category?: string | null
          config_data?: Json | null
          config_key?: string | null
          data_source?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          size_max_kw?: number | null
          size_max_mwh?: number | null
          size_min_kw?: number | null
          size_min_mwh?: number | null
          updated_at?: string | null
          vendor_notes?: string | null
          version?: string | null
        }
        Update: {
          confidence_level?: string | null
          config_category?: string | null
          config_data?: Json | null
          config_key?: string | null
          data_source?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          size_max_kw?: number | null
          size_max_mwh?: number | null
          size_min_kw?: number | null
          size_min_mwh?: number | null
          updated_at?: string | null
          vendor_notes?: string | null
          version?: string | null
        }
        Relationships: []
      }
      v_use_case_templates_summary: {
        Row: {
          avg_rating: number | null
          category: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          equipment_count: number | null
          icon: string | null
          id: string | null
          name: string | null
          required_tier: string | null
          slug: string | null
          times_saved: number | null
          times_used: number | null
          total_ratings: number | null
          updated_at: string | null
          version: string | null
        }
        Relationships: []
      }
      vendor_performance: {
        Row: {
          approval_rate_percent: number | null
          approved_submissions: number | null
          company_name: string | null
          created_at: string | null
          id: string | null
          last_login: string | null
          quotes_included_count: number | null
          specialty: string | null
          total_submissions: number | null
        }
        Insert: {
          approval_rate_percent?: never
          approved_submissions?: number | null
          company_name?: string | null
          created_at?: string | null
          id?: string | null
          last_login?: string | null
          quotes_included_count?: number | null
          specialty?: string | null
          total_submissions?: number | null
        }
        Update: {
          approval_rate_percent?: never
          approved_submissions?: number | null
          company_name?: string | null
          created_at?: string | null
          id?: string | null
          last_login?: string | null
          quotes_included_count?: number | null
          specialty?: string | null
          total_submissions?: number | null
        }
        Relationships: []
      }
      wizard_session_summary: {
        Row: {
          ai_accepted_count: number | null
          ai_shown_count: number | null
          avg_completion_rate: number | null
          avg_duration_seconds: number | null
          completed_sessions: number | null
          leads_captured: number | null
          session_date: string | null
          template_selected: string | null
          total_sessions: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_template_rating: {
        Args: { rating_value: number; template_slug: string }
        Returns: undefined
      }
      calculate_price_trend: {
        Args: {
          p_period_end: string
          p_period_start: string
          p_region?: string
          p_time_period: string
          p_trend_type: string
        }
        Returns: undefined
      }
      calculate_weighted_price: {
        Args: {
          p_capacity_mw?: number
          p_equipment_type: string
          p_region?: string
          p_technology?: string
        }
        Returns: {
          ceiling_price: number
          confidence: number
          floor_price: number
          price_range_high: number
          price_range_low: number
          sample_count: number
          weighted_price: number
        }[]
      }
      clean_expired_solar_cache: { Args: never; Returns: number }
      cleanup_expired_cache: { Args: never; Returns: number }
      exec_sql: { Args: { sql_query: string }; Returns: Json }
      exec_sql_modify: { Args: { sql_query: string }; Returns: Json }
      exec_sql_rows: { Args: { sql_query: string }; Returns: Json }
      find_investor_matches_by_embedding: {
        Args: { match_count?: number; startup_uuid: string }
        Returns: {
          combined_score: number
          investor_id: string
          investor_name: string
          investor_type: string
          sector_focus: string[]
          similarity_score: number
          stage_focus: string[]
        }[]
      }
      find_similar_investors: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: number[]
        }
        Returns: {
          firm: string
          id: string
          name: string
          sector_focus: string[]
          similarity: number
          stage_focus: string[]
          type: string
        }[]
      }
      find_similar_startups: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: number[]
        }
        Returns: {
          id: string
          name: string
          sectors: string[]
          similarity: number
          stage: string
          tagline: string
          total_god_score: number
        }[]
      }
      generate_business_search_key: {
        Args: { p_business_name: string; p_postal_code: string }
        Returns: string
      }
      get_business_size_tier: {
        Args: { p_industry_slug: string; p_size_value: number }
        Returns: {
          questionnaire_depth: string
          target_question_count: number
          tier: string
          tier_name: string
        }[]
      }
      get_constant: { Args: { p_key: string }; Returns: number }
      get_constant_json: { Args: { p_key: string }; Returns: Json }
      get_pricing_tier: {
        Args: { p_category: string; p_size_kw?: number; p_size_mwh?: number }
        Returns: {
          confidence_level: string
          config_data: Json
          config_key: string
          id: string
          price_high: number
          price_low: number
          price_low_plus: number
          price_mid: number
          price_mid_plus: number
          price_unit: string
          size_max_kw: number
          size_max_mwh: number
          size_min_kw: number
          size_min_mwh: number
          source_type: string
        }[]
      }
      get_rss_sources: {
        Args: never
        Returns: {
          content_type: string
          equipment_categories: string[]
          feed_url: string
          id: string
          name: string
        }[]
      }
      get_sources_by_equipment: {
        Args: { equipment_type: string }
        Returns: {
          feed_url: string
          id: string
          last_fetch_at: string
          name: string
          reliability_score: number
          source_type: string
          url: string
        }[]
      }
      get_use_case_with_equipment: {
        Args: { template_slug: string }
        Returns: {
          equipment: Json
          template_data: Json
          template_id: string
          template_name: string
        }[]
      }
      get_utility_rate_by_zip: {
        Args: { p_zip_code: string }
        Returns: {
          commercial_rate: number
          demand_charge: number
          has_tou: boolean
          off_peak_rate: number
          peak_rate: number
          solar_potential: string
          state_name: string
          utility_name: string
          wind_potential: string
        }[]
      }
      increment_template_usage: {
        Args: { template_slug: string }
        Returns: undefined
      }
      lookup_business: {
        Args: {
          p_business_name: string
          p_postal_code: string
          p_street_address?: string
        }
        Returns: {
          address: string
          business_name: string
          category: string
          city: string
          confidence_score: number
          id: string
          industry_slug: string
          logo_url: string
          phone: string
          photo_url: string
          postal_code: string
          state: string
          verification_status: string
          website: string
        }[]
      }
      match_investors_to_startup: {
        Args: {
          match_count?: number
          match_threshold?: number
          startup_embedding: string
        }
        Returns: {
          investor_id: string
          similarity: number
        }[]
      }
      save_business_lookup: {
        Args: {
          p_api_response?: Json
          p_business_name: string
          p_category?: string
          p_city: string
          p_confidence_score?: number
          p_google_photo_url?: string
          p_google_place_id?: string
          p_industry_slug?: string
          p_logo_url?: string
          p_phone?: string
          p_postal_code: string
          p_state: string
          p_street_address: string
          p_website?: string
        }
        Returns: string
      }
      update_investor_embedding: {
        Args: { embedding_vector: number[]; investor_id: string }
        Returns: undefined
      }
      update_startup_embedding: {
        Args: { embedding_vector: number[]; startup_id: string }
        Returns: undefined
      }
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
