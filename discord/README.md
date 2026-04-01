# Merlin Energy — Discord Setup Guide

## Overview

Two components:

| Component                  | What it does                                                                               | Requires                     |
| -------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------- |
| **Discord Bot** (`bot.ts`) | Slash commands `/quote`, `/qualify`, `/benchmark`, `/objection`, `/pitch` — live MCP calls | Bot token + running process  |
| **Webhook** (`webhook.ts`) | Posts lead/quote alerts to a channel automatically                                         | Just a webhook URL in `.env` |

Start with the webhook (5 min), then add the full bot (15 min).

---

## Part 1 — Create Your Discord Server

### Channel Structure (copy this)

Create a new server at discord.com → "Create My Own" → "For a club or community"

Then create these channels:

```
📣  announcements       ← pin MCP install instructions here
⚡  truequote-results   ← bot posts every quote generated
🔥  leads               ← bot posts every qualified lead
💬  general
🛠️  support
🗺️  feature-requests
🤝  partners            ← for EPCs, manufacturers, integrators
```

To create channels: right-click the category → "Create Channel"

---

## Part 2 — Webhook Setup (5 minutes, no bot required)

This makes Merlin automatically post lead and quote alerts to Discord.

### Step 1 — Create the Webhook

1. Right-click the **#leads** channel → **Edit Channel**
2. Click **Integrations** → **Webhooks** → **New Webhook**
3. Name it `Merlin Lead Bot`
4. Copy the Webhook URL
5. Repeat for **#truequote-results** (name it `Merlin Quote Bot`)

### Step 2 — Add to .env

```env
# Discord
DISCORD_LEAD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN
```

### Step 3 — Use in your code

```typescript
import { sendLeadAlert, sendQuoteAlert } from "./discord/webhook.js";

// After a lead is qualified:
await sendLeadAlert({
  companyName: "Acme Hotel Group",
  industry: "hotel",
  score: 85,
  tier: "hot",
  decisionTimeline: "3-months",
  currentPain: "High demand charges on summer peak days",
  action: "Schedule demo within 24 hours",
  source: "merlinpro.energy/hotel",
});

// After a quote is generated:
await sendQuoteAlert({
  companyName: "Acme Hotel Group",
  industry: "hotel",
  zipCode: "89101",
  systemSizeMW: 0.75,
  totalCostDollars: 945000,
  netCostDollars: 661500,
  annualSavingsDollars: 112000,
  paybackYears: 5.9,
  npvDollars: 1_820_000,
});
```

---

## Part 3 — Full Discord Bot (slash commands)

### Step 1 — Create a Discord Application

1. Go to **https://discord.com/developers/applications**
2. Click **"New Application"**
3. Name it `Merlin Energy` → Create
4. Copy the **Application ID** (= CLIENT_ID)

### Step 2 — Create the Bot

1. Left sidebar → **Bot**
2. Click **"Add Bot"** → Yes, do it
3. Under **Token** → click **"Reset Token"** → Copy it (= BOT_TOKEN)
   > ⚠️ Save this somewhere safe — you only see it once
4. Scroll down → **Privileged Gateway Intents** — leave all OFF (not needed)
5. Save Changes

### Step 3 — Invite the Bot to Your Server

1. Left sidebar → **OAuth2** → **URL Generator**
2. Under **Scopes** → check: `bot`, `applications.commands`
3. Under **Bot Permissions** → check: `Send Messages`, `Use Slash Commands`, `Embed Links`
4. Copy the generated URL → open in browser → select your server → Authorize

### Step 4 — Get Your Guild ID (for instant command registration)

1. In Discord, go to **User Settings** → **Advanced** → enable **Developer Mode**
2. Right-click your server name → **Copy Server ID** (= GUILD_ID)

### Step 5 — Add to .env

```env
# Discord Bot
DISCORD_BOT_TOKEN=YOUR_BOT_TOKEN_HERE
DISCORD_CLIENT_ID=YOUR_APPLICATION_ID_HERE
DISCORD_GUILD_ID=YOUR_SERVER_ID_HERE        # omit for global commands (1hr propagation)

# MCP Server (Railway)
MERLIN_MCP_URL=https://merlin-mcp-agent-production.up.railway.app/mcp
```

### Step 6 — Install Dependencies

```bash
cd /Users/robertchristopher/merlin3
npm install discord.js
```

### Step 7 — Run the Bot

```bash
# From merlin3/
npm run discord:bot

# Or directly:
npx tsx discord/bot.ts
```

The bot will:

1. Register all slash commands instantly (guild) or globally (1 hour)
2. Connect to the Merlin MCP server on Railway
3. Go online — `🧙 Merlin Discord Bot online as Merlin Energy#XXXX`

### Available Slash Commands

| Command                                    | Description                                               |
| ------------------------------------------ | --------------------------------------------------------- |
| `/quote industry peak_kw monthly_bill zip` | TrueQuote™ estimate — size, cost, savings, payback, NPV   |
| `/qualify company industry pain timeline`  | Lead score 0–100 + hot/warm/nurture + next steps          |
| `/benchmark category`                      | NREL/EIA data — BESS cost, solar cost, utility rates, ROI |
| `/objection text`                          | Scripted response to sales objections                     |
| `/pitch audience`                          | 60-second pitch for investor/EPC/SMB/manufacturer         |

---

## Part 4 — Promotion Posts (copy-paste ready)

### For MCP Community / Anthropic Discord

> 🧙 Just launched **Merlin Energy MCP** — the first 47-variable BESS quoting engine as an MCP tool.
>
> Drop it in Claude and get TrueQuote™ estimates, lead scoring, proposals, and competitor battle cards in seconds — no code required.
>
> **6 tools · 2 prompts · 4 resources**
>
> 📦 `npx @merlinpro/mcp-agent`
> 🌐 Smithery: `merlinpro/merlin-energy`
> 💻 GitHub: github.com/ugobe007/merlin-mcp-agent

---

### For AI Tinkerers / Latent Space Discord

> Built something wild — an MCP server that does full commercial energy storage (BESS) quoting with a 47-variable algorithm.
>
> Ask Claude: _"How much would a battery system cost for a 500 kW hotel in Las Vegas?"_ and it returns MW sizing, installed cost, annual savings, 25-year NPV, IRR, and CO₂ offset in under 5 seconds.
>
> Manual BESS quotes take 90 hours in Excel or $15K/yr in Homer Energy. This is 5 minutes + free.
>
> `npx @merlinpro/mcp-agent`
> github.com/ugobe007/merlin-mcp-agent

---

### For Hugging Face Discord

> Just open-sourced Merlin Energy MCP — a production BESS (battery energy storage) quoting engine exposed as a Model Context Protocol server.
>
> The TrueQuote™ algorithm covers 18 industry verticals (car washes → data centers → hospitals), uses real NREL/EIA benchmark data, and outputs financial models comparable to $15K/year commercial software.
>
> Works with Claude, any MCP client, or via HTTP (`merlin-mcp-agent-production.up.railway.app/mcp`).
>
> → github.com/ugobe007/merlin-mcp-agent

---

### For Energy / CleanTech Discords

> 🔋 Merlin Energy just went open-source.
>
> Our TrueQuote™ BESS algorithm — 47 variables, 18 industry verticals, NREL benchmark-backed — is now available as a free MCP tool for Claude.
>
> Solar + storage consultants, EPCs, and developers: instead of building a quote in Homer Energy or Excel, just ask Claude. You get MW sizing, cost, ITC savings, payback, NPV, and IRR in seconds.
>
> `npx @merlinpro/mcp-agent` or try it at merlinpro.energy

---

## Recommended Servers to Join & Post In

| Server        | How to Find                     | Best Channel       |
| ------------- | ------------------------------- | ------------------ |
| Anthropic     | discord.gg/anthropic            | `#mcp` or `#tools` |
| MCP Community | Search "Model Context Protocol" | `#show-and-tell`   |
| AI Tinkerers  | aitinkerers.org/discord         | `#projects`        |
| Latent Space  | latent.space/discord            | `#show-your-work`  |
| Hugging Face  | discord.gg/huggingface          | `#general`         |
| EnergyTech    | Search on Disboard              | `#tools`           |

---

## Troubleshooting

| Issue                       | Fix                                                        |
| --------------------------- | ---------------------------------------------------------- |
| `Missing DISCORD_BOT_TOKEN` | Add to `.env`                                              |
| Commands not appearing      | Wait 1 hour (global) or set `DISCORD_GUILD_ID` for instant |
| `Unknown interaction`       | Bot offline — restart `npm run discord:bot`                |
| MCP connection error        | Check Railway is running at `/health` endpoint             |
| Webhook not posting         | Check `DISCORD_LEAD_WEBHOOK_URL` in `.env`                 |
