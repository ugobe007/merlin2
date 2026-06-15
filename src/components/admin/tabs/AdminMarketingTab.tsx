/**
 * Admin Marketing Kit Tab
 * Internal sales tool — multiple selectable outreach templates per channel.
 */

import React, { useState, useCallback, useMemo } from "react";
import { Megaphone, Copy, Check, Link2 } from "lucide-react";

type Channel = "email" | "linkedin" | "social" | "sms";

interface QuoteInputs {
  industryLabel: string;
  city: string;
  bizName: string;
  bessKWh: number;
  solarKW: number;
  netCostK: number;
  savingsK: number;
  payback: string;
  roi: number;
}

interface TemplateVariant {
  id: string;
  label: string;
  build: (q: QuoteInputs) => string;
}

function buildTemplates(q: QuoteInputs): Record<Channel, TemplateVariant[]> {
  const hasSolar = q.solarKW > 0;
  const netCostFmt = `$${q.netCostK}K`;
  const savingsFmt = `$${q.savingsK}K`;
  const storageLine = `${q.bessKWh} kWh battery storage${hasSolar ? ` + ${q.solarKW} kW solar` : ""}`;
  const industry = q.industryLabel.toLowerCase();
  const hashtag = q.industryLabel.replace(/\s+/g, "");

  return {
    email: [
      {
        id: "direct-pitch",
        label: "Direct Pitch",
        build:
          () => `Subject: Cut ${q.bizName}'s Energy Costs by Up to ${savingsFmt}/Year — Here's How

Hi [First Name],

I came across ${q.bizName} and wanted to share something that could directly impact your bottom line.

We just ran a Merlin BESS energy analysis for a ${industry} in ${q.city}. Here's what the numbers showed:

  • ${storageLine}
  • Estimated annual savings: ${savingsFmt}
  • Net investment after federal ITC: ${netCostFmt}
  • Payback period: ${q.payback} years
  • 10-year ROI: ${q.roi}%

With utility rates rising every year, facilities like yours in ${q.city} are seeing strong returns on energy independence.

Would you be open to a 15-minute call to walk through a custom quote for your location?

Best,
[Your Name]
Merlin Energy Solutions`,
      },
      {
        id: "roi-focused",
        label: "ROI Focus",
        build: () => `Subject: ${q.roi}% 10-Year ROI on Energy Storage — ${q.bizName}

Hi [First Name],

Quick ROI snapshot for ${q.bizName} (${q.city}):

Investment (after 30% ITC): ${netCostFmt}
Annual savings: ${savingsFmt}
Payback: ${q.payback} years
10-year ROI: ${q.roi}%

System: ${storageLine}

Merlin models this in minutes using real utility rates and incentive data for ${q.city}. Happy to send a facility-specific quote — no obligation.

[Your Name]
Merlin Energy Solutions`,
      },
      {
        id: "follow-up",
        label: "Follow-Up",
        build: () => `Subject: Following up — energy savings for ${q.bizName}

Hi [First Name],

Following up on the Merlin analysis we prepared for a comparable ${industry} in ${q.city}:

  • ${storageLine}
  • ${savingsFmt}/year estimated savings
  • ${q.payback}-year payback after ITC

If timing is better now, I can run the same analysis for ${q.bizName} and share numbers this week.

Best,
[Your Name]`,
      },
    ],
    linkedin: [
      {
        id: "case-study",
        label: "Case Study",
        build: () => `⚡ Energy savings case study — ${q.industryLabel} in ${q.city}

We ran a Merlin BESS analysis and the numbers are hard to ignore:

✅ ${storageLine}
✅ ${savingsFmt}/year in estimated savings
✅ ${q.payback}-year payback after the 30% federal ITC
✅ ${q.roi}% projected 10-year ROI

With grid costs climbing, now is the time for ${industry} operators to take control of their energy spend.

If you own or manage a ${industry} and want to see what the numbers look like for your specific location — reach out. We'll build you a quote in minutes.

#EnergyStorage #BESS #CleanEnergy #${hashtag} #SolarPlusStorage #EnergyIndependence`,
      },
      {
        id: "thought-leadership",
        label: "Thought Leadership",
        build: () => `Utility rates aren't waiting for anyone.

We modeled a ${industry} in ${q.city} with Merlin BESS:
→ ${storageLine}
→ ${savingsFmt}/yr savings
→ ${q.payback}-yr payback (post-ITC)

The facilities winning on energy economics aren't guessing — they're running real numbers before they sign a PPA or capex check.

DM me if you want a quote built for your site in under 5 minutes.

#EnergyTransition #CommercialSolar #BatteryStorage #${hashtag}`,
      },
      {
        id: "data-hook",
        label: "Data Hook",
        build: () => `${savingsFmt}/year.

That's what a ${industry} in ${q.city} could save with:
• ${q.bessKWh} kWh BESS${hasSolar ? `\n• ${q.solarKW} kW solar` : ""}
• ${netCostFmt} net cost after ITC
• ${q.roi}% 10-year ROI

Payback: ${q.payback} years.

We built this with Merlin — quote-grade modeling, not a spreadsheet guess.

Comment "QUOTE" or message me for your location.

#BESS #EnergySavings #${hashtag} #MerlinEnergy`,
      },
      {
        id: "short-hook",
        label: "Short Hook",
        build: () => `${q.industryLabel} in ${q.city}:
${storageLine} → ${savingsFmt}/yr savings, ${q.payback}-yr payback.

Real numbers. 5-minute quote.

#EnergyStorage #${hashtag}`,
      },
    ],
    social: [
      {
        id: "twitter",
        label: "X / Twitter",
        build: () => `Modeled a ${industry} in ${q.city}:
${q.bessKWh} kWh BESS${hasSolar ? ` + ${q.solarKW} kW solar` : ""}
→ ${savingsFmt}/yr savings
→ ${q.payback}-yr payback (post-ITC)
→ ${q.roi}% 10-yr ROI

Quote-grade energy math in minutes. DM for your site.

#BESS #CleanEnergy #${hashtag}`,
      },
      {
        id: "facebook",
        label: "Facebook",
        build: () => `Thinking about cutting energy costs at your ${industry}?

We ran a Merlin BESS analysis for a property in ${q.city}:
• ${storageLine}
• Estimated savings: ${savingsFmt}/year
• Net investment after federal tax credit: ${netCostFmt}
• Payback: ${q.payback} years

Message us to get a custom quote for your facility — takes about 5 minutes.`,
      },
      {
        id: "instagram",
        label: "Instagram Caption",
        build: () => `Energy independence isn't theory — it's math. ⚡

${q.industryLabel} · ${q.city}
${storageLine}
${savingsFmt}/yr savings · ${q.payback}-yr payback · ${q.roi}% ROI

Link in bio for your custom Merlin quote.

#EnergyStorage #SolarPlusStorage #${hashtag} #CleanEnergy #BESS #MerlinEnergy`,
      },
      {
        id: "threads",
        label: "Threads",
        build: () => `Ran the numbers on a ${industry} in ${q.city}.

${storageLine}
${savingsFmt}/yr back in your pocket.
${q.payback}-year payback after ITC.

If you operate commercial property and haven't modeled BESS yet — you're leaving money on the table.`,
      },
    ],
    sms: [
      {
        id: "standard",
        label: "Standard",
        build: () =>
          `Hi [Name] — quick note: we built an energy analysis for a ${industry} in ${q.city}. ${q.bessKWh} kWh storage, ${savingsFmt}/yr savings, ${q.payback}-yr payback after ITC. Happy to build one for your location — takes 5 min. Reply YES and I'll send a link.`,
      },
      {
        id: "roi-sms",
        label: "ROI Short",
        build: () =>
          `Hi [Name] — Merlin quote for ${industry}s in ${q.city}: ${savingsFmt}/yr savings, ${q.payback}-yr payback, ${q.roi}% 10-yr ROI on ${q.bessKWh} kWh BESS. Want numbers for your site? Reply YES.`,
      },
      {
        id: "follow-up-sms",
        label: "Follow-Up",
        build: () =>
          `Hi [Name] — following up on Merlin energy modeling. Comparable ${industry} in ${q.city} saves ~${savingsFmt}/yr with ${q.bessKWh} kWh storage. Still interested in a free quote? Reply YES.`,
      },
    ],
  };
}

const CHANNEL_META: { key: Channel; label: string }[] = [
  { key: "email", label: "Email" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "social", label: "Social Media" },
  { key: "sms", label: "SMS" },
];

const FIELD_DEFAULTS: QuoteInputs = {
  industryLabel: "Hotel",
  city: "Las Vegas, NV",
  bizName: "the property",
  bessKWh: 500,
  solarKW: 200,
  netCostK: 280,
  savingsK: 95,
  payback: "4.2",
  roi: 180,
};

export default function AdminMarketingTab() {
  const [channel, setChannel] = useState<Channel>("email");
  const [variantId, setVariantId] = useState<string>("direct-pitch");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [q, setQ] = useState<QuoteInputs>(FIELD_DEFAULTS);

  const templates = useMemo(() => buildTemplates(q), [q]);

  const variants = templates[channel];
  const activeVariant = variants.find((v) => v.id === variantId) ?? variants[0];
  const activeText = activeVariant.build(q);

  const handleChannelChange = (next: Channel) => {
    setChannel(next);
    setVariantId(buildTemplates(q)[next][0].id);
  };

  const copyToClipboard = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  }, []);

  return (
    <div className="admin-supabase max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Megaphone className="w-5 h-5 text-[var(--magic)]" />
        <div>
          <h2 className="admin-title">Marketing Kit</h2>
          <p className="admin-subtitle">
            Internal sales tool — select a template, copy, and personalize.
          </p>
        </div>
      </div>

      <div className="admin-stroke">
        <div className="admin-section-label admin-stroke-row">Quote Inputs</div>
        <div className="grid grid-cols-2 md:grid-cols-4">
          {(
            [
              { key: "bizName", label: "Business Name", type: "text" },
              { key: "industryLabel", label: "Industry", type: "text" },
              { key: "city", label: "City / State", type: "text" },
              { key: "bessKWh", label: "BESS (kWh)", type: "number" },
              { key: "solarKW", label: "Solar (kW)", type: "number" },
              { key: "netCostK", label: "Net Cost ($K)", type: "number" },
              { key: "savingsK", label: "Savings/yr ($K)", type: "number" },
              { key: "payback", label: "Payback (yrs)", type: "text" },
              { key: "roi", label: "10-yr ROI (%)", type: "number" },
            ] as { key: keyof QuoteInputs; label: string; type: string }[]
          ).map(({ key, label, type }) => (
            <div key={key} className="admin-stroke-row flex-col items-stretch !gap-1">
              <label className="admin-section-label">{label}</label>
              <input
                type={type}
                value={String(q[key])}
                onChange={(e) =>
                  setQ((prev) => ({
                    ...prev,
                    [key]: type === "number" ? Number(e.target.value) : e.target.value,
                  }))
                }
                className="admin-input w-full"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="admin-stroke">
        <div className="flex border-b border-[var(--glass-border)]">
          {CHANNEL_META.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleChannelChange(key)}
              className={`admin-template-chip flex-1 ${channel === key ? "active" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="admin-template-picker border-0 border-b border-[var(--glass-border)]">
          {variants.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setVariantId(v.id)}
              className={`admin-template-chip ${variantId === v.id ? "active" : ""}`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <pre className="admin-preview">{activeText}</pre>
          <button
            type="button"
            onClick={() => copyToClipboard(activeText, `${channel}-${variantId}`)}
            className="admin-btn-stroke absolute top-2 right-2"
          >
            {copiedKey === `${channel}-${variantId}` ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copy
              </>
            )}
          </button>
        </div>

        <div className="admin-stroke-row">
          {channel === "email" && (
            <button
              type="button"
              onClick={() => {
                window.location.href = `mailto:?subject=${encodeURIComponent(`Cut ${q.bizName}'s Energy Costs — Merlin BESS Analysis`)}&body=${encodeURIComponent(activeText)}`;
              }}
              className="admin-btn-stroke admin-btn-primary"
            >
              <Link2 className="w-3.5 h-3.5" />
              Open in Mail
            </button>
          )}
          {channel === "linkedin" && (
            <button
              type="button"
              onClick={() => {
                window.open(
                  `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(import.meta.env.VITE_PUBLIC_URL || "https://merlinenergy.net")}&summary=${encodeURIComponent(activeText.slice(0, 700))}`,
                  "_blank"
                );
              }}
              className="admin-btn-stroke admin-btn-primary"
            >
              <Link2 className="w-3.5 h-3.5" />
              Post on LinkedIn
            </button>
          )}
          {channel === "sms" && (
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(activeText);
                window.location.href = `sms:?body=${encodeURIComponent(activeText)}`;
              }}
              className="admin-btn-stroke admin-btn-primary"
            >
              <Link2 className="w-3.5 h-3.5" />
              Copy & Open Messages
            </button>
          )}
          <span className="admin-subtitle">Personalize bracketed fields before sending.</span>
        </div>
      </div>
    </div>
  );
}
