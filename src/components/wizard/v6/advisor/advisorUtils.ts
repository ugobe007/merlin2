// src/components/wizard/v6/advisor/advisorUtils.ts

export function sanitizeText(text: string): string {
  return (text || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function wordCount(text: string): number {
  const t = sanitizeText(text);
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

export function truncate(text: string, maxChars: number): string {
  const t = sanitizeText(text);
  if (t.length <= maxChars) return t;
  return t.slice(0, Math.max(0, maxChars - 1)).trimEnd() + "…";
}

export function stableKey(step: number): string {
  return `step-${step}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
