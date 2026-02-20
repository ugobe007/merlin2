/**
 * COMPARISON MODE SERVICE
 * Database operations for saving and comparing scenarios
 */

import { supabase } from "@/services/supabaseClient";
import type { SavedScenario, ComparisonSet, ComparisonMetrics } from "./types";

// Generate client-side session ID for anonymous users
function getOrCreateSessionId(): string {
  let sessionId = localStorage.getItem("merlin_comparison_session");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("merlin_comparison_session", sessionId);
  }
  return sessionId;
}

/**
 * Save a new scenario for comparison
 */
export async function saveScenario(
  scenarioName: string,
  wizardState: Record<string, unknown>,
  quoteResult: Record<string, unknown>,
  options?: {
    isBaseline?: boolean;
    tags?: string[];
    notes?: string;
  }
): Promise<SavedScenario | null> {
  const sessionId = getOrCreateSessionId();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Extract key metrics for quick comparison
  const peakKw = quoteResult?.powerProfile?.peakKw || 0;
  const kwhCapacity = wizardState?.batteryKW
    ? (wizardState.batteryKW * wizardState.durationHours) / 1000
    : 0;
  const totalCost = quoteResult?.costs?.totalCost || 0;
  const annualSavings = quoteResult?.financials?.annualSavings || 0;
  const paybackYears = quoteResult?.financials?.paybackYears || 0;

  const { data, error } = await supabase
    .from("saved_scenarios")
    .insert({
      user_id: user?.id || null,
      session_id: sessionId,
      scenario_name: scenarioName,
      scenario_data: wizardState,
      quote_result: quoteResult,
      is_baseline: options?.isBaseline || false,
      tags: options?.tags || [],
      notes: options?.notes || "",
      peak_kw: peakKw,
      kwh_capacity: kwhCapacity,
      total_cost: totalCost,
      annual_savings: annualSavings,
      payback_years: paybackYears,
    })
    .select()
    .single();

  if (error) {
    console.error("Error saving scenario:", error);
    return null;
  }

  return data;
}

/**
 * Get all scenarios for current user/session
 */
export async function getUserScenarios(): Promise<SavedScenario[]> {
  const sessionId = getOrCreateSessionId();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("saved_scenarios")
    .select("*")
    .or(`session_id.eq.${sessionId},user_id.eq.${user?.id || "null"}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching scenarios:", error);
    return [];
  }

  return data || [];
}

/**
 * Get comparison metrics for multiple scenarios
 */
export async function getScenarioComparison(scenarioIds: string[]): Promise<ComparisonMetrics[]> {
  const { data, error } = await supabase.rpc("get_scenario_comparison", {
    scenario_ids: scenarioIds,
  });

  if (error) {
    console.error("Error fetching comparison:", error);
    return [];
  }

  return data || [];
}

/**
 * Update scenario details (name, tags, notes)
 */
export async function updateScenario(
  scenarioId: string,
  updates: {
    scenarioName?: string;
    tags?: string[];
    notes?: string;
    isBaseline?: boolean;
  }
): Promise<boolean> {
  const { error } = await supabase
    .from("saved_scenarios")
    .update({
      scenario_name: updates.scenarioName,
      tags: updates.tags,
      notes: updates.notes,
      is_baseline: updates.isBaseline,
      updated_at: new Date().toISOString(),
    })
    .eq("id", scenarioId);

  if (error) {
    console.error("Error updating scenario:", error);
    return false;
  }

  return true;
}

/**
 * Delete a scenario
 */
export async function deleteScenario(scenarioId: string): Promise<boolean> {
  const { error } = await supabase.from("saved_scenarios").delete().eq("id", scenarioId);

  if (error) {
    console.error("Error deleting scenario:", error);
    return false;
  }

  return true;
}

/**
 * Create a comparison set
 */
export async function createComparisonSet(
  setName: string,
  scenarioIds: string[]
): Promise<ComparisonSet | null> {
  const sessionId = getOrCreateSessionId();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("comparison_sets")
    .insert({
      user_id: user?.id || null,
      session_id: sessionId,
      set_name: setName,
      scenario_ids: scenarioIds,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating comparison set:", error);
    return null;
  }

  return data;
}

/**
 * Get all comparison sets for user
 */
export async function getUserComparisonSets(): Promise<ComparisonSet[]> {
  const sessionId = getOrCreateSessionId();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("comparison_sets")
    .select("*")
    .or(`session_id.eq.${sessionId},user_id.eq.${user?.id || "null"}`)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching comparison sets:", error);
    return [];
  }

  return data || [];
}
