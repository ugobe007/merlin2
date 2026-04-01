# mcpservers.org Submission

# Submit at: https://mcpservers.org/submit

## Name

Merlin Energy — BESS Quoting & Sales Intelligence

## GitHub Repository

<https://github.com/ugobe007/merlin-mcp-agent>

## npm Package

<https://www.npmjs.com/package/@merlinpro/mcp-agent>

## Category

Finance (primary) / Business Tools (secondary)

## Short Description

AI-powered BESS quoting & energy sales agent for Claude and other MCP clients.
Generate TrueQuote™ estimates, qualify leads, compare competitors, and produce proposals — in seconds.

## Full Description

The Merlin Energy MCP server is the first Model Context Protocol server purpose-built for
commercial energy storage (BESS) quoting and sales. It exposes 6 tools that let any
MCP-compatible AI client act as a trained energy sales agent:

**6 Tools**

- `generate_truequote` — 47-variable BESS sizing algorithm (peak demand, industry, ZIP, use-case → MW/MWh sizing, installed cost, annual savings, payback, NPV, IRR, CO₂ offset)
- `qualify_lead` — Score leads 0–100 across 18 industry verticals, output hot/warm/nurture tier + next steps
- `compare_competitor` — Battle cards vs. Homer Energy, EnerNOC, and manual Excel
- `generate_proposal` — Executive summary, detailed technical/financial proposal, or one-pager
- `get_benchmarks` — NREL & EIA benchmarks (BESS cost, solar LCOE, utility rates, ROI by sector, market size)
- `handle_objection` — Scripted, data-backed responses to the 5 most common BESS sales objections

**Why this matters**

Manual BESS quotes take 90+ hours (Excel) or cost $3K–$15K/year (Homer Energy).
Merlin generates TrueQuote™ estimates in seconds with ≥ 95% accuracy vs. actual installed systems.
This MCP makes that capability available inside any AI assistant.

## Tags

`energy`, `bess`, `battery-storage`, `solar`, `quoting`, `sales`, `finance`, `nrel`, `eia`, `commercial-energy`, `lead-qualification`, `proposal`

## Install

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
        "OPENAI_API_KEY": "sk-..."
      }
    }
  }
}
```

## License

MIT

## Homepage

<https://merlinpro.energy>
