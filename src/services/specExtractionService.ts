/**
 * SPEC EXTRACTION SERVICE
 * ========================
 * 
 * Uses AI (OpenAI GPT-4) to extract BESS specifications from document text.
 * Falls back to regex-based extraction if AI is unavailable.
 * 
 * Extracts:
 * - Power capacity (MW/kW)
 * - Energy capacity (MWh/kWh)
 * - Duration (hours)
 * - Location (state, zip, city)
 * - Industry/use case
 * - Solar/wind requirements
 * - Grid connection type
 * - Budget constraints
 * - Timeline requirements
 * 
 * @module specExtractionService
 */

import { supabase } from './supabaseClient';

export interface ExtractedSpecs {
  // Power & Energy
  storageSizeMW?: number;
  storageSizeKW?: number;
  energyMWh?: number;
  energyKWh?: number;
  durationHours?: number;
  
  // Location
  state?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  
  // Project Info
  projectName?: string;
  customerName?: string;
  industry?: string;
  useCase?: string;
  
  // Renewables
  solarMW?: number;
  solarKW?: number;
  windMW?: number;
  windKW?: number;
  
  // Grid & Technical
  gridConnection?: 'on-grid' | 'off-grid' | 'limited';
  voltage?: number;
  frequency?: number;
  
  // Generator/Backup
  generatorMW?: number;
  generatorKW?: number;
  generatorFuelType?: 'diesel' | 'natural-gas' | 'propane';
  
  // Financial
  budgetMin?: number;
  budgetMax?: number;
  targetPaybackYears?: number;
  
  // Timeline
  deliveryDate?: string;
  installationDate?: string;
  
  // Metadata
  confidence: number; // 0-100
  extractionMethod: 'ai' | 'regex' | 'hybrid';
  rawMatches: string[]; // Snippets that matched
}

export interface ExtractionResult {
  specs: ExtractedSpecs;
  summary: string;
  warnings: string[];
  suggestions: string[];
}

// State abbreviations and names for location detection
const US_STATES: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
  'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
  'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
  'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
  'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
  'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
  'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
  'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
  'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia'
};

// Industry keywords for use case detection
const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  'hotel': ['hotel', 'hospitality', 'resort', 'lodging', 'motel', 'inn', 'rooms'],
  'hospital': ['hospital', 'healthcare', 'medical', 'clinic', 'emergency', 'patient'],
  'data-center': ['data center', 'datacenter', 'server', 'colocation', 'hyperscale', 'edge computing'],
  'ev-charging': ['ev charging', 'electric vehicle', 'charger', 'dcfc', 'level 2', 'tesla'],
  'manufacturing': ['manufacturing', 'factory', 'industrial', 'production', 'assembly'],
  'warehouse': ['warehouse', 'distribution', 'logistics', 'fulfillment', 'storage facility'],
  'retail': ['retail', 'store', 'shopping', 'mall', 'commercial'],
  'office': ['office', 'corporate', 'business park', 'commercial building'],
  'residential': ['residential', 'home', 'house', 'apartment', 'multifamily'],
  'microgrid': ['microgrid', 'island', 'remote', 'off-grid', 'isolated'],
  'car-wash': ['car wash', 'carwash', 'auto wash', 'vehicle wash'],
};

/**
 * Extract BESS specifications from document text using AI + regex
 */
export async function extractSpecsFromText(text: string): Promise<ExtractionResult> {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  const rawMatches: string[] = [];
  
  // First, try regex extraction (fast, always works)
  const regexSpecs = extractWithRegex(text, rawMatches);
  
  // Try AI extraction for better accuracy
  let aiSpecs: Partial<ExtractedSpecs> | null = null;
  try {
    aiSpecs = await extractWithAI(text);
  } catch (error) {
    warnings.push('AI extraction unavailable, using pattern matching only');
    console.warn('AI extraction failed:', error);
  }
  
  // Merge results, preferring AI when available and confident
  const specs = mergeExtractions(regexSpecs, aiSpecs);
  
  // Validate and add warnings
  validateSpecs(specs, warnings, suggestions);
  
  // Generate summary
  const summary = generateSummary(specs);
  
  return {
    specs,
    summary,
    warnings,
    suggestions,
  };
}

/**
 * Extract specs using regex patterns (fast, offline)
 */
function extractWithRegex(text: string, rawMatches: string[]): ExtractedSpecs {
  const specs: ExtractedSpecs = {
    confidence: 60,
    extractionMethod: 'regex',
    rawMatches,
  };
  
  const normalizedText = text.toLowerCase();
  
  // Power extraction (MW, kW)
  const mwPatterns = [
    /(\d+(?:\.\d+)?)\s*(?:mega)?watts?\b/gi,
    /(\d+(?:\.\d+)?)\s*mw\b/gi,
    /power\s*[:=]?\s*(\d+(?:\.\d+)?)\s*mw/gi,
    /capacity\s*[:=]?\s*(\d+(?:\.\d+)?)\s*mw/gi,
  ];
  
  for (const pattern of mwPatterns) {
    const match = text.match(pattern);
    if (match) {
      const numMatch = match[0].match(/(\d+(?:\.\d+)?)/);
      if (numMatch) {
        const value = parseFloat(numMatch[1]);
        if (value > 0 && value <= 1000) {
          specs.storageSizeMW = value;
          rawMatches.push(match[0]);
          break;
        }
      }
    }
  }
  
  // kW patterns (if MW not found)
  if (!specs.storageSizeMW) {
    const kwPatterns = [
      /(\d+(?:\.\d+)?)\s*(?:kilo)?watts?\b/gi,
      /(\d+(?:\.\d+)?)\s*kw\b/gi,
      /power\s*[:=]?\s*(\d+(?:\.\d+)?)\s*kw/gi,
    ];
    
    for (const pattern of kwPatterns) {
      const match = text.match(pattern);
      if (match) {
        const numMatch = match[0].match(/(\d+(?:\.\d+)?)/);
        if (numMatch) {
          const value = parseFloat(numMatch[1]);
          if (value > 0) {
            specs.storageSizeKW = value;
            specs.storageSizeMW = value / 1000;
            rawMatches.push(match[0]);
            break;
          }
        }
      }
    }
  }
  
  // Energy extraction (MWh, kWh)
  const mwhPatterns = [
    /(\d+(?:\.\d+)?)\s*mwh\b/gi,
    /energy\s*[:=]?\s*(\d+(?:\.\d+)?)\s*mwh/gi,
    /storage\s*[:=]?\s*(\d+(?:\.\d+)?)\s*mwh/gi,
  ];
  
  for (const pattern of mwhPatterns) {
    const match = text.match(pattern);
    if (match) {
      const numMatch = match[0].match(/(\d+(?:\.\d+)?)/);
      if (numMatch) {
        specs.energyMWh = parseFloat(numMatch[1]);
        rawMatches.push(match[0]);
        break;
      }
    }
  }
  
  // kWh patterns
  if (!specs.energyMWh) {
    const kwhPatterns = [
      /(\d+(?:\.\d+)?)\s*kwh\b/gi,
      /energy\s*[:=]?\s*(\d+(?:\.\d+)?)\s*kwh/gi,
    ];
    
    for (const pattern of kwhPatterns) {
      const match = text.match(pattern);
      if (match) {
        const numMatch = match[0].match(/(\d+(?:\.\d+)?)/);
        if (numMatch) {
          specs.energyKWh = parseFloat(numMatch[1]);
          specs.energyMWh = specs.energyKWh / 1000;
          rawMatches.push(match[0]);
          break;
        }
      }
    }
  }
  
  // Duration extraction
  const durationPatterns = [
    /(\d+(?:\.\d+)?)\s*(?:hour|hr)s?\s*(?:duration|storage|discharge)/gi,
    /duration\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:hour|hr)s?/gi,
    /(\d+(?:\.\d+)?)\s*(?:hour|hr)\s*system/gi,
  ];
  
  for (const pattern of durationPatterns) {
    const match = text.match(pattern);
    if (match) {
      const numMatch = match[0].match(/(\d+(?:\.\d+)?)/);
      if (numMatch) {
        const value = parseFloat(numMatch[1]);
        if (value > 0 && value <= 24) {
          specs.durationHours = value;
          rawMatches.push(match[0]);
          break;
        }
      }
    }
  }
  
  // Calculate duration from MW and MWh if not found
  if (!specs.durationHours && specs.storageSizeMW && specs.energyMWh) {
    specs.durationHours = specs.energyMWh / specs.storageSizeMW;
  }
  
  // Location extraction - State
  for (const [abbr, name] of Object.entries(US_STATES)) {
    const patterns = [
      new RegExp(`\\b${abbr}\\b`, 'g'),
      new RegExp(`\\b${name}\\b`, 'gi'),
    ];
    
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        specs.state = abbr;
        rawMatches.push(abbr);
        break;
      }
    }
    if (specs.state) break;
  }
  
  // ZIP code extraction
  const zipMatch = text.match(/\b(\d{5}(?:-\d{4})?)\b/);
  if (zipMatch) {
    specs.zipCode = zipMatch[1];
    rawMatches.push(zipMatch[0]);
  }
  
  // Industry detection
  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword)) {
        specs.industry = industry;
        specs.useCase = industry;
        rawMatches.push(keyword);
        break;
      }
    }
    if (specs.industry) break;
  }
  
  // Solar extraction
  const solarPatterns = [
    /(\d+(?:\.\d+)?)\s*mw\s*(?:solar|pv|photovoltaic)/gi,
    /solar\s*[:=]?\s*(\d+(?:\.\d+)?)\s*mw/gi,
    /(\d+(?:\.\d+)?)\s*kw\s*(?:solar|pv)/gi,
  ];
  
  for (const pattern of solarPatterns) {
    const match = text.match(pattern);
    if (match) {
      const numMatch = match[0].match(/(\d+(?:\.\d+)?)/);
      if (numMatch) {
        const value = parseFloat(numMatch[1]);
        if (match[0].toLowerCase().includes('kw')) {
          specs.solarKW = value;
          specs.solarMW = value / 1000;
        } else {
          specs.solarMW = value;
        }
        rawMatches.push(match[0]);
        break;
      }
    }
  }
  
  // Wind extraction
  const windPatterns = [
    /(\d+(?:\.\d+)?)\s*mw\s*wind/gi,
    /wind\s*[:=]?\s*(\d+(?:\.\d+)?)\s*mw/gi,
    /(\d+(?:\.\d+)?)\s*kw\s*wind/gi,
  ];
  
  for (const pattern of windPatterns) {
    const match = text.match(pattern);
    if (match) {
      const numMatch = match[0].match(/(\d+(?:\.\d+)?)/);
      if (numMatch) {
        const value = parseFloat(numMatch[1]);
        if (match[0].toLowerCase().includes('kw')) {
          specs.windKW = value;
          specs.windMW = value / 1000;
        } else {
          specs.windMW = value;
        }
        rawMatches.push(match[0]);
        break;
      }
    }
  }
  
  // Grid connection detection
  if (/off[- ]?grid/i.test(text)) {
    specs.gridConnection = 'off-grid';
    rawMatches.push('off-grid');
  } else if (/island(?:ed)?|isolated|standalone/i.test(text)) {
    specs.gridConnection = 'off-grid';
  } else if (/limited|unreliable|backup/i.test(text)) {
    specs.gridConnection = 'limited';
  } else {
    specs.gridConnection = 'on-grid';
  }
  
  // Budget extraction
  const budgetPatterns = [
    /budget\s*[:=]?\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:k|m|million|thousand)?/gi,
    /\$\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:m|million)/gi,
  ];
  
  for (const pattern of budgetPatterns) {
    const match = text.match(pattern);
    if (match) {
      let value = parseFloat(match[1].replace(/,/g, ''));
      if (/million|m\b/i.test(match[0])) value *= 1000000;
      if (/thousand|k\b/i.test(match[0])) value *= 1000;
      specs.budgetMax = value;
      rawMatches.push(match[0]);
      break;
    }
  }
  
  // Project name extraction (look for common patterns)
  const projectPatterns = [
    /project\s*(?:name)?[:=]?\s*["']?([^"'\n]+)["']?/gi,
    /(?:re|subject)[:=]\s*(.+?)(?:\n|$)/gi,
  ];
  
  for (const pattern of projectPatterns) {
    const match = pattern.exec(text);
    if (match && match[1]) {
      specs.projectName = match[1].trim().substring(0, 100);
      rawMatches.push(match[0]);
      break;
    }
  }
  
  return specs;
}

/**
 * Extract specs using OpenAI GPT-4
 */
async function extractWithAI(text: string): Promise<Partial<ExtractedSpecs> | null> {
  // Check if we have OpenAI configuration
  const { data: config } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'openai_api_key')
    .single();
  
  if (!config?.value) {
    console.log('OpenAI API key not configured, skipping AI extraction');
    return null;
  }
  
  // Truncate text to fit in context window (roughly 12k chars for ~4k tokens)
  const truncatedText = text.substring(0, 12000);
  
  const prompt = `Extract battery energy storage system (BESS) specifications from this document. Return ONLY valid JSON.

Document text:
${truncatedText}

Extract these fields (use null if not found):
{
  "storageSizeMW": <number or null>,
  "energyMWh": <number or null>,
  "durationHours": <number or null>,
  "state": "<2-letter state code or null>",
  "city": "<city name or null>",
  "zipCode": "<zip code or null>",
  "projectName": "<project name or null>",
  "customerName": "<customer/company name or null>",
  "industry": "<one of: hotel, hospital, data-center, ev-charging, manufacturing, warehouse, retail, office, residential, microgrid, car-wash, or null>",
  "solarMW": <number or null>,
  "windMW": <number or null>,
  "generatorMW": <number or null>,
  "gridConnection": "<on-grid, off-grid, or limited>",
  "budgetMax": <number in USD or null>,
  "confidence": <0-100 based on how clearly specs were stated>
}

Return ONLY the JSON object, no markdown, no explanation.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.value}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are a technical document analyzer specializing in energy storage systems. Extract specifications accurately and return valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in OpenAI response');
    }
    
    // Parse JSON (handle potential markdown wrapping)
    const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(jsonStr);
    
    return {
      ...parsed,
      extractionMethod: 'ai' as const,
    };
  } catch (error) {
    console.error('AI extraction error:', error);
    return null;
  }
}

/**
 * Merge regex and AI extractions, preferring AI when confident
 */
function mergeExtractions(
  regex: ExtractedSpecs,
  ai: Partial<ExtractedSpecs> | null
): ExtractedSpecs {
  if (!ai) {
    return regex;
  }
  
  const merged: ExtractedSpecs = {
    ...regex,
    extractionMethod: 'hybrid',
    confidence: Math.max(regex.confidence, ai.confidence || 0),
  };
  
  // AI takes precedence for these fields when present
  const aiPreferredFields: (keyof ExtractedSpecs)[] = [
    'storageSizeMW', 'energyMWh', 'durationHours',
    'state', 'city', 'zipCode',
    'projectName', 'customerName', 'industry', 'useCase',
    'solarMW', 'windMW', 'generatorMW',
    'gridConnection', 'budgetMax',
  ];
  
  for (const field of aiPreferredFields) {
    if (ai[field] !== null && ai[field] !== undefined) {
      (merged as any)[field] = ai[field];
    }
  }
  
  return merged;
}

/**
 * Validate extracted specs and generate warnings/suggestions
 */
function validateSpecs(
  specs: ExtractedSpecs,
  warnings: string[],
  suggestions: string[]
): void {
  // Check for missing critical fields
  if (!specs.storageSizeMW && !specs.storageSizeKW) {
    warnings.push('Power capacity (MW or kW) not detected');
    suggestions.push('Add power capacity like "2 MW" or "500 kW"');
  }
  
  if (!specs.durationHours && !specs.energyMWh) {
    warnings.push('Duration or energy capacity not detected');
    suggestions.push('Add duration like "4-hour system" or energy like "8 MWh"');
  }
  
  if (!specs.state && !specs.zipCode) {
    warnings.push('Location not detected');
    suggestions.push('Add state or zip code for accurate pricing');
  }
  
  // Sanity checks
  if (specs.storageSizeMW && specs.storageSizeMW > 500) {
    warnings.push(`Unusually large system size: ${specs.storageSizeMW} MW`);
  }
  
  if (specs.durationHours && specs.durationHours > 12) {
    warnings.push(`Long duration storage: ${specs.durationHours} hours`);
  }
  
  // Add helpful suggestions
  if (!specs.industry) {
    suggestions.push('Specify industry (hotel, hospital, data center, etc.) for optimized recommendations');
  }
  
  if (!specs.solarMW && !specs.windMW) {
    suggestions.push('Consider adding solar or wind for better economics');
  }
}

/**
 * Generate human-readable summary of extracted specs
 */
function generateSummary(specs: ExtractedSpecs): string {
  const parts: string[] = [];
  
  if (specs.projectName) {
    parts.push(`Project: ${specs.projectName}`);
  }
  
  if (specs.storageSizeMW) {
    const energy = specs.energyMWh || (specs.durationHours ? specs.storageSizeMW * specs.durationHours : null);
    parts.push(`${specs.storageSizeMW} MW${energy ? ` / ${energy} MWh` : ''} BESS`);
  } else if (specs.storageSizeKW) {
    parts.push(`${specs.storageSizeKW} kW BESS`);
  }
  
  if (specs.durationHours) {
    parts.push(`${specs.durationHours}-hour duration`);
  }
  
  if (specs.state || specs.city) {
    parts.push(`Location: ${specs.city ? specs.city + ', ' : ''}${specs.state || ''}`);
  }
  
  if (specs.industry) {
    parts.push(`Industry: ${specs.industry.replace(/-/g, ' ')}`);
  }
  
  if (specs.solarMW) {
    parts.push(`+ ${specs.solarMW} MW Solar`);
  }
  
  if (specs.windMW) {
    parts.push(`+ ${specs.windMW} MW Wind`);
  }
  
  if (parts.length === 0) {
    return 'No specifications detected. Please review the document or enter details manually.';
  }
  
  return parts.join(' • ');
}

/**
 * Convert extracted specs to QuoteEngine input format
 */
export function specsToQuoteInput(specs: ExtractedSpecs): {
  storageSizeMW: number;
  durationHours: number;
  location?: string;
  solarMW?: number;
  windMW?: number;
  generatorMW?: number;
  gridConnection?: 'on-grid' | 'off-grid' | 'limited';
  useCase?: string;
} {
  return {
    storageSizeMW: specs.storageSizeMW || (specs.storageSizeKW ? specs.storageSizeKW / 1000 : 1),
    durationHours: specs.durationHours || 4,
    location: specs.state,
    solarMW: specs.solarMW,
    windMW: specs.windMW,
    generatorMW: specs.generatorMW,
    gridConnection: specs.gridConnection,
    useCase: specs.useCase || specs.industry,
  };
}
