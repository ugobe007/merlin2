import { describe, it, expect } from "vitest";
import {
  extractPrices,
  classifyContent,
  parseRSSFeed,
} from "/Users/robertchristopher/merlin3/src/services/marketDataScraper.ts";

describe("marketDataScraper: extractPrices", () => {
  it("extracts BESS $/kWh price", () => {
    const text = "Battery storage costs have fallen to $120/kWh in 2025.";
    const prices = extractPrices(text, ["bess"]);
    expect(prices.length).toBeGreaterThan(0);
    expect(prices[0].price).toBe(120);
    expect(prices[0].unit).toBe("kWh");
    expect(prices[0].equipment).toBe("bess");
  });

  it('extracts BESS "per kWh" price', () => {
    const text = "BESS pricing is approximately $115 per kWh for large deployments.";
    const prices = extractPrices(text, ["bess"]);
    expect(prices.length).toBeGreaterThan(0);
    expect(prices[0].price).toBe(115);
  });

  it("extracts solar $/W price", () => {
    const text = "Solar panels are now $0.85/W for commercial installations.";
    const prices = extractPrices(text, ["solar"]);
    expect(prices.length).toBeGreaterThan(0);
    expect(prices[0].price).toBeCloseTo(0.85);
    expect(prices[0].unit).toBe("W");
    expect(prices[0].equipment).toBe("solar");
  });

  it("returns empty for news article with no price text", () => {
    const text =
      "First Solar gets access to Oxford PV perovskite patents for next-generation cells.";
    const prices = extractPrices(text, ["solar"]);
    expect(prices.length).toBe(0);
  });

  it("returns empty for tariff article with no equipment price", () => {
    const text = "Commerce suggests 100%+ tariffs for solar panels from India, Southeast Asia";
    const prices = extractPrices(text, ["solar"]);
    expect(prices.length).toBe(0);
  });

  it("extracts from auto-detected equipment text", () => {
    const text = "Utility-scale storage priced at $250/kWh installed cost for 4-hour systems.";
    const prices = extractPrices(text, []); // no equipment hint — should auto-detect
    expect(prices.length).toBeGreaterThan(0);
  });
});

describe("marketDataScraper: classifyContent", () => {
  it("detects bess equipment", () => {
    const result = classifyContent("Battery energy storage system installed at 10 MW");
    expect(result.equipment).toContain("bess");
  });

  it("detects solar equipment", () => {
    const result = classifyContent("Solar photovoltaic panels deployed on rooftop");
    expect(result.equipment).toContain("solar");
  });

  it("detects pricing topic", () => {
    const result = classifyContent("The project cost $120 per kWh");
    expect(result.topics).toContain("pricing");
  });

  it("detects tariff topic", () => {
    const result = classifyContent("New import tariffs on solar panels from Southeast Asia");
    expect(result.topics).toContain("tariffs");
  });

  it("returns relevanceScore > 0 for relevant content", () => {
    const result = classifyContent("BESS battery storage energy systems installed");
    expect(result.relevanceScore).toBeGreaterThan(0);
  });
});

describe("marketDataScraper: parseRSSFeed", () => {
  it("parses a minimal valid RSS feed", () => {
    const xml = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <item>
      <title>Battery storage falls to $120/kWh</title>
      <link>https://example.com/article1</link>
      <description>Utility-scale BESS now costs $120 per kWh.</description>
      <pubDate>Tue, 25 Feb 2026 10:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Solar panel tariffs increase</title>
      <link>https://example.com/article2</link>
      <description>Import tariffs on solar panels rise 25%.</description>
    </item>
  </channel>
</rss>`;
    const items = parseRSSFeed(xml);
    expect(items.length).toBe(2);
    expect(items[0].title).toBe("Battery storage falls to $120/kWh");
    expect(items[0].link).toBe("https://example.com/article1");
  });

  it("returns empty array for invalid XML", () => {
    const items = parseRSSFeed("not valid xml");
    expect(items).toEqual([]);
  });
});

describe("price extraction: 0% in DB is expected (not a bug)", () => {
  it("explains why real RSS articles have 0% price extraction", () => {
    // These are real article titles from the DB with no prices
    const realArticles = [
      "Weidmuller releases new PV connector series for 1,500-V systems",
      "PG&E expands Sunrun solar + storage projects for backup power",
      "Vote Solar: Rewritten Massachusetts climate bill good for solar",
      "First Solar gets access to Oxford PV perovskite patents",
      "Mechanical Reality Is Catching Up To ICE Pickups",
    ];
    const totalPrices = realArticles.reduce((sum, text) => {
      const c = classifyContent(text);
      const p = extractPrices(text, c.equipment);
      return sum + p.length;
    }, 0);
    // Titles alone contain no pricing data → 0 is correct
    expect(totalPrices).toBe(0);
  });

  it("confirms parser WOULD find prices if article body had them", () => {
    const articleWithPrice =
      "PG&E expands Sunrun solar + storage projects. Battery storage costs $118/kWh installed.";
    const c = classifyContent(articleWithPrice);
    const p = extractPrices(articleWithPrice, c.equipment);
    expect(p.length).toBeGreaterThan(0);
  });
});
