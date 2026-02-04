/**
 * ============================================================
 * Step 3 Finite State Machine - State & Event Types
 * ============================================================
 * 
 * This module defines the formal state machine for Step 3 (Profile).
 * 
 * The FSM eliminates implicit state transitions that cause bugs like:
 * - "template loaded but not persisted"
 * - "defaults applied twice"
 * - "part index resets unexpectedly"
 * - "metrics computed from stale template"
 * 
 * States follow a strict progression:
 *   idle → loading_template → template_ready → applying_defaults(partId) 
 *       → part_active(partId) → validating_part(partId) → part_complete(partId)
 *       → [repeat for each part] → generating_quote → done
 * 
 * Guards prevent illegal transitions.
 */

// ============================================================
// State Types
// ============================================================

/** 
 * Step 3 FSM states
 * 
 * Progression: idle → loading_template → template_ready → parts loop → generating_quote → done
 */
export type Step3State =
  | { state: "idle" }
  | { state: "loading_template"; selectedIndustry: string }
  | { state: "template_ready"; templateId: string; effectiveIndustry: string }
  | { state: "applying_defaults"; templateId: string; partIndex: number }
  | { state: "part_active"; templateId: string; partIndex: number }
  | { state: "validating_part"; templateId: string; partIndex: number }
  | { state: "part_complete"; templateId: string; partIndex: number }
  | { state: "generating_quote"; templateId: string }
  | { state: "done"; templateId: string; quoteId?: string }
  | { state: "error"; code: string; message: string; recoverable: boolean };

/** Get the state name for logging */
export function getStateName(s: Step3State): string {
  if ("partIndex" in s) {
    return `${s.state}(part=${s.partIndex})`;
  }
  return s.state;
}

// ============================================================
// Event Types
// ============================================================

/**
 * Step 3 FSM events
 * 
 * Events trigger state transitions. Guards may prevent invalid transitions.
 */
export type Step3Event =
  | { type: "TEMPLATE_REQUESTED"; selectedIndustry: string }
  | { type: "TEMPLATE_LOADED"; templateId: string; effectiveIndustry: string; questionCount: number }
  | { type: "TEMPLATE_LOAD_FAILED"; code: string; message: string }
  | { type: "DEFAULTS_APPLY_START"; partIndex: number }
  | { type: "DEFAULTS_APPLIED"; partIndex: number }
  | { type: "ANSWER_CHANGED"; questionId: string; value: unknown }
  | { type: "NEXT_PART_REQUESTED" }
  | { type: "PREV_PART_REQUESTED" }
  | { type: "PART_VALIDATED"; partIndex: number; valid: boolean; missingFields: string[] }
  | { type: "QUOTE_REQUESTED" }
  | { type: "QUOTE_GENERATED"; quoteId: string }
  | { type: "QUOTE_FAILED"; code: string; message: string }
  | { type: "RESET" };

// ============================================================
// Context (extended state)
// ============================================================

/**
 * Extended context for the FSM (data that travels with state)
 */
export type Step3Context = {
  /** Session ID for audit trail */
  sessionId: string;
  
  /** Total number of parts (derived from template) */
  totalParts: number;
  
  /** Which parts have had defaults applied (prevents double-apply) */
  defaultsAppliedParts: Set<number>;
  
  /** Which parts are complete */
  completedParts: Set<number>;
  
  /** Current answers (keyed by question ID) */
  answers: Record<string, unknown>;
  
  /** Answer provenance tracking */
  answersMeta: Record<string, {
    source: "template_default" | "user" | "locationIntel" | "business_detection";
    at: string;
  }>;
  
  /** Validation errors by part */
  validationErrors: Record<number, string[]>;
  
  /** Timestamp tracking */
  timestamps: {
    templateLoadedAt?: string;
    lastAnswerAt?: string;
    quoteGeneratedAt?: string;
  };
};

/**
 * Create initial context for a new session
 */
export function createInitialContext(sessionId: string): Step3Context {
  return {
    sessionId,
    totalParts: 0,
    defaultsAppliedParts: new Set(),
    completedParts: new Set(),
    answers: {},
    answersMeta: {},
    validationErrors: {},
    timestamps: {},
  };
}

// ============================================================
// Guards
// ============================================================

/**
 * Guard functions that determine if a transition is allowed
 */
export const guards = {
  /** Can only request next part if current part is complete */
  canGoNextPart: (ctx: Step3Context, currentPart: number): boolean => {
    return ctx.completedParts.has(currentPart);
  },

  /** Can only request quote if all parts are complete */
  canRequestQuote: (ctx: Step3Context): boolean => {
    if (ctx.totalParts === 0) return false;
    for (let i = 0; i < ctx.totalParts; i++) {
      if (!ctx.completedParts.has(i)) return false;
    }
    return true;
  },

  /** Defaults can only apply once per (templateId, partIndex) unless reset */
  canApplyDefaults: (ctx: Step3Context, partIndex: number): boolean => {
    return !ctx.defaultsAppliedParts.has(partIndex);
  },

  /** Can go back if not on first part */
  canGoPrevPart: (_ctx: Step3Context, currentPart: number): boolean => {
    return currentPart > 0;
  },
};

// ============================================================
// Transition function
// ============================================================

/**
 * FSM transition function
 * 
 * Given current state + event, returns next state (or same state if invalid transition)
 */
export function transition(
  current: Step3State,
  event: Step3Event,
  ctx: Step3Context
): { state: Step3State; ctx: Step3Context; sideEffects: SideEffect[] } {
  const effects: SideEffect[] = [];
  let nextState: Step3State = current;
  let nextCtx = { ...ctx };

  switch (event.type) {
    // ------------------------------------------------------------
    // Template loading
    // ------------------------------------------------------------
    case "TEMPLATE_REQUESTED": {
      if (current.state === "idle" || current.state === "error") {
        nextState = { state: "loading_template", selectedIndustry: event.selectedIndustry };
        effects.push({ type: "LOAD_TEMPLATE", industry: event.selectedIndustry });
      }
      break;
    }

    case "TEMPLATE_LOADED": {
      if (current.state === "loading_template") {
        nextState = {
          state: "template_ready",
          templateId: event.templateId,
          effectiveIndustry: event.effectiveIndustry,
        };
        nextCtx.timestamps.templateLoadedAt = new Date().toISOString();
        // Derive totalParts (will be set by caller based on template.parts or deriveParts)
        effects.push({ type: "VALIDATE_TEMPLATE", templateId: event.templateId });
      }
      break;
    }

    case "TEMPLATE_LOAD_FAILED": {
      nextState = {
        state: "error",
        code: event.code,
        message: event.message,
        recoverable: true,
      };
      break;
    }

    // ------------------------------------------------------------
    // Defaults application
    // ------------------------------------------------------------
    case "DEFAULTS_APPLY_START": {
      if (
        (current.state === "template_ready" || current.state === "part_complete") &&
        guards.canApplyDefaults(ctx, event.partIndex)
      ) {
        const templateId = "templateId" in current ? current.templateId : "";
        nextState = { state: "applying_defaults", templateId, partIndex: event.partIndex };
        effects.push({ type: "COMPUTE_DEFAULTS", partIndex: event.partIndex });
      }
      break;
    }

    case "DEFAULTS_APPLIED": {
      if (current.state === "applying_defaults" && current.partIndex === event.partIndex) {
        nextCtx.defaultsAppliedParts = new Set([...ctx.defaultsAppliedParts, event.partIndex]);
        nextState = { state: "part_active", templateId: current.templateId, partIndex: event.partIndex };
      }
      break;
    }

    // ------------------------------------------------------------
    // Answer changes
    // ------------------------------------------------------------
    case "ANSWER_CHANGED": {
      if (current.state === "part_active") {
        nextCtx.answers = { ...ctx.answers, [event.questionId]: event.value };
        nextCtx.answersMeta = {
          ...ctx.answersMeta,
          [event.questionId]: { source: "user", at: new Date().toISOString() },
        };
        nextCtx.timestamps.lastAnswerAt = new Date().toISOString();
        effects.push({ type: "PERSIST_ANSWERS" });
      }
      break;
    }

    // ------------------------------------------------------------
    // Part navigation
    // ------------------------------------------------------------
    case "NEXT_PART_REQUESTED": {
      if (current.state === "part_active" && "partIndex" in current) {
        // First validate current part
        nextState = { state: "validating_part", templateId: current.templateId, partIndex: current.partIndex };
        effects.push({ type: "VALIDATE_PART", partIndex: current.partIndex });
      }
      break;
    }

    case "PART_VALIDATED": {
      if (current.state === "validating_part" && current.partIndex === event.partIndex) {
        if (event.valid) {
          nextCtx.completedParts = new Set([...ctx.completedParts, event.partIndex]);
          nextState = { state: "part_complete", templateId: current.templateId, partIndex: event.partIndex };
          
          // Auto-advance to next part or stay for quote
          const nextPartIndex = event.partIndex + 1;
          if (nextPartIndex < ctx.totalParts) {
            effects.push({ type: "ADVANCE_TO_PART", partIndex: nextPartIndex });
          }
        } else {
          // Return to active with errors
          nextCtx.validationErrors = { ...ctx.validationErrors, [event.partIndex]: event.missingFields };
          nextState = { state: "part_active", templateId: current.templateId, partIndex: event.partIndex };
        }
      }
      break;
    }

    case "PREV_PART_REQUESTED": {
      if (current.state === "part_active" && "partIndex" in current && guards.canGoPrevPart(ctx, current.partIndex)) {
        const prevPart = current.partIndex - 1;
        nextState = { state: "part_active", templateId: current.templateId, partIndex: prevPart };
      }
      break;
    }

    // ------------------------------------------------------------
    // Quote generation
    // ------------------------------------------------------------
    case "QUOTE_REQUESTED": {
      if (
        (current.state === "part_complete" || current.state === "part_active") &&
        "templateId" in current &&
        guards.canRequestQuote(ctx)
      ) {
        nextState = { state: "generating_quote", templateId: current.templateId };
        effects.push({ type: "GENERATE_QUOTE" });
      }
      break;
    }

    case "QUOTE_GENERATED": {
      if (current.state === "generating_quote") {
        nextCtx.timestamps.quoteGeneratedAt = new Date().toISOString();
        nextState = { state: "done", templateId: current.templateId, quoteId: event.quoteId };
      }
      break;
    }

    case "QUOTE_FAILED": {
      if (current.state === "generating_quote") {
        nextState = { state: "error", code: event.code, message: event.message, recoverable: true };
      }
      break;
    }

    // ------------------------------------------------------------
    // Reset
    // ------------------------------------------------------------
    case "RESET": {
      nextState = { state: "idle" };
      nextCtx = createInitialContext(ctx.sessionId);
      break;
    }
  }

  return { state: nextState, ctx: nextCtx, sideEffects: effects };
}

// ============================================================
// Side Effects
// ============================================================

/**
 * Side effects that should be executed after a transition
 */
export type SideEffect =
  | { type: "LOAD_TEMPLATE"; industry: string }
  | { type: "VALIDATE_TEMPLATE"; templateId: string }
  | { type: "COMPUTE_DEFAULTS"; partIndex: number }
  | { type: "PERSIST_ANSWERS" }
  | { type: "VALIDATE_PART"; partIndex: number }
  | { type: "ADVANCE_TO_PART"; partIndex: number }
  | { type: "GENERATE_QUOTE" }
  | { type: "RECOMPUTE_METRICS" };

// ============================================================
// Debug helpers
// ============================================================

/**
 * Log a state transition for debugging
 */
export function logTransition(
  from: Step3State,
  event: Step3Event,
  to: Step3State,
  effects: SideEffect[]
): void {
  if (import.meta.env.DEV) {
    console.log(
      `[Step3 FSM] ${getStateName(from)} + ${event.type} → ${getStateName(to)}`,
      effects.length > 0 ? `[effects: ${effects.map(e => e.type).join(", ")}]` : ""
    );
  }
}
