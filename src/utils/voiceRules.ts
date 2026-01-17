// src/utils/voiceRules.ts

/**
 * MERLIN VOICE GUIDE ENFORCEMENT
 *
 * Validates Merlin's communication against SSOT rules in MERLIN_VOICE_GUIDE.md
 *
 * Use in AdvisorPublisher or getMerlinInsight() to catch regressions before deployment.
 */

export interface VoiceValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

/**
 * Validate a Merlin insight message (Step 1-2 anticipation)
 *
 * Rules:
 * - Max 160 characters
 * - Exactly 1 sentence
 * - Must contain "Because" (capital B)
 * - Must have a comma (causality format: "Because X, Y")
 */
export function validateInsight(text: string): VoiceValidationResult {
  const warnings: string[] = [];

  // Length check
  if (text.length > 160) {
    return { valid: false, error: "Insight too long (160 char max)" };
  }

  // Causality check
  if (!text.includes("Because")) {
    return { valid: false, error: "Missing 'Because' (causality required)" };
  }

  // Comma check (causality format)
  if (!text.includes(",")) {
    warnings.push("No comma found (causality format: 'Because X, Y')");
  }

  // Sentence count
  const sentences = text.split(/[.!?]/).filter((s) => s.trim().length > 0);
  if (sentences.length > 1) {
    return { valid: false, error: "Insight must be 1 sentence" };
  }

  // Forbidden patterns
  const forbidden = [
    { pattern: /\bI think\b/i, name: "'I think'" },
    { pattern: /\bmaybe\b/i, name: "'maybe'" },
    { pattern: /\bit seems\b/i, name: "'it seems'" },
    { pattern: /\byou'll want\b/i, name: "'you'll want' (prescriptive)" },
    { pattern: /\bbuy\b/i, name: "'buy' (sales language)" },
    { pattern: /\boptimize\b/i, name: "'optimize' (buzzword)" },
    { pattern: /\bgame-changer\b/i, name: "'game-changer' (hype)" },
  ];

  for (const { pattern, name } of forbidden) {
    if (pattern.test(text)) {
      return { valid: false, error: `Forbidden pattern: ${name}` };
    }
  }

  return { valid: true, warnings: warnings.length > 0 ? warnings : undefined };
}

/**
 * Validate a Merlin trade-off warning (Step 3-4)
 *
 * Rules:
 * - Max 2 sentences
 * - Format: "If X, then risk Z. Therefore do Y."
 * - Must contain "If" and "Therefore"
 */
export function validateWarning(text: string): VoiceValidationResult {
  const warnings: string[] = [];

  // Sentence count
  const sentences = text.split(/[.!?]/).filter((s) => s.trim().length > 0);
  if (sentences.length > 2) {
    return { valid: false, error: "Warning max 2 sentences" };
  }

  // Trade-off format check
  if (!text.includes("If")) {
    warnings.push("Missing 'If' (trade-off format: 'If X, then Y')");
  }
  if (!text.includes("Therefore")) {
    warnings.push("Missing 'Therefore' (recommendation format)");
  }

  // Forbidden patterns
  const forbidden = [
    { pattern: /\bI think\b/i, name: "'I think'" },
    { pattern: /\bdon't worry\b/i, name: "'don't worry' (apologetic)" },
    { pattern: /\byou'll be fine\b/i, name: "'you'll be fine' (dismissive)" },
  ];

  for (const { pattern, name } of forbidden) {
    if (pattern.test(text)) {
      return { valid: false, error: `Forbidden pattern: ${name}` };
    }
  }

  return { valid: true, warnings: warnings.length > 0 ? warnings : undefined };
}

/**
 * Validate a Merlin headline (top of panel)
 *
 * Rules:
 * - Max 9 words
 * - Format: Action + outcome
 */
export function validateHeadline(text: string): VoiceValidationResult {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  if (words.length > 9) {
    return { valid: false, error: `Headline too long (${words.length} words, 9 max)` };
  }
  return { valid: true };
}

/**
 * Validate a Merlin subline (optional)
 *
 * Rules:
 * - Max 1 sentence
 * - Must add new info (not checked programmatically)
 */
export function validateSubline(text: string): VoiceValidationResult {
  const sentences = text.split(/[.!?]/).filter((s) => s.trim().length > 0);
  if (sentences.length > 1) {
    return { valid: false, error: "Subline must be 1 sentence" };
  }
  return { valid: true };
}

/**
 * Helper: Check if insight contains a measurable driver
 *
 * Valid drivers:
 * - rate ($/kWh)
 * - demand charge ($/kW)
 * - TOU presence
 * - operating hours
 * - weather profile
 * - backup requirement
 */
export function validateCausality(text: string): VoiceValidationResult {
  const drivers = [
    /\brate\b/i,
    /\bdemand charge/i,
    /\bTOU\b/i,
    /\boperating hours\b/i,
    /\bweather\b/i,
    /\bclimate\b/i,
    /\bbackup\b/i,
    /\bresilience\b/i,
  ];

  const hasDriver = drivers.some((pattern) => pattern.test(text));
  if (!hasDriver) {
    return {
      valid: false,
      error: "No measurable driver found (rate, demand charge, TOU, hours, weather, backup)",
    };
  }

  return { valid: true };
}

/**
 * DEV-ONLY: Full voice check with console output
 *
 * Use in development to validate insights before deployment:
 *
 * ```typescript
 * if (import.meta.env.DEV) {
 *   validateVoiceDEV('insight', getMerlinInsight());
 * }
 * ```
 */
export function validateVoiceDEV(
  type: "insight" | "warning" | "headline" | "subline",
  text: string | null
): void {
  if (!text) return;

  let result: VoiceValidationResult;

  switch (type) {
    case "insight":
      result = validateInsight(text);
      break;
    case "warning":
      result = validateWarning(text);
      break;
    case "headline":
      result = validateHeadline(text);
      break;
    case "subline":
      result = validateSubline(text);
      break;
  }

  if (!result.valid) {
    console.warn(`[Merlin Voice] ${type} failed:`, result.error);
  } else if (result.warnings) {
    console.warn(`[Merlin Voice] ${type} warnings:`, result.warnings);
  }

  // Additional causality check for insights
  if (type === "insight") {
    const causalityResult = validateCausality(text);
    if (!causalityResult.valid) {
      console.warn(`[Merlin Voice] insight causality:`, causalityResult.error);
    }
  }
}
