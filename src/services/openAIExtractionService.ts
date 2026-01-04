/**
 * OPENAI EXTRACTION SERVICE
 * =========================
 *
 * Uses OpenAI GPT-4 to extract structured data from parsed documents.
 * This is the AI-powered part of Path A: Upload Specs workflow.
 *
 * Extraction capabilities:
 * - Utility bills → kWh usage, demand, rates, utility provider
 * - Equipment schedules → connected load, peak demand
 * - Load profiles → hourly/daily patterns, peak/average demand
 *
 * @module openAIExtractionService
 */

import type { ParsedDocument } from "./documentParserService";
import { combineDocumentsForAnalysis } from "./documentParserService";

// ============================================
// TYPES
// ============================================

export interface ExtractedSpecsData {
  // Power Requirements
  powerRequirements?: {
    peakDemandKW?: number;
    averageDemandKW?: number;
    monthlyKWh?: number;
    annualKWh?: number;
    powerFactor?: number;
  };

  // Utility Information
  utilityInfo?: {
    utilityProvider?: string;
    rateSchedule?: string;
    electricityRate?: number; // $/kWh
    demandCharge?: number; // $/kW
    timeOfUseRates?: boolean;
    peakHours?: string;
  };

  // Location
  location?: {
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };

  // Existing Infrastructure
  existingInfrastructure?: {
    hasSolar?: boolean;
    solarKW?: number;
    hasGenerator?: boolean;
    generatorKW?: number;
    hasBattery?: boolean;
    batteryKWh?: number;
    mainPanelAmps?: number;
    serviceVoltage?: number;
  };

  // Facility Information
  facilityInfo?: {
    facilityType?: string;
    squareFootage?: number;
    occupancy?: string;
    operatingHours?: string;
  };

  // Equipment Details (from schedules)
  equipment?: {
    totalConnectedLoadKW?: number;
    majorLoads?: Array<{
      name: string;
      kW?: number;
      hp?: number;
      quantity?: number;
    }>;
    hvacTonnage?: number;
    lightingKW?: number;
  };

  // Load Profile (from interval data)
  loadProfile?: {
    peakDemandKW?: number;
    peakTime?: string;
    averageLoadKW?: number;
    loadFactorPercent?: number;
    dailyPeakKWh?: number;
  };

  // Confidence and metadata
  confidence: number; // 0-100
  extractedFrom: string[];
  rawInsights?: string;
}

export interface ExtractionOptions {
  documentTypes?: ("utility-bill" | "equipment-schedule" | "load-profile" | "other")[];
  includeRawInsights?: boolean;
}

// ============================================
// PROMPT TEMPLATES
// ============================================

const EXTRACTION_SYSTEM_PROMPT = `You are an expert energy analyst extracting data from facility documents for battery energy storage system (BESS) sizing. Extract all relevant electrical and facility data.

ALWAYS respond in valid JSON format matching this structure:
{
  "powerRequirements": {
    "peakDemandKW": number or null,
    "averageDemandKW": number or null,
    "monthlyKWh": number or null,
    "annualKWh": number or null,
    "powerFactor": number or null
  },
  "utilityInfo": {
    "utilityProvider": string or null,
    "rateSchedule": string or null,
    "electricityRate": number or null,
    "demandCharge": number or null,
    "timeOfUseRates": boolean,
    "peakHours": string or null
  },
  "location": {
    "address": string or null,
    "city": string or null,
    "state": string or null (2-letter code),
    "zipCode": string or null
  },
  "existingInfrastructure": {
    "hasSolar": boolean,
    "solarKW": number or null,
    "hasGenerator": boolean,
    "generatorKW": number or null,
    "hasBattery": boolean,
    "batteryKWh": number or null,
    "mainPanelAmps": number or null,
    "serviceVoltage": number or null
  },
  "facilityInfo": {
    "facilityType": string or null,
    "squareFootage": number or null,
    "occupancy": string or null,
    "operatingHours": string or null
  },
  "equipment": {
    "totalConnectedLoadKW": number or null,
    "majorLoads": array of {name, kW, hp, quantity},
    "hvacTonnage": number or null,
    "lightingKW": number or null
  },
  "loadProfile": {
    "peakDemandKW": number or null,
    "peakTime": string or null,
    "averageLoadKW": number or null,
    "loadFactorPercent": number or null,
    "dailyPeakKWh": number or null
  },
  "confidence": number (0-100),
  "rawInsights": string (brief summary of what you found)
}

Important notes:
- Extract exact numbers when available, don't estimate
- For electricity rates, look for $/kWh values (typical range $0.05-$0.40)
- For demand charges, look for $/kW values (typical range $5-$25)
- Convert HP to kW if needed (1 HP ≈ 0.746 kW)
- US state should be 2-letter code (CA, TX, NY, etc.)
- Set confidence based on data quality (100 = clear explicit data, 50 = inferred, 0 = no data)`;

// ============================================
// OPENAI API INTEGRATION
// ============================================

/**
 * Call OpenAI API for data extraction
 */
async function callOpenAI(content: string): Promise<ExtractedSpecsData> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OpenAI API key not configured. Set VITE_OPENAI_API_KEY in .env");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
        { role: "user", content: `Extract all relevant data from these documents:\n\n${content}` },
      ],
      temperature: 0.1, // Low temperature for consistent extraction
      max_tokens: 2000,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || "Unknown error"}`);
  }

  const result = await response.json();
  const extractedContent = result.choices[0]?.message?.content;

  if (!extractedContent) {
    throw new Error("No content in OpenAI response");
  }

  try {
    const parsed = JSON.parse(extractedContent);
    return {
      ...parsed,
      extractedFrom: ["openai-gpt4"],
    };
  } catch (parseError) {
    if (import.meta.env.DEV) {
      console.error("Failed to parse OpenAI response:", extractedContent);
    }
    throw new Error("Failed to parse extraction results");
  }
}

// ============================================
// LOCAL EXTRACTION (Fallback)
// ============================================

/**
 * Local pattern-based extraction (no API key needed)
 * Used as fallback when OpenAI is unavailable
 */
function localExtraction(documents: ParsedDocument[]): ExtractedSpecsData {
  const combinedText = combineDocumentsForAnalysis(documents).toLowerCase();

  const result: ExtractedSpecsData = {
    confidence: 30,
    extractedFrom: ["local-patterns"],
  };

  // Extract kWh values
  const kwhMatch = combinedText.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*kwh/i);
  if (kwhMatch) {
    const kwh = parseFloat(kwhMatch[1].replace(/,/g, ""));
    if (kwh > 100 && kwh < 1000000) {
      result.powerRequirements = {
        ...result.powerRequirements,
        monthlyKWh: kwh,
      };
      result.confidence = Math.min(result.confidence + 15, 100);
    }
  }

  // Extract peak demand (kW)
  const demandMatch = combinedText.match(
    /(?:peak|demand|max)\s*(?:demand|load|power)?:?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*kw/i
  );
  if (demandMatch) {
    const kw = parseFloat(demandMatch[1].replace(/,/g, ""));
    if (kw > 10 && kw < 100000) {
      result.powerRequirements = {
        ...result.powerRequirements,
        peakDemandKW: kw,
      };
      result.confidence = Math.min(result.confidence + 20, 100);
    }
  }

  // Extract electricity rate
  const rateMatch = combinedText.match(/\$?(0?\.\d{2,4})\s*(?:per\s+)?(?:\/)?kwh/i);
  if (rateMatch) {
    const rate = parseFloat(rateMatch[1]);
    if (rate > 0.03 && rate < 0.5) {
      result.utilityInfo = {
        ...result.utilityInfo,
        electricityRate: rate,
      };
      result.confidence = Math.min(result.confidence + 15, 100);
    }
  }

  // Extract demand charge
  const demandChargeMatch = combinedText.match(
    /\$?(\d{1,2}(?:\.\d{2})?)\s*(?:per\s+)?(?:\/)?kw(?:\s+demand)?/i
  );
  if (demandChargeMatch) {
    const charge = parseFloat(demandChargeMatch[1]);
    if (charge > 1 && charge < 50) {
      result.utilityInfo = {
        ...result.utilityInfo,
        demandCharge: charge,
      };
      result.confidence = Math.min(result.confidence + 10, 100);
    }
  }

  // Extract state (2-letter code)
  const stateMatch = combinedText.match(
    /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/
  );
  if (stateMatch) {
    result.location = {
      ...result.location,
      state: stateMatch[1],
    };
    result.confidence = Math.min(result.confidence + 10, 100);
  }

  // Extract zip code
  const zipMatch = combinedText.match(/\b(\d{5})(?:-\d{4})?\b/);
  if (zipMatch) {
    result.location = {
      ...result.location,
      zipCode: zipMatch[1],
    };
    result.confidence = Math.min(result.confidence + 5, 100);
  }

  // Extract solar if mentioned
  const solarMatch = combinedText.match(
    /(?:solar|pv)\s*(?:capacity|system|array)?:?\s*(\d{1,4}(?:\.\d+)?)\s*kw/i
  );
  if (solarMatch) {
    result.existingInfrastructure = {
      ...result.existingInfrastructure,
      hasSolar: true,
      solarKW: parseFloat(solarMatch[1]),
    };
    result.confidence = Math.min(result.confidence + 10, 100);
  }

  // Extract square footage
  const sqftMatch = combinedText.match(/(\d{1,3}(?:,\d{3})*)\s*(?:sq\.?\s*ft\.?|square\s*feet)/i);
  if (sqftMatch) {
    result.facilityInfo = {
      ...result.facilityInfo,
      squareFootage: parseInt(sqftMatch[1].replace(/,/g, "")),
    };
    result.confidence = Math.min(result.confidence + 5, 100);
  }

  return result;
}

// ============================================
// MAIN EXTRACTION FUNCTION
// ============================================

/**
 * Extract structured data from parsed documents using AI
 */
export async function extractSpecsFromDocuments(
  documents: ParsedDocument[],
  options: ExtractionOptions = {}
): Promise<ExtractedSpecsData> {
  if (import.meta.env.DEV) {
    console.log(`🤖 [OpenAIExtraction] Processing ${documents.length} documents`);
  }

  // Filter out failed documents
  const validDocs = documents.filter((d) => d.status !== "failed");

  if (validDocs.length === 0) {
    return {
      confidence: 0,
      extractedFrom: [],
      rawInsights: "No valid documents to process",
    };
  }

  // Combine documents for analysis
  const combinedContent = combineDocumentsForAnalysis(validDocs);

  // Try OpenAI first
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (apiKey && apiKey !== "your-key-here") {
    try {
      const result = await callOpenAI(combinedContent);

      if (import.meta.env.DEV) {
        console.log(
          `🤖 [OpenAIExtraction] AI extraction complete, confidence: ${result.confidence}%`
        );
      }

      return result;
    } catch (error) {
      console.error("OpenAI extraction failed, falling back to local:", error);
    }
  }

  // Fallback to local extraction
  if (import.meta.env.DEV) {
    console.log("🤖 [OpenAIExtraction] Using local pattern extraction (no API key)");
  }

  return localExtraction(validDocs);
}

/**
 * Validate extracted data for quote building
 */
export function validateExtractedData(data: ExtractedSpecsData): {
  isValid: boolean;
  missingFields: string[];
  suggestions: string[];
} {
  const missingFields: string[] = [];
  const suggestions: string[] = [];

  // Check for minimum required data
  if (!data.powerRequirements?.peakDemandKW && !data.powerRequirements?.monthlyKWh) {
    missingFields.push("Power requirements (peak kW or monthly kWh)");
    suggestions.push("Upload a utility bill or load profile for power data");
  }

  if (!data.location?.state) {
    missingFields.push("Location (state)");
    suggestions.push("Enter your facility location manually");
  }

  if (!data.utilityInfo?.electricityRate) {
    missingFields.push("Electricity rate");
    suggestions.push("We'll use regional average rates");
  }

  return {
    isValid: missingFields.length <= 1, // Allow 1 missing field
    missingFields,
    suggestions,
  };
}

/**
 * Format extracted data for display
 */
export function formatExtractedData(data: ExtractedSpecsData): string {
  const lines: string[] = [];

  if (data.powerRequirements?.peakDemandKW) {
    lines.push(`Peak Demand: ${data.powerRequirements.peakDemandKW.toLocaleString()} kW`);
  }
  if (data.powerRequirements?.monthlyKWh) {
    lines.push(`Monthly Usage: ${data.powerRequirements.monthlyKWh.toLocaleString()} kWh`);
  }
  if (data.utilityInfo?.electricityRate) {
    lines.push(`Electricity Rate: $${data.utilityInfo.electricityRate.toFixed(4)}/kWh`);
  }
  if (data.utilityInfo?.demandCharge) {
    lines.push(`Demand Charge: $${data.utilityInfo.demandCharge.toFixed(2)}/kW`);
  }
  if (data.location?.state) {
    lines.push(
      `Location: ${data.location.city ? data.location.city + ", " : ""}${data.location.state}`
    );
  }
  if (data.existingInfrastructure?.hasSolar) {
    lines.push(`Existing Solar: ${data.existingInfrastructure.solarKW} kW`);
  }

  return lines.join("\n");
}
