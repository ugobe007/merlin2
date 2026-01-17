// src/components/wizard/v6/advisor/advisorBudget.ts

import type { AdvisorPayload, AdvisorCard } from "./advisorTypes";
import { sanitizeText, truncate, wordCount } from "./advisorUtils";

const MAX_CARDS = 3;
const MAX_WORDS_TOTAL = 600;
const MAX_BODY_CHARS_PER_CARD = 420;
const MAX_TITLE_CHARS = 70;

const DEFAULT_ESTIMATE_DISCLAIMER =
  "⚠️ Estimate only — not TrueQuote Verified. This preview uses benchmarks and public averages. " +
  "Your TrueQuote Verified results are calculated in Step 5 after you answer facility details.";

function normalizeCard(card: AdvisorCard): AdvisorCard {
  return {
    ...card,
    title: truncate(sanitizeText(card.title || ""), MAX_TITLE_CHARS),
    body: card.body ? truncate(sanitizeText(card.body), MAX_BODY_CHARS_PER_CARD) : undefined,
  };
}

function totalWords(payload: AdvisorPayload): number {
  const parts: string[] = [];
  parts.push(payload.headline || "");
  parts.push(payload.subline || "");
  parts.push(payload.disclaimer || "");
  for (const c of payload.cards || []) {
    parts.push(c.title || "");
    parts.push(c.body || "");
    parts.push(c.badge || "");
  }
  return wordCount(parts.join(" "));
}

export function enforceAdvisorBudget(input: AdvisorPayload): { payload: AdvisorPayload; warnings: string[] } {
  const warnings: string[] = [];
  const payload: AdvisorPayload = {
    ...input,
    headline: sanitizeText(input.headline || ""),
    subline: input.subline ? sanitizeText(input.subline) : undefined,
    disclaimer: input.disclaimer ? sanitizeText(input.disclaimer) : undefined,
    cards: Array.isArray(input.cards) ? input.cards.map(normalizeCard) : [],
  };

  // 1) Card cap
  if (payload.cards.length > MAX_CARDS) {
    warnings.push(`Advisor budget: cards=${payload.cards.length} exceeds MAX_CARDS=${MAX_CARDS}. Truncating.`);
    payload.cards = payload.cards.slice(0, MAX_CARDS);
  }

  // 2) Estimate mode must include disclaimer
  if (payload.mode === "estimate") {
    if (!payload.disclaimer) {
      warnings.push("Advisor budget: estimate mode missing disclaimer. Injecting default disclaimer.");
      payload.disclaimer = DEFAULT_ESTIMATE_DISCLAIMER;
    }
  }

  // 3) Total word cap
  let words = totalWords(payload);
  if (words > MAX_WORDS_TOTAL) {
    warnings.push(`Advisor budget: totalWords=${words} exceeds MAX_WORDS_TOTAL=${MAX_WORDS_TOTAL}. Truncating bodies.`);
    // deterministic truncation: reduce each body until within cap
    payload.cards = payload.cards.map((c) => ({
      ...c,
      body: c.body ? truncate(c.body, Math.max(120, Math.floor(MAX_BODY_CHARS_PER_CARD * 0.6))) : c.body,
    }));
    payload.subline = payload.subline ? truncate(payload.subline, 120) : payload.subline;
    payload.disclaimer = payload.disclaimer ? truncate(payload.disclaimer, 220) : payload.disclaimer;
    words = totalWords(payload);
    if (words > MAX_WORDS_TOTAL) {
      warnings.push(`Advisor budget: still over cap after truncation (totalWords=${words}). Hard trimming to 2 cards.`);
      payload.cards = payload.cards.slice(0, 2);
    }
  }

  // 4) Minimal sanity checks
  if (!payload.headline) {
    warnings.push("Advisor budget: empty headline. Forcing fallback.");
    payload.headline = payload.mode === "verified" ? "✅ TrueQuote Verified" : "🔎 Estimate Preview";
  }
  if (!payload.key) {
    warnings.push("Advisor budget: missing key. Forcing fallback key.");
    payload.key = `step-${payload.step || 0}`;
  }

  return { payload, warnings };
}
