# mcp.so Submission — GitHub Issue Template

# Submit at: https://github.com/chatmcp/mcpso/issues/new

# Use the "Submit MCP Server" issue template, or paste the fields below.

---

**Issue title:** Add MCP Server: Merlin Energy — BESS Quoting & Sales Intelligence

---

## Server Name

Merlin Energy MCP — BESS Quoting & Sales Intelligence

## GitHub Repository

https://github.com/ugobe007/merlin-mcp-agent

## npm Package

https://www.npmjs.com/package/@merlinpro/mcp-agent

## Short Description (≤ 160 chars)

AI-powered BESS quoting & energy sales agent. Generate TrueQuote™ estimates, qualify leads, compare competitors, produce proposals — in seconds.

## Full Description

The Merlin Energy MCP server gives any AI assistant the ability to act as a trained commercial energy storage (BESS) sales agent. Using Anthropic's Model Context Protocol, Claude or any MCP-compatible client can instantly:

- **Generate TrueQuote™ estimates** — 47-variable BESS sizing algorithm using peak demand, industry vertical, ZIP code, and use-case to produce MW/MWh sizing, total installed cost, annual savings, payback period, NPV, IRR, and CO₂ offset.
- **Qualify leads** — Score inbound inquiries 0–100 across 18 industry verticals, output hot/warm/nurture tiers with next-step recommendations.
- **Battle-card competitor comparisons** — Real-time head-to-head vs. Homer Energy, EnerNOC, and manual Excel workflows.
- **Generate proposals** — Executive summary, detailed technical/financial proposal, or one-pager format — ready to send.
- **Retrieve NREL/EIA benchmarks** — Live industry-grade benchmarks: BESS cost curves, utility rates, ROI by sector, solar LCOE, market size.
- **Handle objections** — 5 scripted, data-backed objection handlers for the most common sales blockers.

**Why this matters:** Merlin's TrueQuote™ is the only 47-variable BESS quoting algorithm available as an MCP tool. Manual BESS quotes take 90+ hours (Excel) or $3K–$15K/year (Homer Energy). Merlin generates accurate quotes in seconds — directly inside Claude.

## Categories

- Energy
- Finance
- Sales & CRM
- Business Tools

## Tags

`bess`, `battery-storage`, `energy`, `solar`, `quoting`, `sales-agent`, `truequote`, `nrel`, `demand-charge`, `commercial-energy`, `lead-qualification`, `proposal`

## Install Command

```bash
npx @merlinpro/mcp-agent
```

## Claude Desktop Config

```json
{
  "mcpServers": {
    "merlin-energy": {
      "command": "npx",
      "args": ["-y", "@merlinpro/mcp-agent"],
      "env": {
        "OPENAI_API_KEY": "sk-...",
        "SUPABASE_URL": "https://xxxx.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJ..."
      }
    }
  }
}
```

## Tools (6)

| Tool                 | Description                                                           |
| -------------------- | --------------------------------------------------------------------- |
| `generate_truequote` | BESS sizing + full financial model (cost, savings, NPV, IRR, payback) |
| `qualify_lead`       | Score leads 0–100 with hot/warm/nurture tier + next steps             |
| `compare_competitor` | Battle cards vs. Homer Energy, EnerNOC, Excel                         |
| `generate_proposal`  | Executive summary, detailed, or one-pager format                      |
| `get_benchmarks`     | NREL/EIA benchmarks: cost, rates, ROI, market size                    |
| `handle_objection`   | Scripted responses to 5 common sales objections                       |

## Resources (4)

`merlin://product/overview`, `merlin://product/differentiators`, `merlin://data/benchmarks`, `merlin://sales/objections`

## Prompts (2)

`sales-call-opener`, `executive-pitch` (investor / EPC / SMB / manufacturer modes)

## Homepage

https://merlinpro.energy

## License

MIT
