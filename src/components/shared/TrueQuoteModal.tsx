/**
 * TrueQuoteModal.tsx
 *
 * Supabase-style dark modal — clean, typographic, minimal.
 * Three tabs: Why It Matters / How It Works / See The Proof
 *
 * @version 2.0.0 — Supabase redesign (Feb 2026)
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  Shield,
  CheckCircle2,
  XCircle,
  FileCheck,
  Search,
  Award,
  ArrowRight,
  BadgeCheck,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import { TrueQuoteBadgeCanonical } from "./TrueQuoteBadgeCanonical";
import { AUTHORITY_SOURCES } from "./IndustryComplianceBadges";

export type TrueQuoteModalMode = "about" | "proof";

export type TrueQuoteProofPayload = {
  industry?: string | null;
  location?: {
    zipCode?: string;
    city?: string;
    state?: string;
    region?: string;
  };
  business?: {
    name?: string;
    address?: string;
    category?: string;
    website?: string | null;
    rating?: number;
    userRatingsTotal?: number;
  };
  locationIntel?: {
    peakSunHours?: number | null;
    utilityRate?: number | null;
    weatherRisk?: "Low" | "Med" | "High" | string | null;
    solarGrade?: string | null;
    riskDrivers?: string[];
  };
  outputs?: Record<string, unknown>;
  assumptions?: Array<{ label: string; value: string }>;
  sources?: Array<{ label: string; url?: string; note?: string }>;
};

interface TrueQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGetQuote?: () => void;
  mode?: TrueQuoteModalMode;
  payload?: TrueQuoteProofPayload;
}

export const TrueQuoteModal: React.FC<TrueQuoteModalProps> = ({
  isOpen,
  onClose,
  onGetQuote,
  mode = "about",
  payload,
}) => {
  const [activeTab, setActiveTab] = useState<"why" | "how" | "proof">("why");
  const [showComparison, setShowComparison] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  const proofContext = useMemo(() => {
    const industryName = payload?.industry || payload?.business?.category || null;
    const loc =
      payload?.location?.city || payload?.location?.state || payload?.location?.zipCode
        ? [payload?.location?.city, payload?.location?.state, payload?.location?.zipCode]
            .filter(Boolean)
            .join(", ")
        : null;
    if (!industryName && !loc) return null;
    return `${industryName ? industryName : "Your site"}${loc ? ` · ${loc}` : ""}`;
  }, [payload]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(mode === "proof" ? "proof" : "why");
      setTimeout(() => setAnimateIn(true), 50);
      setTimeout(() => setShowComparison(true), 400);
    } else {
      setAnimateIn(false);
      setShowComparison(false);
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const tabs = [
    { id: "why" as const, label: "Why It Matters", icon: AlertTriangle },
    { id: "how" as const, label: "How It Works", icon: Eye },
    { id: "proof" as const, label: "See The Proof", icon: Award },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 ${
          animateIn ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl overflow-hidden transition-all duration-500 ${
          animateIn ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-8"
        }`}
        style={{
          background: "#0f1117",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* ── HEADER ── */}
        <div className="relative px-6 pt-5 pb-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>

          <div className="flex items-center gap-3">
            <TrueQuoteBadgeCanonical showTooltip={false} />
            <div>
              <h2 className="text-lg font-semibold text-white">TrueQuote™</h2>
              <p className="text-sm text-slate-500">
                The Quote That Shows Its Work
                {proofContext && <span className="text-slate-600"> · {proofContext}</span>}
              </p>
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="flex px-6 gap-1 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                activeTab === tab.id
                  ? "text-emerald-400 border-emerald-400"
                  : "text-slate-500 border-transparent hover:text-slate-300"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── CONTENT ── */}
        <div className="overflow-y-auto flex-1 min-h-0 p-6">

          {/* TAB: Why It Matters */}
          {activeTab === "why" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  The Industry's Dirty Secret
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  When you get a BESS quote from most vendors, you're trusting a black box.
                  They give you numbers, but{" "}
                  <span className="text-slate-200 font-medium">can't tell you where they came from</span>.
                  Banks know this. Investors know this. That's why projects stall.
                </p>
              </div>

              {/* Side-by-Side Comparison */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Competitor */}
                <div
                  className={`rounded-lg p-5 transition-all duration-500 ${
                    showComparison ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                  }`}
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <EyeOff className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-300">Typical Competitor</span>
                  </div>

                  <div className="space-y-2 text-sm font-mono">
                    {[
                      ["Battery System", "$2,400,000"],
                      ["Annual Savings", "$450,000"],
                      ["Payback Period", "5.3 years"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between py-2 px-3 rounded-md" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <span className="text-slate-500">{label}</span>
                        <span className="text-slate-300 font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 rounded-md" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                    <div className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="text-red-300 font-medium">Where do these numbers come from?</span>
                        <p className="text-red-400/70 mt-0.5">&quot;Trust us, we&apos;re experts.&quot;</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TrueQuote */}
                <div
                  className={`rounded-lg p-5 transition-all duration-500 delay-150 ${
                    showComparison ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                  }`}
                  style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.12)" }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-300">Merlin TrueQuote™</span>
                  </div>

                  <div className="space-y-2 text-sm font-mono">
                    {[
                      { label: "Battery System", value: "$2,400,000", source: "NREL ATB 2024, LFP 4-hr, $150/kWh" },
                      { label: "Annual Savings", value: "$450,000", source: "StoreFAST methodology, EIA rates" },
                      { label: "Payback Period", value: "5.3 years", source: "8% discount, 2% degradation, 30% ITC" },
                    ].map((row) => (
                      <div key={row.label} className="py-2 px-3 rounded-md" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <div className="flex justify-between">
                          <span className="text-slate-500">{row.label}</span>
                          <span className="text-slate-200 font-semibold">{row.value}</span>
                        </div>
                        <div className="text-[11px] text-emerald-500/80 flex items-center gap-1 mt-1">
                          <FileCheck className="w-3 h-3" />
                          {row.source}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 rounded-md" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="text-emerald-300 font-medium">Every number is verifiable.</span>
                        <p className="text-emerald-400/60 mt-0.5">Export JSON audit trail for bank due diligence.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center py-4">
                <p className="text-sm text-slate-500 italic">
                  &quot;Ask competitors where their numbers come from.&quot;
                </p>
              </div>
            </div>
          )}

          {/* TAB: How It Works */}
          {activeTab === "how" && (
            <div className="space-y-6">
              <div className="mb-2">
                <h3 className="text-base font-semibold text-white mb-1">
                  The Three Pillars of TrueQuote™
                </h3>
                <p className="text-sm text-slate-500">
                  Every Merlin quote meets these standards. No exceptions.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {[
                  {
                    icon: Search,
                    title: "Traceable",
                    desc: "Every number links to a specific, documented source.",
                    items: ["Line-item citations", "Direct benchmark links"],
                    accent: "59,130,246",
                  },
                  {
                    icon: FileCheck,
                    title: "Auditable",
                    desc: "Complete methodology documented and exportable.",
                    items: ["JSON/Excel export", "All assumptions shown"],
                    accent: "16,185,129",
                  },
                  {
                    icon: BadgeCheck,
                    title: "Verifiable",
                    desc: "Third parties can check independently.",
                    items: ["Public benchmarks", "Deviation flagging"],
                    accent: "139,92,246",
                  },
                ].map((pillar) => (
                  <div
                    key={pillar.title}
                    className="rounded-lg p-5"
                    style={{
                      background: `rgba(${pillar.accent}, 0.04)`,
                      border: `1px solid rgba(${pillar.accent}, 0.12)`,
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                      style={{ background: `rgba(${pillar.accent}, 0.1)` }}
                    >
                      <pillar.icon className="w-4 h-4" style={{ color: `rgba(${pillar.accent}, 0.8)` }} />
                    </div>
                    <h4 className="text-sm font-semibold text-white mb-1">{pillar.title}</h4>
                    <p className="text-xs text-slate-500 mb-3">{pillar.desc}</p>
                    <ul className="space-y-1.5">
                      {pillar.items.map((item) => (
                        <li key={item} className="flex items-center gap-2 text-xs text-slate-400">
                          <CheckCircle2 className="w-3 h-3" style={{ color: `rgba(${pillar.accent}, 0.6)` }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: See The Proof */}
          {activeTab === "proof" && (
            <div className="space-y-6">
              <div className="mb-2">
                <h3 className="text-base font-semibold text-white mb-1">
                  Backed by Industry Authorities
                </h3>
                <p className="text-sm text-slate-500">
                  Sources banks and investors trust.
                  {payload?.locationIntel && (
                    <>
                      {payload.locationIntel.utilityRate != null && (
                        <span className="ml-2">Rate: <span className="text-emerald-400 font-medium">${payload.locationIntel.utilityRate}/kWh</span></span>
                      )}
                      {payload.locationIntel.peakSunHours != null && (
                        <span className="ml-2">Sun: <span className="text-amber-400 font-medium">{payload.locationIntel.peakSunHours} hrs</span></span>
                      )}
                    </>
                  )}
                </p>
              </div>

              {/* Facility Proof Card */}
              {payload && (
                <div className="rounded-lg p-5" style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.12)" }}>
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Facility Data</p>
                      <p className="text-sm font-semibold text-white">
                        {payload.business?.name || "Your Facility"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {[payload.location?.city, payload.location?.state, payload.location?.zipCode].filter(Boolean).join(", ")}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-emerald-400" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                      TrueQuote™
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Utility Rate", value: payload.locationIntel?.utilityRate != null ? `$${payload.locationIntel.utilityRate}/kWh` : "—" },
                      { label: "Peak Sun Hours", value: payload.locationIntel?.peakSunHours != null ? `${payload.locationIntel.peakSunHours}` : "—" },
                      { label: "Weather Risk", value: payload.locationIntel?.weatherRisk ?? "—" },
                    ].map((d) => (
                      <div key={d.label} className="p-3 rounded-md" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <p className="text-[11px] text-slate-500 font-medium mb-1">{d.label}</p>
                        <p className="text-sm font-semibold text-white">{d.value}</p>
                      </div>
                    ))}
                  </div>

                  {payload.outputs && (
                    <div className="mt-4">
                      <p className="text-xs text-slate-500 font-medium mb-2">Outputs</p>
                      <pre className="rounded-md p-3 text-[11px] text-slate-400 font-mono overflow-x-auto" style={{ background: "rgba(255,255,255,0.03)" }}>
                        {JSON.stringify(payload.outputs, null, 2)}
                      </pre>
                    </div>
                  )}

                  {payload.assumptions?.length ? (
                    <div className="mt-4">
                      <p className="text-xs text-slate-500 font-medium mb-2">Assumptions</p>
                      <div className="grid grid-cols-2 gap-2">
                        {payload.assumptions.map((a, idx) => (
                          <div key={idx} className="p-3 rounded-md" style={{ background: "rgba(255,255,255,0.03)" }}>
                            <p className="text-[11px] text-slate-500">{a.label}</p>
                            <p className="text-xs font-medium text-white mt-0.5">{a.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Authority Sources Grid */}
              <div className="grid grid-cols-4 gap-2">
                {AUTHORITY_SOURCES.slice(0, 8).map((source) => (
                  <a
                    key={source.id}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group p-3 rounded-lg text-center transition-all hover:scale-[1.02]"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div className="text-2xl mb-1">{source.logo}</div>
                    <p className="text-xs font-semibold text-slate-300">{source.name}</p>
                    <p className="text-[10px] text-slate-600 truncate">{source.fullName}</p>
                  </a>
                ))}
              </div>

              {/* Audience cards */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: "🏢", title: "For Businesses", desc: "Present quotes to your CFO with confidence.", accent: "59,130,246" },
                  { icon: "🏛️", title: "For Banks", desc: "Due diligence without calling us.", accent: "16,185,129" },
                  { icon: "⚡", title: "For Developers", desc: "Close deals faster with NREL alignment.", accent: "139,92,246" },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="p-4 rounded-lg"
                    style={{ background: `rgba(${card.accent}, 0.04)`, border: `1px solid rgba(${card.accent}, 0.12)` }}
                  >
                    <span className="text-xl">{card.icon}</span>
                    <h4 className="text-sm font-semibold text-white mt-2">{card.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="px-6 py-4 flex items-center justify-between flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
          <span className="text-xs text-slate-600">
            TrueQuote™ Verified · Source-attributed pricing
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => { onClose(); onGetQuote?.(); }}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-white transition-all"
              style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(16,185,129,0.25)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(16,185,129,0.15)"; }}
            >
              Get Your TrueQuote™
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrueQuoteModal;
