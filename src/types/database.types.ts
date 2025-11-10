/**
 * SUPABASE DATABASE TYPES
 * Auto-generated types for use case database schema
 * This file should be regenerated when database schema changes
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      use_cases: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon: string | null
          image_url: string | null
          category: 'commercial' | 'industrial' | 'institutional' | 'agricultural' | 'residential' | 'utility'
          required_tier: 'free' | 'semi_premium' | 'premium'
          is_active: boolean
          display_order: number
          industry_standards: Json
          validation_sources: string[] | null
          usage_count: number
          average_roi: number | null
          average_payback_years: number | null
          last_used: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          icon?: string | null
          image_url?: string | null
          category: 'commercial' | 'industrial' | 'institutional' | 'agricultural' | 'residential' | 'utility'
          required_tier?: 'free' | 'semi_premium' | 'premium'
          is_active?: boolean
          display_order?: number
          industry_standards?: Json
          validation_sources?: string[] | null
          usage_count?: number
          average_roi?: number | null
          average_payback_years?: number | null
          last_used?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          icon?: string | null
          image_url?: string | null
          category?: 'commercial' | 'industrial' | 'institutional' | 'agricultural' | 'residential' | 'utility'
          required_tier?: 'free' | 'semi_premium' | 'premium'
          is_active?: boolean
          display_order?: number
          industry_standards?: Json
          validation_sources?: string[] | null
          usage_count?: number
          average_roi?: number | null
          average_payback_years?: number | null
          last_used?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
      }
      use_case_configurations: {
        Row: {
          id: string
          use_case_id: string
          config_name: string
          config_slug: string
          description: string | null
          is_default: boolean
          typical_load_kw: number
          peak_load_kw: number
          profile_type: 'constant' | 'peaked' | 'seasonal' | 'variable'
          daily_operating_hours: number
          peak_hours_start: string | null
          peak_hours_end: string | null
          operates_weekends: boolean
          seasonal_variation: number
          demand_charge_sensitivity: number
          energy_cost_multiplier: number
          typical_savings_percent: number
          roi_adjustment_factor: number
          peak_demand_penalty: number
          min_size_mw: number | null
          max_size_mw: number | null
          preferred_duration_hours: number
          selection_count: number
          average_system_size_mw: number | null
          average_roi: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          use_case_id: string
          config_name: string
          config_slug: string
          description?: string | null
          is_default?: boolean
          typical_load_kw: number
          peak_load_kw: number
          profile_type?: 'constant' | 'peaked' | 'seasonal' | 'variable'
          daily_operating_hours?: number
          peak_hours_start?: string | null
          peak_hours_end?: string | null
          operates_weekends?: boolean
          seasonal_variation?: number
          demand_charge_sensitivity?: number
          energy_cost_multiplier?: number
          typical_savings_percent?: number
          roi_adjustment_factor?: number
          peak_demand_penalty?: number
          min_size_mw?: number | null
          max_size_mw?: number | null
          preferred_duration_hours?: number
          selection_count?: number
          average_system_size_mw?: number | null
          average_roi?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          use_case_id?: string
          config_name?: string
          config_slug?: string
          description?: string | null
          is_default?: boolean
          typical_load_kw?: number
          peak_load_kw?: number
          profile_type?: 'constant' | 'peaked' | 'seasonal' | 'variable'
          daily_operating_hours?: number
          peak_hours_start?: string | null
          peak_hours_end?: string | null
          operates_weekends?: boolean
          seasonal_variation?: number
          demand_charge_sensitivity?: number
          energy_cost_multiplier?: number
          typical_savings_percent?: number
          roi_adjustment_factor?: number
          peak_demand_penalty?: number
          min_size_mw?: number | null
          max_size_mw?: number | null
          preferred_duration_hours?: number
          selection_count?: number
          average_system_size_mw?: number | null
          average_roi?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      equipment_templates: {
        Row: {
          id: string
          name: string
          category: string | null
          manufacturer: string | null
          model: string | null
          nameplate_power_kw: number
          typical_duty_cycle: number
          startup_power_kw: number | null
          efficiency_percent: number
          certification_standards: string[] | null
          energy_efficiency_rating: string | null
          typical_cost_per_kw: number | null
          installation_factor: number
          maintenance_cost_per_year: number | null
          expected_lifetime_years: number
          warranty_years: number
          replacement_schedule_years: number
          description: string | null
          typical_applications: string[] | null
          operating_conditions: Json
          usage_count: number
          average_duty_cycle: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category?: string | null
          manufacturer?: string | null
          model?: string | null
          nameplate_power_kw: number
          typical_duty_cycle?: number
          startup_power_kw?: number | null
          efficiency_percent?: number
          certification_standards?: string[] | null
          energy_efficiency_rating?: string | null
          typical_cost_per_kw?: number | null
          installation_factor?: number
          maintenance_cost_per_year?: number | null
          expected_lifetime_years?: number
          warranty_years?: number
          replacement_schedule_years?: number
          description?: string | null
          typical_applications?: string[] | null
          operating_conditions?: Json
          usage_count?: number
          average_duty_cycle?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string | null
          manufacturer?: string | null
          model?: string | null
          nameplate_power_kw?: number
          typical_duty_cycle?: number
          startup_power_kw?: number | null
          efficiency_percent?: number
          certification_standards?: string[] | null
          energy_efficiency_rating?: string | null
          typical_cost_per_kw?: number | null
          installation_factor?: number
          maintenance_cost_per_year?: number | null
          expected_lifetime_years?: number
          warranty_years?: number
          replacement_schedule_years?: number
          description?: string | null
          typical_applications?: string[] | null
          operating_conditions?: Json
          usage_count?: number
          average_duty_cycle?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      configuration_equipment: {
        Row: {
          id: string
          configuration_id: string
          equipment_template_id: string
          quantity: number
          power_override_kw: number | null
          duty_cycle_override: number | null
          description_override: string | null
          operating_schedule: Json
          load_priority: number
          is_critical: boolean
          created_at: string
        }
        Insert: {
          id?: string
          configuration_id: string
          equipment_template_id: string
          quantity?: number
          power_override_kw?: number | null
          duty_cycle_override?: number | null
          description_override?: string | null
          operating_schedule?: Json
          load_priority?: number
          is_critical?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          configuration_id?: string
          equipment_template_id?: string
          quantity?: number
          power_override_kw?: number | null
          duty_cycle_override?: number | null
          description_override?: string | null
          operating_schedule?: Json
          load_priority?: number
          is_critical?: boolean
          created_at?: string
        }
      }
      pricing_scenarios: {
        Row: {
          id: string
          configuration_id: string
          scenario_name: string
          scenario_type: string
          description: string | null
          demand_charge_per_kw: number
          energy_rate_peak: number
          energy_rate_offpeak: number
          peak_hours_definition: Json
          tou_structure: Json
          seasonal_rates: Json
          fixed_monthly_charge: number
          power_factor_penalty: number
          minimum_demand_charge: number
          ratchet_percentage: number
          baseline_annual_cost: number | null
          with_bess_annual_cost: number | null
          annual_savings: number | null
          savings_percentage: number | null
          payback_period_years: number | null
          npv_25_year: number | null
          irr_percentage: number | null
          utility_name: string | null
          state_province: string | null
          country: string
          rate_schedule_name: string | null
          effective_date: string | null
          applicable_incentives: Json
          total_incentive_value: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          configuration_id: string
          scenario_name: string
          scenario_type?: string
          description?: string | null
          demand_charge_per_kw: number
          energy_rate_peak: number
          energy_rate_offpeak: number
          peak_hours_definition?: Json
          tou_structure?: Json
          seasonal_rates?: Json
          fixed_monthly_charge?: number
          power_factor_penalty?: number
          minimum_demand_charge?: number
          ratchet_percentage?: number
          baseline_annual_cost?: number | null
          with_bess_annual_cost?: number | null
          annual_savings?: number | null
          savings_percentage?: number | null
          payback_period_years?: number | null
          npv_25_year?: number | null
          irr_percentage?: number | null
          utility_name?: string | null
          state_province?: string | null
          country?: string
          rate_schedule_name?: string | null
          effective_date?: string | null
          applicable_incentives?: Json
          total_incentive_value?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          configuration_id?: string
          scenario_name?: string
          scenario_type?: string
          description?: string | null
          demand_charge_per_kw?: number
          energy_rate_peak?: number
          energy_rate_offpeak?: number
          peak_hours_definition?: Json
          tou_structure?: Json
          seasonal_rates?: Json
          fixed_monthly_charge?: number
          power_factor_penalty?: number
          minimum_demand_charge?: number
          ratchet_percentage?: number
          baseline_annual_cost?: number | null
          with_bess_annual_cost?: number | null
          annual_savings?: number | null
          savings_percentage?: number | null
          payback_period_years?: number | null
          npv_25_year?: number | null
          irr_percentage?: number | null
          utility_name?: string | null
          state_province?: string | null
          country?: string
          rate_schedule_name?: string | null
          effective_date?: string | null
          applicable_incentives?: Json
          total_incentive_value?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      custom_questions: {
        Row: {
          id: string
          use_case_id: string
          question_text: string
          question_key: string
          question_type: 'number' | 'select' | 'boolean' | 'percentage' | 'text' | 'range'
          default_value: Json | null
          unit: string | null
          min_value: number | null
          max_value: number | null
          step_value: number | null
          select_options: Json
          impact_type: 'multiplier' | 'additionalLoad' | 'factor' | 'override' | 'none'
          impacts_field: string | null
          impact_calculation: Json
          display_order: number
          is_required: boolean
          help_text: string | null
          validation_rules: Json
          depends_on_question: string | null
          dependency_condition: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          use_case_id: string
          question_text: string
          question_key: string
          question_type: 'number' | 'select' | 'boolean' | 'percentage' | 'text' | 'range'
          default_value?: Json | null
          unit?: string | null
          min_value?: number | null
          max_value?: number | null
          step_value?: number | null
          select_options?: Json
          impact_type: 'multiplier' | 'additionalLoad' | 'factor' | 'override' | 'none'
          impacts_field?: string | null
          impact_calculation?: Json
          display_order?: number
          is_required?: boolean
          help_text?: string | null
          validation_rules?: Json
          depends_on_question?: string | null
          dependency_condition?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          use_case_id?: string
          question_text?: string
          question_key?: string
          question_type?: 'number' | 'select' | 'boolean' | 'percentage' | 'text' | 'range'
          default_value?: Json | null
          unit?: string | null
          min_value?: number | null
          max_value?: number | null
          step_value?: number | null
          select_options?: Json
          impact_type?: 'multiplier' | 'additionalLoad' | 'factor' | 'override' | 'none'
          impacts_field?: string | null
          impact_calculation?: Json
          display_order?: number
          is_required?: boolean
          help_text?: string | null
          validation_rules?: Json
          depends_on_question?: string | null
          dependency_condition?: Json
          created_at?: string
          updated_at?: string
        }
      }
      recommended_applications: {
        Row: {
          id: string
          use_case_id: string
          application_type: string
          priority: number
          effectiveness_rating: number
          typical_savings_contribution: number
          implementation_complexity: number
          payback_impact_factor: number
          description: string | null
          requirements: string | null
          benefits: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          use_case_id: string
          application_type: string
          priority?: number
          effectiveness_rating?: number
          typical_savings_contribution?: number
          implementation_complexity?: number
          payback_impact_factor?: number
          description?: string | null
          requirements?: string | null
          benefits?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          use_case_id?: string
          application_type?: string
          priority?: number
          effectiveness_rating?: number
          typical_savings_contribution?: number
          implementation_complexity?: number
          payback_impact_factor?: number
          description?: string | null
          requirements?: string | null
          benefits?: string[] | null
          created_at?: string
        }
      }
      use_case_analytics: {
        Row: {
          id: string
          use_case_id: string
          configuration_id: string | null
          user_id: string | null
          event_type: 'viewed' | 'selected' | 'configured' | 'quoted' | 'shared' | 'exported'
          event_data: Json
          answers: Json
          calculated_load_kw: number | null
          recommended_size_mw: number | null
          estimated_cost: number | null
          projected_savings: number | null
          calculated_roi: number | null
          session_id: string | null
          ip_address: string | null
          user_agent: string | null
          country: string | null
          created_at: string
        }
        Insert: {
          id?: string
          use_case_id: string
          configuration_id?: string | null
          user_id?: string | null
          event_type: 'viewed' | 'selected' | 'configured' | 'quoted' | 'shared' | 'exported'
          event_data?: Json
          answers?: Json
          calculated_load_kw?: number | null
          recommended_size_mw?: number | null
          estimated_cost?: number | null
          projected_savings?: number | null
          calculated_roi?: number | null
          session_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          country?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          use_case_id?: string
          configuration_id?: string | null
          user_id?: string | null
          event_type?: 'viewed' | 'selected' | 'configured' | 'quoted' | 'shared' | 'exported'
          event_data?: Json
          answers?: Json
          calculated_load_kw?: number | null
          recommended_size_mw?: number | null
          estimated_cost?: number | null
          projected_savings?: number | null
          calculated_roi?: number | null
          session_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          country?: string | null
          created_at?: string
        }
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

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never