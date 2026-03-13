/**
 * Merlin Widget API - Quote Generation Endpoint
 *
 * POST /api/v1/widget/quote
 *
 * Generates a TrueQuote for partner's customer.
 * Uses existing calculateQuote() SSOT.
 */

import type { Request, Response } from "express";
import { calculateQuote } from "@/services/unifiedQuoteCalculator";
import type {
  WidgetQuoteRequest,
  WidgetQuoteResponse,
  WidgetError,
  HotelWidgetInput,
} from "./types";

// ============================================================================
// API Key Authentication
// ============================================================================

interface AuthResult {
  valid: boolean;
  partnerId?: string;
  tier?: string;
  quotesRemaining?: number;
  error?: string;
}

/**
 * Validate API key and check usage limits
 *
 * @param apiKey - Partner API key (pk_live_xxxxx format)
 * @returns Authentication result with partner details
 */
async function validateApiKey(apiKey: string): Promise<AuthResult> {
  // TODO: Query Supabase widget_partners table
  // For now, mock validation

  if (!apiKey || !apiKey.startsWith("pk_live_")) {
    return { valid: false, error: "Invalid API key format" };
  }

  // Mock partner lookup
  const mockPartner = {
    id: "partner_123",
    tier: "pro",
    monthlyQuoteLimit: 500,
    quotesUsedThisMonth: 342, // Would come from widget_usage query
  };

  const quotesRemaining = mockPartner.monthlyQuoteLimit - mockPartner.quotesUsedThisMonth;

  if (quotesRemaining <= 0) {
    return {
      valid: false,
      error: "Monthly quote limit exceeded. Upgrade to Enterprise for unlimited quotes.",
    };
  }

  return {
    valid: true,
    partnerId: mockPartner.id,
    tier: mockPartner.tier,
    quotesRemaining,
  };
}

// ============================================================================
// Industry-Specific Input Mappers
// ============================================================================

/**
 * Map widget request to SSOT calculateQuote() input
 *
 * Different industries have different input formats.
 * This normalizes them to the SSOT format.
 */
function mapToSSOTInput(request: WidgetQuoteRequest) {
  const { industry, location, facility, options } = request;

  // Hotel mapping
  if (industry === "hotel") {
    const hotelInput = facility as HotelWidgetInput;

    return {
      // Location
      location: location.state,
      zipCode: location.zipCode,

      // Use case
      useCase: "hotel",

      // Industry data (for calculateUseCasePower)
      industryData: {
        roomCount: hotelInput.rooms,
        hotelClass: hotelInput.hotelClass,
      },

      // Electricity rate (use provided or auto-fetch)
      electricityRate: hotelInput.electricityRate,

      // Add-ons
      solarMW: options?.includeSolar ? undefined : 0, // undefined = auto-size
      generatorMW: options?.includeGenerator ? undefined : 0,

      // System sizing (let SSOT calculate)
      storageSizeMW: undefined, // Auto-calculated from use case
      durationHours: 4, // Standard for peak shaving
    };
  }

  // Car wash mapping (future)
  if (industry === "car-wash") {
    return {
      useCase: "car-wash",
      location: location.state,
      industryData: facility,
      // ... car wash specific mapping
    };
  }

  throw new Error(`Industry "${industry}" not yet supported in widget`);
}

// ============================================================================
// Quote Generation Handler
// ============================================================================

/**
 * Generate widget quote
 *
 * Main handler for POST /api/v1/widget/quote
 */
export async function generateWidgetQuote(
  request: WidgetQuoteRequest,
  apiKey: string
): Promise<WidgetQuoteResponse | WidgetError> {
  try {
    // 1. Validate API key and check limits
    const auth = await validateApiKey(apiKey);
    if (!auth.valid) {
      return {
        success: false,
        error: {
          code: "AUTH_ERROR",
          message: auth.error || "Invalid API key",
        },
      };
    }

    // 2. Map widget request to SSOT input format
    const ssotInput = mapToSSOTInput(request);

    // 3. Call SSOT calculateQuote
    const quoteResult = await calculateQuote(ssotInput);

    // 4. Format response for widget
    const response: WidgetQuoteResponse = {
      success: true,
      quote: {
        // System sizing
        bessKWh: quoteResult.sizing.bessKWh || 0,
        bessMW: quoteResult.sizing.bessMW || 0,
        durationHours: quoteResult.sizing.durationHours || 4,
        solarKW: quoteResult.sizing.solarKW,
        generatorKW: quoteResult.sizing.generatorKW,
        evChargerKW: quoteResult.sizing.evChargerKW,

        // Costs
        costs: {
          equipment: quoteResult.costs.equipmentCost || 0,
          installation: quoteResult.costs.installationCost || 0,
          total: quoteResult.costs.totalProjectCost || 0,
          afterITC: quoteResult.costs.netCost || 0,
        },

        // Savings
        savings: {
          annual: quoteResult.financials.annualSavings || 0,
          peakShaving: quoteResult.financials.peakShavingSavings || 0,
          demandCharge: quoteResult.financials.demandChargeSavings || 0,
          solarSavings: quoteResult.financials.solarSavings,
        },

        // Financials
        financials: {
          paybackYears: quoteResult.financials.paybackYears || 0,
          npv25Year: quoteResult.financials.npv || 0,
          roi25Year: quoteResult.financials.roi25Year || 0,
          irr: quoteResult.financials.irr || 0,
        },

        // TrueQuote validation
        truequote: {
          sources: quoteResult.metadata?.sources || ["NREL ATB 2024", "IRA 2022"],
          methodology: quoteResult.metadata?.methodology || "Industry-standard calculations",
          confidence: 0.95, // High confidence from SSOT
          timestamp: new Date().toISOString(),
        },
      },

      metadata: {
        partnerId: auth.partnerId!,
        quotesRemaining: auth.quotesRemaining! - 1,
        generatedAt: new Date().toISOString(),
      },
    };

    // 5. Track usage (async, non-blocking)
    trackWidgetUsage({
      partnerId: auth.partnerId!,
      event: "quote_completed",
      industry: request.industry,
      quoteData: response.quote,
    }).catch((err) => console.error("Usage tracking failed:", err));

    return response;
  } catch (error) {
    console.error("Widget quote generation error:", error);

    return {
      success: false,
      error: {
        code: "QUOTE_ERROR",
        message: "Failed to generate quote",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

// ============================================================================
// Usage Tracking
// ============================================================================

interface UsageTrackingData {
  partnerId: string;
  event: string;
  industry: string;
  quoteData?: any;
}

async function trackWidgetUsage(data: UsageTrackingData): Promise<void> {
  // TODO: Insert into widget_usage table
  console.log("[Widget] Usage tracked:", data);

  /*
  Example Supabase query:
  
  const { error } = await supabase
    .from('widget_usage')
    .insert({
      partner_id: data.partnerId,
      event_type: data.event,
      industry: data.industry,
      quote_data: data.quoteData,
      created_at: new Date().toISOString(),
    });
  */
}

// ============================================================================
// Express.js Route Handler (for /api/v1/widget/quote)
// ============================================================================

export async function handleQuoteRequest(req: Request, res: Response): Promise<Response> {
  // Extract API key from Authorization header
  const authHeader = req.headers.authorization;
  const apiKey = authHeader?.replace("Bearer ", "");

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: {
        code: "MISSING_API_KEY",
        message: 'Authorization header required. Format: "Bearer pk_live_xxxxx"',
      },
    });
  }

  // Get request body
  const request: WidgetQuoteRequest = req.body;

  // Validate request
  if (!request.industry || !request.location || !request.facility) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_REQUEST",
        message: "Missing required fields: industry, location, facility",
      },
    });
  }

  // Generate quote
  const response = await generateWidgetQuote(request, apiKey);

  // Return response
  const statusCode = response.success ? 200 : 400;
  return res.status(statusCode).json(response);
}
