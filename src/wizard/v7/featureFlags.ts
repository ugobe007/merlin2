/**
 * Wizard V7 Feature Flags
 * ========================
 * 
 * Created: February 1, 2026
 * 
 * These flags control the rollout of new V7 features.
 * Set via environment variables or localStorage for testing.
 */

/**
 * Enable the 4-part gated Step 3 questionnaire (Step3GatedV7)
 * 
 * When TRUE: Uses Step3GatedV7 with 4-part navigation, gating, and SSOT-compliant provenance
 * When FALSE: Uses Step3ProfileV7 (single-page list, now SSOT-compliant as of Feb 1, 2026)
 * 
 * To enable in dev:
 * - Set VITE_V7_ENABLE_GATED_STEP3=true in .env
 * - Or run: localStorage.setItem('V7_ENABLE_GATED_STEP3', 'true')
 */
export const V7_ENABLE_GATED_STEP3 = (() => {
  // Check environment variable first
  if (import.meta.env.VITE_V7_ENABLE_GATED_STEP3 === 'true') {
    return true;
  }
  
  // Check localStorage (dev override)
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem('V7_ENABLE_GATED_STEP3');
    if (override === 'true') {
      console.log('[V7 Flags] Step3GatedV7 enabled via localStorage');
      return true;
    }
  }
  
  // Default: use Step3ProfileV7 (production safe)
  return false;
})();

/**
 * Use curated schema resolver for Step 3 (Step3ProfileV7Curated)
 * 
 * When TRUE: Uses Step3ProfileV7Curated with curated field definitions
 * When FALSE: Uses Step3ProfileV7 (template-based questions)
 * 
 * NOTE: This flag is ignored when V7_ENABLE_GATED_STEP3 is true.
 * Priority: Gated > Curated > Basic
 * 
 * To enable in dev:
 * - Set VITE_V7_USE_CURATED_STEP3=true in .env
 * - Or run: localStorage.setItem('V7_USE_CURATED_STEP3', 'true')
 */
export const V7_USE_CURATED_STEP3 = (() => {
  // Check environment variable first
  if (import.meta.env.VITE_V7_USE_CURATED_STEP3 === 'true') {
    return true;
  }
  
  // Check localStorage (dev override)
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem('V7_USE_CURATED_STEP3');
    if (override === 'true') {
      console.log('[V7 Flags] Step3ProfileV7Curated enabled via localStorage');
      return true;
    }
    // Also check for explicit false
    if (override === 'false') {
      return false;
    }
  }
  
  // Default: use curated Step 3 (Feb 2, 2026 - restoring magic)
  return true;
})();

/**
 * Helper to check flag status and log
 */
export function logFeatureFlags(): void {
  console.log('[V7 Feature Flags]', {
    V7_ENABLE_GATED_STEP3,
    V7_USE_CURATED_STEP3,
    gatedSource: import.meta.env.VITE_V7_ENABLE_GATED_STEP3 === 'true' 
      ? 'env' 
      : localStorage.getItem('V7_ENABLE_GATED_STEP3') === 'true'
        ? 'localStorage'
        : 'default',
    curatedSource: import.meta.env.VITE_V7_USE_CURATED_STEP3 === 'true'
      ? 'env'
      : localStorage.getItem('V7_USE_CURATED_STEP3') === 'true'
        ? 'localStorage'
        : 'default',
  });
}
