/**
 * Energy News Service
 * Fetches and ranks recent energy news from scraped articles
 */

import { supabase } from "./supabaseClient";

export interface EnergyNewsStory {
  id: string;
  title: string;
  subtitle?: string;
  url: string;
  source: string;
  publishedDate: string;
  summary: string;
  content?: string;
  topics: string[];
  equipment: string[];
  relevanceScore: number;
  imageUrl?: string;
}

interface NewsFilters {
  topics?: string[];
  equipment?: string[];
  dateRange?: "today" | "week" | "month";
  limit?: number;
}

/**
 * Calculate relevance score based on multiple factors
 */
function calculateRelevanceScore(article: any): number {
  let score = 0;

  // Recency boost (max 40 points)
  const hoursSincePublished =
    (Date.now() - new Date(article.published_at || article.scraped_at).getTime()) /
    (1000 * 60 * 60);
  if (hoursSincePublished < 6) score += 40;
  else if (hoursSincePublished < 24) score += 30;
  else if (hoursSincePublished < 72) score += 20;
  else score += 10;

  // Equipment diversity (max 20 points)
  const equipmentCount = article.equipment_mentioned?.length || 0;
  score += Math.min(equipmentCount * 5, 20);

  // Topic relevance (max 20 points)
  const topicCount = article.topics?.length || 0;
  score += Math.min(topicCount * 5, 20);

  // Source credibility (max 20 points) - simplified for now
  score += 15; // Default credibility score

  return score;
}

/**
 * Get top energy news stories from scraped articles
 */
export async function getTopEnergyNews(filters: NewsFilters = {}): Promise<EnergyNewsStory[]> {
  const { topics, equipment, dateRange = "today", limit = 15 } = filters;

  // Calculate date cutoff
  const now = new Date();
  let dateFrom: Date;
  switch (dateRange) {
    case "today":
      dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "week":
      dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  // Build query - simplified without join to avoid RLS issues
  let query = supabase
    .from("scraped_articles")
    .select(
      "id, title, url, excerpt, content, published_at, scraped_at, equipment_mentioned, topics, relevance_score, source_id"
    )
    .gte("scraped_at", dateFrom.toISOString())
    .order("scraped_at", { ascending: false })
    .limit(100); // Get more than needed for filtering

  // Apply filters
  if (topics && topics.length > 0) {
    query = query.contains("topics", topics);
  }

  if (equipment && equipment.length > 0) {
    query = query.contains("equipment_mentioned", equipment);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching energy news:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Calculate relevance scores and transform
  const stories: EnergyNewsStory[] = data.map((article: any) => ({
    id: article.id,
    title: article.title || "Untitled Article",
    subtitle: article.excerpt || "",
    url: article.url,
    source: "Energy News", // Simplified - can enhance later with source lookup
    publishedDate: article.published_at || article.scraped_at,
    summary: article.excerpt || article.content?.substring(0, 200) + "..." || "",
    content: article.content || "",
    topics: article.topics || [],
    equipment: article.equipment_mentioned || [],
    relevanceScore: calculateRelevanceScore(article),
    imageUrl: undefined, // Could extract from content later
  }));

  // Sort by relevance score
  stories.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Return top N
  return stories.slice(0, limit);
}

/**
 * Get available topic filters from recent articles
 */
export async function getAvailableTopics(): Promise<string[]> {
  const { data, error } = await supabase
    .from("scraped_articles")
    .select("topics")
    .gte("scraped_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .not("topics", "is", null);

  if (error || !data) return [];

  const topicsSet = new Set<string>();
  data.forEach((article: any) => {
    article.topics?.forEach((topic: string) => topicsSet.add(topic));
  });

  return Array.from(topicsSet).sort();
}

/**
 * Get available equipment filters from recent articles
 */
export async function getAvailableEquipment(): Promise<string[]> {
  const { data, error } = await supabase
    .from("scraped_articles")
    .select("equipment_mentioned")
    .gte("scraped_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .not("equipment_mentioned", "is", null);

  if (error || !data) return [];

  const equipmentSet = new Set<string>();
  data.forEach((article: any) => {
    article.equipment_mentioned?.forEach((eq: string) => equipmentSet.add(eq));
  });

  return Array.from(equipmentSet).sort();
}

/**
 * Get news statistics for display
 */
export async function getNewsStats(): Promise<{
  totalToday: number;
  totalWeek: number;
  totalMonth: number;
  lastScraped: string;
}> {
  const now = new Date();
  const today = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const week = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const month = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [todayResult, weekResult, monthResult, lastScrapedResult] = await Promise.all([
    supabase
      .from("scraped_articles")
      .select("id", { count: "exact" })
      .gte("scraped_at", today.toISOString()),
    supabase
      .from("scraped_articles")
      .select("id", { count: "exact" })
      .gte("scraped_at", week.toISOString()),
    supabase
      .from("scraped_articles")
      .select("id", { count: "exact" })
      .gte("scraped_at", month.toISOString()),
    supabase
      .from("scraped_articles")
      .select("scraped_at")
      .order("scraped_at", { ascending: false })
      .limit(1),
  ]);

  return {
    totalToday: todayResult.count || 0,
    totalWeek: weekResult.count || 0,
    totalMonth: monthResult.count || 0,
    lastScraped: (lastScrapedResult.data?.[0] as any)?.scraped_at || "Unknown",
  };
}
