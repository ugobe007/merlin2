/**
 * Merlin V7 Expression Layer
 * ===========================
 * 
 * Created: January 31, 2026
 * 
 * DOCTRINE (from LIFEFORM_EXPRESSION_CONTRACT.md):
 * 
 * "lifeSignals is the ONLY interface between state and UI expression.
 *  If a designer wants something expressive, the answer is:
 *  'Show me which lifeSignal justifies it.'
 *  If no signal justifies it, it doesn't ship."
 * 
 * These components consume lifeSignals and return visual properties.
 * They do NOT:
 * - Read raw state
 * - Invent feelings
 * - Editorialize
 * - Add personality
 * 
 * They DO:
 * - Reflect internal truth
 * - Express through posture (weight, opacity, spacing)
 * - Enable attribution (where did this come from?)
 * - Stay silent when uncertain
 */

export * from "./types";
export * from "./hooks";
export * from "./components";
