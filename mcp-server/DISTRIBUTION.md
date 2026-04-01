# Merlin Energy — MCP Registry Distribution Playbook

> **Status:** Pre-launch — complete steps in order.
> This is the source-of-truth for distributing the Merlin MCP server and Partner API.

---

## 0. Prerequisites (do these first)

### 0.1 Create the Public GitHub Repo

The MCP registries (mcp.so, glama.ai, mcpservers.org) all require a **public GitHub repo**.
The MCP server lives inside the monorepo (`mcp-server/`) — copy it out to a standalone repo.

```bash
# From your GitHub account, create: github.com/merlinpro/merlin-mcp-agent
# Then copy mcp-server/ contents into it:

mkdir /tmp/merlin-mcp-agent
cp -r /Users/robertchristopher/merlin3/mcp-server/* /tmp/merlin-mcp-agent/
# Also copy the smithery.yaml (already in mcp-server/)

cd /tmp/merlin-mcp-agent
git init
git add .
git commit -m "feat: initial Merlin Energy MCP server v1.0.0"
git remote add origin https://github.com/ugobe007/merlin-mcp-agent
git push -u origin main
```

**Files that must be in the public repo root:**

- `src/index.ts` — server source
- `smithery.yaml` — Smithery/glama auto-discovery config ✅ (already created)
- `package.json` — npm metadata ✅ (already updated)
- `tsconfig.json` — TypeScript config
- `README.md` — install & usage guide (see step 0.2)
- `LICENSE` — MIT

Create `LICENSE`:

```
MIT License

Copyright (c) 2025 Merlin Energy

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### 0.2 Build the Package

```bash
cd /Users/robertchristopher/merlin3/mcp-server
npm run build          # tsc → dist/index.js
node dist/index.js     # smoke test — should start without crashing
```

---

## 1. npm Registry

**Priority: 🔴 Critical — do this before all registries (they link to npm)**

### Why

- Enables `npx @merlinpro/mcp-agent` one-line install
- Most registries link to npm for install instructions
- Enables version pinning and auto-updates for users

### Steps

```bash
# 1. Create npm org (if not done)
#    Go to: https://www.npmjs.com/org/create
#    Org name: merlinpro

# 2. Login
npm login

# 3. Publish (from mcp-server/)
cd /Users/robertchristopher/merlin3/mcp-server
npm publish --access public
```

### Post-publish URL

<https://www.npmjs.com/package/@merlinpro/mcp-agent>

### Re-publish after updates

```bash
npm version patch   # or minor / major
npm publish --access public
```

---

## 2. mcp.so

**Priority: 🔴 Critical — largest MCP directory (19,000+ servers)**

### Submit URL

<https://github.com/chatmcp/mcpso/issues/new>

### Steps

1. Open the URL above
2. Title: `Add MCP Server: Merlin Energy — BESS Quoting & Sales Intelligence`
3. Copy the full submission from:
   `mcp-server/registry/mcp-so-submission.md`
4. Submit the issue

### Expected timeline

Listed within 1–3 business days after issue review.

---

## 3. glama.ai

**Priority: 🟠 High — auto-discovers from GitHub + rates security/license/quality**

### Submit URL

<https://glama.ai/mcp/servers> → click **"Add Server"**

### Steps

1. Paste GitHub repo URL: `https://github.com/merlinpro/merlin-mcp-agent`
2. Glama reads `smithery.yaml` and `README.md` automatically
3. Verify the extracted metadata (name, tools, description)
4. For listing description, use: `mcp-server/registry/glama-submission.md`

### Categories to select

- Finance (primary)
- Business Intelligence

### Expected timeline

Auto-indexed within minutes of submitting the GitHub URL.

---

## 4. mcpservers.org

**Priority: 🟠 High — curated directory with submit form**

### Submit URL

<https://mcpservers.org/submit>

### Steps

1. Open the submit URL
2. Copy fields from: `mcp-server/registry/mcpservers-org-submission.md`
3. Category: Finance / Business Tools

### Expected timeline

Reviewed within 2–5 business days.

---

## 5. Smithery.ai

**Priority: 🟡 Medium — requires HTTP transport for full listing; stdio supported via GitHub**

### Current situation

Smithery's new Gateway requires **Streamable HTTP transport** (not stdio).
The Merlin MCP server currently uses **stdio** (Claude Desktop compatible).

### Option A — List as stdio (now)

1. Go to: <https://smithery.ai/servers/new>
2. Note: Smithery may prompt for a public URL.
3. The `smithery.yaml` in the repo enables Smithery CLI users to install:

```bash
npx @smithery/cli@latest install @merlinpro/mcp-agent
```

### Option B — Upgrade to HTTP transport (recommended Q2 2025)

To get the full Smithery Gateway listing (analytics, OAuth UI, install button):

1. Wrap the stdio server in an HTTP layer using [xmcp](https://xmcp.dev/)
2. Deploy to Fly.io or Vercel (existing infra)
3. Submit the HTTPS URL at: <https://smithery.ai/new>

**xmcp upgrade path:**

```bash
npm install xmcp
# Wrap mcp-server/src/index.ts as HTTP — see https://xmcp.dev/docs
```

---

## 6. punkpeye/awesome-mcp-servers (GitHub)

**Priority: 🟡 Medium — community list, good backlinks and SEO**

### Repo

<https://github.com/punkpeye/awesome-mcp-servers>

### Steps

1. Fork the repo on GitHub
2. Add the listing line to the appropriate section (Finance or Energy):

```markdown
- [Merlin Energy](https://github.com/ugobe007/merlin-mcp-agent) — AI-powered BESS quoting and energy sales intelligence. TrueQuote™ estimates, lead qualification, competitor battle cards, and proposal generation for commercial energy storage. 🏢
```

3. Open a PR — use the content from: `mcp-server/registry/awesome-mcp-pr.md`

---

## 7. RapidAPI (Partner API)

**Priority: 🟡 Medium — reaches developer buyers and integrators**

### Submit URL

<https://rapidapi.com/developer/dashboard> → **Add new API**

### Steps

1. Create RapidAPI account (or login)
2. Click "Add new API" → import OpenAPI spec
3. Upload: `src/api/openapi.yaml` (OpenAPI 3.1.0)
4. Set base URL: `https://api.merlinpro.energy/v1`
5. Set pricing tiers (see `mcp-server/registry/rapidapi-listing.md`)
6. Publish to RapidAPI Hub

### Listing content

`mcp-server/registry/rapidapi-listing.md`

---

## 8. Postman Public API Network

**Priority: 🟢 Nice-to-have — reaches Postman users, API-first buyers**

### Steps

1. Open Postman app
2. File → Import → `src/api/openapi.yaml`
3. Create workspace: "Merlin Energy"
4. Make workspace public (Settings → Visibility → Public)
5. Submit to Postman Public API Network: <https://www.postman.com/explore>

### Full instructions

`mcp-server/registry/postman-listing.md`

---

## 9. APIs.guru (OpenAPI Directory)

**Priority: 🟢 Nice-to-have — free directory, good SEO backlink**

### Submit URL

<https://github.com/APIs-guru/openapi-directory/blob/main/CONTRIBUTING.md>

### Steps

1. Fork: `github.com/APIs-guru/openapi-directory`
2. Add: `APIs/merlinpro.energy/v1/openapi.yaml` (copy of `src/api/openapi.yaml`)
3. Ensure the spec has `info.x-logo`, `info.contact`, and `info.x-apisguru-categories`
4. Open PR

---

## 10. Community Amplification

### Reddit

- Post to `r/LocalLLaMA` — "Built an MCP server for BESS quoting — Merlin Energy"
- Post to `r/ClaudeAI` — "Merlin MCP: energy storage quotes + sales intelligence inside Claude"
- Post to `r/mcp` (if exists) / `r/AITools`

### Product Hunt

- Submit as an AI tool: <https://www.producthunt.com/posts/new>
- Category: Artificial Intelligence
- Tagline: "BESS quoting & energy sales intelligence, inside your AI assistant"

### Hacker News

- Show HN: "Merlin MCP — commercial energy storage quoting inside Claude"

### LinkedIn

- Announce from company page + personal profile
- Tag: Anthropic, Claude, OpenAI, clean energy, commercial real estate connections

---

## Status Tracker

| Registry            | Priority    | Status                           | URL                                    | Date Listed |
| ------------------- | ----------- | -------------------------------- | -------------------------------------- | ----------- |
| npm                 | 🔴 Critical | ⬜ Pending                       | npmjs.com/package/@merlinpro/mcp-agent | —           |
| mcp.so              | 🔴 Critical | ⬜ Pending                       | mcp.so/server/merlin-energy            | —           |
| glama.ai            | 🟠 High     | ⬜ Pending                       | glama.ai/mcp/servers/merlinpro/...     | —           |
| mcpservers.org      | 🟠 High     | ⬜ Pending                       | mcpservers.org/servers/merlin-energy   | —           |
| Smithery            | 🟡 Medium   | ⬜ Pending (HTTP upgrade needed) | smithery.ai/servers/merlinpro          | —           |
| awesome-mcp-servers | 🟡 Medium   | ⬜ Pending                       | github PR                              | —           |
| RapidAPI            | 🟡 Medium   | ⬜ Pending                       | rapidapi.com/merlinpro/...             | —           |
| Postman             | 🟢 Optional | ⬜ Pending                       | postman.com/merlinpro/...              | —           |
| APIs.guru           | 🟢 Optional | ⬜ Pending                       | apis.guru                              | —           |
| Product Hunt        | 🟢 Optional | ⬜ Pending                       | producthunt.com                        | —           |

---

## Key Assets Reference

| Asset                     | Path                                               |
| ------------------------- | -------------------------------------------------- |
| MCP server source         | `mcp-server/src/index.ts`                          |
| Smithery config           | `mcp-server/smithery.yaml`                         |
| npm package.json          | `mcp-server/package.json`                          |
| Partner API spec          | `src/api/openapi.yaml`                             |
| mcp.so submission         | `mcp-server/registry/mcp-so-submission.md`         |
| glama.ai submission       | `mcp-server/registry/glama-submission.md`          |
| mcpservers.org submission | `mcp-server/registry/mcpservers-org-submission.md` |
| awesome-mcp PR            | `mcp-server/registry/awesome-mcp-pr.md`            |
| RapidAPI listing          | `mcp-server/registry/rapidapi-listing.md`          |
| Postman listing           | `mcp-server/registry/postman-listing.md`           |

---

## Quick Start (TL;DR)

```bash
# 1. Build the package
cd /Users/robertchristopher/merlin3/mcp-server && npm run build

# 2. Publish to npm
npm publish --access public

# 3. Submit to mcp.so (GitHub issue)
open https://github.com/chatmcp/mcpso/issues/new

# 4. Submit to glama.ai (paste repo URL)
open https://glama.ai/mcp/servers
# URL: https://github.com/ugobe007/merlin-mcp-agent

# 5. Submit to mcpservers.org
open https://mcpservers.org/submit
```
