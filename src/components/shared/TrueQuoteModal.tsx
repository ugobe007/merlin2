/**
 * TrueQuoteModal.tsx
 *
 * Compact header with TrueQuote badge integrated into purple area.
 *
 * Adds (Jan 23, 2026):
 * - mode: 'about' | 'proof' (so WizardV7 can open directly to proof)
 * - payload: proof data (optional; used by future proof UI)
 *
 * @version 1.4.0
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
  Sparkles,
  ArrowRight,
  Building2,
  Landmark,
  BadgeCheck,
  AlertTriangle,
  Eye,
  EyeOff,
  Zap,
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

  /**
   * Optional: allow WizardV7 global event bus to open directly into proof.
   * - 'about' -> normal experience (tabs start at Why)
   * - 'proof' -> starts on Proof tab
   */
  mode?: TrueQuoteModalMode;

  /**
   * Optional proof payload (used later to show facility-specific proof).
   * Safe to pass now even if UI doesn't render it yet.
   */
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

  // Optional: derive a tiny bit of "context" text for Proof header later
  const proofContext = useMemo(() => {
    const industryName =
      payload?.industry ||
      payload?.business?.category ||
      null;

    const loc =
      payload?.location?.city || payload?.location?.state || payload?.location?.zipCode
        ? [payload?.location?.city, payload?.location?.state, payload?.location?.zipCode]
            .filter(Boolean)
            .join(", ")
        : null;

    if (!industryName && !loc) return null;
    return `${industryName ? industryName : "Your site"}${loc ? ` • ${loc}` : ""}`;
  }, [payload]);

  useEffect(() => {
    if (isOpen) {
      // When opening, honor mode
      setActiveTab(mode === "proof" ? "proof" : "why");

      setTimeout(() => setAnimateIn(true), 50);
      setTimeout(() => setShowComparison(true), 500);
    } else {
      setAnimateIn(false);
      setShowComparison(false);
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          animateIn ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl transition-all duration-500 overflow-hidden ${
          animateIn ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-8"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* ============================================================ */}
        {/* COMPACT HEADER - Badge + Tagline in one purple section */}
        {/* ============================================================ */}
        <div className="relative bg-gradient-to-br from-purple-900 via-purple-700 to-indigo-800 px-8 pt-6 pb-8 text-center overflow-hidden flex-shrink-0">
          {/* Animated shine */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />

          {/* Background decorative elements - subtle */}
          <div className="absolute top-2 left-6 opacity-5">
            <Shield className="w-16 h-16 text-white" />
          </div>
          <div className="absolute bottom-2 right-6 opacity-5">
            <BadgeCheck className="w-14 h-14 text-white" />
          </div>

          {/* Content */}
          <div className="relative flex flex-col items-center gap-3">
            {/* TrueQuote Badge - at top of purple section */}
            <TrueQuoteBadgeCanonical showTooltip={false} />

            {/* Tagline */}
            <p className="text-purple-200 text-lg font-medium mt-1">
              The Quote That Shows Its Work™
            </p>

            {/* Optional context line (only if payload provided) */}
            {proofContext && (
              <p className="text-purple-100/80 text-sm font-semibold tracking-wide">
                {proofContext}
              </p>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 flex-shrink-0 bg-white">
          {[
            { id: "why", label: "Why It Matters", icon: AlertTriangle },
            { id: "how", label: "How It Works", icon: Eye },
            { id: "proof", label: "See The Proof", icon: Award },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "why" | "how" | "proof")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 font-semibold transition-all ${
                activeTab === tab.id
                  ? "text-amber-600 border-b-2 border-amber-500 bg-amber-50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area - Scrollable */}
        <div className="overflow-y-auto flex-1 min-h-0 p-8 bg-white">
          {/* TAB: Why It Matters */}
          {activeTab === "why" && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                  The Industry&apos;s Dirty Secret
                </h2>
                <p className="text-gray-700 text-lg leading-relaxed mb-6">
                  When you get a BESS quote from most vendors, you&apos;re trusting a black box.
                  They give you numbers, but{" "}
                  <strong className="text-gray-900">can&apos;t tell you where they came from</strong>.
                  Banks know this. Investors know this. That&apos;s why projects stall.
                </p>
              </div>

              {/* Side-by-Side Comparison */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Competitor Quote */}
                <div
                  className={`bg-gray-100 rounded-2xl p-6 border-2 border-gray-300 transition-all duration-700 ${
                    showComparison ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <EyeOff className="w-5 h-5 text-gray-500" />
                    <h3 className="font-bold text-gray-800 text-lg">Typical Competitor Quote</h3>
                  </div>

                  <div className="space-y-3 font-mono text-sm">
                    <div className="flex justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-gray-700">Battery System:</span>
                      <span className="font-bold text-gray-900">$2,400,000</span>
                    </div>
                    <div className="flex justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-gray-700">Annual Savings:</span>
                      <span className="font-bold text-gray-900">$450,000</span>
                    </div>
                    <div className="flex justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-gray-700">Payback Period:</span>
                      <span className="font-bold text-gray-900">5.3 years</span>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-red-100 rounded-lg border-2 border-red-300">
                    <div className="flex items-start gap-2">
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <strong className="text-red-800">Where do these numbers come from?</strong>
                        <p className="text-red-700 mt-1 font-medium">
                          &quot;Trust us, we&apos;re experts.&quot;
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TrueQuote */}
                <div
                  className={`bg-gradient-to-br from-amber-50 to-white rounded-2xl p-6 border-2 border-amber-400 shadow-lg transition-all duration-700 delay-200 ${
                    showComparison ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <TrueQuoteBadgeCanonical showTooltip={false} />
                    <h3 className="font-bold text-amber-900 text-lg">Merlin TrueQuote™</h3>
                  </div>

                  <div className="space-y-3 font-mono text-sm">
                    <div className="p-3 bg-white rounded-lg border-2 border-amber-200">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-700">Battery System:</span>
                        <span className="font-bold text-gray-900">$2,400,000</span>
                      </div>
                      <div className="text-xs text-amber-800 flex items-center gap-1 font-semibold">
                        <FileCheck className="w-3 h-3" />
                        NREL ATB 2024, LFP 4-hr, $150/kWh
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-lg border-2 border-amber-200">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-700">Annual Savings:</span>
                        <span className="font-bold text-gray-900">$450,000</span>
                      </div>
                      <div className="text-xs text-amber-800 flex items-center gap-1 font-semibold">
                        <FileCheck className="w-3 h-3" />
                        StoreFAST methodology, EIA rates
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-lg border-2 border-amber-200">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-700">Payback Period:</span>
                        <span className="font-bold text-gray-900">5.3 years</span>
                      </div>
                      <div className="text-xs text-amber-800 flex items-center gap-1 font-semibold">
                        <FileCheck className="w-3 h-3" />
                        8% discount, 2% degradation, 30% ITC
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-emerald-100 rounded-lg border-2 border-emerald-300">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <strong className="text-emerald-800">Every number is verifiable.</strong>
                        <p className="text-emerald-700 mt-1 font-medium">
                          Export JSON audit trail for bank due diligence.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center py-6 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-gray-800 italic">
                  &quot;Ask competitors where their numbers come from.&quot;
                </p>
              </div>
            </div>
          )}

          {/* TAB: How It Works */}
          {activeTab === "how" && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  The Three Pillars of TrueQuote™
                </h2>
                <p className="text-gray-700 text-lg">
                  Every Merlin quote meets these standards. No exceptions.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="group bg-gradient-to-br from-sky-100 via-blue-50 to-white rounded-2xl p-6 border-2 border-blue-300 hover:border-blue-500 hover:shadow-xl transition-all">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-200 to-blue-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Search className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Traceable</h3>
                  <p className="text-gray-700 mb-4">
                    Every number links to a specific, documented source.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2 text-blue-800 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      Line-item citations
                    </li>
                    <li className="flex items-center gap-2 text-blue-800 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      Direct benchmark links
                    </li>
                  </ul>
                </div>

                <div className="group bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-6 border-2 border-emerald-300 hover:border-emerald-500 hover:shadow-xl transition-all">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FileCheck className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Auditable</h3>
                  <p className="text-gray-700 mb-4">
                    Complete methodology documented and exportable.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2 text-emerald-800 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      JSON/Excel export
                    </li>
                    <li className="flex items-center gap-2 text-emerald-800 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      All assumptions shown
                    </li>
                  </ul>
                </div>

                <div className="group bg-gradient-to-br from-purple-50 to-white rounded-2xl p-6 border-2 border-purple-300 hover:border-purple-500 hover:shadow-xl transition-all">
                  <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <BadgeCheck className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Verifiable</h3>
                  <p className="text-gray-700 mb-4">Third parties can check independently.</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2 text-purple-800 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-purple-600" />
                      Public benchmarks
                    </li>
                    <li className="flex items-center gap-2 text-purple-800 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-purple-600" />
                      Deviation flagging
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB: See The Proof */}
          {activeTab === "proof" && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Backed by Industry Authorities
                </h2>
                <p className="text-gray-700 text-lg">Sources banks and investors trust.</p>

                {/* Optional: show one-liner hint from payload */}
                {payload?.locationIntel && (
                  <div className="mt-3 text-sm text-gray-600">
                    {payload.locationIntel.utilityRate != null && (
                      <span className="inline-flex items-center gap-2 mx-2">
                        <Zap className="w-4 h-4 text-amber-600" />
                        Utility Rate: <strong className="text-gray-900">{payload.locationIntel.utilityRate}</strong>
                      </span>
                    )}
                    {payload.locationIntel.peakSunHours != null && (
                      <span className="inline-flex items-center gap-2 mx-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        Peak Sun Hours:{" "}
                        <strong className="text-gray-900">{payload.locationIntel.peakSunHours}</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Facility Proof Card (only when payload exists) */}
              {payload && (
                <div className="bg-white rounded-2xl border-2 border-amber-200 shadow-sm p-6">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-500 font-semibold">Facility Proof</div>
                      <div className="text-xl font-bold text-gray-900">
                        {payload.business?.name || "Your Facility"}
                      </div>
                      <div className="text-sm text-gray-600">
                        {[payload.location?.city, payload.location?.state, payload.location?.zipCode].filter(Boolean).join(", ")}
                      </div>
                    </div>

                    <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-bold">
                      TrueQuote™ Payload
                    </div>
                  </div>

                  {/* Key inputs */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="text-xs text-gray-500 font-semibold mb-1">Utility Rate</div>
                      <div className="text-lg font-bold text-gray-900">
                        {payload.locationIntel?.utilityRate != null ? `$${payload.locationIntel.utilityRate}/kWh` : "—"}
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="text-xs text-gray-500 font-semibold mb-1">Peak Sun Hours</div>
                      <div className="text-lg font-bold text-gray-900">
                        {payload.locationIntel?.peakSunHours != null ? `${payload.locationIntel.peakSunHours}` : "—"}
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="text-xs text-gray-500 font-semibold mb-1">Weather Risk</div>
                      <div className="text-lg font-bold text-gray-900">
                        {payload.locationIntel?.weatherRisk ?? "—"}
                      </div>
                    </div>
                  </div>

                  {/* Outputs (if present) */}
                  {payload.outputs && (
                    <div className="mt-5">
                      <div className="text-sm font-semibold text-gray-700 mb-2">Outputs</div>
                      <div className="rounded-xl border border-gray-200 bg-white p-4 font-mono text-xs text-gray-700 overflow-x-auto">
                        <pre>{JSON.stringify(payload.outputs, null, 2)}</pre>
                      </div>
                    </div>
                  )}

                  {/* Assumptions */}
                  {payload.assumptions?.length ? (
                    <div className="mt-5">
                      <div className="text-sm font-semibold text-gray-700 mb-2">Assumptions</div>
                      <div className="grid md:grid-cols-2 gap-3">
                        {payload.assumptions.map((a, idx) => (
                          <div key={idx} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                            <div className="text-xs text-gray-500 font-semibold">{a.label}</div>
                            <div className="text-sm font-bold text-gray-900 mt-1">{a.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {AUTHORITY_SOURCES.slice(0, 8).map((source) => (
                  <a
                    key={source.id}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group p-4 rounded-xl border-2 ${source.bgColor} hover:shadow-xl transition-all`}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-2">{source.logo}</div>
                      <div className="font-bold text-gray-900">{source.name}</div>
                      <div className="text-xs text-gray-600 truncate">{source.fullName}</div>
                    </div>
                  </a>
                ))}
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-blue-100 rounded-xl p-6 border-2 border-blue-300">
                  <Building2 className="w-8 h-8 text-blue-700 mb-3" />
                  <h3 className="font-bold text-gray-900 mb-2 text-lg">For Businesses</h3>
                  <p className="text-gray-700">Present quotes to your CFO with confidence.</p>
                </div>
                <div className="bg-emerald-100 rounded-xl p-6 border-2 border-emerald-300">
                  <Landmark className="w-8 h-8 text-emerald-700 mb-3" />
                  <h3 className="font-bold text-gray-900 mb-2 text-lg">For Banks</h3>
                  <p className="text-gray-700">Due diligence without calling us.</p>
                </div>
                <div className="bg-purple-100 rounded-xl p-6 border-2 border-purple-300">
                  <Sparkles className="w-8 h-8 text-purple-700 mb-3" />
                  <h3 className="font-bold text-gray-900 mb-2 text-lg">For Developers</h3>
                  <p className="text-gray-700">Close deals faster with NREL alignment.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="border-t border-gray-200 bg-gray-50 px-8 py-5 flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <TrueQuoteBadgeCanonical showTooltip={false} />
              <span className="text-gray-600">Ready to see the difference?</span>
            </div>
            <button
              onClick={() => {
                onClose();
                onGetQuote?.();
              }}
              className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              <Zap className="w-5 h-5" />
              Get Your TrueQuote™
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default TrueQuoteModal;
