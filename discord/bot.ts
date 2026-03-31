#!/usr/bin/env node
/**
 * MERLIN ENERGY DISCORD BOT
 * =========================
 * Slash commands that call the Merlin MCP server live.
 * Lets any Discord user generate TrueQuote™ estimates, qualify leads,
 * pull benchmarks, handle objections, and get pitch scripts — right in Discord.
 *
 * Commands:
 *   /quote      — TrueQuote™ BESS estimate (MW, cost, savings, payback, NPV)
 *   /qualify    — Lead scoring (0–100, hot/warm/nurture, next action)
 *   /benchmark  — NREL/EIA market data
 *   /objection  — Scripted objection handler
 *   /pitch      — 60-second executive pitch by audience
 *
 * Setup: see discord/README.md
 */

import {
  Client as DiscordClient,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActivityType,
  Interaction,
} from 'discord.js';
import { Client as McpClient } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import 'dotenv/config';

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────

const MCP_URL   = process.env.MERLIN_MCP_URL    ?? 'https://merlin-mcp-agent-production.up.railway.app/mcp';
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const GUILD_ID  = process.env.DISCORD_GUILD_ID;   // set for instant dev registration, omit for global

// ─────────────────────────────────────────────────────────────
// MCP CLIENT — singleton, reconnect on failure
// ─────────────────────────────────────────────────────────────

let _mcpClient: McpClient | null = null;

async function getMcp(): Promise<McpClient> {
  if (_mcpClient) return _mcpClient;
  _mcpClient = new McpClient({ name: 'merlin-discord-bot', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL));
  await _mcpClient.connect(transport);
  console.log('🔗 Connected to Merlin MCP server');
  return _mcpClient;
}

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  try {
    const mcp = await getMcp();
    const result = await mcp.callTool({ name, arguments: args });
    const text = (result.content as Array<{ type: string; text: string }>)?.[0]?.text;
    return text ? JSON.parse(text) : result;
  } catch (err) {
    _mcpClient = null; // force reconnect next call
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────
// SLASH COMMANDS — DEFINITIONS
// ─────────────────────────────────────────────────────────────

const commands = [
  new SlashCommandBuilder()
    .setName('quote')
    .setDescription('⚡ Generate a TrueQuote™ BESS estimate — cost, savings, payback, NPV')
    .addStringOption(o => o
      .setName('industry')
      .setDescription('Industry type')
      .setRequired(true)
      .addChoices(
        { name: 'Car Wash',       value: 'car-wash' },
        { name: 'Hotel',          value: 'hotel' },
        { name: 'Data Center',    value: 'data-center' },
        { name: 'EV Charging',    value: 'ev-charging' },
        { name: 'Restaurant',     value: 'restaurant' },
        { name: 'Office',         value: 'office' },
        { name: 'Warehouse',      value: 'warehouse' },
        { name: 'Manufacturing',  value: 'manufacturing' },
        { name: 'University',     value: 'university' },
        { name: 'Hospital',       value: 'hospital' },
        { name: 'Agriculture',    value: 'agriculture' },
        { name: 'Retail',         value: 'retail' },
      ))
    .addIntegerOption(o => o
      .setName('peak_kw')
      .setDescription('Peak electrical demand in kW (e.g. 500)')
      .setRequired(true)
      .setMinValue(50)
      .setMaxValue(50_000))
    .addIntegerOption(o => o
      .setName('monthly_bill')
      .setDescription('Average monthly utility bill in $ (e.g. 15000)')
      .setRequired(true)
      .setMinValue(100))
    .addStringOption(o => o
      .setName('zip')
      .setDescription('5-digit ZIP code (e.g. 89101)')
      .setRequired(true))
    .addStringOption(o => o
      .setName('use_case')
      .setDescription('Primary use case (default: peak-shaving)')
      .addChoices(
        { name: 'Peak Shaving',            value: 'peak-shaving' },
        { name: 'Backup Power',            value: 'backup-power' },
        { name: 'TOU Arbitrage',           value: 'TOU-arbitrage' },
        { name: 'Solar Self-Consumption',  value: 'solar-self-consumption' },
        { name: 'Demand Charge Reduction', value: 'demand-charge-reduction' },
      )),

  new SlashCommandBuilder()
    .setName('qualify')
    .setDescription('🎯 Qualify a sales lead — score 0–100, hot/warm/nurture + next steps')
    .addStringOption(o => o
      .setName('company')
      .setDescription('Company name')
      .setRequired(true))
    .addStringOption(o => o
      .setName('industry')
      .setDescription('Industry vertical (e.g. hotel, car-wash)')
      .setRequired(true))
    .addStringOption(o => o
      .setName('pain')
      .setDescription('Their main energy challenge')
      .setRequired(true))
    .addStringOption(o => o
      .setName('timeline')
      .setDescription('Purchase timeline')
      .setRequired(true)
      .addChoices(
        { name: 'Immediate',          value: 'immediate' },
        { name: '3 months',           value: '3-months' },
        { name: '6 months',           value: '6-months' },
        { name: '12 months',          value: '12-months' },
        { name: 'Exploring / unsure', value: 'exploring' },
      ))
    .addIntegerOption(o => o
      .setName('locations')
      .setDescription('Number of facilities (default: 1)')
      .setMinValue(1)),

  new SlashCommandBuilder()
    .setName('benchmark')
    .setDescription('📊 Retrieve NREL/EIA energy market benchmarks')
    .addStringOption(o => o
      .setName('category')
      .setDescription('Benchmark category')
      .setRequired(true)
      .addChoices(
        { name: 'BESS Cost ($/kWh)',  value: 'bess-cost' },
        { name: 'Solar Cost ($/W)',   value: 'solar-cost' },
        { name: 'Utility Rates',      value: 'utility-rates' },
        { name: 'ROI by Industry',    value: 'roi-by-industry' },
        { name: 'Market Size',        value: 'market-size' },
      ))
    .addStringOption(o => o
      .setName('industry')
      .setDescription('Specific industry (for roi-by-industry category)')),

  new SlashCommandBuilder()
    .setName('objection')
    .setDescription('🛡️ Get a scripted Merlin response to a sales objection')
    .addStringOption(o => o
      .setName('text')
      .setDescription('The objection raised by the prospect')
      .setRequired(true)),

  new SlashCommandBuilder()
    .setName('pitch')
    .setDescription('🎤 Generate a 60-second Merlin executive pitch')
    .addStringOption(o => o
      .setName('audience')
      .setDescription('Target audience')
      .setRequired(true)
      .addChoices(
        { name: 'Investor',              value: 'investor' },
        { name: 'EPC Executive',         value: 'EPC-executive' },
        { name: 'SMB Owner',             value: 'SMB-owner' },
        { name: 'Battery Manufacturer',  value: 'battery-manufacturer' },
      )),

].map(c => c.toJSON());

// ─────────────────────────────────────────────────────────────
// REGISTER COMMANDS WITH DISCORD
// ─────────────────────────────────────────────────────────────

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);
  if (GUILD_ID) {
    // Guild commands register instantly — use for dev
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log(`✅ Slash commands registered to guild ${GUILD_ID} (instant)`);
  } else {
    // Global commands take up to 1 hour to propagate
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('✅ Global slash commands registered (propagates in up to 1 hour)');
  }
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function tierEmoji(tier: string) {
  return tier === 'hot' ? '🔥' : tier === 'warm' ? '🌤️' : '❄️';
}

function tierColor(tier: string): number {
  return tier === 'hot' ? 0xFF4444 : tier === 'warm' ? 0xFFAA00 : 0x4488FF;
}

function usd(n: number) {
  return `$${n.toLocaleString('en-US')}`;
}

// ─────────────────────────────────────────────────────────────
// COMMAND HANDLERS
// ─────────────────────────────────────────────────────────────

async function handleQuote(i: ChatInputCommandInteraction) {
  await i.deferReply();

  const raw = await callTool('generate_truequote', {
    industry:           i.options.getString('industry', true),
    peakDemandKw:       i.options.getInteger('peak_kw', true),
    monthlyBillDollars: i.options.getInteger('monthly_bill', true),
    zipCode:            i.options.getString('zip', true),
    primaryUseCase:     i.options.getString('use_case') ?? 'peak-shaving',
    hasSolar:           false,
  }) as { recommendation: Record<string, unknown>; financials: Record<string, unknown>; disclaimer?: string; nextStep?: string };

  const rec = raw.recommendation ?? {};
  const fin = raw.financials ?? {};

  const sizeMW        = rec.systemSizeMW as number;
  const durationHrs   = rec.durationHours as number;
  const capacityKwh   = sizeMW * 1000 * durationHrs;
  const totalCost     = fin.totalInstalledCost as number;
  const netCost       = fin.netCostAfterITC as number;
  const annualSavings = fin.annualSavings as number;
  const payback       = fin.simplePayback as number;
  const npv           = fin.npv25Year as number;
  const irr           = fin.irrEstimate as string;
  const co2           = fin.co2AvoidedTonsPerYear as number;

  const industryLabel = i.options.getString('industry', true);
  const peakKw        = i.options.getInteger('peak_kw', true);
  const zip           = i.options.getString('zip', true);
  const useCase       = i.options.getString('use_case') ?? 'peak-shaving';

  const embed = new EmbedBuilder()
    .setTitle(`⚡ TrueQuote™ — ${industryLabel.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`)
    .setColor(0xF97316)
    .addFields(
      { name: '🏭 Industry',          value: industryLabel,                    inline: true },
      { name: '⚡ Peak Demand',        value: `${peakKw.toLocaleString()} kW`,  inline: true },
      { name: '📍 ZIP / Use Case',     value: `${zip} · ${useCase}`,           inline: true },
      { name: '📐 System Size',        value: `**${sizeMW} MW** · ${capacityKwh.toLocaleString()} kWh · ${durationHrs}h`, inline: true },
      { name: '💰 Total Cost',         value: usd(totalCost),                  inline: true },
      { name: '🏛️ After ITC (30%)',    value: usd(netCost),                    inline: true },
      { name: '📈 Annual Savings',     value: usd(annualSavings),              inline: true },
      { name: '⏱️ Payback',            value: `${payback} years`,              inline: true },
      { name: '📊 NPV (25yr)',         value: usd(npv),                        inline: true },
      { name: '📉 IRR',                value: irr,                             inline: true },
      { name: '🌱 CO₂ Avoided',        value: `${co2?.toLocaleString()} tons/yr`, inline: true },
    )
    .setDescription(raw.nextStep ? `_${raw.nextStep}_` : null)
    .setFooter({ text: `Merlin TrueQuote™ • merlinpro.energy${raw.disclaimer ? ' • ' + raw.disclaimer : ''}` })
    .setTimestamp();

  await i.editReply({ embeds: [embed] });
}

async function handleQualify(i: ChatInputCommandInteraction) {
  await i.deferReply();

  const company = i.options.getString('company', true);
  const result = await callTool('qualify_lead', {
    companyName:      company,
    industry:         i.options.getString('industry', true),
    currentPain:      i.options.getString('pain', true),
    decisionTimeline: i.options.getString('timeline', true),
    numberOfLocations: i.options.getInteger('locations') ?? 1,
  }) as Record<string, unknown>;

  const tier = result.tier as string;
  const embed = new EmbedBuilder()
    .setTitle(`${tierEmoji(tier)} Lead Score — ${company}`)
    .setColor(tierColor(tier))
    .addFields(
      { name: 'Score',          value: `**${result.score}/100** — ${String(tier).toUpperCase()}`, inline: true },
      { name: 'Next Action',    value: String(result.action), inline: false },
      { name: 'Recommendations', value: (result.recommendations as string[])?.map(r => `• ${r}`).join('\n') ?? 'N/A', inline: false },
    )
    .setFooter({ text: 'Merlin Lead Intelligence • merlinpro.energy' })
    .setTimestamp();

  await i.editReply({ embeds: [embed] });
}

async function handleBenchmark(i: ChatInputCommandInteraction) {
  await i.deferReply();

  const category = i.options.getString('category', true);
  const industry  = i.options.getString('industry') ?? undefined;
  const result = await callTool('get_benchmarks', { category, ...(industry ? { industry } : {}) });

  const embed = new EmbedBuilder()
    .setTitle(`📊 NREL/EIA Benchmark — ${category}`)
    .setColor(0x22C55E)
    .setDescription('```json\n' + JSON.stringify(result, null, 2).slice(0, 1900) + '\n```')
    .setFooter({ text: 'Source: NREL ATB 2024 / EIA • merlinpro.energy' })
    .setTimestamp();

  await i.editReply({ embeds: [embed] });
}

async function handleObjection(i: ChatInputCommandInteraction) {
  await i.deferReply();

  const text = i.options.getString('text', true);
  const result = await callTool('handle_objection', { objection: text });

  const embed = new EmbedBuilder()
    .setTitle('🛡️ Objection Handler')
    .setColor(0x8B5CF6)
    .addFields(
      { name: 'Objection',       value: `_"${text}"_`, inline: false },
      { name: 'Merlin Response', value: typeof result === 'string' ? result : JSON.stringify(result), inline: false },
    )
    .setFooter({ text: 'Merlin Sales Playbook • merlinpro.energy' })
    .setTimestamp();

  await i.editReply({ embeds: [embed] });
}

async function handlePitch(i: ChatInputCommandInteraction) {
  await i.deferReply();

  const audience = i.options.getString('audience', true);
  const pitches: Record<string, string> = {
    investor: [
      '**"The Bloomberg Terminal of commercial energy storage."**\n',
      'Merlin automates BESS quoting — a process that takes experts 90 hours in Excel or $15K/year in software.',
      'We built a 47-variable algorithm covering 18 industry verticals, wrapped as an MCP tool so any AI can quote, qualify, and close.\n',
      '📊 Target: **$600K SaaS ARR + $2.5M lead gen**',
      '⚡ Try: `npx @merlinpro/mcp-agent`\n',
      'We\'re raising. Let\'s talk → **merlinpro.energy**',
    ].join('\n'),
    'EPC-executive': [
      '**Cut your quoting time from 90 hours to 5 minutes.**\n',
      'Merlin\'s TrueQuote™ gives your team instant BESS sizing, ROI models, and proposal generation — inside Claude or any MCP client.',
      '47 variables. 18 verticals. ≥95% accuracy.\n',
      'Your competitors are still in Excel. You don\'t have to be.\n',
      '⚡ `npx @merlinpro/mcp-agent` · **merlinpro.energy**',
    ].join('\n'),
    'SMB-owner': [
      '**Is battery storage right for your business?**\n',
      'Merlin answers that in 5 minutes — free.',
      'Tell us your industry, your bill, and your ZIP. We\'ll tell you exactly how much you\'d save, what it costs, and how fast it pays back.\n',
      'No consultants. No Excel. No wait.\n',
      '⚡ Try at **merlinpro.energy**',
    ].join('\n'),
    'battery-manufacturer': [
      '**Your product. Our pipeline.**\n',
      'Merlin qualifies and routes 18 verticals of BESS leads — pre-educated, pre-quoted, ready to buy.',
      'We\'re not a competitor; we\'re your demand generation engine.\n',
      'Partner with Merlin to reach qualified commercial buyers before any other manufacturer does.\n',
      '📧 **merlinpro.energy**',
    ].join('\n'),
  };

  const embed = new EmbedBuilder()
    .setTitle(`🎤 60-Second Pitch — ${audience}`)
    .setColor(0xF97316)
    .setDescription(pitches[audience] ?? 'Merlin Energy — AI-powered BESS quoting. merlinpro.energy')
    .setFooter({ text: 'Merlin Energy • merlinpro.energy' })
    .setTimestamp();

  await i.editReply({ embeds: [embed] });
}

// ─────────────────────────────────────────────────────────────
// DISCORD BOT SETUP
// ─────────────────────────────────────────────────────────────

const discord = new DiscordClient({ intents: [GatewayIntentBits.Guilds] });

discord.once('ready', () => {
  console.log(`🧙 Merlin Discord Bot online as ${discord.user?.tag}`);
  discord.user?.setActivity('BESS quotes | /quote', { type: ActivityType.Watching });
});

discord.on('interactionCreate', async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    switch (interaction.commandName) {
      case 'quote':      await handleQuote(interaction);     break;
      case 'qualify':    await handleQualify(interaction);   break;
      case 'benchmark':  await handleBenchmark(interaction); break;
      case 'objection':  await handleObjection(interaction); break;
      case 'pitch':      await handlePitch(interaction);     break;
    }
  } catch (err) {
    const msg = `❌ Error calling Merlin: ${String(err)}`;
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(msg);
    } else {
      await interaction.reply({ content: msg, ephemeral: true });
    }
  }
});

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

async function main() {
  if (!BOT_TOKEN) throw new Error('Missing DISCORD_BOT_TOKEN in .env');
  if (!CLIENT_ID) throw new Error('Missing DISCORD_CLIENT_ID in .env');

  await registerCommands();
  await discord.login(BOT_TOKEN);
}

main().catch(console.error);
