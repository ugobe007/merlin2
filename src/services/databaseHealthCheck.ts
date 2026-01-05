/**
 * Database Health Check Service
 * ==============================
 * Monitors database connectivity and SSOT status
 */

import { supabase } from './supabaseClient';

export interface DatabaseHealthStatus {
  connected: boolean;
  tables: {
    calculation_constants: { exists: boolean; rowCount: number };
    industry_configs: { exists: boolean; rowCount: number };
    market_pricing: { exists: boolean; rowCount: number };
  };
  lastChecked: string;
  error?: string;
}

export async function checkDatabaseHealth(): Promise<DatabaseHealthStatus> {
  const status: DatabaseHealthStatus = {
    connected: false,
    tables: {
      calculation_constants: { exists: false, rowCount: 0 },
      industry_configs: { exists: false, rowCount: 0 },
      market_pricing: { exists: false, rowCount: 0 },
    },
    lastChecked: new Date().toISOString(),
  };

  try {
    // Check calculation_constants
    const { data: constants, error: constError } = await supabase
      .from('calculation_constants')
      .select('key', { count: 'exact' });
    
    if (!constError) {
      status.tables.calculation_constants.exists = true;
      status.tables.calculation_constants.rowCount = constants?.length || 0;
      status.connected = true;
    }

    // Check industry_configs (if exists)
    const { data: industries, error: indError } = await supabase
      .from('industry_configs')
      .select('industry', { count: 'exact' });
    
    if (!indError) {
      status.tables.industry_configs.exists = true;
      status.tables.industry_configs.rowCount = industries?.length || 0;
    }

    // Check market_pricing (if exists)  
    const { data: pricing, error: priceError } = await supabase
      .from('market_pricing')
      .select('id', { count: 'exact' });
    
    if (!priceError) {
      status.tables.market_pricing.exists = true;
      status.tables.market_pricing.rowCount = pricing?.length || 0;
    }

  } catch (err) {
    status.error = err instanceof Error ? err.message : 'Unknown error';
  }

  return status;
}

/**
 * Get all rows from calculation_constants table
 */
export async function getCalculationConstantsRaw(): Promise<any[]> {
  const { data, error } = await supabase
    .from('calculation_constants')
    .select('*')
    .order('category');
  
  if (error) {
    console.error('Failed to fetch calculation_constants:', error);
    return [];
  }
  
  return data || [];
}
