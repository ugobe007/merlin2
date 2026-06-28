import express from 'express';

const router = express.Router();

const FEEDS = [
  { url: 'https://electrek.co/feed', source: 'Electrek' },
  { url: 'https://www.greentechmedia.com/rss/all', source: 'Wood Mackenzie' },
  { url: 'https://rss.politico.com/energy.xml', source: 'Politico Energy' },
];

// Parse up to `limit` items from raw RSS/Atom XML
function parseRSS(xml, source, limit = 4) {
  const items = [];
  // Match <item>…</item> blocks
  const itemBlocks = [...xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/g)];
  for (const block of itemBlocks.slice(0, limit)) {
    const body = block[1];
    const titleMatch = body.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
    const linkMatch  = body.match(/<link[^>]*>([^<]+)<\/link>/) ||
                       body.match(/<link[^>]+href="([^"]+)"/);
    const dateMatch  = body.match(/<pubDate[^>]*>([^<]+)<\/pubDate>/) ||
                       body.match(/<published[^>]*>([^<]+)<\/published>/);
    const title = titleMatch?.[1]?.trim().replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"');
    if (!title || title.length < 10) continue;
    items.push({
      title,
      source,
      url:  linkMatch?.[1]?.trim() ?? '#',
      date: dateMatch?.[1]?.trim() ?? '',
    });
  }
  return items;
}

router.get('/market/news', async (req, res) => {
  const results = [];
  await Promise.all(
    FEEDS.map(async ({ url, source }) => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        const r = await fetch(url, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (Merlin Energy Market Intelligence Bot)' },
        });
        clearTimeout(timer);
        if (!r.ok) return;
        const xml = await r.text();
        const items = parseRSS(xml, source, 4);
        results.push(...items);
      } catch (err) {
        console.warn(`[market-news] Failed to fetch ${source}:`, err.message);
      }
    })
  );
  res.json({ headlines: results.slice(0, 15) });
});

export default router;
