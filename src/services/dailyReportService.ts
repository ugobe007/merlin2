/**
 * Daily BESS Market Intelligence Report Service
 *
 * Aggregates industry news, pricing trends, deployments, and potential customers
 * Sends formatted email digest via Resend
 */

import { Resend } from "resend";

// Initialize Resend - add VITE_RESEND_API_KEY to your .env
const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

// ============================================================================
// TYPES
// ============================================================================

export interface NewsItem {
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  category: "deployment" | "pricing" | "policy" | "technology" | "customer";
  relevanceScore: number;
}

export interface CompanyMention {
  name: string;
  type: "epc" | "engineering" | "construction" | "developer" | "customer" | "manufacturer";
  context: string;
  projectSize?: string;
  location?: string;
}

export interface PricingUpdate {
  batteryType: "LFP" | "NMC" | "Sodium-Ion" | "Flow";
  pricePerKwh: number;
  change: number; // percentage
  source: string;
  date: string;
}

export interface DailyReport {
  date: string;
  executiveSummary: string;
  newsItems: NewsItem[];
  companyMentions: CompanyMention[];
  pricingUpdates: PricingUpdate[];
  potentialCustomers: CompanyMention[];
  newDeployments: {
    project: string;
    size: string;
    location: string;
    companies: string[];
    useCase: string;
  }[];
}

// ============================================================================
// RSS FEED SOURCES
// ============================================================================

export const RSS_FEEDS = {
  energyStorage: [
    { name: "Energy Storage News", url: "https://www.energy-storage.news/feed/" },
    {
      name: "Utility Dive - Storage",
      url: "https://www.utilitydive.com/feeds/topic/energy-storage/",
    },
    { name: "PV Magazine", url: "https://pv-magazine-usa.com/feed/" },
    { name: "Canary Media", url: "https://www.canarymedia.com/feed" },
    { name: "CleanTechnica", url: "https://cleantechnica.com/feed/" },
  ],
  industry: [
    { name: "GreenTech Media", url: "https://www.greentechmedia.com/feed" },
    { name: "Solar Power World", url: "https://www.solarpowerworldonline.com/feed/" },
  ],
  business: [
    {
      name: "Business Wire - Energy",
      url: "https://feed.businesswire.com/rss/home/?rss=G1QFDERJXkJeGVtTWg==",
    },
    { name: "PR Newswire - Energy", url: "https://www.prnewswire.com/rss/energy-latest-news.rss" },
  ],
};

// ============================================================================
// KEY COMPANIES TO TRACK
// ============================================================================

export const TRACKED_COMPANIES = {
  epc: [
    "Fluence",
    "Sungrow",
    "BYD",
    "CATL",
    "Tesla",
    "Wärtsilä",
    "Powin",
    "ESS Inc",
    "Form Energy",
    "Energy Vault",
  ],
  engineering: [
    "Black & Veatch",
    "Burns & McDonnell",
    "Stantec",
    "AECOM",
    "Jacobs",
    "HDR",
    "Tetra Tech",
    "WSP",
  ],
  construction: [
    "Mortenson",
    "McCarthy",
    "Rosendin",
    "Primoris",
    "Blattner",
    "Swinerton",
    "Moss Construction",
  ],
  developers: [
    "NextEra",
    "Intersect Power",
    "sPower",
    "Recurrent Energy",
    "EDF Renewables",
    "Invenergy",
    "Key Capture Energy",
    "Jupiter Power",
    "Plus Power",
    "Broad Reach Power",
  ],
  manufacturers: [
    "LG Energy",
    "Samsung SDI",
    "Panasonic",
    "CATL",
    "BYD",
    "EVE Energy",
    "CALB",
    "Gotion",
    "Northvolt",
  ],
};

// Industries that are potential customers
export const TARGET_INDUSTRIES = [
  "data center",
  "manufacturing",
  "cold storage",
  "warehouse",
  "hospital",
  "healthcare",
  "university",
  "college",
  "campus",
  "retail",
  "shopping center",
  "mall",
  "hotel",
  "resort",
  "airport",
  "ev charging",
  "fleet",
  "logistics",
  "food processing",
  "pharmaceutical",
  "semiconductor",
  "mining",
  "water treatment",
  "desalination",
];

// ============================================================================
// DATA AGGREGATION
// ============================================================================

/**
 * Fetch and parse RSS feeds
 */
export async function fetchRSSFeeds(): Promise<NewsItem[]> {
  const Parser = (await import("rss-parser")).default;
  const parser = new Parser();
  const allItems: NewsItem[] = [];

  const allFeeds = [...RSS_FEEDS.energyStorage, ...RSS_FEEDS.industry, ...RSS_FEEDS.business];

  for (const feed of allFeeds) {
    try {
      const result = await parser.parseURL(feed.url);

      for (const item of result.items.slice(0, 10)) {
        // Last 10 items per feed
        const newsItem: NewsItem = {
          title: item.title || "",
          summary: item.contentSnippet || item.content?.slice(0, 300) || "",
          source: feed.name,
          url: item.link || "",
          publishedAt: item.pubDate || new Date().toISOString(),
          category: categorizeNews(item.title || "", item.contentSnippet || ""),
          relevanceScore: calculateRelevance(item.title || "", item.contentSnippet || ""),
        };
        allItems.push(newsItem);
      }
    } catch (error) {
      console.warn(`Failed to fetch ${feed.name}:`, error);
    }
  }

  // Sort by relevance and date
  return allItems
    .filter((item) => item.relevanceScore > 0.3)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 30); // Top 30 most relevant
}

/**
 * Categorize news item based on content
 */
function categorizeNews(title: string, content: string): NewsItem["category"] {
  const text = `${title} ${content}`.toLowerCase();

  if (text.includes("price") || text.includes("cost") || text.includes("$/kwh")) {
    return "pricing";
  }
  if (
    text.includes("deploy") ||
    text.includes("commission") ||
    text.includes("install") ||
    text.includes("mwh project")
  ) {
    return "deployment";
  }
  if (
    text.includes("policy") ||
    text.includes("regulation") ||
    text.includes("ira") ||
    text.includes("incentive")
  ) {
    return "policy";
  }
  if (
    text.includes("breakthrough") ||
    text.includes("innovation") ||
    text.includes("new technology")
  ) {
    return "technology";
  }
  return "customer";
}

/**
 * Calculate relevance score based on keywords
 */
function calculateRelevance(title: string, content: string): number {
  const text = `${title} ${content}`.toLowerCase();
  let score = 0;

  // High-value keywords
  const highValue = ["bess", "battery storage", "energy storage", "mwh", "grid-scale"];
  const mediumValue = ["solar + storage", "microgrid", "peak shaving", "demand charge"];
  const companyMentions = [...TRACKED_COMPANIES.epc, ...TRACKED_COMPANIES.developers];
  const customerKeywords = TARGET_INDUSTRIES;

  highValue.forEach((kw) => {
    if (text.includes(kw)) score += 0.3;
  });
  mediumValue.forEach((kw) => {
    if (text.includes(kw)) score += 0.2;
  });
  companyMentions.forEach((co) => {
    if (text.toLowerCase().includes(co.toLowerCase())) score += 0.15;
  });
  customerKeywords.forEach((kw) => {
    if (text.includes(kw)) score += 0.1;
  });

  return Math.min(score, 1);
}

/**
 * Extract company mentions from news items
 */
export function extractCompanyMentions(newsItems: NewsItem[]): CompanyMention[] {
  const mentions: CompanyMention[] = [];
  const allCompanies = {
    ...TRACKED_COMPANIES,
  };

  for (const item of newsItems) {
    const text = `${item.title} ${item.summary}`;

    for (const [type, companies] of Object.entries(allCompanies)) {
      for (const company of companies) {
        if (text.toLowerCase().includes(company.toLowerCase())) {
          mentions.push({
            name: company,
            type: type as CompanyMention["type"],
            context: item.title,
            projectSize: extractProjectSize(text),
            location: extractLocation(text),
          });
        }
      }
    }
  }

  // Deduplicate
  const unique = mentions.reduce((acc, mention) => {
    const key = `${mention.name}-${mention.context}`;
    if (!acc.has(key)) {
      acc.set(key, mention);
    }
    return acc;
  }, new Map<string, CompanyMention>());

  return Array.from(unique.values());
}

/**
 * Extract project size from text (e.g., "100 MWh", "50 MW/200 MWh")
 */
function extractProjectSize(text: string): string | undefined {
  const patterns = [
    /(\d+(?:\.\d+)?)\s*mwh/i,
    /(\d+(?:\.\d+)?)\s*mw\s*\/\s*(\d+(?:\.\d+)?)\s*mwh/i,
    /(\d+(?:\.\d+)?)\s*gw/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  return undefined;
}

/**
 * Extract location from text
 */
function extractLocation(text: string): string | undefined {
  const states = [
    "California",
    "Texas",
    "Arizona",
    "Nevada",
    "Florida",
    "New York",
    "Massachusetts",
  ];
  const countries = ["Australia", "UK", "Germany", "China", "Japan", "India"];

  for (const loc of [...states, ...countries]) {
    if (text.includes(loc)) return loc;
  }
  return undefined;
}

/**
 * Identify potential customers from news
 */
export function identifyPotentialCustomers(newsItems: NewsItem[]): CompanyMention[] {
  const customers: CompanyMention[] = [];

  for (const item of newsItems) {
    const text = `${item.title} ${item.summary}`.toLowerCase();

    // Look for companies announcing sustainability goals, high energy costs, etc.
    const customerSignals = [
      "sustainability",
      "carbon neutral",
      "net zero",
      "energy costs",
      "renewable energy",
      "clean energy transition",
      "electricity bill",
      "demand response",
      "backup power",
      "resilience",
    ];

    const hasSignal = customerSignals.some((signal) => text.includes(signal));
    const hasIndustry = TARGET_INDUSTRIES.some((ind) => text.includes(ind));

    if (hasSignal && hasIndustry) {
      // Extract company name (simplified - would use NER in production)
      const companyMatch = item.title.match(/^([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/);
      if (companyMatch) {
        customers.push({
          name: companyMatch[1],
          type: "customer",
          context: item.title,
          location: extractLocation(item.summary),
        });
      }
    }
  }

  return customers;
}

// ============================================================================
// AI SUMMARIZATION (Optional - requires OpenAI)
// ============================================================================

/**
 * Generate executive summary using AI
 */
export async function generateExecutiveSummary(
  newsItems: NewsItem[],
  companies: CompanyMention[]
): Promise<string> {
  // If no OpenAI key, generate a basic summary
  if (!import.meta.env.VITE_OPENAI_API_KEY) {
    const deployments = newsItems.filter((n) => n.category === "deployment").length;
    const pricing = newsItems.filter((n) => n.category === "pricing").length;
    const topCompanies = companies
      .slice(0, 5)
      .map((c) => c.name)
      .join(", ");

    return (
      `Today's BESS Market Update: ${newsItems.length} relevant articles tracked. ` +
      `${deployments} new deployment announcements, ${pricing} pricing updates. ` +
      `Key companies mentioned: ${topCompanies || "Various"}. ` +
      `See details below for actionable intelligence.`
    );
  }

  // TODO: Add OpenAI integration for better summaries
  return "AI summary generation requires OpenAI API key.";
}

// ============================================================================
// EMAIL GENERATION
// ============================================================================

/**
 * Generate HTML email template
 */
export function generateEmailHTML(report: DailyReport): string {
  const { date, executiveSummary, newsItems, companyMentions, potentialCustomers, newDeployments } =
    report;

  const deploymentNews = newsItems.filter((n) => n.category === "deployment");
  const pricingNews = newsItems.filter((n) => n.category === "pricing");
  const policyNews = newsItems.filter((n) => n.category === "policy");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Merlin BESS Daily Intelligence - ${date}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 700px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .header .date { opacity: 0.9; margin-top: 8px; }
    .section { padding: 25px; border-bottom: 1px solid #eee; }
    .section:last-child { border-bottom: none; }
    .section h2 { color: #1e3a5f; margin-top: 0; font-size: 20px; display: flex; align-items: center; gap: 10px; }
    .section h2 .emoji { font-size: 24px; }
    .summary-box { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 0 8px 8px 0; margin-bottom: 20px; }
    .news-item { margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #f0f0f0; }
    .news-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .news-title { font-weight: 600; color: #1e3a5f; text-decoration: none; }
    .news-title:hover { color: #3b82f6; }
    .news-meta { font-size: 12px; color: #666; margin-top: 5px; }
    .news-summary { font-size: 14px; color: #444; margin-top: 8px; line-height: 1.5; }
    .company-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .company-tag { background: #e0f2fe; color: #0369a1; padding: 8px 12px; border-radius: 6px; font-size: 13px; }
    .company-tag.epc { background: #dcfce7; color: #166534; }
    .company-tag.customer { background: #fef3c7; color: #92400e; }
    .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; text-align: center; }
    .stat-box { background: #f8fafc; padding: 15px; border-radius: 8px; }
    .stat-number { font-size: 32px; font-weight: 700; color: #1e3a5f; }
    .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .cta-button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>⚡ Merlin BESS Intelligence</h1>
      <div class="date">${new Date(date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
    </div>

    <!-- Executive Summary -->
    <div class="section">
      <h2><span class="emoji">📊</span> Executive Summary</h2>
      <div class="summary-box">
        ${executiveSummary}
      </div>
      <div class="stat-grid">
        <div class="stat-box">
          <div class="stat-number">${newsItems.length}</div>
          <div class="stat-label">Articles Tracked</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">${companyMentions.length}</div>
          <div class="stat-label">Companies Mentioned</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">${potentialCustomers.length}</div>
          <div class="stat-label">Potential Leads</div>
        </div>
      </div>
    </div>

    <!-- New Deployments -->
    ${
      deploymentNews.length > 0
        ? `
    <div class="section">
      <h2><span class="emoji">🔋</span> New BESS Deployments</h2>
      ${deploymentNews
        .slice(0, 5)
        .map(
          (item) => `
        <div class="news-item">
          <a href="${item.url}" class="news-title">${item.title}</a>
          <div class="news-meta">${item.source} • ${new Date(item.publishedAt).toLocaleDateString()}</div>
          <div class="news-summary">${item.summary.slice(0, 200)}...</div>
        </div>
      `
        )
        .join("")}
    </div>
    `
        : ""
    }

    <!-- Pricing Updates -->
    ${
      pricingNews.length > 0
        ? `
    <div class="section">
      <h2><span class="emoji">💰</span> Pricing & Market Updates</h2>
      ${pricingNews
        .slice(0, 3)
        .map(
          (item) => `
        <div class="news-item">
          <a href="${item.url}" class="news-title">${item.title}</a>
          <div class="news-meta">${item.source} • ${new Date(item.publishedAt).toLocaleDateString()}</div>
          <div class="news-summary">${item.summary.slice(0, 200)}...</div>
        </div>
      `
        )
        .join("")}
    </div>
    `
        : ""
    }

    <!-- Key Companies -->
    ${
      companyMentions.length > 0
        ? `
    <div class="section">
      <h2><span class="emoji">🏢</span> Key Companies in the News</h2>
      <div class="company-grid">
        ${companyMentions
          .slice(0, 10)
          .map(
            (company) => `
          <div class="company-tag ${company.type}">${company.name} <small>(${company.type})</small></div>
        `
          )
          .join("")}
      </div>
    </div>
    `
        : ""
    }

    <!-- Potential Customers -->
    ${
      potentialCustomers.length > 0
        ? `
    <div class="section">
      <h2><span class="emoji">🎯</span> Potential Customer Leads</h2>
      <p style="color: #666; font-size: 14px;">Companies showing interest in energy storage or sustainability:</p>
      ${potentialCustomers
        .slice(0, 5)
        .map(
          (customer) => `
        <div class="news-item">
          <strong>${customer.name}</strong>
          ${customer.location ? `<span style="color: #666;"> • ${customer.location}</span>` : ""}
          <div class="news-summary">${customer.context}</div>
        </div>
      `
        )
        .join("")}
    </div>
    `
        : ""
    }

    <!-- Policy Updates -->
    ${
      policyNews.length > 0
        ? `
    <div class="section">
      <h2><span class="emoji">📜</span> Policy & Regulatory</h2>
      ${policyNews
        .slice(0, 3)
        .map(
          (item) => `
        <div class="news-item">
          <a href="${item.url}" class="news-title">${item.title}</a>
          <div class="news-meta">${item.source}</div>
        </div>
      `
        )
        .join("")}
    </div>
    `
        : ""
    }

    <!-- CTA -->
    <div class="section" style="text-align: center;">
      <h2><span class="emoji">⚡</span> Ready to Quote?</h2>
      <p>Use Merlin to generate instant BESS quotes for any of these opportunities.</p>
      <a href="https://merlinenergy.net" class="cta-button">Open Quote Builder →</a>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>Merlin Energy Intelligence • <a href="https://merlinenergy.net">merlinenergy.net</a></p>
      <p>You're receiving this because you subscribed to daily BESS market updates.</p>
      <p><a href="#">Unsubscribe</a> • <a href="#">Update Preferences</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

// ============================================================================
// MAIN REPORT GENERATION & SENDING
// ============================================================================

/**
 * Generate the full daily report
 */
export async function generateDailyReport(): Promise<DailyReport> {
  if (import.meta.env.DEV) {
    console.log("📊 Generating daily BESS intelligence report...");
  }

  // Fetch news from RSS feeds
  const newsItems = await fetchRSSFeeds();
  if (import.meta.env.DEV) {
    console.log(`  ✓ Fetched ${newsItems.length} relevant news items`);
  }

  // Extract company mentions
  const companyMentions = extractCompanyMentions(newsItems);
  if (import.meta.env.DEV) {
    console.log(`  ✓ Found ${companyMentions.length} company mentions`);
  }

  // Identify potential customers
  const potentialCustomers = identifyPotentialCustomers(newsItems);
  if (import.meta.env.DEV) {
    console.log(`  ✓ Identified ${potentialCustomers.length} potential customer leads`);
  }

  // Generate executive summary
  const executiveSummary = await generateExecutiveSummary(newsItems, companyMentions);

  const report: DailyReport = {
    date: new Date().toISOString(),
    executiveSummary,
    newsItems,
    companyMentions,
    pricingUpdates: [], // TODO: Add dedicated pricing API
    potentialCustomers,
    newDeployments: [], // Extracted from deployment news
  };

  return report;
}

/**
 * Send the daily report via email
 */
export async function sendDailyReport(
  report: DailyReport,
  recipients: string[]
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!import.meta.env.VITE_RESEND_API_KEY) {
    return { success: false, error: "Resend API key not configured" };
  }

  const html = generateEmailHTML(report);
  const date = new Date(report.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  try {
    const response = await resend.emails.send({
      from: "Merlin Intelligence <reports@merlinenergy.net>", // Update with your verified domain
      to: recipients,
      subject: `⚡ BESS Market Intelligence - ${date} | ${report.newsItems.length} Updates`,
      html: html,
    });

    if (import.meta.env.DEV) {
      console.log("✅ Daily report sent successfully:", response);
    }
    return { success: true, messageId: response.data?.id };
  } catch (error: any) {
    console.error("❌ Failed to send daily report:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Preview report in browser (for testing)
 */
export function previewReportHTML(report: DailyReport): void {
  const html = generateEmailHTML(report);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}

// ============================================================================
// SUBSCRIBER MANAGEMENT
// ============================================================================

export interface Subscriber {
  email: string;
  name?: string;
  company?: string;
  preferences: {
    deployments: boolean;
    pricing: boolean;
    policy: boolean;
    customerLeads: boolean;
  };
  subscribedAt: string;
  active: boolean;
}

// Store subscribers in Supabase (we'll add the table)
export async function addSubscriber(
  subscriber: Omit<Subscriber, "subscribedAt" | "active">
): Promise<boolean> {
  // TODO: Implement Supabase storage
  if (import.meta.env.DEV) {
    console.log("Adding subscriber:", subscriber.email);
  }
  return true;
}

export async function getActiveSubscribers(): Promise<string[]> {
  // TODO: Fetch from Supabase
  // For now, return empty array
  return [];
}

// ============================================================================
// SCHEDULED EXECUTION
// ============================================================================

/**
 * Run the daily report job
 * Call this from a cron job or Supabase Edge Function
 */
export async function runDailyReportJob(): Promise<void> {
  if (import.meta.env.DEV) {
    console.log("🚀 Starting daily BESS intelligence report job...");
  }

  try {
    // Generate the report
    const report = await generateDailyReport();

    // Get subscribers
    const subscribers = await getActiveSubscribers();

    if (subscribers.length === 0) {
      if (import.meta.env.DEV) {
        console.log("⚠️ No subscribers to send to");
      }
      return;
    }

    // Send the report
    const result = await sendDailyReport(report, subscribers);

    if (result.success) {
      if (import.meta.env.DEV) {
        console.log(`✅ Daily report sent to ${subscribers.length} subscribers`);
      }
    } else {
      console.error("❌ Failed to send report:", result.error);
    }
  } catch (error) {
    console.error("❌ Daily report job failed:", error);
    throw error;
  }
}
