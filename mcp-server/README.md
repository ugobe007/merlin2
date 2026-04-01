# Merlin Energy MCP

The **only** MCP server for commercial BESS (Battery Energy Storage) quoting.
TrueQuote estimates, lead qualification, competitor battle cards, and proposals
inside Claude or any MCP-compatible AI client.

## Install

```bash
npx @merlinpro/mcp-agent
```

## Claude Desktop Config

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

Restart Claude Desktop — the Merlin Energy tools appear in the ⚙ menu.

---

## Tools (6)

| Tool                 | Description                                                                       |
| -------------------- | --------------------------------------------------------------------------------- |
| `generate_truequote` | 47-variable BESS sizing + financial model (cost, savings, payback, NPV, IRR, CO2) |
| `qualify_lead`       | Score leads 0-100 across 18 industry verticals: hot / warm / nurture              |
| `compare_competitor` | Battle cards vs Homer Energy, EnerNOC, manual Excel                               |
| `generate_proposal`  | Executive summary, detailed, or one-pager format                                  |
| `get_benchmarks`     | NREL and EIA benchmarks: cost curves, utility rates, ROI by sector                |
| `handle_objection`   | Data-backed responses to the 5 most common BESS sales objections                  |

## Resources (4)

| URI                                | Content                          |
| ---------------------------------- | -------------------------------- |
| `merlin://product/overview`        | Full platform overview           |
| `merlin://product/differentiators` | TrueQuote competitive advantages |
| `merlin://data/benchmarks`         | Industry ROI benchmarks          |
| `merlin://sales/objections`        | Objection-handling playbook      |

## Prompts (2)

| Prompt              | Modes                                    |
| ------------------- | ---------------------------------------- |
| `sales-call-opener` | Cold opener for BESS sales conversations |
| `executive-pitch`   | investor / EPC / SMB / manufacturer      |

---

## Environment Variables

| Variable                    | Required | Description                        |
| --------------------------- | -------- | ---------------------------------- |
| `OPENAI_API_KEY`            | **Yes**  | OpenAI key for proposal formatting |
| `SUPABASE_URL`              | Optional | Supabase URL for analytics         |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Supabase service role key          |
| `RESEND_API_KEY`            | Optional | Resend key for email delivery      |
| `API_URL`                   | Optional | Merlin Partner API base URL        |

---

## Why Merlin

|                       | Merlin TrueQuote | Homer Energy | Manual Excel |
| --------------------- | :--------------: | :----------: | :----------: |
| Time per quote        |   **Seconds**    | 12-18 hours  |  90+ hours   |
| Variables used        |      **47**      |     ~12      |      ~8      |
| Accuracy vs. installs |     **95%+**     |     ~85%     |     ~70%     |
| Annual cost           |   **$299/mo+**   | $3K-$15K/yr  |  Staff time  |
| MCP integration       |     **Yes**      |      No      |      No      |

---

## Partner API

REST API (OpenAPI 3.1.0) for programmatic quoting, leads, and benchmarks.

| Plan         | Price   | Rate Limit   |
| ------------ | ------- | ------------ |
| Starter      | $299/mo | 100 req/hr   |
| Professional | $499/mo | 500 req/hr   |
| Enterprise   | $999/mo | 5,000 req/hr |

Docs: [merlinpro.energy/api](https://merlinpro.energy/api)

---

## Development

```bash
git clone https://github.com/merlinpro/merlin-mcp-agent
cd merlin-mcp-agent
npm install
npm run dev    # hot reload via tsx
npm run build  # tsc -> dist/index.js
```

Local test (stdio):

```json
{
  "mcpServers": {
    "merlin-energy-dev": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": { "OPENAI_API_KEY": "sk-..." }
    }
  }
}
```

---

## License

MIT © [Merlin Energy](https://merlinpro.energy)
