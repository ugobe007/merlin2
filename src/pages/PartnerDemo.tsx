/**
 * Partner Demo Page — /demo/:partner
 * ===================================
 * Personalized demo landing for prospective partners & investors.
 * Routes: /demo/capex  →  CapEX Power
 *         /demo/discovery  →  Discovery Power
 *         /demo  →  generic
 *
 * Design: Supabase-dark (#0c0c0c), Merlin green (#3ECF8E)
 */

import { lazy, Suspense, useState } from "react";
import {
  Zap,
  TrendingUp,
  Shield,
  Clock,
  BarChart3,
  Globe,
  ChevronRight,
  CheckCircle,
  Building2,
  Battery,
  Play,
  ArrowRight,
  DollarSign,
  Cpu,
} from "lucide-react";
import { MerlinBatteryLogo } from "@/components/shared/MerlinBatteryLogo";

const WizardV8Page = lazy(() => import("@/wizard/v8/WizardV8Page"));

// ─── Partner config ──────────────────────────────────────────────────────────

interface PartnerConfig {
  name: string;
  greeting: string;
  tagline: string;
  accentColor: string;
  showInvestorSection: boolean;
  defaultIndustry: string;
  callToAction: string;
  calLink: string;
}

const PARTNER_CONFIGS: Record<string, PartnerConfig> = {
  capex: {
    name: "CapEX Power",
    greeting: "Built for CapEX Power",
    tagline:
      "See how Merlin turns a 90-second customer conversation into a bankable BESS proposal — and how CapEX Power can close more deals with it.",
    accentColor: "#3ECF8E",
    showInvestorSection: true,
    defaultIndustry: "hotel",
    callToAction: "Schedule a call with Robert",
    calLink:
      "mailto:robert@merlinenergy.net?subject=CapEX Power x Merlin — Partnership & Investment",
  },
  discovery: {
    name: "Discovery Power",
    greeting: "Built for Discovery Power",
    tagline:
      "See how Merlin's TrueQuote™ engine generates certified BESS proposals in under 90 seconds — and how Discovery Power can white-label it for your customers.",
    accentColor: "#3ECF8E",
    showInvestorSection: false,
    defaultIndustry: "car-wash",
    callToAction: "Schedule a call with Robert",
    calLink: "mailto:robert@merlinenergy.net?subject=Discovery Power x Merlin — Partnership",
  },
};

const GENERIC_CONFIG: PartnerConfig = {
  name: "Your Team",
  greeting: "Merlin Energy — Live Demo",
  tagline: "BESS proposals in 90 seconds. Every number traces to NREL, IEEE, and IRA 2022.",
  accentColor: "#3ECF8E",
  showInvestorSection: false,
  defaultIndustry: "hotel",
  callToAction: "Get in touch",
  calLink: "mailto:robert@merlinenergy.net",
};

// ─── Data ────────────────────────────────────────────────────────────────────

const WHY_PARTNER = [
  {
    icon: <Clock className="w-6 h-6" />,
    title: "90-Second Quote",
    body: "From ZIP code to fully-modeled BESS proposal — peak kW, CAPEX, savings, NPV, payback — in under 90 seconds.",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "TrueQuote™ Accuracy",
    body: "Every load estimate traces to ASHRAE/CBECS benchmarks, NREL PVWatts, and real utility tariffs — not gut feel.",
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: "Embeddable Anywhere",
    body: "Drop a single iframe or call our REST API. White-label with your brand colors and logo in minutes.",
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Real Financial Model",
    body: "Full IRR, NPV, discounted payback, P10/P50/P90 Monte Carlo, battery degradation by chemistry, IRA 2022 ITC.",
  },
  {
    icon: <Building2 className="w-6 h-6" />,
    title: "15 Industry Verticals",
    body: "Car wash, hotel, data center, EV charging, hospital, manufacturing, cold storage — with vertical-specific load profiles.",
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: "Live Utility Rates",
    body: "31 major utilities covered. Dynamic demand charge detection by ZIP. ITC auto-calculates from project location.",
  },
];

const METRICS = [
  { value: "< 90s", label: "Quote generation time" },
  { value: "15", label: "Industry verticals" },
  { value: "31", label: "Utilities covered" },
  { value: "6–70%", label: "ITC range (IRA 2022)" },
];

const INVESTOR_BULLETS = [
  "Partners earn revenue share on every BESS deal closed through Merlin",
  "API + white-label tiers already built — zero integration risk",
  "Car wash vertical live: 50% of energy bill is blower load (now modeled)",
  "TrueQuote™ is a defensible moat — load accuracy no competitor matches",
  "Next: 3 additional verticals in Q2 (truck stop, cold storage, indoor farm)",
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Customer answers 12 questions",
    body: "ZIP, industry, equipment specs, operating hours, utility data",
  },
  {
    step: "02",
    title: "Merlin models the load",
    body: "ASHRAE profiles + equipment kW × duty cycle × schedule = TrueQuote™ peak kW",
  },
  {
    step: "03",
    title: "Financial model runs",
    body: "CAPEX, NPV, IRR, payback, ITC — live utility rates, battery degradation curves",
  },
  {
    step: "04",
    title: "Partner closes the deal",
    body: "Export PDF / send share link. Your brand, your margin, your customer.",
  },
];

// ─── Subcomponents ───────────────────────────────────────────────────────────

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center p-6 rounded-2xl border border-white/[0.08] bg-white/[0.03]">
      <div className="text-3xl font-black text-[#3ECF8E] mb-1">{value}</div>
      <div className="text-sm text-white/50">{label}</div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
      <div className="w-11 h-11 rounded-xl bg-[#3ECF8E]/10 text-[#3ECF8E] flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-white/55 leading-relaxed">{body}</p>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PartnerDemo() {
  const pathname = window.location.pathname; // e.g. /demo/capex
  const slug = pathname.split("/").pop()?.toLowerCase() ?? "";
  const partner = PARTNER_CONFIGS[slug] ?? GENERIC_CONFIG;

  const [showWizard, setShowWizard] = useState(false);

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: "#0c0c0c", fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* ── Nav ── */}
      <nav
        className="sticky top-0 z-50 border-b border-white/[0.06] backdrop-blur-xl"
        style={{ background: "rgba(12,12,12,0.88)" }}
      >
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MerlinBatteryLogo size={26} />
            <span className="font-bold text-sm tracking-tight">Merlin Energy</span>
            {slug && PARTNER_CONFIGS[slug] && (
              <>
                <span className="text-white/20 mx-1">×</span>
                <span className="text-sm font-semibold text-[#3ECF8E]">{partner.name}</span>
              </>
            )}
          </div>
          <a
            href={partner.calLink}
            className="h-8 px-4 rounded-lg bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black font-semibold text-xs flex items-center gap-1.5 transition-colors"
          >
            {partner.callToAction}
            <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-5 py-16 space-y-24">
        {/* ── Hero ── */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#3ECF8E]/30 bg-[#3ECF8E]/[0.06] text-[#3ECF8E] text-xs font-semibold tracking-wide uppercase">
            <Zap className="w-3 h-3" />
            Confidential Partner Preview
          </div>
          <h1 className="text-5xl font-black tracking-tight leading-tight">{partner.greeting}</h1>
          <p className="text-lg text-white/60 leading-relaxed">{partner.tagline}</p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={() => setShowWizard(true)}
              className="h-12 px-6 rounded-xl bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black font-bold text-sm flex items-center gap-2 transition-colors"
            >
              <Play className="w-4 h-4" />
              Launch Live Demo
            </button>
            <a
              href={partner.calLink}
              className="h-12 px-6 rounded-xl border border-white/15 hover:bg-white/[0.05] text-white font-semibold text-sm flex items-center gap-2 transition-colors"
            >
              Talk to Robert
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* ── Metrics ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {METRICS.map((m) => (
            <MetricCard key={m.label} {...m} />
          ))}
        </div>

        {/* ── Live Demo ── */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Try it right now</h2>
            <p className="text-white/50 text-sm">
              Run a real quote — same engine your customers will use.
            </p>
          </div>

          {showWizard ? (
            <div
              className="rounded-2xl overflow-hidden border border-white/[0.08]"
              style={{ minHeight: 700 }}
            >
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-96 text-white/40 text-sm gap-2">
                    <Battery className="w-5 h-5 animate-pulse" /> Loading Merlin…
                  </div>
                }
              >
                <WizardV8Page />
              </Suspense>
            </div>
          ) : (
            <div
              className="rounded-2xl border border-white/[0.08] bg-white/[0.02] flex flex-col items-center justify-center gap-6 cursor-pointer hover:bg-white/[0.04] transition-colors"
              style={{ minHeight: 340 }}
              onClick={() => setShowWizard(true)}
            >
              <div className="w-16 h-16 rounded-2xl bg-[#3ECF8E]/10 text-[#3ECF8E] flex items-center justify-center">
                <Zap className="w-8 h-8" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-bold text-lg">Click to launch the live wizard</p>
                <p className="text-white/40 text-sm">
                  No login required · Real calculations · Takes ~90 seconds
                </p>
              </div>
              <button className="h-11 px-6 rounded-xl bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black font-bold text-sm flex items-center gap-2 transition-colors">
                <Play className="w-4 h-4" />
                Start Demo
              </button>
            </div>
          )}
        </div>

        {/* ── How it works ── */}
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-center">How it works</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {HOW_IT_WORKS.map((step) => (
              <div
                key={step.step}
                className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-3"
              >
                <div className="text-3xl font-black text-[#3ECF8E]/30">{step.step}</div>
                <h3 className="font-semibold text-white">{step.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Why Partner ── */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Why {partner.name} + Merlin</h2>
            <p className="text-white/50 text-sm max-w-xl mx-auto">
              Everything your team needs to quote, close, and deliver BESS projects faster.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {WHY_PARTNER.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>

        {/* ── Integration preview ── */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 md:p-12 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#3ECF8E]/10 text-[#3ECF8E] flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold">Partner integration</h2>
          </div>
          <p className="text-white/55 leading-relaxed max-w-2xl">
            Merlin runs as an embeddable widget or REST API. Your team deploys in hours, not weeks.
            White-label with your brand — customers never see "Merlin."
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                icon: <Globe className="w-4 h-4" />,
                label: "Iframe embed",
                detail: "One line of code on your website",
              },
              {
                icon: <Cpu className="w-4 h-4" />,
                label: "REST API",
                detail: "POST /api/quote — JSON in, proposal out",
              },
              {
                icon: <DollarSign className="w-4 h-4" />,
                label: "Revenue share",
                detail: "Earn on every deal closed through Merlin",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]"
              >
                <div className="w-8 h-8 rounded-lg bg-[#3ECF8E]/10 text-[#3ECF8E] flex items-center justify-center flex-shrink-0 mt-0.5">
                  {item.icon}
                </div>
                <div>
                  <div className="font-semibold text-sm text-white">{item.label}</div>
                  <div className="text-xs text-white/45 mt-0.5">{item.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Investor section (CapEX only) ── */}
        {partner.showInvestorSection && (
          <div className="rounded-2xl border border-[#3ECF8E]/20 bg-[#3ECF8E]/[0.04] p-8 md:p-12 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#3ECF8E]/15 text-[#3ECF8E] flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold">Investment opportunity</h2>
            </div>
            <p className="text-white/60 leading-relaxed max-w-2xl">
              Merlin is raising a seed round to accelerate vertical coverage and partner
              integrations. CapEX Power's market reach makes you an ideal strategic co-investor —
              you win on deal flow, we win on distribution.
            </p>
            <ul className="space-y-3">
              {INVESTOR_BULLETS.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm text-white/70">
                  <CheckCircle className="w-4 h-4 text-[#3ECF8E] flex-shrink-0 mt-0.5" />
                  {b}
                </li>
              ))}
            </ul>
            <a
              href={partner.calLink}
              className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black font-bold text-sm transition-colors"
            >
              Let's talk investment
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}

        {/* ── CTA ── */}
        <div className="text-center space-y-5 py-8">
          <h2 className="text-3xl font-bold">Ready to move forward?</h2>
          <p className="text-white/50 text-sm max-w-md mx-auto">
            Robert is available this week. Let's talk through what a {partner.name} + Merlin
            partnership looks like in practice.
          </p>
          <a
            href={partner.calLink}
            className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black font-bold text-sm transition-colors"
          >
            {partner.callToAction}
            <ArrowRight className="w-4 h-4" />
          </a>
          <div className="pt-2 text-xs text-white/25">
            This page is confidential and intended only for {partner.name}.
          </div>
        </div>
      </div>
    </div>
  );
}
