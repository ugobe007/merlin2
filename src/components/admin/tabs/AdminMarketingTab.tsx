/**
 * Admin Marketing Kit Tab
 * ─────────────────────────────────────────────────────────────
 * Self-contained marketing copy generator for the Merlin team.
 * Builds email / LinkedIn / SMS templates from manual inputs.
 * Not shown to end users — internal sales tool only.
 */

import React, { useState, useCallback } from "react";
import { Megaphone, Copy, Check, Link2 } from "lucide-react";

type Tab = "email" | "linkedin" | "sms";

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

function buildContent(q: QuoteInputs) {
  const hasSolar = q.solarKW > 0;
  const netCostFmt = `$${q.netCostK}K`;
  const savingsFmt = `$${q.savingsK}K`;

  const emailBody = `Subject: Cut ${q.bizName}'s Energy Costs by Up to ${savingsFmt}/Year — Here's How

Hi [First Name],

I came across ${q.bizName} and wanted to share something that could directly impact your bottom line.

We just ran a Merlin BESS energy analysis for a ${q.industryLabel.toLowerCase()} in ${q.city}. Here's what the numbers showed:

  • ${q.bessKWh} kWh battery storage${hasSolar ? ` + ${q.solarKW} kW solar` : ""}
  • Estimated annual savings: ${savingsFmt}
  • Net investment after federal ITC: ${netCostFmt}
  • Payback period: ${q.payback} years
  • 10-year ROI: ${q.roi}%

With utility rates rising every year, facilities like yours in ${q.city} are seeing strong returns on energy independence.

Would you be open to a 15-minute call to walk through a custom quote for your location?

Best,
[Your Name]
Merlin Energy Solutions`;

  const linkedinPost = `⚡ Energy savings case study — ${q.industryLabel} in ${q.city}

We ran a Merlin BESS analysis and the numbers are hard to ignore:

✅ ${q.bessKWh} kWh battery storage${hasSolar ? ` + ${q.solarKW} kW solar` : ""}
✅ ${savingsFmt}/year in estimated savings
✅ ${q.payback}-year payback after the 30% federal ITC
✅ ${q.roi}% projected 10-year ROI

With grid costs climbing, now is the time for ${q.industryLabel.toLowerCase()} operators to take control of their energy spend.

If you own or manage a ${q.industryLabel.toLowerCase()} and want to see what the numbers look like for your specific location — reach out. We'll build you a quote in minutes.

#EnergyStorage #BESS #CleanEnergy #${q.industryLabel.replace(/\s+/g, "")} #SolarPlusStorage #EnergyIndependence`;

  const smsText = `Hi [Name] — quick note: we built an energy analysis for a ${q.industryLabel.toLowerCase()} in ${q.city}. ${q.bessKWh} kWh storage, ${savingsFmt}/yr savings, ${q.payback}-yr payback after ITC. Happy to build one for your location — takes 5 min. Reply YES and I'll send a link.`;

  return { emailBody, linkedinPost, smsText };
}

const TAB_META: { key: Tab; label: string; icon: string }[] = [
  { key: "email", label: "Email Pitch", icon: "✉️" },
  { key: "linkedin", label: "LinkedIn Post", icon: "💼" },
  { key: "sms", label: "Text / SMS", icon: "💬" },
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
  const [tab, setTab] = useState<Tab>("email");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [q, setQ] = useState<QuoteInputs>(FIELD_DEFAULTS);

  const { emailBody, linkedinPost, smsText } = buildContent(q);

  const texts: Record<Tab, string> = {
    email: emailBody,
    linkedin: linkedinPost,
    sms: smsText,
  };

  const copyToClipboard = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  }, []);

  const activeText = texts[tab];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
          <Megaphone className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Marketing Kit</h2>
          <p className="text-sm text-white/50">
            Internal sales tool — build outreach templates from a quote's numbers.
          </p>
        </div>
      </div>

      {/* Inputs panel */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
        <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-4">
          Quote Inputs
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
            <div key={key} className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-white/40 uppercase tracking-wide">
                {label}
              </label>
              <input
                type={type}
                value={String(q[key])}
                onChange={(e) =>
                  setQ((prev) => ({
                    ...prev,
                    [key]: type === "number" ? Number(e.target.value) : e.target.value,
                  }))
                }
                className="px-3 py-2 rounded-lg bg-slate-900 border border-white/[0.10] text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/40 transition"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Output panel */}
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.03] p-5">
        {/* Tab switcher */}
        <div className="flex gap-1.5 mb-4">
          {TAB_META.map(({ key, label, icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tab === key
                  ? "bg-violet-500/20 border border-violet-500/40 text-violet-300"
                  : "bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-white/70 hover:bg-white/[0.07]"
              }`}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {/* Content preview */}
        <div className="relative">
          <pre className="w-full min-h-[220px] max-h-80 overflow-y-auto rounded-lg bg-slate-900/70 border border-white/[0.08] p-4 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
            {activeText}
          </pre>
          <button
            type="button"
            onClick={() => copyToClipboard(activeText, tab)}
            className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 border border-white/10 text-xs text-slate-400 hover:text-slate-200 hover:border-white/20 transition-all"
          >
            {copiedKey === tab ? (
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

        {/* Actions */}
        <div className="flex items-center gap-3 mt-3">
          {tab === "email" && (
            <button
              type="button"
              onClick={() => {
                window.location.href = `mailto:?subject=${encodeURIComponent(`Cut ${q.bizName}'s Energy Costs — Merlin BESS Analysis`)}&body=${encodeURIComponent(emailBody)}`;
              }}
              className="flex items-center gap-2 h-9 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 transition-all text-white font-semibold text-sm"
            >
              <Link2 className="w-3.5 h-3.5" />
              Open in Mail
            </button>
          )}
          {tab === "linkedin" && (
            <button
              type="button"
              onClick={() => {
                window.open(
                  `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://merlin2.fly.dev")}&summary=${encodeURIComponent(linkedinPost.slice(0, 700))}`,
                  "_blank"
                );
              }}
              className="flex items-center gap-2 h-9 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 transition-all text-white font-semibold text-sm"
            >
              <Link2 className="w-3.5 h-3.5" />
              Post on LinkedIn
            </button>
          )}
          {tab === "sms" && (
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(smsText);
                window.location.href = `sms:?body=${encodeURIComponent(smsText)}`;
              }}
              className="flex items-center gap-2 h-9 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 transition-all text-white font-semibold text-sm"
            >
              <Link2 className="w-3.5 h-3.5" />
              Copy & Open Messages
            </button>
          )}
          <span className="text-xs text-white/30">
            Personalize the bracketed fields before sending.
          </span>
        </div>
      </div>
    </div>
  );
}
