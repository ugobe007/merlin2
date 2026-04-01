# punkpeye/awesome-mcp-servers — Pull Request

## PR Title

Add Merlin Energy MCP — BESS quoting & sales intelligence

## PR Description

This PR adds the Merlin Energy MCP server to the Finance / Business category.

**Server:** [Merlin Energy — BESS Quoting & Sales Intelligence](https://github.com/ugobe007/merlin-mcp-agent)

The Merlin Energy MCP is the first Model Context Protocol server for commercial
battery energy storage (BESS) quoting. It gives AI assistants 6 tools to act as
trained energy sales agents — generating TrueQuote™ estimates, qualifying leads,
comparing competitors, and producing proposals in seconds.

**Tools:** `generate_truequote`, `qualify_lead`, `compare_competitor`,
`generate_proposal`, `get_benchmarks`, `handle_objection`

**License:** MIT | **Transport:** stdio

---

## Exact Line to Add in README.md

Find the **Finance** section (or **Business** / **Other** if Finance doesn't exist yet)
and add:

```markdown
- [Merlin Energy](https://github.com/merlinpro/merlin-mcp-agent) — AI-powered BESS quoting and energy sales intelligence. TrueQuote™ estimates, lead qualification, competitor battle cards, and proposal generation for commercial energy storage. 🏢
```

---

## Alternative: Add New "Energy" Section

If the maintainer prefers a dedicated Energy section, propose:

```markdown
## Energy

- [Merlin Energy](https://github.com/merlinpro/merlin-mcp-agent) — AI-powered BESS (Battery Energy Storage) quoting and sales intelligence. TrueQuote™ estimates, lead qualification, competitor battle cards, and proposal generation for commercial energy storage. 🏢
```

---

## Checklist (for PR body)

- [x] Server has a public GitHub repository
- [x] Server has a README with setup instructions
- [x] Server uses @modelcontextprotocol/sdk
- [x] Server has a valid MIT license
- [x] Server is installable via npx
- [x] Server has been tested with Claude Desktop
