/**
 * Supabase Client Configuration
 * Project: dleickerygxdtodfxdmm
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dleickerygxdtodfxdmm.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
  console.warn('⚠️ Supabase anon key not configured. Please add VITE_SUPABASE_ANON_KEY to .env file');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Database Tables Schema:
 * 
 * 1. projects - Store BESS project quotes
 * 2. financial_models - Store advanced financial analysis
 * 3. battery_degradation - Track battery performance over time
 * 4. revenue_streams - Multiple revenue sources (RECs, capacity, arbitrage)
 * 5. scenarios - Scenario analysis results
 */

// Type definitions for our database tables
export interface Project {
  id: string;
  user_id: string;
  project_name: string;
  power_mw: number;
  duration_hours: number;
  location: string;
  created_at: string;
  updated_at: string;
  bess_capex: number;
  grand_capex: number;
  annual_savings: number;
  simple_roi_years: number;
}

export interface FinancialModel {
  id: string;
  project_id: string;
  // Advanced metrics
  levered_irr: number;
  unlevered_irr: number;
  dscr: number; // Debt Service Coverage Ratio
  npv: number;
  payback_period: number;
  // 40-year forecast
  forecast_years: number;
  monthly_forecast: any; // JSON array of monthly data
  created_at: string;
}

export interface BatteryDegradation {
  id: string;
  project_id: string;
  method: 'linear' | 'exponential' | 'calendar' | 'cycle' | 'temp_adjusted' | 'hybrid' | 'warranty' | 'measured';
  year: number;
  capacity_remaining: number; // Percentage
  efc_count: number; // Equivalent Full Cycles
  soh: number; // State of Health percentage
  created_at: string;
}

export interface RevenueStream {
  id: string;
  project_id: string;
  type: 'peak_shaving' | 'arbitrage' | 'rec' | 'reserve_capacity' | 'demand_charge' | 'frequency_regulation';
  annual_revenue: number;
  monthly_breakdown: any; // JSON array
  confidence_level: 'low' | 'medium' | 'high';
  created_at: string;
}

export interface Scenario {
  id: string;
  project_id: string;
  name: string;
  type: 'best' | 'base' | 'worst' | 'custom';
  // Sensitivities
  battery_cost_variation: number; // percentage
  electricity_price_variation: number; // percentage
  degradation_rate_variation: number; // percentage
  result_npv: number;
  result_irr: number;
  created_at: string;
}

// Helper functions for database operations
export const projectService = {
  async createProject(data: Omit<Project, 'id' | 'created_at' | 'updated_at'>) {
    const { data: project, error } = await supabase
      .from('projects')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return project;
  },

  async getProjects(userId: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async updateProject(id: string, updates: Partial<Project>) {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteProject(id: string) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

export const financialModelService = {
  async saveModel(data: Omit<FinancialModel, 'id' | 'created_at'>) {
    const { data: model, error } = await supabase
      .from('financial_models')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return model;
  },

  async getModel(projectId: string) {
    const { data, error } = await supabase
      .from('financial_models')
      .select('*')
      .eq('project_id', projectId)
      .single();
    
    if (error) throw error;
    return data;
  }
};

export const batteryService = {
  async saveDegradationData(data: Omit<BatteryDegradation, 'id' | 'created_at'>[]) {
    const { data: records, error } = await supabase
      .from('battery_degradation')
      .insert(data)
      .select();
    
    if (error) throw error;
    return records;
  },

  async getDegradationData(projectId: string) {
    const { data, error } = await supabase
      .from('battery_degradation')
      .select('*')
      .eq('project_id', projectId)
      .order('year', { ascending: true });
    
    if (error) throw error;
    return data;
  }
};

export const revenueService = {
  async saveRevenueStreams(data: Omit<RevenueStream, 'id' | 'created_at'>[]) {
    const { data: streams, error } = await supabase
      .from('revenue_streams')
      .insert(data)
      .select();
    
    if (error) throw error;
    return streams;
  },

  async getRevenueStreams(projectId: string) {
    const { data, error } = await supabase
      .from('revenue_streams')
      .select('*')
      .eq('project_id', projectId);
    
    if (error) throw error;
    return data;
  }
};

export const scenarioService = {
  async saveScenarios(data: Omit<Scenario, 'id' | 'created_at'>[]) {
    const { data: scenarios, error } = await supabase
      .from('scenarios')
      .insert(data)
      .select();
    
    if (error) throw error;
    return scenarios;
  },

  async getScenarios(projectId: string) {
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('project_id', projectId)
      .order('type', { ascending: true });
    
    if (error) throw error;
    return data;
  }
};
