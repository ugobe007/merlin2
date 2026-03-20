/**
 * AI-Powered Analysis Service
 * Uses OpenAI GPT-4 for intelligent entity extraction and opportunity analysis
 */

import type { Opportunity, OpportunitySignal, IndustryType } from "../types/opportunity";

// OpenAI API configuration
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export interface AIAnalysisResult {
  company_name: string;
  industry: IndustryType;
  location?: string;
  project_type: string;
  estimated_budget?: string;
  timeline?: string;
  decision_makers?: Array<{
    name: string;
    title: string;
    email?: string;
    linkedin?: string;
  }>;
  key_details: string[];
  signals: OpportunitySignal[];
  confidence_score: number;
  reasoning: string;
}

/**
 * Validate if a company name is legitimate (not junk)
 */
function isValidCompanyName(name: string): boolean {
  if (!name || name.length < 2) return false;

  // Reject generic/junk phrases
  const junkPatterns = [
    /^(the|a|an)\s+$/i,
    /^(new|latest|breaking|report|update|news)$/i,
    /^(business|company|corporation|firm|enterprise)\s*$/i,
    /^(it|this|that|these|those|here|there)$/i,
    /^(what|where|when|why|how|who)\b/i,
    /^\d+[\d\s,.-]*$/, // Just numbers
    /\b(plans to|set to|expected to|will|announces)\b/i,
  ];

  for (const pattern of junkPatterns) {
    if (pattern.test(name)) return false;
  }

  // Must have at least one letter
  if (!/[a-zA-Z]/.test(name)) return false;

  // Should not be too long (likely a sentence fragment)
  if (name.length > 100) return false;

  return true;
}

const ANALYSIS_PROMPT = `You are an expert business analyst specializing in identifying energy infrastructure opportunities for BESS (Battery Energy Storage Systems) projects.

Analyze the following news article and extract structured information in JSON format.

CRITICAL: Extract the ACTUAL company name (e.g., "Amazon", "Tesla", "Microsoft"), NOT descriptive phrases like "Company plans" or "New facility". If you cannot identify a real company name, use "Unknown".

Focus on:
1. Company name (the organization undertaking the project)
2. Industry category
3. Location (city, state, country)
4. Project type and scale (MW, square feet, investment amount)
5. Timeline (construction start, completion dates)
6. Decision makers (names, titles if mentioned)
7. Budget/investment amount
8. Opportunity signals (construction, expansion, energy needs, etc.)
9. Key details relevant to BESS opportunities

Return ONLY valid JSON in this exact format:
{
  "company_name": "string",
  "industry": "data_center|manufacturing|logistics|hospitality|healthcare|retail|education|automotive|other",
  "location": "string or null",
  "project_type": "string describing the project",
  "estimated_budget": "string with $ amount or null",
  "timeline": "string with dates or null",
  "decision_makers": [
    {
      "name": "string",
      "title": "string",
      "email": "string or null",
      "linkedin": "string or null"
    }
  ],
  "key_details": ["array", "of", "important", "facts"],
  "signals": ["construction", "expansion", "new_opening", "funding", "acquisition", "sustainability_initiative", "energy_upgrade", "facility_upgrade"],
  "confidence_score": 0-100,
  "reasoning": "brief explanation of why this is a good/bad opportunity"
}

Article to analyze:`;

/**
 * Analyze article content using AI to extract structured opportunity data
 */
export async function analyzeArticleWithAI(
  title: string,
  description: string,
  sourceUrl: string
): Promise<AIAnalysisResult | null> {
  if (!OPENAI_API_KEY) {
    console.warn("OpenAI API key not configured, skipping AI analysis");
    return null;
  }

  try {
    const articleText = `Title: ${title}\n\nDescription: ${description}\n\nSource: ${sourceUrl}`;

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Fast and cost-effective
        messages: [
          {
            role: "system",
            content:
              "You are an expert business intelligence analyst. Extract structured data from news articles in JSON format. Be precise and factual.",
          },
          {
            role: "user",
            content: `${ANALYSIS_PROMPT}\n\n${articleText}`,
          },
        ],
        temperature: 0.1, // Low temperature for factual extraction
        max_tokens: 1000,
        response_format: { type: "json_object" }, // Ensure JSON response
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI API error:", error);
      return null;
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.error("No content in OpenAI response");
      return null;
    }

    // Parse the JSON response
    const result: AIAnalysisResult = JSON.parse(content);

    // Validate required fields
    if (!result.company_name || !result.industry) {
      console.error("Invalid AI analysis result: missing required fields");
      return null;
    }

    // Validate company name quality
    if (
      !isValidCompanyName(result.company_name) ||
      result.company_name.toLowerCase() === "unknown"
    ) {
      console.warn(`Rejecting junk company name: "${result.company_name}"`);
      return null;
    }

    return result;
  } catch (error) {
    console.error("AI analysis error:", error);
    return null;
  }
}

/**
 * Enrich opportunity with AI analysis
 */
export async function enrichOpportunityWithAI(opportunity: Opportunity): Promise<Opportunity> {
  const aiResult = await analyzeArticleWithAI(
    opportunity.company_name,
    opportunity.description,
    opportunity.source_url
  );

  if (!aiResult) {
    // Return original opportunity if AI analysis fails
    return opportunity;
  }

  // Merge AI analysis with opportunity data
  return {
    ...opportunity,
    company_name: aiResult.company_name || opportunity.company_name,
    industry: aiResult.industry || opportunity.industry,
    location: aiResult.location || opportunity.location,
    signals: aiResult.signals.length > 0 ? aiResult.signals : opportunity.signals,
    confidence_score: Math.max(aiResult.confidence_score, opportunity.confidence_score),
    notes: [
      aiResult.reasoning,
      `Project: ${aiResult.project_type}`,
      aiResult.estimated_budget ? `Budget: ${aiResult.estimated_budget}` : "",
      aiResult.timeline ? `Timeline: ${aiResult.timeline}` : "",
      ...aiResult.key_details,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

/**
 * Batch analyze multiple articles with rate limiting
 */
export async function batchAnalyzeArticles(
  opportunities: Opportunity[],
  maxConcurrent = 5
): Promise<Opportunity[]> {
  const enriched: Opportunity[] = [];

  // Process in batches to avoid rate limits
  for (let i = 0; i < opportunities.length; i += maxConcurrent) {
    const batch = opportunities.slice(i, i + maxConcurrent);
    const results = await Promise.all(batch.map((opp) => enrichOpportunityWithAI(opp)));
    enriched.push(...results);

    // Rate limiting: wait 1 second between batches
    if (i + maxConcurrent < opportunities.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(
      `AI analysis progress: ${Math.min(i + maxConcurrent, opportunities.length)}/${opportunities.length}`
    );
  }

  return enriched;
}
