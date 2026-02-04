// src/services/marginRenderEnvelopeAdapter.ts
/**
 * MARGIN RENDER ENVELOPE ADAPTER
 * ===============================
 * 
 * Single conversion point: MarginQuoteResult → MarginRenderEnvelope
 * UI must NEVER compute margin / buffers / clamp logic.
 * 
 * @version 1.1.0
 * @date 2026-02-01
 */

import type { MarginQuoteResult } from '@/services/marginPolicyEngine';
import type { MarginRenderEnvelope } from '@/types/marginRenderEnvelope';

type BadgeLevel = 'high' | 'medium' | 'low';

function computeConfidenceBadge(result: MarginQuoteResult): {
  level: BadgeLevel;
  badge: string;
  message: string;
} {
  if (result.needsHumanReview) {
    return { level: 'low', badge: '⚠️ Needs Review', message: 'Market pricing below review threshold' };
  }
  if ((result.procurementBufferTotal ?? 0) > 0) {
    return { level: 'medium', badge: '📊 Buffer Applied', message: 'Procurement buffer applied to optimistic market costs' };
  }
  return { level: 'high', badge: '✅ Verified', message: 'Pricing within expected market bands' };
}

/**
 * Render-only envelope conversion.
 * UI must NEVER compute margin / buffers / clamp logic.
 */
export function toMarginRenderEnvelope(result: MarginQuoteResult): MarginRenderEnvelope {
  const confidenceBadge = computeConfidenceBadge(result);

  return {
    // ✅ THE number UI displays
    sellPriceTotal: result.sellPriceTotal,

    // transparency (display only)
    baseCostTotal: result.baseCostTotal,
    marginDollars: result.totalMarginDollars,

    marketCostTotal: result.marketCostTotal ?? result.baseCostTotal,
    obtainableCostTotal: result.obtainableCostTotal ?? result.baseCostTotal,
    procurementBufferTotal: result.procurementBufferTotal ?? 0,

    // trust flags
    needsHumanReview: result.needsHumanReview ?? false,
    confidenceBadge,
    // Map engine events → render events (UI contract stability)
    reviewEvents: (result.reviewEvents ?? []).map((e) => ({
      type: e.type ?? 'unknown',
      message: e.message ?? '',
      productClass: e.productClass,
      unitPrice: e.unitPrice,
      threshold: e.threshold,
    })),
    clampEvents: (result.clampEvents ?? []).map((e) => ({
      reason: e.reason ?? 'unknown',
      originalValue: e.originalValue ?? 0,
      clampedValue: e.clampedValue ?? 0,
      guardName: e.guardName ?? 'unknown',
    })),

    // line items (render-only)
    lineItems: (result.lineItems ?? []).map((li) => ({
      sku: li.sku,
      category: li.category,
      description: li.description,
      quantity: li.quantity,
      unit: li.unit,

      // show the 3 layers, but UI never recalculates them
      marketCost: (li.marketCost ?? li.baseCost),
      obtainableCost: (li.obtainableCost ?? li.baseCost),
      sellPrice: li.sellPrice,

      reviewEvents: li.reviewEvents ?? [],
      clampEvents: li.clampEvents ?? [],
    })),

    // metadata
    marginBandId: result.marginBandId,
    policyVersion: result.policyVersion,
    pricingAsOf: result.pricingAsOf,

    // 🔒 "UI must not compute" tripwires
    _FORBIDDEN_computeMarginInUI: () => {
      throw new Error('FORBIDDEN: UI attempted to compute margin. Use marginRender from envelope.');
    },
    _FORBIDDEN_getRawCostsForRecomputation: () => {
      throw new Error('FORBIDDEN: UI attempted to recompute costs. Use marginRender totals only.');
    },
  };
}
