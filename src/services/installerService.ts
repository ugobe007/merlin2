/**
 * Installer Vendor Service
 * 
 * Queries the installer_vendors database to get recommended installers
 * for solar, BESS, EV charging, and generator projects by state.
 */

import { supabase } from '@/lib/supabase';

export interface RecommendedInstaller {
  rank: number;
  company_name: string;
  phone: string;
  email: string;
  website: string;
  tier: number;
  recommendation_reason: string;
}

export type InstallerType = 'solar' | 'bess' | 'ev_charging' | 'generator' | 'microgrid' | 'epc';

/**
 * Get top 3 recommended installers for a project
 * 
 * @param state - 2-letter state code (e.g., 'FL', 'CA', 'TX')
 * @param type - Installer specialty type
 * @param projectSizeKW - Project size in kilowatts
 * @returns Array of top 3 recommended installers ranked by tier, project fit, and ratings
 * 
 * @example
 * const installers = await getRecommendedInstallers('FL', 'solar', 500);
 * // Returns: [AGT, Solar Source, Compass Solar]
 */
export async function getRecommendedInstallers(
  state: string,
  type: InstallerType,
  projectSizeKW: number
): Promise<RecommendedInstaller[]> {
  const { data, error } = await supabase.rpc('get_recommended_installers', {
    p_state: state.toUpperCase(),
    p_installer_type: type,
    p_project_size_kw: projectSizeKW,
  });

  if (error) {
    console.error('Error fetching recommended installers:', error);
    throw new Error(`Failed to get installers: ${error.message}`);
  }

  return data || [];
}

/**
 * Get all installers for a state and type (not limited to top 3)
 * 
 * @param state - 2-letter state code
 * @param type - Installer specialty type
 * @param maxTier - Maximum tier to include (1, 2, or 3)
 * @returns Array of all matching installers
 */
export async function getAllInstallers(
  state: string,
  type: InstallerType,
  maxTier: number = 3
): Promise<any[]> {
  const { data, error } = await supabase.rpc('get_installers_by_state_and_type', {
    p_state: state.toUpperCase(),
    p_installer_type: type,
    p_tier_max: maxTier,
  });

  if (error) {
    console.error('Error fetching installers:', error);
    throw new Error(`Failed to get installers: ${error.message}`);
  }

  return data || [];
}
