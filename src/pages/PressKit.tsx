/**
 * PRESS KIT / PROMOTION COMMAND CENTER — /press
 * ================================================
 * Tracks C (directories), D (social posts), F (cold email)
 * All copy-ready content in one place. Click to copy.
 * Feb 25, 2026
 */

import React, { useState } from "react";
import { MerlinBatteryLogo } from "@/components/shared/MerlinBatteryLogo";
import {
  Copy, Check, Zap, ArrowRight, Globe, Twitter,
  Linkedin, Mail, MessageSquare, Search, Star,
  ExternalLink, Users, ChevronDown, ChevronRight,
} from "lucide-react";

// ─── Copy helper ─────────────────────────────────────────────────────────────
function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };
  const isCopied = (id: string) => copied === id;
  return { copy, isCopied };
}

function CopyBtn({ id, text, label = "Copy" }: { id: string; text: string; label?: string }) {
  const { copy, isCopied } = useCopy();
  return (
    <button
      onClick={() => copy(id, text)}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        isCopied(id)
          ? "bg-[#3ECF8E]/20 text-[#3ECF8E] border border-[#3ECF8E]/30"
          : "bg-white/[0.05] text-white/50 border border-white/[0.08] hover:text-white/80 hover:bg-white/[0.08]"
      }`}
    >
      {isCopied(id) ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {isCopied(id) ? "Copied!" : label}
    </button>
  );
}

// ─── Content data ─────────────────────────────────────────────────────────────

const ABOUT_BLURB_SHORT = `Merlin Energy is an AI-powered BESS and solar quote builder for commercial facilities. Every quote is TrueQuote™ verified — backed by NREL ATB 2024, EIA utility rates, and IRA 2022 tax credit calculations. Generate bankable energy storage proposals in under 90 seconds. Free to start.`;

const ABOUT_BLURB_LONG = `Merlin Energy is an AI-powered battery energy storage system (BESS) and solar quote builder trusted by commercial energy professionals. Every quote is TrueQuote™ verified — backed by NREL ATB 2024, EIA utility rates, and IRA 2022 Investment Tax Credit calculations. Generate full IRR, NPV, Monte Carlo P10/P50/P90, and bank-ready financial proposals in under 90 seconds. Supports 15 commercial industries including hotels, hospitals, data centers, car washes, warehouses, EV charging stations, and more. No consultants. No spreadsheets. Free forever tier available.`;

const TAGLINE = `BESS quotes in 90 seconds. Every number traced to NREL, EIA & IRA data. Free.`;

const CATEGORIES = {
  capterra: "Energy Management Software",
  g2: "Energy Management",
  alternativeTo: "Alternative to: HOMER Pro, SAM (NREL), HelioScope, Aurora Solar",
  futurepedia: "AI Tools → Energy & Finance",
  theresAnAI: "Energy / Finance / Construction",
  aiTools: "Business Tools → Energy",
};

const DIRECTORIES = [
  {
    name: "Capterra",
    url: "https://www.capterra.com/vendors/sign-up",
    category: "Energy Management Software",
    instructions: "Category: Energy Management → Renewable Energy → Battery Storage",
    id: "capterra",
  },
  {
    name: "G2",
    url: "https://www.g2.com/products/new",
    category: "Energy Management Software",
    instructions: "Category: Energy Management. Add competitor: HOMER Pro, SAM",
    id: "g2",
  },
  {
    name: "AlternativeTo",
    url: "https://alternativeto.net/software/new",
    category: "Alternative to HOMER Pro",
    instructions: "Add as alternative to: HOMER Pro, SAM, PVWatts Calculator",
    id: "alternativeto",
  },
  {
    name: "Futurepedia",
    url: "https://www.futurepedia.io/submit",
    category: "AI Tools → Energy",
    instructions: "Tags: energy, finance, BESS, solar, construction",
    id: "futurepedia",
  },
  {
    name: "There's An AI For That",
    url: "https://theresanaiforthat.com/submit",
    category: "Finance / Construction",
    instructions: "Task: BESS quote generation, energy analysis, solar sizing",
    id: "theresanai",
  },
  {
    name: "Toolify.ai",
    url: "https://www.toolify.ai/submit",
    category: "AI Tools → Energy",
    instructions: "Business / Finance category. Free tier available.",
    id: "toolify",
  },
  {
    name: "Product Hunt",
    url: "https://www.producthunt.com/posts/new",
    category: "Dev Tools / Finance",
    instructions: "Use /launch page copy. Tag: #energy #bess #climate #fintech",
    id: "producthunt",
  },
];

const LINKEDIN_POSTS = [
  {
    id: "li-1",
    label: "🚀 Launch Post",
    text: `I built BESS quotes that actually show their math.

Every commercial energy project I've seen has the same problem: the quote is a black box. A consultant hands you a number, charges $5–50K, and you have no idea where it came from.

So I built Merlin.

✅ TrueQuote™ — every number traces to a published source (NREL ATB 2024, IRA 2022, IEEE 446-1995)
✅ 15 commercial verticals — hotel, hospital, data center, car wash, warehouse, EV charging...
✅ Full IRR, NPV, Monte Carlo P10/P50/P90 — in 90 seconds
✅ Free to start

Try it: https://merlinenergy.net

#BESS #EnergyStorage #CleanEnergy #SolarPlusStorage #IRA2022 #EnergyTransition #TrueQuote #BatteryStorage`,
  },
  {
    id: "li-2",
    label: "📊 Demand Charge Education",
    text: `The average commercial demand charge in California is $25/kW/month.

A building with a 500 kW peak demand pays ~$150,000/year in demand charges alone.

A properly sized BESS can cut that by 30–40% through peak shaving.

The math (NREL standard):
• BESS size = 0.40 × peak demand = 200 kWh
• Annual savings = $45,000–$60,000
• With 40% ITC: payback under 5 years

Want the numbers for your building? Merlin generates this in 90 seconds — free.

🔗 https://merlinenergy.net/wizard

#EnergyStorage #DemandCharges #BESS #CommercialEnergy #SolarPlusStorage #PeakShaving #CleanEnergy`,
  },
  {
    id: "li-3",
    label: "💰 IRA 2022 ITC Post",
    text: `Most BESS quotes still use 30% ITC. That's leaving money on the table.

Under IRA 2022, the ACTUAL rate depends on your project:
• Base rate: 6%
• Prevailing wage + apprenticeship: +24%
• Energy community (coal closure, brownfield): +10%
• Domestic content (US steel + components): +10%
• Low-income area Tier 1: +10%
• Low-income area Tier 2: +20%

Your project could qualify for 40–70% ITC.

On a $3M BESS project, the difference between 30% and 50% ITC = $600,000.

Merlin calculates your specific rate automatically — no guessing.

https://merlinenergy.net/wizard

#IRA2022 #ITC #InvestmentTaxCredit #BESS #CleanEnergyIncentives #EnergyStorage #Sustainability`,
  },
  {
    id: "li-4",
    label: "🏥 Hospital Vertical Post",
    text: `Hospital energy facts most facilities managers don't know:

• 85% of load is classified as "critical" per NEC 517 / NFPA 99
• A 200-bed hospital peaks at 4,000–6,000 kW
• Average demand charge exposure: $2M+/year
• A BESS + backup generator combo can eliminate 99.9% of downtime risk
• IRA 2022 ITC covers 30–50% of the project cost

Most hospitals are still running on 30-year-old diesel backup systems. The ROI on a modern BESS is 5–8 years with no utility rebates.

We built the hospital BESS calculator at https://merlinenergy.net/hospital

60 seconds. Real numbers. Free.

#HospitalEnergy #Healthcare #EnergyStorage #CriticalFacilities #BESS #FacilitiesManagement #NEC517`,
  },
  {
    id: "li-5",
    label: "🔬 TrueQuote™ Explainer",
    text: `Why do BESS proposals fail due diligence? Five reasons I see over and over:

1. No source citations — "we used industry norms"
2. Flat 20% solar capacity factor (ignores your zip code)
3. Hardcoded 30% ITC (misses IRA 2022 bonus rates worth up to 40% more)
4. No degradation modeling (LFP loses ~1.5%/yr; NMC ~2%/yr over 25 years = 30% capacity loss)
5. No Monte Carlo — P50 projections with no downside case for lenders

TrueQuote™ is our answer to all five:
→ Every assumption cites its source
→ Location-specific PVWatts solar data
→ Dynamic ITC (6–70% per IRA 2022)
→ Chemistry-specific degradation curves
→ P10/P50/P90 Monte Carlo output

Get your TrueQuote™: https://merlinenergy.net

#TrueQuote #BESS #EnergyStorage #ProjectFinance #CleanEnergy #DueDiligence #Sustainability #IRA2022`,
  },
];

const TWEETS = [
  {
    id: "tw-1",
    label: "🚀 Launch",
    text: `Just shipped: BESS quotes in 90 seconds, every number traced to NREL/IEEE/IRA data.

TrueQuote™ = no more black-box proposals. Free.

👉 https://merlinenergy.net

#BESS #EnergyStorage #CleanEnergy #SolarPlusStorage #IRA2022`,
  },
  {
    id: "tw-2",
    label: "📊 Stats",
    text: `Commercial building BESS math:
→ Peak demand: 500 kW
→ BESS ratio (NREL standard): 0.40
→ BESS size: 200 kWh
→ Demand charge savings: ~$45K/yr
→ ITC at 40%: saves $80K upfront
→ Payback: ~5 years

Merlin calculates this in 60s 🔋

https://merlinenergy.net/wizard

#BESS #EnergyStorage #PeakShaving`,
  },
  {
    id: "tw-3",
    label: "💰 IRA ITC",
    text: `The IRA 2022 ITC isn't just 30%.

It's: 6% base + 24% prevailing wage + 10% energy community + 10% domestic content + up to 20% low-income bonus.

Your BESS project could qualify for 40–70% ITC.

Merlin calculates your actual rate automatically.

https://merlinenergy.net #IRA2022 #BESS #CleanEnergy @EnergyStoNews`,
  },
  {
    id: "tw-4",
    label: "👨‍💻 Founder Story",
    text: `I got tired of BESS consultants charging $5–50K for a black-box Excel sheet.

So I built Merlin — open benchmarks, traceable sources, free.

Every number cites NREL, IEEE, or IRA 2022. 15 industry verticals. Full IRR/NPV. Monte Carlo.

90 seconds. Free. @NRELnews data.

https://merlinenergy.net #BESS #EnergyStorage`,
  },
  {
    id: "tw-carwash",
    label: "🚗 Car Wash",
    text: `🚗 A tunnel car wash pulls 400–700 kW the moment the conveyor starts.

That 60-second spike = hundreds in demand charges every month.

LA car wash modeled:
→ Savings: $193K/yr
→ ITC credit: $125K
→ Payback: 1.5 yrs
→ 25-yr ROI: 565%

Run your numbers free 👇
https://merlinenergy.net/wizard

#CarWash #BESS #PeakShaving #IRA2022`,
  },
  {
    id: "tw-5",
    label: "⚔️ Comparison",
    text: `HOMER Pro: $2,500/yr
SAM (NREL): complex, no commercial focus
Custom consultant: $5K–$50K/quote
Excel spreadsheet: 40 hours of your life

Merlin: $0. 90 seconds. TrueQuote™ verified.

https://merlinenergy.net

#BESS #EnergyStorage #CleanEnergy`,
  },
  {
    id: "tw-hotel",
    label: "🏨 Hotel",
    text: `Hotels have two massive demand spikes every day: 7am checkout scramble + 6pm check-in.

That daily pattern costs a 200-room hotel $80–120K/year in demand charges alone.

BESS solution:
→ 500 kWh system absorbs both peaks
→ Saves $95K/yr in demand charges
→ ITC at 40%: $120K back
→ Payback: 3.8 years

Model your property free 👇
https://merlinenergy.net/wizard

#Hotel #BESS #EnergyStorage #PeakShaving`,
  },
  {
    id: "tw-datacenter",
    label: "🖥️ Data Center",
    text: `Data centers pay the highest demand charges of any building type.

Why? 100% critical load. Zero tolerance for sag. Utilities penalize that certainty.

A 2 MW colo running in Texas:
→ Demand charges: $480K/yr
→ BESS (800 kWh): cuts demand 40%
→ Savings: $192K/yr
→ Payback: 4.2 years
→ Doubles as UPS backup

Run your data center numbers free 👇
https://merlinenergy.net/wizard

#DataCenter #BESS #EnergyStorage #Colocation`,
  },
  {
    id: "tw-ev",
    label: "⚡ EV Charging",
    text: `The #1 reason EV charging stations fail financially: demand charges.

A 10-stall DCFC site hits 1,500 kW the moment 10 cars plug in simultaneously.

That spike = $30–60K/yr in demand charges before you sell a single kWh.

Add BESS:
→ 600 kWh absorbs the spike
→ Saves $42K/yr
→ ITC: $90K at 40%
→ Payback: 2.9 years

Model your EV hub 👇
https://merlinenergy.net/wizard

#EVCharging #BESS #EV #ChargingStation #IRA2022`,
  },
  {
    id: "tw-manufacturing",
    label: "🏭 Manufacturing",
    text: `Manufacturing plants bleed money every time a motor starts.

Large motor startup = instantaneous 6–10× rated load spike. Utilities charge you for the peak, not the average.

A 100K sqft facility in California:
→ Peak demand: 800 kW
→ Monthly demand charges: $24K
→ BESS (320 kWh): cuts peak 40%
→ Annual savings: $115K
→ Payback: 3.5 years

https://merlinenergy.net/wizard

#Manufacturing #BESS #EnergyStorage #Demand`,
  },
  {
    id: "tw-hospital",
    label: "🏥 Hospital",
    text: `Hospitals pay for energy twice: their utility bill AND a diesel generator they hope never runs.

What if your BESS was both?

A 300-bed hospital modeled:
→ 2 MWh BESS handles 85% critical load
→ Replaces $180K diesel maintenance/yr
→ Demand charge savings: $210K/yr
→ ITC (energy community bonus): 40%
→ Payback: 4.1 years

TrueQuote™ sourced to NEC 517 + IEEE 446.

https://merlinenergy.net/wizard

#Hospital #Healthcare #BESS #Backup #CriticalPower`,
  },
  {
    id: "tw-retail",
    label: "🏪 Retail",
    text: `Every grocery store, big-box retailer, and shopping center has the same problem: HVAC spikes at noon, lighting blazes 14 hrs a day.

Utilities charge demand based on your worst 15-minute interval each month.

One bad day sets your rate for 30 days.

A 50K sqft retail center:
→ Demand charges: $72K/yr
→ BESS (200 kWh): shaves peak
→ Saves: $31K/yr
→ + Solar arbitrage: $18K/yr
→ Payback: 5.1 years

https://merlinenergy.net/wizard

#Retail #BESS #SolarPlusStorage #EnergyStorage`,
  },
  {
    id: "tw-solar-arbitrage",
    label: "☀️ Solar + BESS",
    text: `Solar without storage = giving away your cheapest electrons.

Without BESS: sell excess solar at $0.04/kWh (wholesale)
With BESS: use it at peak when grid costs $0.32/kWh

8× value difference. Same panels.

A 500 kW commercial solar system:
→ Without BESS: $52K/yr savings
→ With BESS (400 kWh): $119K/yr savings
→ BESS pays for itself in 4 years
→ Then runs free for 21 more

https://merlinenergy.net/wizard

#Solar #BESS #SolarPlusStorage #EnergyArbitrage #IRA2022`,
  },
  {
    id: "tw-coldstore",
    label: "❄️ Cold Storage",
    text: `Cold storage warehouses: the most expensive electric bill per square foot of any building.

Compressors run 24/7. Defrost cycles spike demand at 2am when no one's watching.

A 100K sqft cold storage facility:
→ Annual electric bill: $1.2M
→ Demand charges alone: $310K/yr
→ BESS (800 kWh) + load shifting: saves $140K/yr
→ Payback: 4.8 years
→ 25-yr NPV: $1.9M

Run your cold storage model free 👇
https://merlinenergy.net/wizard

#ColdStorage #Refrigeration #BESS #EnergyStorage #Warehouse`,
  },
];

const EMAILS = [
  {
    id: "email-1",
    label: "Email 1 — Awareness",
    subject: "Quick BESS analysis tool for your next project",
    body: `Hi [First Name],

I noticed [Company] has been active in commercial energy storage projects in [Region/State].

I built a tool called Merlin that generates bankable BESS proposals in under 90 seconds — every number cited to NREL ATB 2024, IRA 2022, and IEEE standards. No black boxes, no consultants needed.

A few things it does that most tools don't:
• Dynamic ITC calculation (not just flat 30% — accounts for IRA 2022 prevailing wage, energy community, domestic content bonuses)
• Chemistry-specific battery degradation curves for 25-year projections
• Monte Carlo P10/P50/P90 output for lender/investor presentations

It's free to try: https://merlinenergy.net/wizard

Would a quick 15-minute demo be useful for your team?

Best,
[Your Name]
Merlin Energy | merlinenergy.net`,
  },
  {
    id: "email-2",
    label: "Email 2 — ITC Follow-up",
    subject: "RE: Quick BESS analysis tool — ITC update worth sharing",
    body: `Hi [First Name],

Following up on my last note. Quick value add regardless of whether you use Merlin:

Under IRA 2022, most commercial BESS projects qualify for 30–50% ITC (not just the flat 30% most quotes use). The bonus rates:
• Prevailing wage + apprenticeship: +24%
• Energy community (coal closure, brownfield, fossil employment): +10%
• Domestic content (100% US steel, 40%+ US components): +10%

On a $3M BESS project, the difference between 30% and 50% ITC is $600,000 in federal tax credits.

Merlin's ITC calculator runs all these scenarios automatically.

Takes 90 seconds to model your specific project: https://merlinenergy.net/wizard

Happy to show you a live example with your project parameters — 15 minutes?

Best,
[Your Name]`,
  },
  {
    id: "email-3",
    label: "Email 3 — Break-up",
    subject: "Last note — free BESS template",
    body: `Hi [First Name],

I'll keep this short — last email, I promise.

If your team ever needs a fast BESS first-pass for a site assessment, proposal, or client presentation, Merlin is free to use at https://merlinenergy.net

No sign-up required for the first quote. Full IRR, NPV, Monte Carlo output included.

Good luck with [Company]'s projects — you're building something important.

— [Your Name]
https://merlinenergy.net`,
  },
];

const PH_LISTING = {
  id: "ph-listing",
  name: "Merlin Energy",
  tagline: "BESS quotes in 90 seconds, backed by NREL + IRA data",
  description: `Merlin is an instant BESS (battery energy storage) financial analysis tool for commercial facilities.

🔋 What makes it different:
• TrueQuote™ — every number traces to a published source (NREL ATB 2024, IRA 2022, IEEE 446-1995)
• 15 commercial industries with ASHRAE/CBECS power profiles
• Dynamic ITC calculator: 6–70% based on IRA 2022 prevailing wage, energy community, and domestic content rules
• Full IRR, NPV, discounted payback, Monte Carlo P10/P50/P90
• Battery degradation by chemistry (LFP, NMC, NCA, Flow, Na-Ion)
• NREL PVWatts integration for location-specific solar production
• Export PDF, Word, Excel — bank-ready 3-statement model

⚡ Why I built it:
Every BESS quote I received was a black box — opaque assumptions, hardcoded spreadsheets, $5–50K consultant fees. TrueQuote™ means you can see exactly where every number comes from.

Free forever tier. 90 seconds. No consultants.`,
  topics: "#energy #bess #climate #fintech #saas #sustainability #solar",
};

// ─── Section component ────────────────────────────────────────────────────────
function Section({
  title, icon, children, id,
}: { title: string; icon: React.ReactNode; children: React.ReactNode; id: string }) {
  return (
    <section id={id} className="scroll-mt-20 mb-12">
      <div className="flex items-center gap-3 mb-5 pb-3 border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PressKit() {
  const { copy, isCopied } = useCopy();

  const nav = [
    { label: "Blurbs", href: "#blurbs" },
    { label: "Directories", href: "#directories" },
    { label: "LinkedIn", href: "#linkedin" },
    { label: "Twitter / X", href: "#twitter" },
    { label: "Product Hunt", href: "#ph" },
    { label: "Cold Email", href: "#email" },
  ];

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: "#0c0c0c", fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Sticky nav */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] backdrop-blur-xl"
        style={{ background: "rgba(12,12,12,0.92)" }}>
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MerlinBatteryLogo size={28} />
            <span className="font-bold text-sm">Merlin Energy</span>
            <span className="text-white/30 text-xs ml-1">/ Press &amp; Promo Kit</span>
          </div>
          <div className="hidden sm:flex items-center gap-5">
            {nav.map((n) => (
              <a key={n.href} href={n.href}
                className="text-xs text-white/40 hover:text-white/80 transition-colors">
                {n.label}
              </a>
            ))}
          </div>
          <a href="/wizard"
            className="h-7 px-3 rounded-lg bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black font-semibold text-xs flex items-center gap-1 transition-colors">
            Try Free <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-2">

        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#3ECF8E]/25 bg-[#3ECF8E]/5 mb-4">
            <div className="w-1.5 h-1.5 bg-[#3ECF8E] rounded-full animate-pulse" />
            <span className="text-[#3ECF8E] text-xs font-semibold uppercase tracking-wider">
              Promo Command Center
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">
            Press &amp; Promotion Kit
          </h1>
          <p className="text-white/40 text-sm max-w-xl">
            Click-to-copy content for every channel. No editing needed — just paste and post.
          </p>
        </div>

        {/* ── BLURBS ── */}
        <Section id="blurbs" title="About Merlin — Copy Blurbs" icon={<MessageSquare className="w-4 h-4 text-[#3ECF8E]" />}>
          <div className="space-y-3">
            {/* Tagline */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Tagline (1 line)</span>
                <CopyBtn id="tagline" text={TAGLINE} />
              </div>
              <p className="text-sm text-white/80 leading-relaxed">{TAGLINE}</p>
            </div>

            {/* Short */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Short description (~50 words)</span>
                <CopyBtn id="blurb-short" text={ABOUT_BLURB_SHORT} />
              </div>
              <p className="text-sm text-white/80 leading-relaxed">{ABOUT_BLURB_SHORT}</p>
            </div>

            {/* Long */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Long description (~100 words)</span>
                <CopyBtn id="blurb-long" text={ABOUT_BLURB_LONG} />
              </div>
              <p className="text-sm text-white/80 leading-relaxed">{ABOUT_BLURB_LONG}</p>
            </div>
          </div>
        </Section>

        {/* ── DIRECTORIES ── */}
        <Section id="directories" title="Directory Submissions" icon={<Globe className="w-4 h-4 text-[#3ECF8E]" />}>
          <div className="grid sm:grid-cols-2 gap-3">
            {DIRECTORIES.map((d) => (
              <div key={d.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm text-white">{d.name}</div>
                    <div className="text-xs text-white/40 mt-0.5">{d.category}</div>
                  </div>
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs text-white/60 hover:text-white transition-colors"
                  >
                    Open <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="text-xs text-white/30 bg-white/[0.02] rounded-lg p-2 border border-white/[0.05]">
                  {d.instructions}
                </div>
                <CopyBtn id={`dir-${d.id}`} text={`${ABOUT_BLURB_SHORT}\n\nWebsite: https://merlinenergy.net\nCategory: ${d.category}`} label="Copy description" />
              </div>
            ))}
          </div>
          {/* Categories reference */}
          <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Categories reference (copy for any listing)</span>
              <CopyBtn id="categories" text={Object.entries(CATEGORIES).map(([k,v]) => `${k}: ${v}`).join('\n')} label="Copy all" />
            </div>
            <div className="space-y-1">
              {Object.entries(CATEGORIES).map(([k, v]) => (
                <div key={k} className="flex items-baseline gap-2 text-xs">
                  <span className="text-white/30 w-28 shrink-0 capitalize">{k}</span>
                  <span className="text-white/60">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── LINKEDIN ── */}
        <Section id="linkedin" title="LinkedIn Posts (5 ready to post)" icon={<Linkedin className="w-4 h-4 text-[#3ECF8E]" />}>
          <div className="space-y-3">
            {LINKEDIN_POSTS.map((p) => (
              <div key={p.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-white/40">{p.label}</span>
                  <CopyBtn id={p.id} text={p.text} />
                </div>
                <pre className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap font-[inherit]">{p.text}</pre>
              </div>
            ))}
          </div>
        </Section>

        {/* ── TWITTER / X ── */}
        <Section id="twitter" title="Twitter / X Posts (5 ready to post)" icon={<Twitter className="w-4 h-4 text-[#3ECF8E]" />}>
          <div className="mb-3 rounded-lg border border-[#3ECF8E]/20 bg-[#3ECF8E]/[0.04] px-4 py-2.5 text-xs text-[#3ECF8E]">
            💡 Your handle: <span className="font-bold">@Merlin_Energy</span> — tag relevant accounts: <span className="font-mono">@NRELnews @EnergyStoNews @SEIA @DOEnergy @CleanEnergyOrg</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {TWEETS.map((t) => (
              <div key={t.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-white/40">{t.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] ${t.text.length > 280 ? 'text-amber-400' : 'text-white/30'}`}>
                      {t.text.length} chars
                    </span>
                    <CopyBtn id={t.id} text={t.text} />
                  </div>
                </div>
                <pre className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap font-[inherit]">{t.text}</pre>
              </div>
            ))}
          </div>
        </Section>

        {/* ── PRODUCT HUNT ── */}
        <Section id="ph" title="Product Hunt Listing" icon={<Star className="w-4 h-4 text-[#3ECF8E]" />}>
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-white/40">Product name</span>
                  <CopyBtn id="ph-name" text={PH_LISTING.name} />
                </div>
                <p className="text-sm text-white/80">{PH_LISTING.name}</p>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-white/40">Tagline (under 60 chars)</span>
                  <CopyBtn id="ph-tagline" text={PH_LISTING.tagline} />
                </div>
                <p className="text-sm text-white/80">{PH_LISTING.tagline}</p>
              </div>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white/40">Full description</span>
                <CopyBtn id="ph-desc" text={PH_LISTING.description} />
              </div>
              <pre className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap font-[inherit]">{PH_LISTING.description}</pre>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white/40">Topics / tags</span>
                <CopyBtn id="ph-topics" text={PH_LISTING.topics} />
              </div>
              <p className="text-sm text-white/80 font-mono">{PH_LISTING.topics}</p>
            </div>
            <a
              href="https://www.producthunt.com/posts/new"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-500/30 text-orange-400 text-sm font-semibold hover:bg-orange-500/10 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              Open Product Hunt submission →
            </a>
          </div>
        </Section>

        {/* ── COLD EMAIL ── */}
        <Section id="email" title="Cold Email Sequence (3-touch)" icon={<Mail className="w-4 h-4 text-[#3ECF8E]" />}>
          <div className="mb-3 text-xs text-white/30 bg-white/[0.02] border border-white/[0.05] rounded-lg px-4 py-2.5">
            <strong className="text-white/50">Target audience:</strong> EPC firms, solar+storage developers, commercial energy consultants, facilities managers at hospitals / hotels / data centers / warehouses. Find on LinkedIn, ZoomInfo, or Apollo.io.
          </div>
          <div className="space-y-3">
            {EMAILS.map((e) => (
              <div key={e.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-white/50">{e.label}</span>
                  <CopyBtn id={e.id} text={`Subject: ${e.subject}\n\n${e.body}`} label="Copy full email" />
                </div>
                <div className="mb-2 text-xs text-white/30">
                  <span className="text-white/50 font-medium">Subject:</span> {e.subject}
                </div>
                <pre className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap font-[inherit]">{e.body}</pre>
              </div>
            ))}
          </div>
        </Section>

        {/* ── REFERRAL ── */}
        <Section id="referral" title="Referral Links" icon={<Users className="w-4 h-4 text-[#3ECF8E]" />}>
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <p className="text-sm text-white/60 mb-4">
              Send people your personal referral link. When they sign up, you both get credits.
              Replace <code className="bg-white/[0.06] px-1.5 py-0.5 rounded text-[#3ECF8E] text-xs">yourhandle</code> with your name or company.
            </p>
            <div className="space-y-2">
              {["yourname", "yourcompany", "acmecorp"].map((handle) => (
                <div key={handle} className="flex items-center gap-3">
                  <code className="flex-1 text-xs bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-white/60 font-mono">
                    https://merlinenergy.net/r/{handle}
                  </code>
                  <CopyBtn
                    id={`ref-${handle}`}
                    text={`https://merlinenergy.net/r/${handle}`}
                    label="Copy"
                  />
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-white/30">
              Referral page lives at <code className="text-white/50">/r/[handle]</code> — share with your network, include in email signatures, or add to LinkedIn profile.
            </p>
          </div>
        </Section>

      </div>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] mt-8">
        <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-700">© {new Date().getFullYear()} Merlin Energy — merlinenergy.net</span>
          <div className="flex gap-5">
            {[
              { label: "Home", href: "/home" },
              { label: "Wizard", href: "/wizard" },
              { label: "Pricing", href: "/pricing" },
              { label: "Launch", href: "/launch" },
            ].map((l) => (
              <a key={l.label} href={l.href} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
