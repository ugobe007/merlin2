// src/types/marginRenderEnvelope.ts
/**
 * MARGIN RENDER ENVELOPE - Types Only
 * ====================================
 * 
 * Render-only type for UI consumption. No conversion logic here.
 * Conversion happens in: src/services/marginRenderEnvelopeAdapter.ts
 * 
 * @version 1.1.0
 * @date 2026-02-01
 */

export type ConfidenceBadge = {
  level: 'high' | 'medium' | 'low';
  badge: string;    // ✅ Verified | 📊 Buffer Applied | ⚠️ Needs Review
  message: string;  // short explanation
};

export type RenderClampEvent = {
  reason: string;
  originalValue: number;
  clampedValue: number;
  guardName: string;
};

export type RenderReviewEvent = {
  type: string;
  message: string;
  productClass?: string;
  unitPrice?: number;
  threshold?: number;
};

export type RenderLineItem = {
  sku: string;
  category: string;
  description: string;

  quantity: number;
  unit: string;

  // 3-layer transparency (display only)
  marketCost: number;
  obtainableCost: number;
  sellPrice: number;

  reviewEvents: RenderReviewEvent[];
  clampEvents: RenderClampEvent[];
};

export type MarginRenderEnvelope = {
  // ✅ UI trusts these and displays them directly
  sellPriceTotal: number;

  // transparency
  baseCostTotal: number;
  marginDollars: number;

  marketCostTotal: number;
  obtainableCostTotal: number;
  procurementBufferTotal: number;

  // trust flags
  needsHumanReview: boolean;
  confidenceBadge: ConfidenceBadge;

  reviewEvents: RenderReviewEvent[];
  clampEvents: RenderClampEvent[];

  // optional detail view
  lineItems: RenderLineItem[];

  // metadata
  marginBandId: string;
  policyVersion: string;
  pricingAsOf: string;

  // 🔒 UI tripwires
  _FORBIDDEN_computeMarginInUI: () => never;
  _FORBIDDEN_getRawCostsForRecomputation: () => never;
};
