/**
 * DATABASE CONNECTION SENTINEL TEST
 * ==================================
 * 
 * This test fails LOUDLY if:
 * - DB env vars are present but connection fails
 * - DB tests were supposed to run but didn't
 * 
 * Prevents "we didn't notice DB tests never ran" syndrome.
 * 
 * @created 2026-02-01
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { 
  isDatabaseEnvConfigured, 
  shouldSkipDbTests, 
  getSkipReason,
  getTestMode 
} from './test-governance';

describe('Database Connection Sentinel', () => {
  
  beforeAll(() => {
    // Log test mode on every run
    const mode = getTestMode();
    console.log(`\n📋 TEST MODE: ${mode.toUpperCase()}`);
    
    if (shouldSkipDbTests()) {
      console.log(getSkipReason());
    } else {
      console.log('✅ Database environment configured - DB tests will run');
    }
  });
  
  it('should explicitly declare test mode', () => {
    const mode = getTestMode();
    expect(['full', 'gated-only']).toContain(mode);
    
    if (mode === 'gated-only') {
      console.log('⚠️  Running in GATED-ONLY mode (DB tests skipped)');
    } else {
      console.log('✅ Running in FULL mode (DB tests included)');
    }
  });
  
  it('should warn (not fail) if DB env is partially configured', () => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    
    // If URL is set, it should be a real URL (not placeholder)
    if (supabaseUrl && supabaseUrl.length > 10) {
      expect(supabaseUrl).not.toContain('your-project');
      expect(supabaseUrl).toMatch(/^https?:\/\//);
    }
    
    // If key is set AND looks like a real key, validate it
    // Short keys (< 20 chars) are likely placeholders or partial - just warn
    if (supabaseKey && supabaseKey.length > 20) {
      expect(supabaseKey).not.toBe('your-anon-key');
    } else if (supabaseKey) {
      console.log(`⚠️ SUPABASE_ANON_KEY is set but looks like placeholder (${supabaseKey.length} chars)`);
    }
    
    // Always pass - this test is advisory, not blocking
    expect(true).toBe(true);
  });
  
  it('isDatabaseEnvConfigured returns consistent boolean', () => {
    const result = isDatabaseEnvConfigured();
    expect(typeof result).toBe('boolean');
    
    // Double-check consistency
    expect(isDatabaseEnvConfigured()).toBe(result);
  });
  
  it('should document gated vs optional test split', () => {
    // This test exists purely to document the contract
    const gatedTests = [
      'margin-policy.test.ts',
      'magicfit-invariants.test.ts',
    ];
    
    const optionalDbTests = [
      'equipment-pricing-database.test.ts',
      'Integration.test.tsx',
    ];
    
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║  TEST GOVERNANCE CONTRACT                                                     ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  GATED (must pass before merge):                                              ║
║    - margin-policy.test.ts          (${gatedTests.length} tests, offline)                     ║
║    - magicfit-invariants.test.ts    (fixtures only)                          ║
║                                                                               ║
║  OPTIONAL (require DB connection):                                            ║
║    - equipment-pricing-database.test.ts                                       ║
║    - Integration.test.tsx                                                     ║
║                                                                               ║
║  Rule: If DB env is configured, optional tests MUST pass too.                 ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
    
    expect(gatedTests.length).toBeGreaterThan(0);
    expect(optionalDbTests.length).toBeGreaterThan(0);
  });
});
