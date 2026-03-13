/**
 * Merlin Widget API - Type Definitions
 *
 * Types for the embeddable widget API system.
 * Partners use these types when integrating the widget.
 */

// ============================================================================
// Partner Account Types
// ============================================================================

export type WidgetTier = "free" | "pro" | "enterprise";
export type PartnerStatus = "active" | "suspended" | "cancelled";

export interface WidgetPartner {
  id: string;
  companyName: string;
  contactEmail: string;
  tier: WidgetTier;
  apiKey: string; // pk_live_xxxxx
  status: PartnerStatus;

  // Customization
  primaryColor?: string;
  logoUrl?: string;
  whiteLabel: boolean;

  // Billing
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;

  // Limits
  monthlyQuoteLimit: number;

  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Widget Configuration Types
// ============================================================================

export type WidgetTheme = "light" | "dark";
export type WidgetIndustry =
  | "hotel"
  | "car-wash"
  | "hospital"
  | "office"
  | "data-center"
  | "manufacturing"
  | "retail"
  | "warehouse";

export interface WidgetConfig {
  apiKey: string;
  industry: WidgetIndustry;
  theme?: WidgetTheme;
  primaryColor?: string;
  logo?: string;
  hideAttribution?: boolean; // Enterprise only
  onQuoteGenerated?: (quote: WidgetQuoteResponse) => void;
  onError?: (error: WidgetError) => void;
}

// ============================================================================
// Quote Request/Response Types
// ============================================================================

export interface WidgetQuoteRequest {
  industry: WidgetIndustry;
  location: {
    state: string;
    zipCode?: string;
  };
  facility: Record<string, unknown>; // Industry-specific fields
  options?: {
    includeSolar?: boolean;
    includeGenerator?: boolean;
    includeEV?: boolean;
  };
}

export interface WidgetQuoteResponse {
  success: boolean;
  quote: {
    // System sizing
    bessKWh: number;
    bessMW: number;
    durationHours: number;
    solarKW?: number;
    generatorKW?: number;
    evChargerKW?: number;

    // Costs
    costs: {
      equipment: number;
      installation: number;
      total: number;
      afterITC: number;
    };

    // Savings
    savings: {
      annual: number;
      peakShaving: number;
      demandCharge: number;
      solarSavings?: number;
    };

    // Financials
    financials: {
      paybackYears: number;
      npv25Year: number;
      roi25Year: number;
      irr: number;
    };

    // TrueQuote validation
    truequote: {
      sources: string[];
      methodology: string;
      confidence: number;
      timestamp: string;
    };
  };

  metadata: {
    partnerId: string;
    quotesRemaining: number;
    generatedAt: string;
  };
}

export interface WidgetError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// ============================================================================
// Usage Tracking Types
// ============================================================================

export type WidgetEvent = "widget_loaded" | "quote_started" | "quote_completed" | "error";

export interface WidgetTrackingEvent {
  event: WidgetEvent;
  data: {
    url?: string;
    industry?: string;
    userAgent?: string;
    error?: string;
  };
}

export interface WidgetUsageStats {
  partnerId: string;
  tier: WidgetTier;
  period: {
    start: string;
    end: string;
  };
  usage: {
    quotesGenerated: number;
    quotesLimit: number;
    percentUsed: number;
    widgetLoads: number;
    conversionRate: number;
  };
  topIndustries: Array<{
    industry: string;
    count: number;
  }>;
}

// ============================================================================
// Hotel-Specific Types (MVP Industry)
// ============================================================================

export interface HotelWidgetInput {
  rooms: number;
  hotelClass: "economy" | "midscale" | "upscale" | "luxury";
  state: string;
  electricityRate?: number; // Optional, auto-fetched if omitted
}

// ============================================================================
// API Response Helpers
// ============================================================================

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: unknown } };

// ============================================================================
// Tier Limits
// ============================================================================

export const WIDGET_TIER_LIMITS = {
  free: {
    monthlyQuotes: 100,
    whiteLabel: false,
    apiAccess: false,
    crmIntegration: false,
  },
  pro: {
    monthlyQuotes: 500,
    whiteLabel: false,
    apiAccess: true,
    crmIntegration: true,
  },
  enterprise: {
    monthlyQuotes: Infinity,
    whiteLabel: true,
    apiAccess: true,
    crmIntegration: true,
  },
} as const;
