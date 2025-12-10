import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Supabase Edge Function: Daily Market Data Scraper
 * 
 * This function scrapes RSS feeds and extracts market pricing data.
 * Scheduled to run daily via Supabase cron.
 * 
 * Equipment types tracked:
 * - BESS, Solar, Wind, Generators (combustion + linear)
 * - Inverters, Transformers, Switchgear
 * - DC/AC Panels, EV Chargers (L1, L2, DCFC)
 * - ESS, BMS, AI Energy Management
 * - Microgrids, Hybrid Systems
 * 
 * Also tracks regulations and incentives.
 * 
 * Created: December 10, 2025
 */

const EQUIPMENT_KEYWORDS: Record<string, string[]> = {
  bess: ['battery energy storage', 'bess', 'battery storage', 'lithium-ion', 'lfp', 'nmc', 'megapack'],
  solar: ['solar', 'pv', 'photovoltaic', 'solar panel', 'solar module'],
  wind: ['wind turbine', 'wind farm', 'wind power', 'offshore wind'],
  generator: ['generator', 'diesel generator', 'natural gas generator'],
  'linear-generator': ['linear generator', 'mainspring', 'fuel cell'],
  inverter: ['inverter', 'solar inverter', 'microinverter'],
  transformer: ['transformer', 'power transformer'],
  switchgear: ['switchgear', 'circuit breaker'],
  'ev-charger': ['ev charger', 'charging station', 'dcfc', 'level 2'],
  bms: ['battery management system', 'bms'],
  microgrid: ['microgrid', 'micro-grid', 'islanded'],
  'hybrid-system': ['hybrid system', 'solar+storage']
};

function parseRSSFeed(xml: string): Array<{
  title: string;
  link: string;
  description: string;
  pubDate: string;
  content: string;
}> {
  const items: Array<{
    title: string;
    link: string;
    description: string;
    pubDate: string;
    content: string;
  }> = [];
  
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    items.push({
      title: extractTag(itemXml, 'title'),
      link: extractTag(itemXml, 'link') || extractAttr(itemXml, 'link', 'href'),
      description: extractTag(itemXml, 'description'),
      pubDate: extractTag(itemXml, 'pubDate'),
      content: extractTag(itemXml, 'content:encoded') || extractTag(itemXml, 'description')
    });
  }
  
  // Atom format
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
  while ((match = entryRegex.exec(xml)) !== null) {
    const entryXml = match[1];
    items.push({
      title: extractTag(entryXml, 'title'),
      link: extractAttr(entryXml, 'link', 'href'),
      description: extractTag(entryXml, 'summary'),
      pubDate: extractTag(entryXml, 'published') || extractTag(entryXml, 'updated'),
      content: extractTag(entryXml, 'content') || extractTag(entryXml, 'summary')
    });
  }
  
  return items;
}

function extractTag(xml: string, tag: string): string {
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i');
  const simpleRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  
  const cdataMatch = cdataRegex.exec(xml);
  if (cdataMatch) return cdataMatch[1].trim();
  
  const simpleMatch = simpleRegex.exec(xml);
  return simpleMatch ? simpleMatch[1].trim() : '';
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const regex = new RegExp(`<${tag}[^>]*${attr}=["']([^"']+)["']`, 'i');
  const match = regex.exec(xml);
  return match ? match[1] : '';
}

function classifyContent(text: string): {
  equipment: string[];
  topics: string[];
  relevanceScore: number;
} {
  const textLower = text.toLowerCase();
  const equipment: string[] = [];
  const topics: string[] = [];
  let relevanceScore = 0;
  
  for (const [category, keywords] of Object.entries(EQUIPMENT_KEYWORDS)) {
    const matches = keywords.filter(kw => textLower.includes(kw.toLowerCase()));
    if (matches.length > 0) {
      equipment.push(category);
      relevanceScore += matches.length * 0.1;
    }
  }
  
  if (textLower.includes('price') || textLower.includes('cost') || textLower.includes('$/')) {
    topics.push('pricing');
    relevanceScore += 0.3;
  }
  if (textLower.includes('regulation') || textLower.includes('policy') || textLower.includes('incentive')) {
    topics.push('policy');
    relevanceScore += 0.2;
  }
  
  return { equipment, topics, relevanceScore: Math.min(1, relevanceScore) };
}

function extractPrices(text: string, equipment: string[]): Array<{
  equipment: string;
  price: number;
  unit: string;
  context: string;
  confidence: number;
}> {
  const prices: Array<{
    equipment: string;
    price: number;
    unit: string;
    context: string;
    confidence: number;
  }> = [];
  
  if (equipment.includes('bess')) {
    const bessRegex = /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)\s*kWh/gi;
    let match;
    while ((match = bessRegex.exec(text)) !== null) {
      const price = parseFloat(match[1].replace(/,/g, ''));
      if (price > 50 && price < 2000) {
        const start = Math.max(0, match.index - 100);
        const end = Math.min(text.length, match.index + match[0].length + 100);
        prices.push({
          equipment: 'bess',
          price,
          unit: 'kWh',
          context: text.slice(start, end),
          confidence: 0.8
        });
      }
    }
  }
  
  if (equipment.includes('solar')) {
    const solarRegex = /\$\s*(\d+(?:\.\d{1,2})?)\s*(?:\/|per)\s*[Ww](?:att)?/gi;
    let match;
    while ((match = solarRegex.exec(text)) !== null) {
      const price = parseFloat(match[1]);
      if (price > 0.10 && price < 5) {
        const start = Math.max(0, match.index - 100);
        const end = Math.min(text.length, match.index + match[0].length + 100);
        prices.push({
          equipment: 'solar',
          price,
          unit: 'W',
          context: text.slice(start, end),
          confidence: 0.8
        });
      }
    }
  }
  
  return prices;
}

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('Starting daily market data scrape...');
    
    const results = {
      sourcesProcessed: 0,
      articlesFound: 0,
      articlesSaved: 0,
      pricesExtracted: 0,
      errors: [] as string[]
    };
    
    // Get all active RSS sources
    const { data: sources, error } = await supabase
      .from('market_data_sources')
      .select('*')
      .eq('is_active', true)
      .eq('source_type', 'rss_feed')
      .not('feed_url', 'is', null)
      .order('reliability_score', { ascending: false })
      .limit(50);  // Limit to prevent timeout
    
    if (error || !sources) {
      throw new Error(`Failed to fetch sources: ${error?.message}`);
    }
    
    console.log(`Found ${sources.length} RSS sources`);
    
    for (const source of sources) {
      try {
        console.log(`Processing: ${source.name}`);
        
        const response = await fetch(source.feed_url, {
          headers: {
            'User-Agent': 'Merlin-BESS-QuoteBuilder/1.0',
            'Accept': 'application/rss+xml, application/xml, text/xml'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const xml = await response.text();
        const items = parseRSSFeed(xml);
        results.articlesFound += items.length;
        
        for (const item of items.slice(0, 20)) {  // Limit items per source
          const { data: existing } = await supabase
            .from('scraped_articles')
            .select('id')
            .eq('url', item.link)
            .single();
          
          if (existing) continue;
          
          const fullText = `${item.title} ${item.content}`;
          const classification = classifyContent(fullText);
          const prices = extractPrices(fullText, classification.equipment);
          
          const { error: insertError } = await supabase
            .from('scraped_articles')
            .insert({
              source_id: source.id,
              title: item.title,
              url: item.link,
              published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
              summary: item.description?.slice(0, 500),
              full_content: item.content,
              topics: classification.topics,
              equipment_mentioned: classification.equipment,
              regions_mentioned: source.regions || ['global'],
              prices_extracted: prices,
              relevance_score: classification.relevanceScore,
              is_processed: true
            });
          
          if (!insertError) {
            results.articlesSaved++;
            
            for (const price of prices) {
              await supabase.from('collected_market_prices').insert({
                source_id: source.id,
                equipment_type: price.equipment,
                price_per_unit: price.price,
                unit: price.unit,
                currency: 'USD',
                confidence_score: price.confidence,
                price_date: item.pubDate ? new Date(item.pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                raw_text: price.context,
                extraction_method: 'regex'
              });
              results.pricesExtracted++;
            }
          }
        }
        
        // Update source status
        await supabase
          .from('market_data_sources')
          .update({
            last_fetch_at: new Date().toISOString(),
            last_fetch_status: 'success',
            fetch_error_count: 0
          })
          .eq('id', source.id);
        
        results.sourcesProcessed++;
        
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        results.errors.push(`${source.name}: ${errorMsg}`);
        
        await supabase
          .from('market_data_sources')
          .update({
            last_fetch_at: new Date().toISOString(),
            last_fetch_status: 'failed'
          })
          .eq('id', source.id);
      }
    }
    
    console.log('Scrape complete:', results);
    
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
    
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
