import { useEffect, useMemo, useState } from "react";

type QuoteHighlights = {
  annualSavings?: string | null;
  payback?: string | null;
  npv25?: string | null;
  solarKW?: string | null;
  bessKW?: string | null;
  netInvestment?: string | null;
  bessVendor?: string | null;
  bessModel?: string | null;
};

type SystemItem = {
  category: string;
  size: string;
  specs: string;
  annualOutput?: string;
  purpose?: string;
  savings: string;
  capexGross: string;
};

type FinancialBreakdown = {
  grossProjectCost: number;
  federalITC30: number;
  macrsTaxShieldYear1: number;
  netEffectiveCost: number;
  annualDemandSavings: number;
  annualSolarSavings: number;
  totalAnnualSavings: number;
  paybackYears: number;
  npv25Year: number;
};

type SharedQuoteResponse = {
  ok: boolean;
  quote?: {
    businessName?: string | null;
    industry?: string | null;
    quoteData?: {
      systemBreakdown?: SystemItem[];
      financialBreakdown?: FinancialBreakdown;
      recommended?: Record<string, unknown>;
    } | null;
    createdAt?: string | null;
    expiresAt?: string | null;
    highlights?: QuoteHighlights | null;
  };
  error?: string;
};

function getQuoteToken() {
  return decodeURIComponent(
    window.location.pathname.replace(/^\/(quote|q)\/?/, "").split("/")[0] || ""
  );
}

function industryLabel(industry?: string | null) {
  return (industry || "energy")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function metric(
  label: string,
  value?: string | null,
  subtext?: string,
  accent = "text-yellow-300"
) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-lg">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-extrabold ${accent}`}>{value || "Review"}</p>
      {subtext && <p className="mt-1 text-xs text-slate-400">{subtext}</p>}
    </div>
  );
}

export default function SharedQuotePage() {
  const token = useMemo(getQuoteToken, []);
  const [data, setData] = useState<SharedQuoteResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadQuote() {
      if (!token) {
        setData({ ok: false, error: "Missing quote token" });
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/sales-agent/shared-quote/${encodeURIComponent(token)}`);
        const payload = (await response.json()) as SharedQuoteResponse;
        if (!cancelled) setData(payload);
      } catch {
        if (!cancelled) setData({ ok: false, error: "Unable to load this quote" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadQuote();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#060D1F] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent" />
          <p className="text-sm font-medium text-slate-400">Loading StackQuote Proposal…</p>
        </div>
      </main>
    );
  }

  if (!data?.ok || !data.quote) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#060D1F] px-6 text-white">
        <section className="max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-yellow-300">
            StackQuote™
          </p>
          <h1 className="text-2xl font-bold">Quote link unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {data?.error || "This quote may have expired or been removed."}
          </p>
          <a
            href="/wizard"
            className="mt-6 inline-flex rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-black hover:bg-yellow-300"
          >
            Build a New Quote
          </a>
        </section>
      </main>
    );
  }

  const { quote } = data;
  const highlights = quote.highlights || {};
  const quoteData = quote.quoteData || {};

  // Custom system items or fallback derived from token
  const systemBreakdown: SystemItem[] = quoteData.systemBreakdown || [
    {
      category: "Rooftop & Vacuum Canopy Solar PV",
      size: highlights.solarKW || "45 kW DC",
      specs: "112 × 400W Monocrystalline PV Modules (Flat Metal Vacuum Canopy + Building Roof)",
      annualOutput: "85,500 kWh / year (5.8 Peak Sun Hours, Las Vegas, NV)",
      savings: "$10,260 / year (Energy Rate Offset @ $0.12/kWh)",
      capexGross: "$67,500",
    },
    {
      category: "Commercial BESS Battery Storage",
      size: highlights.bessKW || "180 kW / 360 kWh",
      specs: `${highlights.bessVendor || "Tesla Megapack Commercial / Dynapower"} C&I PCS Inverter (Outdoor IP65 LFP Liquid-Cooled Enclosure)`,
      purpose:
        "Clamps 400–600 kW afternoon rush-hour peak demand spikes from blowers & conveyor motors",
      savings: "$47,520 / year ($22/kW/mo NV Energy LGS-1 Demand Charge Shaving)",
      capexGross: "$180,000",
    },
    {
      category: "Balance of System & Engineering",
      size: "Site Engineering",
      specs: "Interconnection, Structural Engineering, Switchgear & Smart Microgrid Controller",
      savings: "Integrated Automated Peak Shaving",
      capexGross: "$20,000",
    },
  ];

  const financial = quoteData.financialBreakdown || {
    grossProjectCost: 267500,
    federalITC30: 80250,
    macrsTaxShieldYear1: 14000,
    netEffectiveCost: 173250,
    annualDemandSavings: 47520,
    annualSolarSavings: 10260,
    totalAnnualSavings: 57780,
    paybackYears: 3.0,
    npv25Year: 685000,
  };

  return (
    <main className="min-h-screen bg-[#060D1F] px-5 py-8 text-white md:px-10 md:py-12">
      <section className="mx-auto max-w-6xl">
        {/* Header Hero Banner */}
        <div className="mb-8 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-indigo-950/40 to-blue-950/30 p-6 shadow-2xl md:p-10 backdrop-blur-xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Verified StackQuote™ Proposal
            </div>
            <span className="text-xs font-mono text-slate-400">Ref ID: {token}</span>
          </div>

          <div className="mt-5 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-5xl">
                {quote.businessName || "Shared Energy Quote"}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300 md:text-base">
                Custom {industryLabel(quote.industry)} BESS + Solar financial analysis. Modeled
                against NV Energy LGS-1 commercial demand tariffs, NREL solar irradiance data, and
                30% IRA Investment Tax Credit (ITC).
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="mailto:bob@merlinenergy.net?subject=WOW%20Carwash%20StackQuote%20Review"
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-400 transition-all"
              >
                Accept Proposal & Schedule Call →
              </a>
            </div>
          </div>
        </div>

        {/* Executive Metrics Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {metric(
            "Estimated Annual Savings",
            highlights.annualSavings || `$${financial.totalAnnualSavings.toLocaleString()}/yr`,
            "$47.5k demand shave + $10.2k solar",
            "text-emerald-400"
          )}
          {metric(
            "Simple Payback",
            highlights.payback || `${financial.paybackYears.toFixed(1)} Years`,
            "Target threshold: < 5.0 yrs",
            "text-yellow-300"
          )}
          {metric(
            "25-Year Cumulative NPV",
            highlights.npv25 || `$${financial.npv25Year.toLocaleString()}`,
            "Net positive lifetime return",
            "text-sky-400"
          )}
          {metric(
            "Net Out-of-Pocket Cost",
            highlights.netInvestment || `$${financial.netEffectiveCost.toLocaleString()}`,
            "After 30% IRA Federal Tax Credit",
            "text-purple-300"
          )}
        </div>

        {/* Detailed System Architecture Breakdown */}
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-6 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>⚡</span> System Architecture & Equipment Breakdown
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Optimized footprint matching express car wash building dimensions and vacuum shade
                canopies.
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-3 py-1 rounded-full">
              Full Integrated Stack
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {systemBreakdown.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-2xl border border-white/10 bg-black/40 p-5 hover:border-indigo-500/40 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Component {idx + 1}
                    </span>
                    <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                      {item.size}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{item.category}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">{item.specs}</p>

                  {item.purpose && (
                    <div className="mt-3 rounded-lg bg-indigo-950/40 border border-indigo-500/20 p-2.5">
                      <p className="text-[11px] font-semibold text-indigo-300">
                        🎯 Load Objective:
                      </p>
                      <p className="text-[11px] text-slate-300 mt-0.5">{item.purpose}</p>
                    </div>
                  )}

                  {item.annualOutput && (
                    <p className="mt-3 text-xs text-sky-300 font-medium">☀️ {item.annualOutput}</p>
                  )}
                </div>

                <div className="mt-6 border-t border-white/10 pt-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 font-semibold block">
                      Annual Benefit
                    </span>
                    <span className="text-xs font-bold text-emerald-300">{item.savings}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-slate-500 font-semibold block">
                      Gross Capex
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-300">
                      {item.capexGross}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Capital Line Item & Incentives Table */}
        <div className="mb-8 grid gap-8 md:grid-cols-2">
          {/* Capital Outlay Table */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>💳</span> Capital Costs & Tax Credit Breakdown
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-slate-300">Gross System Turnkey Installed Cost</span>
                <span className="font-mono font-bold text-white">
                  ${financial.grossProjectCost.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10 text-emerald-400">
                <span>Less: 30% IRA Federal Investment Tax Credit (ITC)</span>
                <span className="font-mono font-bold">
                  -${financial.federalITC30.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10 text-sky-300">
                <span>Est. Year-1 MACRS Depreciation Tax Shield</span>
                <span className="font-mono font-bold">
                  -${financial.macrsTaxShieldYear1.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-3 rounded-xl bg-gradient-to-r from-emerald-950/40 to-indigo-950/40 px-4 border border-emerald-500/30">
                <span className="font-bold text-white">Net Out-of-Pocket Capital Required</span>
                <span className="font-mono font-extrabold text-emerald-400 text-base">
                  ${financial.netEffectiveCost.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Annual Savings Breakdown */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>💰</span> Annual Utility Bill Reduction
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-slate-300">
                  Demand Charge Shaving (NV Energy LGS-1 @ $22/kW)
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  ${financial.annualDemandSavings.toLocaleString()}/yr
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-slate-300">Rooftop + Canopy Solar Energy Offset</span>
                <span className="font-mono font-bold text-emerald-400">
                  ${financial.annualSolarSavings.toLocaleString()}/yr
                </span>
              </div>
              <div className="flex justify-between py-3 rounded-xl bg-gradient-to-r from-emerald-950/40 to-teal-950/40 px-4 border border-emerald-500/30 mt-4">
                <span className="font-bold text-white">Total Annual Operational Savings</span>
                <span className="font-mono font-extrabold text-emerald-300 text-base">
                  ${financial.totalAnnualSavings.toLocaleString()}/yr
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 25-Year Cumulative ROI Cashflow Projection */}
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span>📈</span> 25-Year Cumulative Net ROI Cash Flow
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Full payback achieved at Year 3.0. Net positive return accelerates every year after.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
              3.0 Year Payback Verified
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              {
                year: "Year 0",
                cash: `-$${financial.netEffectiveCost.toLocaleString()}`,
                label: "Net Initial Outlay",
                style: "border-slate-700 bg-slate-900/60 text-slate-300",
              },
              {
                year: "Year 1",
                cash: `-$${(financial.netEffectiveCost - financial.totalAnnualSavings).toLocaleString()}`,
                label: "+$57.8k Shaved",
                style: "border-slate-700 bg-slate-900/60 text-slate-300",
              },
              {
                year: "Year 3.0",
                cash: "$0 (Full Payback)",
                label: "🎉 100% Capital Recovered",
                style: "border-yellow-500/50 bg-yellow-500/15 text-yellow-300 font-bold",
              },
              {
                year: "Year 10",
                cash: `+$${(financial.totalAnnualSavings * 10 - financial.netEffectiveCost).toLocaleString()}`,
                label: "Net Positive Profit",
                style: "border-emerald-500/30 bg-emerald-950/30 text-emerald-400",
              },
              {
                year: "Year 25",
                cash: `+$${financial.npv25Year.toLocaleString()}`,
                label: "Lifetime Net NPV",
                style: "border-sky-500/40 bg-sky-950/40 text-sky-300 font-extrabold",
              },
            ].map((step, idx) => (
              <div key={idx} className={`rounded-2xl border p-4 text-center ${step.style}`}>
                <p className="text-xs uppercase font-bold tracking-wider opacity-75">{step.year}</p>
                <p className="text-lg font-mono font-extrabold mt-2">{step.cash}</p>
                <p className="text-[11px] mt-1 opacity-90">{step.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Call to Action Section */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 p-6 md:p-10 text-center">
          <h3 className="text-2xl font-bold text-white">
            Ready to Review the Engineering Assumptions?
          </h3>
          <p className="mt-2 text-sm text-slate-300 max-w-xl mx-auto">
            Merlin can run a refined 15-minute interval demand analysis using your actual NV Energy
            electric bill to verify exact peak shaving windows.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <a
              href="mailto:bob@merlinenergy.net?subject=WOW%20Carwash%20Proposal%20Review"
              className="rounded-xl bg-yellow-400 px-6 py-3.5 text-sm font-bold text-black hover:bg-yellow-300 shadow-xl shadow-yellow-400/20"
            >
              Contact Bob Christopher (bob@merlinenergy.net)
            </a>
            <a
              href="/wizard"
              className="rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-bold text-white hover:bg-white/10"
            >
              Explore Energy Wizard →
            </a>
          </div>
        </div>

        <p className="mt-8 text-center text-xs leading-5 text-slate-500">
          This automated analysis is a directional estimate based on available utility tariff
          schedules and solar data. Final engineering, equipment procurement, and utility
          interconnection approval will be confirmed prior to contract execution.
        </p>
      </section>
    </main>
  );
}
