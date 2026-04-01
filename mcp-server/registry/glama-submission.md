# glama.ai Submission

# Submit at: https://glama.ai/mcp/servers → "Add Server" button

# Glama auto-discovers from GitHub. Paste repo URL and it reads smithery.yaml + README.

---

## GitHub Repository URL to Submit

https://github.com/ugobe007/merlin-mcp-agent

## Server Name (displayed on glama.ai)

Merlin Energy — BESS Quoting & Sales Intelligence

## Short Tagline (≤ 120 chars)

The only MCP server for commercial energy storage quoting. TrueQuote™ in seconds, not hours.

## Category (select on form)

Finance ← primary
Business Intelligence ← secondary

## Additional Tags

energy, bess, battery-storage, quoting, sales, solar, commercial, nrel

## Description for glama profile

Merlin Energy is the commercial BESS (Battery Energy Storage System) quoting and sales intelligence platform. This MCP server exposes Merlin's core TrueQuote™ algorithm as 6 callable tools, letting AI assistants act as trained energy sales agents.

**Tools:**

- `generate_truequote` — 47-variable BESS sizing + ROI model (cost, savings, payback, NPV, IRR, CO₂)
- `qualify_lead` — 0–100 lead score across 18 industry verticals, hot/warm/nurture tier
- `compare_competitor` — Battle cards vs. Homer Energy, EnerNOC, manual Excel
- `generate_proposal` — Executive summary, detailed technical/financial, or one-pager
- `get_benchmarks` — NREL & EIA benchmarks: cost curves, utility rates, ROI by sector
- `handle_objection` — Data-backed responses to the 5 most common BESS sales objections

**Why Merlin:**

- TrueQuote™ uses 47 variables vs. industry standard of 8–12 — ≥ 95% accuracy vs. actual installed systems
- 18x faster than manual quoting (minutes vs. hours)
- 18 industry verticals covered with sector-specific ROI benchmarks
- Zero cost vs. $3K–$15K/year for legacy tools like Homer Energy

**Use cases for AI agents:**

- Sales assistants qualifying BESS leads in chat
- Energy brokers generating instant proposals
- EPC contractors checking competitive positioning
- Investors modeling portfolio BESS returns

## Security Notes

- No credentials shared with LLM providers
- OPENAI_API_KEY used only for local proposal formatting (never logged)
- Supabase keys optional — server falls back to cached benchmark data

## License

MIT

## npm

@merlinpro/mcp-agent
