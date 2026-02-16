/**
 * MARGIN POLICY ENGINE
 * ====================
 * 
 * The commercial layer that transforms base/market costs into sell prices.
 * This is how Merlin makes money while keeping quotes realistic.
 * 
 * ARCHITECTURE:
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  Layer A: Market/Base Pricing (SSOT)                                │
 * │  - equipmentPricingTiersService.ts                                  │
 * │  - pricingTierService.ts                                            │
 * │  - collected_market_prices table                                    │
 * └───────────────────────────────┬─────────────────────────────────────┘
 *                                 │
 *                                 ▼
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  Layer B: MARGIN POLICY ENGINE (this file)                          │
 * │  - Deal size bands (scale discount curve)                           │
 * │  - Product-class margins (BESS vs Solar vs EV)                      │
 * │  - Risk/complexity adjusters                                        │
 * │  - Floor/ceiling guards (prevents insane quotes)                    │
 * │  - Full audit trail for trust                                       │
 * └───────────────────────────────┬─────────────────────────────────────┘
 *                                 │
 *                                 ▼
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  Step 4/5/6 - Render sell prices (not math problems)                │
 * └─────────────────────────────────────────────────────────────────────┘
 * 
 * KEY PRINCIPLE:
 * - TrueQuote computes "base cost" (SSOT market truth)
 * - MarginPolicy applies "sell price policy" (commercialization)
 * - If we mix them, drift detection becomes impossible
 * 
 * @created 2026-02-01
 * @version 1.0.0
 */

import { supabase } from './supabaseClient';

// ============================================================================
// VERSION & CONSTANTS
// ============================================================================
export const MARGIN_POLICY_VERSION = '1.2.0'; // v1.2: three-layer pricing stack (market → obtainable → sell)
export const MARGIN_POLICY_DATE = '2026-02-01';

// ============================================================================
// TYPES
// ============================================================================

export type ProductClass = 
  | 'bess' 
  | 'solar' 
  | 'wind' 
  | 'generator' 
  | 'ev_charger' 
  | 'inverter_pcs' 
  | 'transformer' 
  | 'microgrid_controller'
  | 'bms'
  | 'scada'
  | 'ems_software'
  | 'construction_labor'
  | 'engineering';

export type RiskLevel = 'standard' | 'elevated' | 'high_complexity';

export type CustomerSegment = 'direct' | 'epc_partner' | 'strategic' | 'government';

export type ClampReason = 
  | 'unit_floor' 
  | 'unit_ceiling' 
  | 'quote_floor' 
  | 'quote_ceiling' 
  | 'margin_floor' 
  | 'margin_ceiling'
  | 'procurement_buffer';  // Layer 1: obtainable reality buffer

// ============================================================================
// REVIEW EVENTS (human-in-the-loop alerts)
// ============================================================================

export interface ReviewEvent {
  productClass: ProductClass;
  sku: string;
  reason: 'market_below_review_threshold' | 'market_suspiciously_low' | 'stale_pricing';
  marketUnitCost: number;
  reviewThreshold: number;
  message: string;
  severity: 'warning' | 'alert';  // warning = informational, alert = needs human review
}

// ============================================================================
// MARGIN BAND CONFIGURATION
// Deal size → Margin % (scale discount curve)
// ============================================================================

export interface MarginBand {
  id: string;
  minTotal: number;        // Minimum deal size ($)
  maxTotal: number | null; // Maximum deal size (null = no limit)
  marginMin: number;       // Minimum margin %
  marginMax: number;       // Maximum margin %
  marginTarget: number;    // Target margin % (default)
  description: string;
}

/**
 * Default margin bands by deal size
 * These are CONFIGURABLE in database - not hardcoded behavior
 */
export const DEFAULT_MARGIN_BANDS: MarginBand[] = [
  { id: 'micro',      minTotal: 0,          maxTotal: 500_000,    marginMin: 0.18, marginMax: 0.25, marginTarget: 0.20, description: 'Micro: <$500K' },
  { id: 'small',      minTotal: 500_000,    maxTotal: 1_500_000,  marginMin: 0.15, marginMax: 0.20, marginTarget: 0.18, description: 'Small: $500K-$1.5M' },
  { id: 'small_plus', minTotal: 1_500_000,  maxTotal: 3_000_000,  marginMin: 0.10, marginMax: 0.15, marginTarget: 0.12, description: 'Small+: $1.5M-$3M' },
  { id: 'mid',        minTotal: 3_000_000,  maxTotal: 5_000_000,  marginMin: 0.08, marginMax: 0.12, marginTarget: 0.10, description: 'Mid: $3M-$5M' },
  { id: 'mid_plus',   minTotal: 5_000_000,  maxTotal: 10_000_000, marginMin: 0.06, marginMax: 0.09, marginTarget: 0.075, description: 'Mid+: $5M-$10M' },
  { id: 'large',      minTotal: 10_000_000, maxTotal: 20_000_000, marginMin: 0.04, marginMax: 0.07, marginTarget: 0.055, description: 'Large: $10M-$20M' },
  { id: 'enterprise', minTotal: 20_000_000, maxTotal: 100_000_000, marginMin: 0.02, marginMax: 0.05, marginTarget: 0.035, description: 'Enterprise: $20M-$100M' },
  { id: 'mega',       minTotal: 100_000_000, maxTotal: null,       marginMin: 0.005, marginMax: 0.02, marginTarget: 0.012, description: 'Mega: $100M+' },
];

// ============================================================================
// PRODUCT-CLASS MARGIN ADJUSTERS
// Different products have different margin profiles
// ============================================================================

export interface ProductMarginConfig {
  productClass: ProductClass;
  marginMultiplier: number;  // 1.0 = standard, 1.2 = 20% higher margin
  isAdditive: boolean;       // true = fixed adder, false = percentage
  fixedAdder?: number;       // Fixed dollar adder (for labor/EPC)
  description: string;
}

export const DEFAULT_PRODUCT_MARGINS: ProductMarginConfig[] = [
  { productClass: 'bess',                marginMultiplier: 1.0,  isAdditive: false, description: 'BESS: Standard margin' },
  { productClass: 'solar',               marginMultiplier: 0.75, isAdditive: false, description: 'Solar: Commoditized, tighter margin' },
  { productClass: 'wind',                marginMultiplier: 0.85, isAdditive: false, description: 'Wind: Slightly tighter margin' },
  { productClass: 'generator',           marginMultiplier: 0.90, isAdditive: false, description: 'Generator: Competitive market' },
  { productClass: 'ev_charger',          marginMultiplier: 1.1,  isAdditive: false, description: 'EV: Higher margin (install complexity)' },
  { productClass: 'inverter_pcs',        marginMultiplier: 0.85, isAdditive: false, description: 'Inverter: Tight margin, stable' },
  { productClass: 'transformer',         marginMultiplier: 0.90, isAdditive: false, description: 'Transformer: Moderate margin' },
  { productClass: 'microgrid_controller', marginMultiplier: 1.2, isAdditive: false, description: 'Microgrid: Higher complexity margin' },
  { productClass: 'bms',                 marginMultiplier: 1.0,  isAdditive: false, description: 'BMS: Standard margin' },
  { productClass: 'scada',               marginMultiplier: 1.15, isAdditive: false, description: 'SCADA: Software premium' },
  { productClass: 'ems_software',        marginMultiplier: 1.25, isAdditive: false, description: 'EMS: Software premium' },
  { productClass: 'construction_labor',  marginMultiplier: 1.0,  isAdditive: true, fixedAdder: 0.15, description: 'Labor: 15% fixed adder' },
  { productClass: 'engineering',         marginMultiplier: 1.0,  isAdditive: true, fixedAdder: 0.20, description: 'Engineering: 20% fixed adder' },
];

// ============================================================================
// RISK/COMPLEXITY ADJUSTERS
// ============================================================================

export interface RiskAdjuster {
  riskLevel: RiskLevel;
  marginAddPercent: number;  // Added to base margin
  description: string;
}

export const DEFAULT_RISK_ADJUSTERS: RiskAdjuster[] = [
  { riskLevel: 'standard',        marginAddPercent: 0,    description: 'Standard commercial project' },
  { riskLevel: 'elevated',        marginAddPercent: 0.02, description: 'Elevated: Data center, critical loads' },
  { riskLevel: 'high_complexity', marginAddPercent: 0.04, description: 'High: Microgrid islanding, N+1, hospital' },
];

// ============================================================================
// CUSTOMER SEGMENT ADJUSTERS
// ============================================================================

export interface SegmentAdjuster {
  segment: CustomerSegment;
  marginMultiplier: number;  // 1.0 = standard, 0.9 = 10% discount
  description: string;
}

export const DEFAULT_SEGMENT_ADJUSTERS: SegmentAdjuster[] = [
  { segment: 'direct',       marginMultiplier: 1.0,  description: 'Direct customer: Standard margin' },
  { segment: 'epc_partner',  marginMultiplier: 0.85, description: 'EPC Partner: 15% margin share' },
  { segment: 'strategic',    marginMultiplier: 0.90, description: 'Strategic account: 10% discount' },
  { segment: 'government',   marginMultiplier: 0.80, description: 'Government: 20% discount' },
];

// ============================================================================
// FLOOR/CEILING GUARDS
// Prevents insane quotes from bad market data or margin compounding
// ============================================================================

export interface PriceGuard {
  productClass: ProductClass;
  unit: string;                // 'per_kWh', 'per_kW', 'per_W', 'per_unit'
  
  // THREE-LAYER PRICING STACK
  // Layer 0: Market price (SSOT input) - what scraper/DB says
  lastMarketPrice: number;     // Most recent market price
  marketSource: string;        // Source of market price
  asOfDate: string;            // Date of market price
  
  // Layer 1: Obtainable reality buffer (anti-fantasy)
  procurementBufferPct: number;  // Buffer when market is "too good" (e.g., 0.15 = 15%)
  procurementBufferTrigger: number; // Apply buffer if market < this threshold
  
  // Layer 2: Quote floors/ceilings (what we're willing to quote)
  quoteFloorPrice: number;     // Floor for quotes ($105/kWh for BESS) - clamp up to this
  reviewBelowPrice: number;    // Trigger human review if market < this ($100/kWh for BESS)
  ceilingPrice: number;        // Maximum price per unit (ceiling clamp)
  
  // Legacy compatibility
  floorPrice: number;          // Alias for quoteFloorPrice (deprecated, use quoteFloorPrice)
}

/**
 * Default price guards with three-layer pricing stack
 * 
 * BESS Example:
 * - Market says $85/kWh (Layer 0)
 * - We apply 15% buffer → $97.75/kWh (Layer 1 - obtainable)
 * - This is below $105 floor → clamp to $105/kWh (Layer 2 - quotable)
 * - Margin engine then applies profit on top of $105
 * 
 * If market < $100/kWh → ReviewEvent emitted (human review needed)
 */
export const DEFAULT_PRICE_GUARDS: PriceGuard[] = [
  { 
    productClass: 'bess',
    unit: 'per_kWh',
    // Layer 0: Market
    lastMarketPrice: 125,
    marketSource: 'NREL ATB 2024',
    asOfDate: '2025-12-01',
    // Layer 1: Procurement buffer
    procurementBufferPct: 0.15,       // 15% cushion when market is "too good"
    procurementBufferTrigger: 110,    // Apply buffer if market < $110/kWh
    // Layer 2: Quote constraints
    quoteFloorPrice: 105,             // ✅ Floor we can live with ($105/kWh)
    reviewBelowPrice: 100,            // ⚠️ Alarm bell: needs human review
    ceilingPrice: 250,
    floorPrice: 105,                  // Legacy alias
  },
  { 
    productClass: 'solar',
    unit: 'per_W',
    lastMarketPrice: 0.85,
    marketSource: 'NREL Cost Benchmark',
    asOfDate: '2025-12-01',
    procurementBufferPct: 0.10,
    procurementBufferTrigger: 0.70,
    quoteFloorPrice: 0.65,
    reviewBelowPrice: 0.55,
    ceilingPrice: 1.50,
    floorPrice: 0.65,
  },
  { 
    productClass: 'inverter_pcs',
    unit: 'per_kW',
    lastMarketPrice: 95,
    marketSource: 'NREL ATB 2024',
    asOfDate: '2025-12-01',
    procurementBufferPct: 0.10,
    procurementBufferTrigger: 70,
    quoteFloorPrice: 70,
    reviewBelowPrice: 60,
    ceilingPrice: 180,
    floorPrice: 70,
  },
  { 
    productClass: 'generator',
    unit: 'per_kW',
    lastMarketPrice: 700,
    marketSource: 'Industry pricing',
    asOfDate: '2025-12-01',
    procurementBufferPct: 0.08,
    procurementBufferTrigger: 500,
    quoteFloorPrice: 450,
    reviewBelowPrice: 400,
    ceilingPrice: 1200,
    floorPrice: 450,
  },
  { 
    productClass: 'ev_charger',
    unit: 'per_unit',
    lastMarketPrice: 35000,
    marketSource: 'Industry pricing',
    asOfDate: '2025-12-01',
    procurementBufferPct: 0.10,
    procurementBufferTrigger: 8000,
    quoteFloorPrice: 6000,
    reviewBelowPrice: 5000,
    ceilingPrice: 150000,
    floorPrice: 6000,
  },
  { 
    productClass: 'transformer',
    unit: 'per_kVA',
    lastMarketPrice: 55,
    marketSource: 'Industry pricing',
    asOfDate: '2025-12-01',
    procurementBufferPct: 0.08,
    procurementBufferTrigger: 40,
    quoteFloorPrice: 40,
    reviewBelowPrice: 35,
    ceilingPrice: 100,
    floorPrice: 40,
  },
  { 
    productClass: 'bms',
    unit: 'per_unit',
    lastMarketPrice: 15000,
    marketSource: 'Industry pricing',
    asOfDate: '2025-12-01',
    procurementBufferPct: 0.10,
    procurementBufferTrigger: 10000,
    quoteFloorPrice: 10000,
    reviewBelowPrice: 8000,
    ceilingPrice: 40000,
    floorPrice: 10000,
  },
  { 
    productClass: 'scada',
    unit: 'flat',
    lastMarketPrice: 45000,
    marketSource: 'Industry pricing',
    asOfDate: '2025-12-01',
    procurementBufferPct: 0.10,
    procurementBufferTrigger: 25000,
    quoteFloorPrice: 25000,
    reviewBelowPrice: 20000,
    ceilingPrice: 150000,
    floorPrice: 25000,
  },
];

// Quote-level guards (total project)
export interface QuoteLevelGuard {
  productClass: ProductClass;
  metric: string;           // 'per_kWh_total', 'per_kW_total', 'per_W_total'
  minPerUnit: number;       // Minimum $/unit for total quote
  maxPerUnit: number;       // Maximum $/unit for total quote
}

export const DEFAULT_QUOTE_GUARDS: QuoteLevelGuard[] = [
  { productClass: 'bess',  metric: 'per_kWh_total', minPerUnit: 150, maxPerUnit: 400 },  // Total BESS project
  { productClass: 'solar', metric: 'per_W_total',   minPerUnit: 0.80, maxPerUnit: 2.50 }, // Total solar project
];

// ============================================================================
// LINE ITEM RESULT (what the engine returns per item)
// ============================================================================

export interface MarginLineItem {
  // Identity
  sku: string;
  category: ProductClass;
  description: string;
  quantity: number;
  unit: string;
  
  // ═══════════════════════════════════════════════════════════════════════════
  // THREE-LAYER PRICING STACK
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Layer 0: Market price (SSOT input - what scraper/DB says)
  marketCost: number;           // Total market cost for this line item
  marketUnitCost: number;       // Market cost per unit (before any adjustments)
  
  // Layer 1: Obtainable cost (after procurement buffer - "anti-fantasy" layer)
  obtainableCost: number;       // Total obtainable cost
  obtainableUnitCost: number;   // Obtainable cost per unit
  procurementBufferApplied: boolean;  // Was buffer applied?
  procurementBufferPct: number;       // Buffer % that was applied (0 if not applied)
  
  // Layer 2: Sell price (after Merlin margin - profit layer)
  sellPrice: number;            // Final sell price to customer
  sellUnitPrice: number;        // Sell price per unit
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MARGIN DETAILS
  // ═══════════════════════════════════════════════════════════════════════════
  marginBandId: string;
  productMarginMultiplier: number;
  riskAdjustPercent: number;
  segmentMultiplier: number;
  appliedMarginPercent: number;  // Final computed margin (on obtainable cost)
  marginDollars: number;         // sellPrice - obtainableCost
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CLAMPING & REVIEW
  // ═══════════════════════════════════════════════════════════════════════════
  wasClampedFloor: boolean;
  wasClampedCeiling: boolean;
  clampEvents: ClampEvent[];
  reviewEvents: ReviewEvent[];   // Human review needed?
  
  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIT
  // ═══════════════════════════════════════════════════════════════════════════
  costSource: string;
  costAsOfDate: string;
  
  // Legacy compatibility (deprecated - use marketCost/obtainableCost)
  baseCost: number;              // Alias for obtainableCost (margin base)
  baseUnitCost: number;          // Alias for obtainableUnitCost
}

export interface ClampEvent {
  reason: ClampReason;
  originalValue: number;
  clampedValue: number;
  guardName: string;
}

// ============================================================================
// QUOTE RESULT (what the engine returns for full quote)
// ============================================================================

export interface MarginQuoteResult {
  // ═══════════════════════════════════════════════════════════════════════════
  // THREE-LAYER TOTALS
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Layer 0: Market totals
  marketCostTotal: number;       // Sum of all market costs (what DB says)
  
  // Layer 1: Obtainable totals
  obtainableCostTotal: number;   // Sum after procurement buffers ("reality-adjusted")
  procurementBufferTotal: number; // Total buffer dollars applied
  
  // Layer 2: Sell totals
  sellPriceTotal: number;        // Sum of all sell prices (customer sees this)
  totalMarginDollars: number;    // sellPriceTotal - obtainableCostTotal
  blendedMarginPercent: number;  // Weighted average margin on obtainable cost
  
  // Legacy compatibility
  baseCostTotal: number;         // Alias for obtainableCostTotal (margin base)
  
  // ═══════════════════════════════════════════════════════════════════════════
  // LINE ITEMS & MARGIN BAND
  // ═══════════════════════════════════════════════════════════════════════════
  lineItems: MarginLineItem[];
  marginBandId: string;
  marginBandDescription: string;
  
  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIT TRAIL & REVIEW
  // ═══════════════════════════════════════════════════════════════════════════
  clampEvents: ClampEvent[];
  reviewEvents: ReviewEvent[];   // Items needing human review (market < reviewBelowPrice)
  pricingAsOf: string;
  pricingSourceVersion: string;
  policyVersion: string;
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SANITY CHECKS
  // ═══════════════════════════════════════════════════════════════════════════
  passesQuoteLevelGuards: boolean;
  quoteLevelWarnings: string[];
  needsHumanReview: boolean;     // True if any reviewEvents exist
}

// ============================================================================
// INPUT TO ENGINE
// ============================================================================

export interface MarginPolicyInput {
  // Line items from TrueQuote base pricing
  lineItems: Array<{
    sku: string;
    category: ProductClass;
    description: string;
    baseCost: number;
    quantity: number;
    unitCost: number;
    unit: string;
    costSource: string;
    costAsOfDate?: string;
  }>;
  
  // Context for margin selection
  totalBaseCost: number;        // Total project base cost (for band selection)
  riskLevel?: RiskLevel;        // Project complexity
  customerSegment?: CustomerSegment;
  
  // Optional overrides
  forceMarginPercent?: number;  // Admin override: force specific margin
  maxMarginPercent?: number;    // HARD CAP: absolute ceiling, overrides band floor (for competitive bids)
  
  // Quote denominators for quote-level guards (enables real $/kWh_total enforcement)
  // Example: { bess: 1000 /*kWh*/, solar: 2_000_000 /*W*/, inverter_pcs: 500 /*kW*/ }
  quoteUnits?: Partial<Record<ProductClass, number>>;
}

// ============================================================================
// CORE ENGINE FUNCTIONS
// ============================================================================

/**
 * Get the margin band for a given deal size
 */
export function getMarginBand(totalBaseCost: number, bands: MarginBand[] = DEFAULT_MARGIN_BANDS): MarginBand {
  for (const band of bands) {
    if (totalBaseCost >= band.minTotal && (band.maxTotal === null || totalBaseCost < band.maxTotal)) {
      return band;
    }
  }
  // Fallback to largest band
  return bands[bands.length - 1];
}

/**
 * Get product margin multiplier
 */
export function getProductMarginMultiplier(productClass: ProductClass, configs: ProductMarginConfig[] = DEFAULT_PRODUCT_MARGINS): ProductMarginConfig {
  return configs.find(c => c.productClass === productClass) || { productClass, marginMultiplier: 1.0, isAdditive: false, description: 'Default' };
}

/**
 * Get risk adjuster
 */
export function getRiskAdjuster(riskLevel: RiskLevel, adjusters: RiskAdjuster[] = DEFAULT_RISK_ADJUSTERS): RiskAdjuster {
  return adjusters.find(a => a.riskLevel === riskLevel) || adjusters[0];
}

/**
 * Get segment adjuster
 */
export function getSegmentAdjuster(segment: CustomerSegment, adjusters: SegmentAdjuster[] = DEFAULT_SEGMENT_ADJUSTERS): SegmentAdjuster {
  return adjusters.find(a => a.segment === segment) || adjusters[0];
}

/**
 * Get price guard for a product class
 */
export function getPriceGuard(productClass: ProductClass, guards: PriceGuard[] = DEFAULT_PRICE_GUARDS): PriceGuard | undefined {
  return guards.find(g => g.productClass === productClass);
}

/**
 * Apply margin policy to a single line item
 * 
 * THREE-LAYER PRICING STACK (v1.2.0):
 * 
 * Layer 0: Market price (SSOT input)
 *   - What the scraper/DB says the world looks like today
 *   - May be optimistic or stale
 * 
 * Layer 1: Obtainable reality buffer (anti-fantasy)
 *   - If market < procurementBufferTrigger, apply buffer
 *   - obtainable_cost = market_cost * (1 + procurement_buffer_pct)
 *   - This is NOT profit. It's a realism correction.
 * 
 * Layer 2: Merlin margin (profit policy)
 *   - Deal-size bands, product multipliers, segment discounts
 *   - sell_price = obtainable_cost * (1 + merlin_margin_pct)
 * 
 * GUARD RULES:
 * - If market < reviewBelowPrice → emit ReviewEvent (human review needed)
 * - If sellPricePerUnit < quoteFloorPrice → clamp up to floor
 * - If sellPricePerUnit > ceilingPrice → clamp down (but never below obtainableCost)
 */
export function applyMarginToLineItem(
  item: MarginPolicyInput['lineItems'][0],
  marginBand: MarginBand,
  productConfig: ProductMarginConfig,
  riskAdjuster: RiskAdjuster,
  segmentAdjuster: SegmentAdjuster,
  forceMargin?: number,
  maxMargin?: number
): MarginLineItem {
  const clampEvents: ClampEvent[] = [];
  const reviewEvents: ReviewEvent[] = [];
  
  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 0: Market price (SSOT input)
  // ═══════════════════════════════════════════════════════════════════════════
  const marketCost = item.baseCost;  // Input is market cost from TrueQuote
  const marketUnitCost = item.quantity > 0 ? marketCost / item.quantity : item.unitCost;
  
  // Get price guard for this product class
  const guard = getPriceGuard(item.category);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // REVIEW CHECK: Is market price suspiciously low? (human review needed)
  // ═══════════════════════════════════════════════════════════════════════════
  if (guard && item.quantity > 0) {
    if (marketUnitCost < guard.reviewBelowPrice) {
      reviewEvents.push({
        productClass: item.category,
        sku: item.sku,
        reason: 'market_below_review_threshold',
        marketUnitCost,
        reviewThreshold: guard.reviewBelowPrice,
        message: `⚠️ ${item.category} market price $${marketUnitCost.toFixed(2)}/${guard.unit} is below review threshold $${guard.reviewBelowPrice}. Needs human verification.`,
        severity: 'alert',
      });
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 1: Obtainable reality buffer (anti-fantasy layer)
  // If market is "too good to be true", apply procurement cushion
  // ═══════════════════════════════════════════════════════════════════════════
  let obtainableCost = marketCost;
  let obtainableUnitCost = marketUnitCost;
  let procurementBufferApplied = false;
  let procurementBufferPct = 0;
  
  if (guard && item.quantity > 0) {
    // Apply buffer if market is below the trigger threshold
    if (marketUnitCost < guard.procurementBufferTrigger) {
      procurementBufferPct = guard.procurementBufferPct;
      procurementBufferApplied = true;
      
      obtainableUnitCost = marketUnitCost * (1 + procurementBufferPct);
      obtainableCost = obtainableUnitCost * item.quantity;
      
      clampEvents.push({
        reason: 'procurement_buffer',
        originalValue: marketUnitCost,
        clampedValue: obtainableUnitCost,
        guardName: `${item.category} procurement buffer (${(procurementBufferPct * 100).toFixed(0)}%)`,
      });
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 2: Merlin margin (profit policy)
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Calculate base margin from band
  let baseMargin = marginBand.marginTarget;
  
  // Apply product multiplier (or adder)
  let productAdjustedMargin: number;
  if (productConfig.isAdditive && productConfig.fixedAdder !== undefined) {
    productAdjustedMargin = baseMargin + productConfig.fixedAdder;
  } else {
    productAdjustedMargin = baseMargin * productConfig.marginMultiplier;
  }
  
  // Apply risk adjuster (additive)
  let riskAdjustedMargin = productAdjustedMargin + riskAdjuster.marginAddPercent;
  
  // Apply segment multiplier
  let finalMargin = riskAdjustedMargin * segmentAdjuster.marginMultiplier;
  
  // Force override (admin) - bypasses all band logic
  if (forceMargin !== undefined) {
    finalMargin = forceMargin;
  }
  
  // Apply band floor/ceiling (soft limits)
  if (finalMargin < marginBand.marginMin) {
    clampEvents.push({
      reason: 'margin_floor',
      originalValue: finalMargin,
      clampedValue: marginBand.marginMin,
      guardName: `${marginBand.id} band floor`,
    });
    finalMargin = marginBand.marginMin;
  }
  if (finalMargin > marginBand.marginMax) {
    clampEvents.push({
      reason: 'margin_ceiling',
      originalValue: finalMargin,
      clampedValue: marginBand.marginMax,
      guardName: `${marginBand.id} band ceiling`,
    });
    finalMargin = marginBand.marginMax;
  }
  
  // Apply maxMargin HARD CAP (overrides band floor for competitive bids)
  if (maxMargin !== undefined && finalMargin > maxMargin) {
    clampEvents.push({
      reason: 'margin_ceiling',
      originalValue: finalMargin,
      clampedValue: maxMargin,
      guardName: 'maxMarginPercent hard cap',
    });
    finalMargin = maxMargin;
  }
  
  // Calculate sell price (margin applied to OBTAINABLE cost, not market cost)
  const marginDollars = obtainableCost * finalMargin;
  let sellPrice = obtainableCost + marginDollars;
  let sellUnitPrice = item.quantity > 0 ? sellPrice / item.quantity : 0;
  
  // ═══════════════════════════════════════════════════════════════════════════
  // QUOTE FLOOR/CEILING GUARDS
  // ═══════════════════════════════════════════════════════════════════════════
  if (guard && item.quantity > 0) {
    // Floor clamp: use quoteFloorPrice ($105/kWh for BESS)
    // This is what we're willing to quote against
    if (sellUnitPrice < guard.quoteFloorPrice) {
      clampEvents.push({
        reason: 'unit_floor',
        originalValue: sellUnitPrice,
        clampedValue: guard.quoteFloorPrice,
        guardName: `${item.category} quote floor ($${guard.quoteFloorPrice}/${guard.unit})`,
      });
      sellUnitPrice = guard.quoteFloorPrice;
      sellPrice = sellUnitPrice * item.quantity;
    }
    
    // Ceiling clamp: NEVER drop below obtainableCost (negative margin protection)
    if (sellUnitPrice > guard.ceilingPrice) {
      const clampedPerUnit = Math.max(guard.ceilingPrice, obtainableUnitCost);
      clampEvents.push({
        reason: 'unit_ceiling',
        originalValue: sellUnitPrice,
        clampedValue: clampedPerUnit,
        guardName: clampedPerUnit > guard.ceilingPrice 
          ? `${item.category} ceiling (obtainable_cost_protected)`
          : `${item.category} ceiling ($${guard.ceilingPrice}/${guard.unit})`,
      });
      sellUnitPrice = clampedPerUnit;
      sellPrice = sellUnitPrice * item.quantity;
    }
  }
  
  // FINAL SAFETY: Ensure sellPrice >= obtainableCost (never negative margin)
  if (sellPrice < obtainableCost) {
    clampEvents.push({
      reason: 'margin_floor' as ClampReason,
      originalValue: sellPrice,
      clampedValue: obtainableCost,
      guardName: 'negative_margin_protection',
    });
    sellPrice = obtainableCost;
    sellUnitPrice = item.quantity > 0 ? sellPrice / item.quantity : 0;
  }
  
  return {
    sku: item.sku,
    category: item.category,
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    
    // Layer 0: Market
    marketCost,
    marketUnitCost,
    
    // Layer 1: Obtainable
    obtainableCost,
    obtainableUnitCost,
    procurementBufferApplied,
    procurementBufferPct,
    
    // Layer 2: Sell
    sellPrice,
    sellUnitPrice,
    
    // Margin details
    marginBandId: marginBand.id,
    productMarginMultiplier: productConfig.marginMultiplier,
    riskAdjustPercent: riskAdjuster.marginAddPercent,
    segmentMultiplier: segmentAdjuster.marginMultiplier,
    appliedMarginPercent: finalMargin,
    marginDollars: sellPrice - obtainableCost, // Margin is on obtainable, not market
    
    // Clamping & review
    wasClampedFloor: clampEvents.some(e => e.reason === 'unit_floor' || e.reason === 'margin_floor'),
    wasClampedCeiling: clampEvents.some(e => e.reason === 'unit_ceiling' || e.reason === 'margin_ceiling'),
    clampEvents,
    reviewEvents,
    
    // Audit
    costSource: item.costSource,
    costAsOfDate: item.costAsOfDate || MARGIN_POLICY_DATE,
    
    // Legacy compatibility (baseCost = obtainableCost for margin calculation)
    baseCost: obtainableCost,
    baseUnitCost: obtainableUnitCost,
  };
}

/**
 * MAIN ENTRY POINT: Apply margin policy to a full quote
 * 
 * THREE-LAYER PRICING STACK:
 * - Layer 0: marketCostTotal (what DB/scraper says)
 * - Layer 1: obtainableCostTotal (after procurement buffer)
 * - Layer 2: sellPriceTotal (after Merlin margin)
 */
export function applyMarginPolicy(input: MarginPolicyInput): MarginQuoteResult {
  // Select margin band based on total deal size
  const marginBand = getMarginBand(input.totalBaseCost);
  
  // Get adjusters
  const riskAdjuster = getRiskAdjuster(input.riskLevel || 'standard');
  const segmentAdjuster = getSegmentAdjuster(input.customerSegment || 'direct');
  
  // Process each line item
  const lineItems: MarginLineItem[] = input.lineItems.map(item => {
    const productConfig = getProductMarginMultiplier(item.category);
    return applyMarginToLineItem(
      item,
      marginBand,
      productConfig,
      riskAdjuster,
      segmentAdjuster,
      input.forceMarginPercent,
      input.maxMarginPercent
    );
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Calculate THREE-LAYER totals
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Layer 0: Market totals
  const marketCostTotal = lineItems.reduce((sum, item) => sum + item.marketCost, 0);
  
  // Layer 1: Obtainable totals (margin base)
  const obtainableCostTotal = lineItems.reduce((sum, item) => sum + item.obtainableCost, 0);
  const procurementBufferTotal = obtainableCostTotal - marketCostTotal;
  
  // Layer 2: Sell totals
  const sellPriceTotal = lineItems.reduce((sum, item) => sum + item.sellPrice, 0);
  const totalMarginDollars = sellPriceTotal - obtainableCostTotal;
  const blendedMarginPercent = obtainableCostTotal > 0 ? totalMarginDollars / obtainableCostTotal : 0;
  
  // Legacy: baseCostTotal = obtainableCostTotal (margin is applied to obtainable cost)
  const baseCostTotal = obtainableCostTotal;
  
  // Collect all clamp events and review events
  const allClampEvents = lineItems.flatMap(item => item.clampEvents);
  const allReviewEvents = lineItems.flatMap(item => item.reviewEvents);
  
  // Quote-level sanity checks
  const warnings: string[] = [];
  let passesGuards = true;
  
  // Check blended margin is reasonable
  if (blendedMarginPercent < 0.02) {
    warnings.push(`⚠️ Blended margin (${(blendedMarginPercent * 100).toFixed(1)}%) below 2% minimum`);
    passesGuards = false;
  }
  if (blendedMarginPercent > 0.30) {
    warnings.push(`⚠️ Blended margin (${(blendedMarginPercent * 100).toFixed(1)}%) above 30% maximum`);
    passesGuards = false;
  }
  
  // Check quote-level guards (e.g., $/kWh for full BESS project)
  for (const guard of DEFAULT_QUOTE_GUARDS) {
    const units = input.quoteUnits?.[guard.productClass];
    if (!units || units <= 0) continue;
    
    const categoryItems = lineItems.filter(item => item.category === guard.productClass);
    if (categoryItems.length === 0) continue;
    
    const categoryTotal = categoryItems.reduce((sum, item) => sum + item.sellPrice, 0);
    const perUnit = categoryTotal / units;
    
    if (perUnit < guard.minPerUnit) {
      warnings.push(`⚠️ ${guard.productClass} quote ${guard.metric} below floor: $${perUnit.toFixed(2)} < $${guard.minPerUnit}`);
      passesGuards = false;
    }
    if (perUnit > guard.maxPerUnit) {
      warnings.push(`⚠️ ${guard.productClass} quote ${guard.metric} above ceiling: $${perUnit.toFixed(2)} > $${guard.maxPerUnit}`);
      passesGuards = false;
    }
  }
  
  // NEGATIVE MARGIN DETECTION (should never happen after line-item protection)
  if (sellPriceTotal < obtainableCostTotal) {
    warnings.push(`🚨 CRITICAL: Negative gross margin detected! sellPrice ($${sellPriceTotal.toFixed(2)}) < obtainableCost ($${obtainableCostTotal.toFixed(2)})`);
    passesGuards = false;
  }
  
  // Surface review events as warnings
  if (allReviewEvents.length > 0) {
    warnings.push(`⚠️ ${allReviewEvents.length} item(s) need human review (market price below threshold)`);
  }
  
  return {
    // Layer 0
    marketCostTotal,
    
    // Layer 1
    obtainableCostTotal,
    procurementBufferTotal,
    
    // Layer 2
    sellPriceTotal,
    totalMarginDollars,
    blendedMarginPercent,
    
    // Legacy
    baseCostTotal,
    
    // Line items & band
    lineItems,
    marginBandId: marginBand.id,
    marginBandDescription: marginBand.description,
    
    // Audit
    clampEvents: allClampEvents,
    reviewEvents: allReviewEvents,
    pricingAsOf: MARGIN_POLICY_DATE,
    pricingSourceVersion: 'market-2026-02',
    policyVersion: MARGIN_POLICY_VERSION,
    
    // Sanity checks
    passesQuoteLevelGuards: passesGuards,
    quoteLevelWarnings: warnings,
    needsHumanReview: allReviewEvents.length > 0,
  };
}

// ============================================================================
// DATABASE-BACKED CONFIGURATION (optional - uses defaults if unavailable)
// ============================================================================

let cachedMarginBands: MarginBand[] | null = null;
let cachedProductMargins: ProductMarginConfig[] | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Load margin configuration from database (with fallback to defaults)
 */
export async function loadMarginConfig(): Promise<{
  marginBands: MarginBand[];
  productMargins: ProductMarginConfig[];
}> {
  if (cachedMarginBands && cachedProductMargins && Date.now() < cacheExpiry) {
    return { marginBands: cachedMarginBands, productMargins: cachedProductMargins };
  }
  
  try {
    // Try to load from database
    const { data: bandsData, error: bandsError } = await supabase
      .from('margin_policy_bands')
      .select('*')
      .eq('is_active', true)
      .order('min_total', { ascending: true });
    
    if (!bandsError && bandsData && bandsData.length > 0) {
      cachedMarginBands = bandsData.map(row => ({
        id: row.band_id,
        minTotal: row.min_total,
        maxTotal: row.max_total,
        marginMin: row.margin_min,
        marginMax: row.margin_max,
        marginTarget: row.margin_target,
        description: row.description,
      })) as unknown as MarginBand[];
    } else {
      cachedMarginBands = DEFAULT_MARGIN_BANDS;
    }
    
    const { data: productsData, error: productsError } = await supabase
      .from('margin_policy_products')
      .select('*')
      .eq('is_active', true);
    
    if (!productsError && productsData && productsData.length > 0) {
      cachedProductMargins = productsData.map(row => ({
        productClass: row.product_class as ProductClass,
        marginMultiplier: row.margin_multiplier,
        isAdditive: row.is_additive,
        fixedAdder: row.fixed_adder,
        description: row.description,
      })) as unknown as ProductMarginConfig[];
    } else {
      cachedProductMargins = DEFAULT_PRODUCT_MARGINS;
    }
    
    cacheExpiry = Date.now() + CACHE_TTL_MS;
    
  } catch (error) {
    console.warn('[MarginPolicy] Database unavailable, using defaults');
    cachedMarginBands = DEFAULT_MARGIN_BANDS;
    cachedProductMargins = DEFAULT_PRODUCT_MARGINS;
  }
  
  return { marginBands: cachedMarginBands!, productMargins: cachedProductMargins! };
}

/**
 * Database-backed margin policy application
 */
export async function applyMarginPolicyAsync(input: MarginPolicyInput): Promise<MarginQuoteResult> {
  const { marginBands, productMargins } = await loadMarginConfig();
  
  // Override defaults with DB config
  const marginBand = marginBands.find(b => 
    input.totalBaseCost >= b.minTotal && (b.maxTotal === null || input.totalBaseCost < b.maxTotal)
  ) || marginBands[marginBands.length - 1];
  
  const riskAdjuster = getRiskAdjuster(input.riskLevel || 'standard');
  const segmentAdjuster = getSegmentAdjuster(input.customerSegment || 'direct');
  
  const lineItems: MarginLineItem[] = input.lineItems.map(item => {
    const productConfig = productMargins.find(p => p.productClass === item.category) 
      || { productClass: item.category, marginMultiplier: 1.0, isAdditive: false, description: 'Default' };
    return applyMarginToLineItem(
      item,
      marginBand,
      productConfig,
      riskAdjuster,
      segmentAdjuster,
      input.forceMarginPercent,
      input.maxMarginPercent
    );
  });
  
  const baseCostTotal = lineItems.reduce((sum, item) => sum + item.baseCost, 0);
  const sellPriceTotal = lineItems.reduce((sum, item) => sum + item.sellPrice, 0);
  const totalMarginDollars = sellPriceTotal - baseCostTotal;
  const blendedMarginPercent = baseCostTotal > 0 ? totalMarginDollars / baseCostTotal : 0;
  
  const allClampEvents = lineItems.flatMap(item => item.clampEvents);
  const warnings: string[] = [];
  let passesGuards = true;
  
  if (blendedMarginPercent < 0.02) {
    warnings.push(`⚠️ Blended margin (${(blendedMarginPercent * 100).toFixed(1)}%) below 2% minimum`);
    passesGuards = false;
  }
  if (blendedMarginPercent > 0.30) {
    warnings.push(`⚠️ Blended margin (${(blendedMarginPercent * 100).toFixed(1)}%) above 30% maximum`);
    passesGuards = false;
  }
  
  // Collect review events
  const allReviewEvents = lineItems.flatMap(item => item.reviewEvents);
  if (allReviewEvents.length > 0) {
    warnings.push(`⚠️ ${allReviewEvents.length} item(s) need human review`);
  }
  
  // Calculate three-layer totals
  const marketCostTotal = lineItems.reduce((sum, item) => sum + item.marketCost, 0);
  const obtainableCostTotal = baseCostTotal;
  const procurementBufferTotal = obtainableCostTotal - marketCostTotal;
  
  return {
    // Layer 0
    marketCostTotal,
    
    // Layer 1
    obtainableCostTotal,
    procurementBufferTotal,
    
    // Layer 2
    sellPriceTotal,
    totalMarginDollars,
    blendedMarginPercent,
    
    // Legacy
    baseCostTotal,
    
    // Line items & band
    lineItems,
    marginBandId: marginBand.id,
    marginBandDescription: marginBand.description,
    
    // Audit
    clampEvents: allClampEvents,
    reviewEvents: allReviewEvents,
    pricingAsOf: MARGIN_POLICY_DATE,
    pricingSourceVersion: 'market-2026-02',
    policyVersion: MARGIN_POLICY_VERSION,
    
    // Sanity checks
    passesQuoteLevelGuards: passesGuards,
    quoteLevelWarnings: warnings,
    needsHumanReview: allReviewEvents.length > 0,
  };
}

// ============================================================================
// CONVENIENCE FUNCTIONS FOR STEPS 4/5/6
// ============================================================================

/**
 * Quick margin estimate for UI preview (no DB call)
 * Note: This doesn't include procurement buffer - use full applyMarginPolicy for accuracy
 */
export function estimateMargin(baseCost: number, productClass: ProductClass = 'bess'): {
  marginPercent: number;
  sellPrice: number;
  marginBand: string;
} {
  const band = getMarginBand(baseCost);
  const product = getProductMarginMultiplier(productClass);
  const margin = band.marginTarget * product.marginMultiplier;
  
  return {
    marginPercent: margin,
    sellPrice: baseCost * (1 + margin),
    marginBand: band.id,
  };
}

/**
 * Format margin info for display
 */
export function formatMarginInfo(result: MarginQuoteResult): string {
  const reviewBadge = result.needsHumanReview ? ' ⚠️ REVIEW NEEDED' : '';
  return `${result.marginBandDescription} | ${(result.blendedMarginPercent * 100).toFixed(1)}% margin | ${result.clampEvents.length} clamps${reviewBadge}`;
}

/**
 * Get pricing confidence indicator for UI (Steps 4/5/6)
 */
export function getPricingConfidence(result: MarginQuoteResult): {
  level: 'high' | 'medium' | 'low';
  message: string;
  badge: string;
} {
  if (result.needsHumanReview) {
    return {
      level: 'low',
      message: 'Market pricing below review threshold - needs verification',
      badge: '⚠️ Needs Review',
    };
  }
  
  const bufferApplied = result.lineItems.some(item => item.procurementBufferApplied);
  if (bufferApplied) {
    return {
      level: 'medium',
      message: 'Procurement buffer applied (market pricing optimistic)',
      badge: '📊 Buffer Applied',
    };
  }
  
  return {
    level: 'high',
    message: 'Pricing within normal market range',
    badge: '✅ Verified',
  };
}

// ============================================================================
// TEST HELPERS (for invariant tests)
// ============================================================================

export const _testHelpers = {
  getMarginBand,
  getProductMarginMultiplier,
  getRiskAdjuster,
  getSegmentAdjuster,
  getPriceGuard,
  DEFAULT_MARGIN_BANDS,
  DEFAULT_PRODUCT_MARGINS,
  DEFAULT_RISK_ADJUSTERS,
  DEFAULT_SEGMENT_ADJUSTERS,
  DEFAULT_PRICE_GUARDS,
  DEFAULT_QUOTE_GUARDS,
};
