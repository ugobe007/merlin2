/**
 * Opportunity Scraper API Endpoint
 * Runs the scraper and stores results in Supabase
 */

import { scrapeOpportunities } from "../services/opportunityScraperService";
import { supabase } from "../lib/supabase";

/**
 * Run scraper and store opportunities
 */
export async function runOpportunityScraper(): Promise<{
  success: boolean;
  message: string;
  data?: {
    total_found: number;
    new_opportunities: number;
    duplicates_skipped: number;
  };
  error?: string;
}> {
  try {
    console.log("🧙‍♂️ Merlin is searching for opportunities...");

    // Run the scraper
    const result = await scrapeOpportunities();

    // Store results in database
    let newOpps = 0;
    let duplicates = 0;

    for (const opp of result.opportunities) {
      try {
        // Check if opportunity already exists (by source URL)
        const { data: existing } = await supabase
          .from("opportunities")
          .select("id")
          .eq("source_url", opp.source_url)
          .single();

        if (existing) {
          duplicates++;
          continue;
        }

        // Insert new opportunity
        const { error } = await supabase.from("opportunities").insert(opp);

        if (error) {
          console.error("Error inserting opportunity:", error);
          continue;
        }

        newOpps++;
      } catch (error) {
        console.error("Error processing opportunity:", error);
      }
    }

    // Log scraper run
    await supabase.from("scraper_runs").insert({
      source: result.source,
      total_found: result.total_found,
      duplicates_skipped: duplicates,
      status: "success",
    });

    console.log(`✅ Scraper complete: ${newOpps} new opportunities saved`);

    return {
      success: true,
      message: `Found ${result.total_found} opportunities, saved ${newOpps} new ones`,
      data: {
        total_found: result.total_found,
        new_opportunities: newOpps,
        duplicates_skipped: duplicates,
      },
    };
  } catch (error) {
    console.error("Scraper error:", error);

    // Log failed run
    await supabase.from("scraper_runs").insert({
      source: "news_aggregator",
      total_found: 0,
      duplicates_skipped: 0,
      status: "failed",
      error_message: error instanceof Error ? error.message : "Unknown error",
    });

    return {
      success: false,
      message: "Scraper failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Manual trigger endpoint (for testing)
 */
export async function handleScraperRequest(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const result = await runOpportunityScraper();

  return new Response(JSON.stringify(result), {
    status: result.success ? 200 : 500,
    headers: { "Content-Type": "application/json" },
  });
}
