/**
 * Mock Pricing Control (V7 Test Infrastructure)
 * ==============================================
 * 
 * Enables deterministic smoke tests by controlling pricing behavior.
 * 
 * USAGE:
 * - Query param: ?mockPricing=fail|slow|slow_timeout|ok
 * - localStorage: localStorage.setItem("V7_MOCK_PRICING", "fail")
 * 
 * MODES:
 * - "ok" (default): Normal pricing behavior
 * - "fail": Force pricing to error immediately
 * - "slow": Delay pricing 3s (test race conditions)
 * - "slow_timeout": Delay pricing 20s (force timeout)
 * 
 * SAFETY:
 * - Only active in DEV/test mode (import.meta.env.DEV)
 * - No-op in production builds
 */

export type MockPricingMode = "ok" | "fail" | "slow" | "slow_timeout";

/**
 * Get the current mock pricing mode from URL or localStorage.
 * Returns "ok" if no mock is active or in production.
 */
export function getMockPricingMode(): MockPricingMode {
  // Safety: disabled in production
  if (typeof window === "undefined") return "ok";
  if (!import.meta.env.DEV) return "ok";

  // 1. Check query param (highest priority)
  try {
    const params = new URLSearchParams(window.location.search);
    const qp = params.get("mockPricing");
    if (qp && isValidMode(qp)) {
      return qp as MockPricingMode;
    }
  } catch {
    // SSR or URL parse failure - ignore
  }

  // 2. Check localStorage (fallback)
  try {
    const ls = localStorage.getItem("V7_MOCK_PRICING");
    if (ls && isValidMode(ls)) {
      return ls as MockPricingMode;
    }
  } catch {
    // localStorage unavailable - ignore
  }

  return "ok";
}

function isValidMode(mode: string): mode is MockPricingMode {
  return ["ok", "fail", "slow", "slow_timeout"].includes(mode);
}

/**
 * Delay helper for mock modes.
 * @param ms - Milliseconds to delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Apply mock pricing behavior.
 * Call this at the start of runPricingQuote() or runPricingSafe().
 * 
 * @returns { shouldFail, delayMs } - Instructions for the calling function
 */
export function getMockBehavior(): { shouldFail: boolean; delayMs: number; mode: MockPricingMode } {
  const mode = getMockPricingMode();

  switch (mode) {
    case "fail":
      return { shouldFail: true, delayMs: 100, mode }; // Fail fast with tiny delay
    case "slow":
      return { shouldFail: false, delayMs: 3000, mode }; // 3s delay (test race conditions)
    case "slow_timeout":
      return { shouldFail: false, delayMs: 20000, mode }; // 20s delay (force timeout)
    case "ok":
    default:
      return { shouldFail: false, delayMs: 0, mode };
  }
}

/**
 * Log mock mode if active (for debugging smoke tests)
 */
export function logMockMode(): void {
  if (!import.meta.env.DEV) return;
  
  const mode = getMockPricingMode();
  if (mode !== "ok") {
    console.log(`🧪 [V7 Mock] Pricing mode: ${mode}`);
  }
}
