/**
 * LAZY EXPORT UTILITIES
 * ======================
 * 
 * Wrapper around quoteExportUtils to lazy-load heavy dependencies:
 * - docx package (~300-400KB)
 * - xlsx package (~429KB) - already lazy in quoteExportUtils
 * - PDF generation utilities
 * 
 * **Bundle Impact:** ~300-500KB savings by deferring export utilities
 * until user clicks "Export PDF/Word/Excel"
 * 
 * Usage:
 * ```tsx
 * import { lazyExportQuoteAsPDF } from './utils/lazyExportUtils';
 * 
 * // Instead of direct import:
 * // import { exportQuoteAsPDF } from '@/utils/quoteExportUtils';
 * 
 * const handleExportPDF = async () => {
 *   await lazyExportQuoteAsPDF(quoteData);
 * };
 * ```
 * 
 * Created: Feb 20, 2026
 * Part of: Wizard bundle optimization initiative
 */

import type { QuoteExportData } from "@/utils/quoteExportUtils";

/**
 * Lazy-load PDF export function
 * Only imports quoteExportUtils when user clicks Export PDF
 */
export async function lazyExportQuoteAsPDF(data: QuoteExportData): Promise<void> {
  const { exportQuoteAsPDF } = await import("@/utils/quoteExportUtils");
  return exportQuoteAsPDF(data);
}

/**
 * Lazy-load Word export function
 * Only imports quoteExportUtils when user clicks Export Word
 */
export async function lazyExportQuoteAsWord(data: QuoteExportData): Promise<void> {
  const { exportQuoteAsWord } = await import("@/utils/quoteExportUtils");
  return exportQuoteAsWord(data);
}

/**
 * Lazy-load Excel export function
 * Already has lazy xlsx import internally, but this ensures
 * the entire quoteExportUtils module isn't in main bundle
 */
export async function lazyExportQuoteAsExcel(data: QuoteExportData): Promise<void> {
  const { exportQuoteAsExcel } = await import("@/utils/quoteExportUtils");
  return exportQuoteAsExcel(data);
}

/**
 * Lazy-load the QuoteExportData type builder
 * Used to build export data structure before export
 */
export async function lazyBuildExportData(): Promise<typeof import("@/utils/quoteExportUtils")> {
  return await import("@/utils/quoteExportUtils");
}

/**
 * Preload export utilities (call when user hovers over export button)
 * Improves perceived performance by loading before click
 */
export function preloadExportUtils(): void {
  // Start loading but don't await
  import("@/utils/quoteExportUtils").catch(() => {
    // Silently fail preload - will load on actual export
  });
}
