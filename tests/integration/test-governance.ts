/**
 * TEST GOVERNANCE
 * ===============
 * 
 * Splits tests into gated (must pass) vs optional (DB-dependent).
 * Prevents "we didn't notice DB tests never ran" syndrome.
 * 
 * @created 2026-02-01
 */

// ============================================================================
// GATED TESTS (must pass in CI / before merge)
// These run offline with fixtures, no external dependencies
// ============================================================================
export const GATED_TESTS = [
  'tests/integration/margin-policy.test.ts',
  'tests/integration/magicfit-invariants.test.ts',
] as const;

// ============================================================================
// OPTIONAL TESTS (allowed to fail locally unless env present)
// These require database connection
// ============================================================================
export const OPTIONAL_DB_TESTS = [
  'tests/integration/equipment-pricing-database.test.ts',
  'tests/Integration.test.tsx',
] as const;

// ============================================================================
// ENVIRONMENT DETECTION
// ============================================================================

/**
 * Check if database environment is configured
 */
export function isDatabaseEnvConfigured(): boolean {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  
  // Both must be present and not placeholder values
  return Boolean(
    supabaseUrl && 
    supabaseKey && 
    !supabaseUrl.includes('your-project') &&
    supabaseKey.length > 20
  );
}

/**
 * Get test run mode based on environment
 */
export function getTestMode(): 'full' | 'gated-only' {
  return isDatabaseEnvConfigured() ? 'full' : 'gated-only';
}

/**
 * Should DB tests be skipped?
 */
export function shouldSkipDbTests(): boolean {
  return !isDatabaseEnvConfigured();
}

/**
 * Get skip reason message
 */
export function getSkipReason(): string {
  return `
╔══════════════════════════════════════════════════════════════════════════════╗
║  DATABASE TESTS SKIPPED                                                       ║
║                                                                               ║
║  Reason: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not configured          ║
║                                                                               ║
║  To run DB tests locally:                                                     ║
║    1. Copy .env.example to .env                                               ║
║    2. Add your Supabase credentials                                           ║
║    3. Re-run tests                                                            ║
║                                                                               ║
║  In CI: Ensure SUPABASE_URL and SUPABASE_ANON_KEY secrets are set            ║
╚══════════════════════════════════════════════════════════════════════════════╝
`;
}

// ============================================================================
// COMMAND GENERATORS
// ============================================================================

/**
 * Get command for gated tests only (CI-safe)
 */
export function getGatedTestCommand(): string {
  return `npx vitest run ${GATED_TESTS.join(' ')}`;
}

/**
 * Get command for all tests (requires DB)
 */
export function getFullTestCommand(): string {
  return `npx vitest run tests/integration`;
}
