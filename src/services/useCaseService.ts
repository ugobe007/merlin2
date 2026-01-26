/**
 * USE CASE DATABASE SERVICE
 * Service layer for managing use cases stored in Supabase
 * Replaces static useCaseTemplates.ts with dynamic database-driven approach
 */

import { supabase } from "./supabaseClient";
import { baselineCache, useCaseCache } from "./cacheService";
import { getBatteryPricing } from "./unifiedPricingService";
import { calculateFinancialMetrics } from "./centralizedCalculations";
import type { Database } from "../types/database.types";

// Database types
export type UseCaseRow = Database["public"]["Tables"]["use_cases"]["Row"];
export type UseCaseConfigurationRow =
  Database["public"]["Tables"]["use_case_configurations"]["Row"];
export type EquipmentTemplateRow = Database["public"]["Tables"]["equipment_templates"]["Row"];
export type ConfigurationEquipmentRow =
  Database["public"]["Tables"]["configuration_equipment"]["Row"];
export type PricingScenarioRow = Database["public"]["Tables"]["pricing_scenarios"]["Row"];
export type CustomQuestionRow = Database["public"]["Tables"]["custom_questions"]["Row"];
export type RecommendedApplicationRow =
  Database["public"]["Tables"]["recommended_applications"]["Row"];
export type UseCaseAnalyticsRow = Database["public"]["Tables"]["use_case_analytics"]["Row"];

// Enhanced types for frontend use
export interface UseCaseWithConfiguration extends UseCaseRow {
  default_configuration?: UseCaseConfigurationRow;
  question_count?: number;
  equipment_count?: number;
  total_equipment_power_kw?: number;
}

export interface DetailedUseCase extends UseCaseRow {
  configurations: UseCaseConfigurationRow[];
  custom_questions: CustomQuestionRow[];
  recommended_applications: RecommendedApplicationRow[];
  equipment_summary?: {
    total_equipment: number;
    total_nameplate_kw: number;
    total_typical_load_kw: number;
  };
}

export interface UseCaseConfiguration extends UseCaseConfigurationRow {
  equipment: Array<
    ConfigurationEquipmentRow & {
      equipment_template: EquipmentTemplateRow;
    }
  >;
  pricing_scenarios: PricingScenarioRow[];
}

export interface CalculationResponse {
  use_case_id: string;
  configuration_id: string;
  user_responses: Record<string, any>;
  calculated_load_kw: number;
  recommended_size_mw: number;
  estimated_cost: number;
  projected_savings: number;
  payback_years: number;
  roi_percentage: number;
  selected_pricing_scenario: PricingScenarioRow;
}

/**
 * ✅ Step 3 Industry Template Bundle (Jan 23, 2026)
 * Contains industry-specific load profile and equipment summary for Step 3
 * This gives the advisor panel context before all answers are filled.
 */
export type Step3IndustryTemplate = {
  useCaseId: string;
  slug: string;
  name: string;

  defaultConfigurationId?: string | null;
  defaultConfigurationName?: string | null;

  equipmentSummary?: {
    total_equipment: number;
    total_nameplate_kw: number;
    total_typical_load_kw: number;
  };

  // "Industry load profile" v1 (derived from config + equipment)
  loadProfile?: {
    baseline_kw?: number;            // typical load estimate
    peak_kw?: number;                // crude peak estimate
    duty_cycle_hint?: string;        // e.g. "spiky", "steady", "peaky afternoons"
    diversity_factor?: number;       // 0-1
    notes?: string[];
  };

  sources?: Array<{ label: string; note?: string }>;
};

/**
 * USE CASE DATABASE SERVICE CLASS
 */
export class UseCaseService {
  // =============================================================================
  // CORE USE CASE RETRIEVAL
  // =============================================================================

  /**
   * Get all active use cases with their default configurations
   */
  async getAllUseCases(includeInactive = false): Promise<UseCaseWithConfiguration[]> {
    try {
      // Simplified query - just get the use cases without complex joins
      let query = supabase
        .from("use_cases")
        .select("*")
        .order("display_order", { ascending: true });

      if (!includeInactive) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Supabase error fetching use cases:", error);
        throw error;
      }

      // Return basic use case data
      return (
        data?.map((useCase) => ({
          ...useCase,
          question_count: 0,
          equipment_count: 0,
          default_configuration: null,
        })) || []
      );
    } catch (error) {
      console.error("Error fetching use cases:", error);
      // Return empty array instead of throwing to prevent UI crash
      return [];
    }
  }

  /**
   * Get use cases by category
   */
  async getUseCasesByCategory(category: string): Promise<UseCaseWithConfiguration[]> {
    try {
      const { data, error } = await supabase
        .from("use_cases")
        .select(
          `
          *,
          default_configuration:use_case_configurations!inner(*)
        `
        )
        .eq("category", category)
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching use cases by category:", error);
      throw error;
    }
  }

  /**
   * Get use cases by access tier
   */
  async getUseCasesByTier(tier: string): Promise<UseCaseWithConfiguration[]> {
    try {
      const { data, error } = await supabase
        .from("use_cases")
        .select(
          `
          *,
          default_configuration:use_case_configurations!inner(*)
        `
        )
        .eq("required_tier", tier)
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching use cases by tier:", error);
      throw error;
    }
  }

  /**
   * Get detailed use case by slug with all related data
   */
  async getUseCaseBySlug(slug: string): Promise<DetailedUseCase | null> {
    try {
      // First try to find active use case
      const { data: useCase, error: useCaseError } = await supabase
        .from("use_cases")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      // If not found as active, check if it exists but is inactive (for debugging)
      if (useCaseError?.code === 'PGRST116' || !useCase) {
        const { data: inactiveCheck } = await supabase
          .from("use_cases")
          .select("slug, name, is_active")
          .eq("slug", slug)
          .single();
        
        if (inactiveCheck) {
          console.warn(`⚠️ [useCaseService] Found use case "${slug}" but it's inactive (is_active=${inactiveCheck.is_active})`);
        } else {
          console.log(`🔍 [useCaseService] No use case found with slug: "${slug}"`);
        }
        return null;
      }

      if (useCaseError) throw useCaseError;

      // Fetch related data in parallel - use Promise.allSettled to handle missing tables gracefully
      const [configurationsResult, questionsResult, applicationsResult] = await Promise.allSettled([
        this.getConfigurationsByUseCaseId(useCase.id),
        this.getCustomQuestionsByUseCaseId(useCase.id),
        this.getRecommendedApplicationsByUseCaseId(useCase.id),
      ]);

      // Transform custom_questions from database format to frontend format
      // Handle schema mismatch: TypeScript types say 'question_key' and 'select_options'
      // but migrations use 'field_name' and 'options'. Database likely has both.
      const rawQuestions = questionsResult.status === "fulfilled" ? questionsResult.value : [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transformedQuestions = rawQuestions.map((q: any) => {
        // Get field name - database may have both question_key (schema) and field_name (migrations)
        const fieldName = q.field_name || q.question_key || q.id;
        
        // Get options from select_options (schema standard) or options (migration format)
        let options = q.select_options || q.options || null;
        
        // Parse JSONB if it's a string
        if (options && typeof options === 'string') {
          try {
            options = JSON.parse(options);
          } catch {
            options = null;
          }
        }
        
        // Return raw database question with both field names for compatibility
        return {
          ...q,
          // Ensure field_name exists (use question_key if field_name doesn't exist)
          field_name: fieldName,
          // Ensure both option fields exist for compatibility
          select_options: options,
          options: options,
          // Preserve section_name if it exists
          section_name: q.section_name || null
        };
      });

      return {
        ...useCase,
        configurations:
          configurationsResult.status === "fulfilled" ? configurationsResult.value : [],
        custom_questions: transformedQuestions,
        customQuestions: transformedQuestions, // Add both formats for compatibility
        recommended_applications:
          applicationsResult.status === "fulfilled" ? applicationsResult.value : [],
      };
    } catch (error) {
      console.error("Error fetching detailed use case:", error);
      throw error;
    }
  }

  /**
   * ✅ Step 3 Industry Template Bundle (Jan 23, 2026)
   * - Pulls default configuration (or first config)
   * - Pulls equipment list and computes an equipment summary
   * - Produces a simple "load profile" snapshot for Step 3
   *
   * This avoids needing a new DB table and gives Step 3 deterministic context.
   */
  async getStep3IndustryTemplateByUseCase(
    useCase: { id: string; slug: string; name: string }
  ): Promise<Step3IndustryTemplate> {
    const template: Step3IndustryTemplate = {
      useCaseId: useCase.id,
      slug: useCase.slug,
      name: useCase.name,
      sources: [{ label: "Supabase", note: "use_cases + use_case_configurations + configuration_equipment" }],
    };

    try {
      const configs = await this.getConfigurationsByUseCaseId(useCase.id);

      const chosen =
        configs.find((c) => (c as any).is_default === true) ||
        configs[0] ||
        null;

      if (!chosen) return template;

      template.defaultConfigurationId = chosen.id;
      template.defaultConfigurationName = (chosen as any).config_name ?? null;

      const detailed = await this.getDetailedConfiguration(chosen.id);
      if (!detailed?.equipment || detailed.equipment.length === 0) return template;

      // Compute equipment summary
      let totalNameplate = 0;
      let totalTypical = 0;

      for (const row of detailed.equipment) {
        const t = row.equipment_template as any;

        // These field names are common in your templates; defensively fallback
        const nameplate = Number(t?.nameplate_power_kw ?? 0);
        const typical = Number(t?.typical_load_kw ?? t?.typical_power_kw ?? 0);

        totalNameplate += Number.isFinite(nameplate) ? nameplate : 0;
        totalTypical += Number.isFinite(typical) ? typical : 0;
      }

      template.equipmentSummary = {
        total_equipment: detailed.equipment.length,
        total_nameplate_kw: Math.round(totalNameplate * 100) / 100,
        total_typical_load_kw: Math.round(totalTypical * 100) / 100,
      };

      // "Load profile" v1 (simple heuristic)
      const diversity =
        totalNameplate > 0 ? Math.min(0.95, Math.max(0.35, totalTypical / totalNameplate)) : 0.6;

      const baseline = totalTypical || totalNameplate * 0.65;
      const peak = Math.max(baseline * 1.25, totalNameplate * 0.85);

      template.loadProfile = {
        baseline_kw: Math.round(baseline * 100) / 100,
        peak_kw: Math.round(peak * 100) / 100,
        diversity_factor: Math.round(diversity * 100) / 100,
        duty_cycle_hint: "industry-dependent",
        notes: [
          "Baseline/peak are heuristic until answers are provided.",
          "Final sizing should come from industry calculator + TrueQuote (Step 5).",
        ],
      };

      return template;
    } catch (error) {
      console.error("❌ [useCaseService] getStep3IndustryTemplateByUseCase failed:", error);
      return template; // fail-soft: do not crash Step 3
    }
  }

  /**
   * Get all use cases with full configurations (for admin UI)
   */
  async getAllUseCasesWithConfigurations(includeInactive = false): Promise<DetailedUseCase[]> {
    try {
      const query = supabase.from("use_cases").select("*").order("name");

      if (!includeInactive) {
        query.eq("is_active", true);
      }

      const { data: useCases, error } = await query;
      if (error) throw error;
      if (!useCases) return [];

      // Fetch configurations for all use cases in parallel
      const detailed = await Promise.all(
        useCases.map(async (useCase) => {
          const configurations = await this.getConfigurationsByUseCaseId(useCase.id);
          return {
            ...useCase,
            configurations,
            custom_questions: [],
            recommended_applications: [],
          } as DetailedUseCase;
        })
      );

      return detailed;
    } catch (error) {
      console.error("Error fetching all use cases with configurations:", error);
      throw error;
    }
  }

  // =============================================================================
  // CONFIGURATION MANAGEMENT
  // =============================================================================

  /**
   * Get configurations for a use case
   */
  async getConfigurationsByUseCaseId(useCaseId: string): Promise<UseCaseConfigurationRow[]> {
    try {
      const { data, error } = await supabase
        .from("use_case_configurations")
        .select("*")
        .eq("use_case_id", useCaseId)
        .order("is_default", { ascending: false })
        .order("config_name");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching configurations:", error);
      throw error;
    }
  }

  /**
   * Get detailed configuration with equipment and pricing
   */
  async getDetailedConfiguration(configurationId: string): Promise<UseCaseConfiguration | null> {
    try {
      const { data: config, error: configError } = await supabase
        .from("use_case_configurations")
        .select("*")
        .eq("id", configurationId)
        .single();

      if (configError) throw configError;
      if (!config) return null;

      // Fetch equipment and pricing scenarios
      const [equipmentResult, pricingResult] = await Promise.all([
        this.getConfigurationEquipment(configurationId),
        this.getPricingScenarios(configurationId),
      ]);

      return {
        ...config,
        equipment: equipmentResult,
        pricing_scenarios: pricingResult,
      };
    } catch (error) {
      console.error("Error fetching detailed configuration:", error);
      throw error;
    }
  }

  /**
   * Get default configuration for a use case
   */
  async getDefaultConfiguration(useCaseId: string): Promise<UseCaseConfigurationRow | null> {
    try {
      const { data, error } = await supabase
        .from("use_case_configurations")
        .select("*")
        .eq("use_case_id", useCaseId)
        .eq("is_default", true)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows found
      return data || null;
    } catch (error) {
      console.error("Error fetching default configuration:", error);
      throw error;
    }
  }

  // =============================================================================
  // EQUIPMENT MANAGEMENT
  // =============================================================================

  /**
   * Get equipment for a configuration with template details
   */
  async getConfigurationEquipment(
    configurationId: string
  ): Promise<Array<ConfigurationEquipmentRow & { equipment_template: EquipmentTemplateRow }>> {
    try {
      const { data, error } = await supabase
        .from("configuration_equipment")
        .select(
          `
          *,
          equipment_template:equipment_templates(*)
        `
        )
        .eq("configuration_id", configurationId);
        // Note: Removed .order("load_priority") - column may not exist in all deployments

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching configuration equipment:", error);
      // Return empty array instead of throwing - allows Step 3 to continue
      return [];
    }
  }

  /**
   * Get all equipment templates
   */
  async getAllEquipmentTemplates(): Promise<EquipmentTemplateRow[]> {
    try {
      const { data, error } = await supabase
        .from("equipment_templates")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching equipment templates:", error);
      throw error;
    }
  }

  /**
   * Get equipment templates by category
   */
  async getEquipmentTemplatesByCategory(category: string): Promise<EquipmentTemplateRow[]> {
    try {
      const { data, error } = await supabase
        .from("equipment_templates")
        .select("*")
        .eq("category", category)
        .eq("is_active", true)
        .order("nameplate_power_kw", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching equipment templates by category:", error);
      throw error;
    }
  }

  // =============================================================================
  // CUSTOM QUESTIONS
  // =============================================================================

  /**
   * Get custom questions for a use case
   */
  async getCustomQuestionsByUseCaseId(useCaseId: string): Promise<CustomQuestionRow[]> {
    try {
      if (!useCaseId) {
        console.warn(
          "⚠️ [useCaseService] getCustomQuestionsByUseCaseId called with empty useCaseId"
        );
        return [];
      }

      // Fetch ALL questions (including inactive) - let the frontend decide what to display
      // This ensures we don't accidentally hide questions that should be visible
      const { data, error } = await supabase
        .from("custom_questions")
        .select("*")
        .eq("use_case_id", useCaseId)
        .order("display_order", { ascending: true });

      if (error) {
        console.error("❌ [useCaseService] Supabase error fetching custom questions:", {
          useCaseId,
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }

      const allQuestions = data || [];

      // DEDUPLICATE by field_name - keep the one with lower display_order (Jan 18, 2026 fix)
      const seenFields = new Map<string, any>();
      for (const q of allQuestions) {
        const fieldName = q.field_name;
        if (!fieldName) continue;
        
        if (!seenFields.has(fieldName)) {
          seenFields.set(fieldName, q);
        } else {
          // Keep the one with lower display_order
          const existing = seenFields.get(fieldName);
          if ((q.display_order ?? 999) < (existing.display_order ?? 999)) {
            seenFields.set(fieldName, q);
          }
        }
      }
      
      // ALSO deduplicate by question_text (semantic duplicates - Jan 19, 2026 fix)
      // This catches cases like "buildingSqFt" vs "squareFeet" both asking same question
      const seenTexts = new Map<string, any>();
      for (const [fieldName, q] of seenFields.entries()) {
        const text = (q.question_text || '').toLowerCase().trim();
        if (!text) {
          seenTexts.set(fieldName, q); // Keep questions without text
          continue;
        }
        
        // Check if we've seen this text before
        let isDupe = false;
        for (const [existingField, existingQ] of seenTexts.entries()) {
          const existingText = (existingQ.question_text || '').toLowerCase().trim();
          if (existingText === text) {
            // Keep the one with lower display_order
            if ((q.display_order ?? 999) < (existingQ.display_order ?? 999)) {
              seenTexts.delete(existingField);
              seenTexts.set(fieldName, q);
            }
            isDupe = true;
            break;
          }
        }
        
        if (!isDupe) {
          seenTexts.set(fieldName, q);
        }
      }
      
      // Convert back to array and sort by display_order
      const activeQuestions = Array.from(seenTexts.values())
        .sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));

      // Log deduplication if any
      if (allQuestions.length !== activeQuestions.length && import.meta.env.DEV) {
        console.warn(`⚠️ [useCaseService] Deduplicated ${allQuestions.length - activeQuestions.length} duplicate questions for useCaseId: ${useCaseId}`);
      }

      // DEBUG: Log what we're returning
      if (import.meta.env.DEV) {
        console.log(
          `📋 [useCaseService] Fetched ${activeQuestions.length} custom questions for useCaseId: ${useCaseId}`,
          {
            count: activeQuestions.length,
            questionFields: activeQuestions.map(
              (q: any) => q.field_name || q.id || q.question_text?.substring(0, 30)
            ),
          }
        );
      }

      return activeQuestions;
    } catch (error: any) {
      // Network errors (connection lost, CORS, etc.) should be handled gracefully
      if (
        error?.message?.includes("Load failed") ||
        error?.message?.includes("network") ||
        error?.message?.includes("connection") ||
        error?.code === "NETWORK_ERROR" ||
        error?.name === "TypeError"
      ) {
        console.warn(
          "⚠️ [useCaseService] Network error fetching custom questions, returning empty array:",
          error.message
        );
        return []; // Return empty array instead of throwing
      }
      console.error("❌ [useCaseService] Error fetching custom questions:", error);
      throw error;
    }
  }

  // =============================================================================
  // PRICING SCENARIOS
  // =============================================================================

  /**
   * Get pricing scenarios for a configuration
   */
  async getPricingScenarios(configurationId: string): Promise<PricingScenarioRow[]> {
    try {
      const { data, error } = await supabase
        .from("pricing_scenarios")
        .select("*")
        .eq("configuration_id", configurationId)
        .order("scenario_name");
      // Note: Removed .order("scenario_type") - column may not exist in all deployments
      // Note: Removed .eq("is_active", true) - column may not exist in all deployments

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching pricing scenarios:", error);
      // Return empty array instead of throwing - allows Step 3 to continue
      return [];
    }
  }

  /**
   * Get pricing scenarios by location
   */
  async getPricingScenariosByLocation(
    country: string,
    stateProvince?: string
  ): Promise<PricingScenarioRow[]> {
    try {
      let query = supabase
        .from("pricing_scenarios")
        .select("*")
        .eq("country", country);
      // Note: Removed .eq("is_active", true) - column may not exist in all deployments

      if (stateProvince) {
        query = query.eq("state_province", stateProvince);
      }

      const { data, error } = await query.order("utility_name").order("rate_schedule_name");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching pricing scenarios by location:", error);
      throw error;
    }
  }

  // =============================================================================
  // RECOMMENDED APPLICATIONS
  // =============================================================================

  /**
   * Get recommended applications for a use case
   */
  async getRecommendedApplicationsByUseCaseId(
    useCaseId: string
  ): Promise<RecommendedApplicationRow[]> {
    try {
      const { data, error } = await supabase
        .from("recommended_applications")
        .select("*")
        .eq("use_case_id", useCaseId)
        .order("priority", { ascending: false })
        .order("effectiveness_rating", { ascending: false });

      if (error) {
        // Gracefully handle table not existing or RLS issues
        console.warn("⚠️ Recommended applications table not available:", error.message);
        return [];
      }
      return data || [];
    } catch (error) {
      console.warn("⚠️ Error fetching recommended applications (non-critical):", error);
      return []; // Return empty array instead of throwing
    }
  }

  // =============================================================================
  // CALCULATIONS & ANALYTICS
  // =============================================================================

  /**
   * Calculate use case configuration with user responses
   */
  async calculateConfiguration(
    useCaseId: string,
    configurationId: string,
    userResponses: Record<string, any>,
    userId?: string
  ): Promise<CalculationResponse> {
    try {
      // Get configuration and custom questions
      const [configuration, questions, pricingScenarios] = await Promise.all([
        this.getDetailedConfiguration(configurationId),
        this.getCustomQuestionsByUseCaseId(useCaseId),
        this.getPricingScenarios(configurationId),
      ]);

      if (!configuration) throw new Error("Configuration not found");

      // Apply custom question impacts to configuration
      const modifiedConfig = { ...configuration };
      let totalLoadKw = configuration.typical_load_kw;
      let totalPeakKw = configuration.peak_load_kw;

      // Process each custom question response
      for (const question of questions) {
        const response = userResponses[question.question_key];
        if (response === undefined || response === null) continue;

        switch (question.impact_type) {
          case "multiplier":
            if (question.impacts_field === "equipmentPower") {
              const multiplier =
                Number(response) * (question.impact_calculation as any)?.multiplierValue || 1;
              totalLoadKw *= multiplier;
              totalPeakKw *= multiplier;
            }
            break;

          case "additionalLoad":
            if (
              question.impact_calculation &&
              (question.impact_calculation as any).additionalLoadKw &&
              response === true
            ) {
              const additionalLoad = (question.impact_calculation as any).additionalLoadKw;
              totalLoadKw += additionalLoad;
              totalPeakKw += additionalLoad;
            }
            break;

          case "factor":
            if (question.impacts_field === "energyCostMultiplier") {
              modifiedConfig.energy_cost_multiplier *= Number(response) / 100 || 1;
            }
            break;

          case "override":
            if (question.impacts_field) {
              (modifiedConfig as any)[question.impacts_field] = response;
            }
            break;
        }
      }

      // Determine recommended system size (simple heuristic)
      const recommendedSizeMw = Math.max(0.05, (totalPeakKw * 0.7) / 1000); // 70% of peak load, min 50kW
      const preferredDurationHours = modifiedConfig.preferred_duration_hours || 2.0;

      // Select best pricing scenario (highest savings)
      const bestPricingScenario = pricingScenarios.reduce(
        (best, current) =>
          !best || (current.annual_savings || 0) > (best.annual_savings || 0) ? current : best,
        pricingScenarios[0]
      );

      // ✅ FIX: Use centralized pricing service (SSOT: $175/kWh commercial) instead of hardcoded $600/kWh
      const batteryPricing = await getBatteryPricing(recommendedSizeMw, preferredDurationHours);
      const systemCostPerKwh = batteryPricing.pricePerKWh || 175; // Fallback to DEFAULTS.BESS.costPerKWhCommercial
      const estimatedCost = recommendedSizeMw * 1000 * preferredDurationHours * systemCostPerKwh;

      // ✅ FIX: Use centralized financial calculations for consistent payback/ROI
      const financials = await calculateFinancialMetrics({
        storageSizeMW: recommendedSizeMw,
        durationHours: preferredDurationHours,
        electricityRate: 0.12, // Default rate
        location: "North America",
        equipmentCost: estimatedCost,
        installationCost: estimatedCost * 0.15,
        includeNPV: false,
      });

      // Use centralized results or fallback to scenario savings
      const projectedSavings =
        financials.annualSavings ||
        bestPricingScenario?.annual_savings ||
        estimatedCost * (modifiedConfig.typical_savings_percent / 100) * 0.4;

      // ✅ Use centralized payback/ROI instead of manual calculation
      const paybackYears = financials.paybackYears;
      const roiPercentage = financials.roi25Year;

      const result: CalculationResponse = {
        use_case_id: useCaseId,
        configuration_id: configurationId,
        user_responses: userResponses,
        calculated_load_kw: totalLoadKw,
        recommended_size_mw: recommendedSizeMw,
        estimated_cost: estimatedCost,
        projected_savings: projectedSavings,
        payback_years: Math.round(paybackYears * 100) / 100,
        roi_percentage: Math.round(roiPercentage * 100) / 100,
        selected_pricing_scenario: bestPricingScenario,
      };

      // Log analytics event
      await this.logAnalyticsEvent({
        use_case_id: useCaseId,
        configuration_id: configurationId,
        user_id: userId,
        event_type: "configured",
        answers: userResponses,
        calculated_load_kw: totalLoadKw,
        recommended_size_mw: recommendedSizeMw,
        estimated_cost: estimatedCost,
        projected_savings: projectedSavings,
        calculated_roi: roiPercentage,
      });

      return result;
    } catch (error) {
      console.error("Error calculating configuration:", error);
      throw error;
    }
  }

  /**
   * Log analytics event
   */
  async logAnalyticsEvent(eventData: Partial<UseCaseAnalyticsRow>): Promise<void> {
    try {
      const { error } = await supabase.from("use_case_analytics").insert([
        {
          ...eventData,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
    } catch (error) {
      console.error("Error logging analytics event:", error);
      // Don't throw - analytics failures shouldn't break the main flow
    }
  }

  // =============================================================================
  // SEARCH & FILTERING
  // =============================================================================

  /**
   * Search use cases by keyword
   */
  async searchUseCases(
    keyword: string,
    filters?: {
      category?: string;
      tier?: string;
      minLoad?: number;
      maxLoad?: number;
    }
  ): Promise<UseCaseWithConfiguration[]> {
    try {
      let query = supabase
        .from("use_cases")
        .select(
          `
          *,
          default_configuration:use_case_configurations!inner(*)
        `
        )
        .eq("is_active", true)
        .or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%`);

      if (filters?.category) {
        query = query.eq("category", filters.category);
      }

      if (filters?.tier) {
        query = query.eq("required_tier", filters.tier);
      }

      if (filters?.minLoad || filters?.maxLoad) {
        // Filter by configuration load ranges
        if (filters.minLoad) {
          query = query.gte("default_configuration.typical_load_kw", filters.minLoad);
        }
        if (filters.maxLoad) {
          query = query.lte("default_configuration.typical_load_kw", filters.maxLoad);
        }
      }

      const { data, error } = await query.order("usage_count", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error searching use cases:", error);
      throw error;
    }
  }

  /**
   * Get popular use cases based on usage analytics
   */
  async getPopularUseCases(limit = 10): Promise<UseCaseWithConfiguration[]> {
    try {
      const { data, error } = await supabase
        .from("use_cases")
        .select(
          `
          *,
          default_configuration:use_case_configurations!inner(*)
        `
        )
        .eq("is_active", true)
        .order("usage_count", { ascending: false })
        .order("average_roi", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching popular use cases:", error);
      throw error;
    }
  }

  // =============================================================================
  // ADMIN FUNCTIONS (for use case management)
  // =============================================================================

  /**
   * Create new use case (admin function)
   */
  async createUseCase(useCaseData: Partial<UseCaseRow>): Promise<UseCaseRow> {
    try {
      const { data, error } = await supabase
        .from("use_cases")
        .insert([useCaseData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating use case:", error);
      throw error;
    }
  }

  /**
   * Update use case (admin function)
   */
  async updateUseCase(id: string, updates: Partial<UseCaseRow>): Promise<UseCaseRow> {
    try {
      const { data, error } = await supabase
        .from("use_cases")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating use case:", error);
      throw error;
    }
  }

  /**
   * Create new configuration (admin function)
   */
  async createConfiguration(
    configData: Partial<UseCaseConfigurationRow>
  ): Promise<UseCaseConfigurationRow> {
    try {
      const { data, error } = await supabase
        .from("use_case_configurations")
        .insert([configData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating configuration:", error);
      throw error;
    }
  }

  // =============================================================================
  // STATISTICS & REPORTING
  // =============================================================================

  /**
   * Get use case statistics
   */
  async getUseCaseStatistics(): Promise<{
    total_use_cases: number;
    active_use_cases: number;
    total_configurations: number;
    total_equipment_templates: number;
    total_usage_count: number;
    average_roi: number;
    most_popular_use_case: string;
  }> {
    try {
      // This would typically be a database function or view for performance
      const [useCases, configurations, equipment] = await Promise.all([
        supabase.from("use_cases").select("id, usage_count, average_roi, name", { count: "exact" }),
        supabase.from("use_case_configurations").select("id", { count: "exact" }),
        supabase.from("equipment_templates").select("id", { count: "exact" }),
      ]);

      const activeUseCases = useCases.data?.filter((uc) => uc.usage_count > 0) || [];
      const totalUsageCount =
        useCases.data?.reduce((sum, uc) => sum + (uc.usage_count || 0), 0) || 0;
      const averageRoi =
        useCases.data && useCases.data.length > 0
          ? useCases.data.reduce((sum, uc) => sum + (uc.average_roi || 0), 0) / useCases.data.length
          : 0;
      const mostPopular =
        useCases.data && useCases.data.length > 0
          ? useCases.data.reduce(
              (max, uc) => ((uc.usage_count || 0) > (max.usage_count || 0) ? uc : max),
              useCases.data[0]
            )?.name || "Unknown"
          : "Unknown";

      return {
        total_use_cases: useCases.count || 0,
        active_use_cases: activeUseCases.length,
        total_configurations: configurations.count || 0,
        total_equipment_templates: equipment.count || 0,
        total_usage_count: totalUsageCount,
        average_roi: Math.round(averageRoi * 100) / 100,
        most_popular_use_case: mostPopular,
      };
    } catch (error) {
      console.error("Error fetching statistics:", error);
      throw error;
    }
  }

  // =============================================================================
  // PRICING CONFIGURATION METHODS (NEW)
  // =============================================================================

  /**
   * Get pricing configuration by key
   */
  async getPricingConfig(configKey: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from("pricing_configurations")
        .select("*")
        .eq("config_key", configKey)
        .eq("is_active", true)
        .single();

      if (error) {
        console.warn(`Pricing config '${configKey}' not found in database, using defaults`);
        return null;
      }

      return data?.config_data;
    } catch (error) {
      console.error("Error fetching pricing config:", error);
      return null;
    }
  }

  /**
   * Get all active pricing configurations by category
   */
  async getPricingConfigsByCategory(category: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("pricing_configurations")
        .select("*")
        .eq("config_category", category)
        .eq("is_active", true)
        .order("effective_date", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching pricing configs by category:", error);
      return [];
    }
  }

  /**
   * Get calculation formula by key
   */
  async getCalculationFormula(formulaKey: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from("calculation_formulas")
        .select("*")
        .eq("formula_key", formulaKey)
        .eq("is_active", true)
        .single();

      if (error) {
        console.warn(`Formula '${formulaKey}' not found in database`);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error fetching calculation formula:", error);
      return null;
    }
  }

  /**
   * Get all active calculation formulas by category
   */
  async getCalculationFormulas(category?: string): Promise<any[]> {
    try {
      let query = supabase.from("calculation_formulas").select("*").eq("is_active", true);

      if (category) {
        query = query.eq("formula_category", category);
      }

      const { data, error } = await query.order("formula_name", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching calculation formulas:", error);
      return [];
    }
  }

  /**
   * Get market pricing data for equipment type and region
   */
  async getMarketPricingData(equipmentType: string, region: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("market_pricing_data")
        .select("*")
        .eq("equipment_type", equipmentType)
        .eq("region", region)
        .order("data_date", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching market pricing data:", error);
      return [];
    }
  }

  /**
   * Update pricing configuration (admin only)
   */
  async updatePricingConfig(
    configKey: string,
    configData: any,
    userId: string,
    vendorNotes?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("pricing_configurations")
        .update({
          config_data: configData,
          vendor_notes: vendorNotes,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        })
        .eq("config_key", configKey);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating pricing config:", error);
      return false;
    }
  }

  /**
   * Update calculation formula (admin only)
   */
  async updateCalculationFormula(
    formulaKey: string,
    formulaData: Partial<{
      formula_expression: string;
      formula_variables: any;
      output_variables: any;
      description: string;
      references: string;
    }>,
    userId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("calculation_formulas")
        .update({
          ...formulaData,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        })
        .eq("formula_key", formulaKey);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating calculation formula:", error);
      return false;
    }
  }

  /**
   * Update use case configuration (admin only)
   * Used by the admin UI to modify baseline calculations
   * Automatically invalidates related caches
   */
  async updateUseCaseConfiguration(
    configId: string,
    updates: Partial<{
      typical_load_kw: number;
      peak_load_kw: number;
      preferred_duration_hours: number;
      is_default: boolean;
      name: string;
    }>
  ): Promise<boolean> {
    try {
      // First, get the configuration to find the related use case slug
      const { data: config, error: fetchError } = await supabase
        .from("use_case_configurations")
        .select("use_case_id")
        .eq("id", configId)
        .single();

      if (fetchError) throw fetchError;

      // Get use case slug for cache invalidation
      const { data: useCase, error: useCaseError } = await supabase
        .from("use_cases")
        .select("slug")
        .eq("id", config.use_case_id)
        .single();

      if (useCaseError) throw useCaseError;

      // Update the configuration
      const { error } = await supabase
        .from("use_case_configurations")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", configId);

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      // Invalidate related caches
      const slug = useCase.slug;
      if (import.meta.env.DEV) {
        console.log(`🔄 Invalidating caches for use case: ${slug}`);
      }

      // Clear all baseline calculations for this use case (all scales and variations)
      baselineCache.clearPattern(`baseline:${slug}:`);

      // Clear use case data cache
      useCaseCache.delete(`useCase:${slug}`);

      if (import.meta.env.DEV) {
        console.log(`✅ Updated configuration ${configId} and invalidated caches`);
      }
      return true;
    } catch (error) {
      console.error("Error updating use case configuration:", error);
      throw error;
    }
  }
}

// Create singleton instance
export const useCaseService = new UseCaseService();

// Backward compatibility helper functions
export const getUseCaseTemplates = () => useCaseService.getAllUseCases();
export const getUseCaseBySlug = (slug: string) => useCaseService.getUseCaseBySlug(slug);
export const calculateUseCaseConfiguration = (
  useCaseId: string,
  configurationId: string,
  responses: Record<string, any>,
  userId?: string
) => useCaseService.calculateConfiguration(useCaseId, configurationId, responses, userId);
