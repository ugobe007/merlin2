import React from "react";
import {
  X,
  Zap,
  Calculator,
  TrendingUp,
  FileText,
  ArrowRight,
  Building2,
  Battery,
  Sparkles,
  Sliders,
  Gauge,
  Landmark,
  Lock,
  ChevronDown,
  Clock,
} from "lucide-react";
import badgeIcon from "@/assets/images/badge_icon.jpg";
import merlinImage from "@/assets/images/new_profile_merlin.png";
import { DocumentUploadZone } from "@/components/upload/DocumentUploadZone";
import type { ExtractedSpecsData } from "@/services/openAIExtractionService";
import type { ParsedDocument } from "@/services/documentParserService";

/**
 * LandingView Component
 *
 * The main landing page for ProQuote showing:
 * - Premium header with navigation
 * - BESS market pricing intelligence strip
 * - System Configuration hero panel with Merlin
 * - Smart Upload section (collapsible)
 * - Welcome popup for first-time users
 * - Tool cards grid organized by tier (Core, Professional, Premium)
 *
 * @component
 */

interface Tool {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color?: string;
  action: () => void;
  tier: string; // Allow any string for flexibility
  badge?: string;
  locked?: boolean;
  comingSoon?: boolean;
}

interface LandingViewProps {
  tools: Tool[];
  onClose: () => void;
  onNavigateToConfig: () => void;
  setShowHowItWorks: (show: boolean) => void;
  setViewMode: React.Dispatch<React.SetStateAction<any>>; // Accept any ViewMode type
  hasWizardConfig: boolean;
  loadWizardConfig: () => void;
  showUploadSection: boolean;
  setShowUploadSection: (show: boolean) => void;
  extractedData: ExtractedSpecsData | null;
  handleExtractionComplete: (data: ExtractedSpecsData, documents: ParsedDocument[]) => void; // Match exact signature
  showWelcomePopup: boolean;
  setShowWelcomePopup: (show: boolean) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  tools,
  onClose,
  onNavigateToConfig,
  setShowHowItWorks,
  setViewMode,
  hasWizardConfig,
  loadWizardConfig,
  showUploadSection,
  setShowUploadSection,
  extractedData,
  handleExtractionComplete,
  showWelcomePopup,
  setShowWelcomePopup,
}) => {
  return (
    <>
      {/* Premium header - sleek dark with emerald accent line */}
      <div
        className="sticky top-0 z-10 backdrop-blur-xl"
        style={{
          background: "rgba(15, 17, 23, 0.95)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={badgeIcon}
                alt="ProQuote Badge"
                className="w-12 h-12 object-contain"
                style={{
                  filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.4))",
                }}
              />
              <div>
                <h1 className="text-2xl font-bold text-white">ProQuote</h1>
                <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Professional-grade BESS configuration
                </p>
              </div>
            </div>

            {/* Quick Access Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={() => setShowHowItWorks(true)}
                className="group flex items-center gap-2 rounded-full px-4 py-2 transition-all duration-200 hover:scale-105"
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-200">How It Works</span>
              </button>

              <button
                onClick={() => {
                  setViewMode("custom-config");
                  setTimeout(() => {
                    const electricalSection = document.querySelector('[data-section="electrical"]');
                    if (electricalSection) {
                      electricalSection.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }
                  }, 300);
                }}
                className="group flex items-center gap-2 rounded-full px-4 py-2 transition-all duration-200 hover:scale-105"
                style={{
                  background: "rgba(59, 130, 246, 0.15)",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(59, 130, 246, 0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(59, 130, 246, 0.15)";
                }}
              >
                <Zap className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-white">Electrical</span>
              </button>

              <button
                onClick={() => {
                  setViewMode("custom-config");
                  setTimeout(() => {
                    const renewablesSection = document.querySelector('[data-section="renewables"]');
                    if (renewablesSection) {
                      renewablesSection.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }
                  }, 300);
                }}
                className="group flex items-center gap-2 rounded-full px-4 py-2 transition-all duration-200 hover:scale-105"
                style={{
                  background: "rgba(34, 197, 94, 0.15)",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(34, 197, 94, 0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(34, 197, 94, 0.15)";
                }}
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-white">Renewables</span>
              </button>

              <button
                onClick={() => {
                  setViewMode("custom-config");
                  setTimeout(() => {
                    const financialSection = document.querySelector('[data-section="financial"]');
                    if (financialSection) {
                      financialSection.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }, 300);
                }}
                className="group flex items-center gap-2 rounded-full px-4 py-2 transition-all duration-200 hover:scale-105"
                style={{
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(16, 185, 129, 0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(16, 185, 129, 0.15)";
                }}
              >
                <Calculator className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-white">Financial</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 hover:bg-white/10 rounded-full transition-all text-white/60 hover:text-white"
              style={{ border: "1px solid rgba(255,255,255,0.15)" }}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* BESS Market Pricing Intelligence - Clean horizontal strip */}
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div
            className="flex items-center gap-2 px-4 py-2"
            style={{
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              borderRadius: 20,
            }}
          >
            <TrendingUp className="w-4 h-4" style={{ color: "#34d399" }} />
            <span className="text-sm font-semibold" style={{ color: "#34d399" }}>
              Market Pricing
            </span>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-2"
            style={{
              background: "rgba(59, 130, 246, 0.08)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              borderRadius: 20,
            }}
          >
            <Battery className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-bold text-white">$200/kWh</span>
            <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
              ≤2 MWh
            </span>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-2"
            style={{
              background: "rgba(20, 184, 166, 0.08)",
              border: "1px solid rgba(20, 184, 166, 0.2)",
              borderRadius: 20,
            }}
          >
            <Battery className="w-4 h-4 text-teal-400" />
            <span className="text-sm font-bold text-white">$155/kWh</span>
            <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
              2–15 MWh
            </span>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-2"
            style={{
              background: "rgba(34, 197, 94, 0.08)",
              border: "1px solid rgba(34, 197, 94, 0.2)",
              borderRadius: 20,
            }}
          >
            <Battery className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-white">$140/kWh</span>
            <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
              15+ MWh
            </span>
          </div>
          <div
            className="px-3 py-2"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 20,
            }}
          >
            <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
              Q4 2025
            </span>
          </div>
        </div>
      </div>

      {/* System Configuration Hero Panel - START HERE */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        <div
          className="group w-full relative rounded-xl p-10 md:p-14 text-left transition-all duration-300 overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="relative flex flex-col md:flex-row items-center gap-10 md:gap-12">
            {/* Merlin on the left */}
            <div className="flex-shrink-0">
              <div
                className="w-40 h-40 md:w-44 md:h-44 rounded-2xl p-3"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <img src={merlinImage} alt="Merlin" className="w-full h-full object-contain" />
              </div>
            </div>

            {/* Content on the right */}
            <div className="flex-1">
              {/* START HERE badge */}
              <span
                className="inline-block px-3 py-1 text-xs font-semibold rounded-md mb-5"
                style={{
                  background: "rgba(16,185,129,0.1)",
                  color: "#34d399",
                  border: "1px solid rgba(16,185,129,0.2)",
                }}
              >
                START HERE
              </span>

              <h3 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                System Configuration
              </h3>
              <p
                className="text-lg md:text-xl leading-relaxed mb-8"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Design your complete BESS system with professional-grade tools. Configure electrical
                specifications, renewable energy integration, and all system parameters in one
                place.
              </p>

              {/* Feature highlights */}
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <div
                  className="flex items-start gap-3 p-4 rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#34d399" }} />
                  <div>
                    <p className="font-semibold text-white mb-1">Professional Tools</p>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                      Advanced configuration, detailed electrical specs, and real-time calculations
                    </p>
                  </div>
                </div>
                <div
                  className="flex items-start gap-3 p-4 rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <Zap className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#4ade80" }} />
                  <div>
                    <p className="font-semibold text-white mb-1">Save Time & Money</p>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                      Instant feedback and market intelligence to optimize your design
                    </p>
                  </div>
                </div>
              </div>

              {/* Action row: Launch + Vendor Partner CTA */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                {/* Large Launch button - emerald to match brand */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateToConfig();
                    if (hasWizardConfig) {
                      loadWizardConfig();
                    }
                  }}
                  className="group/btn w-full md:w-auto px-8 py-3.5 font-semibold text-base rounded-lg flex items-center justify-center gap-3 transition-all duration-200"
                  style={{
                    background: "transparent",
                    color: "#34d399",
                    border: "1px solid rgba(16,185,129,0.35)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(16,185,129,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <Sliders className="w-5 h-5" />
                  <span>Launch Configuration Tool</span>
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </button>

                {/* Vendor & EPC CTA — compact, same row */}
                <a
                  href="/vendor"
                  className="group/vnd w-full md:w-auto px-5 py-3.5 rounded-lg flex items-center justify-center gap-2.5 text-sm font-semibold transition-all duration-200 no-underline"
                  style={{
                    background: "rgba(59,130,246,0.08)",
                    border: "1px solid rgba(59,130,246,0.25)",
                    color: "#60a5fa",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(59,130,246,0.16)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(59,130,246,0.08)";
                  }}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Vendor & EPC Portal</span>
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                    style={{
                      background: "rgba(59,130,246,0.12)",
                      color: "#93c5fd",
                      border: "1px solid rgba(59,130,246,0.2)",
                    }}
                  >
                    NREL
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover/vnd:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Upload Section - Path A */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            className="flex items-center justify-between cursor-pointer p-6"
            onClick={() => setShowUploadSection(!showUploadSection)}
          >
            <h3 className="text-lg font-semibold text-white flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
                <FileText className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Smart Upload™
              </span>
              <span className="ml-2 px-3 py-1 bg-purple-500/10 text-purple-300 text-xs rounded-full border border-purple-400/30 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Saves 10+ min
              </span>
              {extractedData && (
                <span className="ml-2 px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-400/30">
                  ✓ Data Extracted
                </span>
              )}
            </h3>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${showUploadSection ? "rotate-180" : ""}`}
            />
          </div>

          {showUploadSection && (
            <div className="px-6 pb-6">
              <p className="text-gray-400 text-sm mb-4">
                Have utility bills, equipment schedules, or load profiles? Upload them and let AI
                extract the data to pre-populate your quote.{" "}
                <span className="text-purple-400 font-medium">Saves 10+ minutes!</span>
              </p>
              <DocumentUploadZone
                onExtractionComplete={handleExtractionComplete}
                onError={(error) => {
                  if (import.meta.env.DEV) {
                    console.error("Upload error:", error);
                  }
                }}
                maxFiles={5}
              />
              <p className="text-center text-gray-500 text-sm mt-6">
                — or configure your system manually below —
              </p>
            </div>
          )}

          {extractedData && !showUploadSection && (
            <div className="px-6 pb-6">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <p className="text-sm text-emerald-300 mb-3">Pre-filled from uploaded documents:</p>
                <div className="flex flex-wrap gap-2">
                  {extractedData.powerRequirements?.peakDemandKW && (
                    <span className="px-3 py-1.5 bg-gray-800 rounded-lg text-sm text-gray-300 border border-gray-700">
                      {extractedData.powerRequirements.peakDemandKW.toLocaleString()} kW peak
                    </span>
                  )}
                  {extractedData.powerRequirements?.monthlyKWh && (
                    <span className="px-3 py-1.5 bg-gray-800 rounded-lg text-sm text-gray-300 border border-gray-700">
                      {extractedData.powerRequirements.monthlyKWh.toLocaleString()} kWh/month
                    </span>
                  )}
                  {extractedData.location?.state && (
                    <span className="px-3 py-1.5 bg-gray-800 rounded-lg text-sm text-gray-300 border border-gray-700">
                      📍 {extractedData.location.state}
                    </span>
                  )}
                  {extractedData.utilityInfo?.electricityRate && (
                    <span className="px-3 py-1.5 bg-gray-800 rounded-lg text-sm text-gray-300 border border-gray-700">
                      ${extractedData.utilityInfo.electricityRate.toFixed(4)}/kWh
                    </span>
                  )}
                  {extractedData.utilityInfo?.demandCharge && (
                    <span className="px-3 py-1.5 bg-gray-800 rounded-lg text-sm text-gray-300 border border-gray-700">
                      ${extractedData.utilityInfo.demandCharge.toFixed(2)}/kW demand
                    </span>
                  )}
                  {extractedData.existingInfrastructure?.hasSolar && (
                    <span className="px-3 py-1.5 bg-emerald-800/50 rounded-lg text-sm text-emerald-300 border border-emerald-700/50">
                      ☀️ {extractedData.existingInfrastructure.solarKW} kW solar
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Welcome Popup Modal */}
      {showWelcomePopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(4, 8, 20, 0.8)", backdropFilter: "blur(8px)" }}
        >
          <div
            className="rounded-xl max-w-lg w-full overflow-hidden animate-fadeIn"
            style={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {/* Header with Merlin */}
            <div className="p-8 pb-6 text-center relative">
              <img
                src={merlinImage}
                alt="Merlin"
                className="w-20 h-20 mx-auto mb-4 drop-shadow-2xl"
              />
              <h2 className="text-2xl font-bold text-white mb-1">Welcome to ProQuote</h2>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                Professional-grade BESS configuration tools
              </p>
            </div>

            {/* Tools explanation */}
            <div className="px-6 pb-2 space-y-3">
              <div
                className="flex items-start gap-4 p-4 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  className="p-2.5 rounded-lg flex-shrink-0"
                  style={{ background: "rgba(16, 185, 129, 0.1)" }}
                >
                  <Sliders className="w-5 h-5" style={{ color: "#34d399" }} />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">System Configuration</h3>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Design your BESS system with detailed electrical specs, renewable integration,
                    and all parameters.
                  </p>
                </div>
              </div>

              <div
                className="flex items-start gap-4 p-4 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  className="p-2.5 rounded-lg flex-shrink-0"
                  style={{ background: "rgba(59, 130, 246, 0.1)" }}
                >
                  <Gauge className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Interactive Dashboard</h3>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Fine-tune with real-time sliders. See instant cost and ROI updates as you
                    adjust.
                  </p>
                </div>
              </div>

              <div
                className="flex items-start gap-4 p-4 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  className="p-2.5 rounded-lg flex-shrink-0"
                  style={{ background: "rgba(34, 197, 94, 0.1)" }}
                >
                  <Landmark className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Bank-Ready Model</h3>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Generate 3-statement financial models for investors. Includes DSCR, IRR, and
                    MACRS.
                  </p>
                </div>
              </div>
            </div>

            {/* Action button */}
            <div className="p-6">
              <button
                onClick={() => setShowWelcomePopup(false)}
                className="w-full font-semibold py-3 px-6 rounded-lg transition-all"
                style={{
                  background: "transparent",
                  color: "#34d399",
                  border: "1px solid rgba(16,185,129,0.35)",
                }}
              >
                Let's Build a Quote →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tool cards grid — Supabase dark design */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-16">
        {/* ── Analysis & Reporting ── */}
        <div className="mb-10">
          <p
            className="text-xs font-bold uppercase tracking-wider mb-4"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Analysis &amp; Reporting
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tools
              .filter((t) => t.tier === "core" && t.id !== "custom-config")
              .map((tool) => (
                <button
                  key={tool.id}
                  onClick={tool.action}
                  className="group flex items-start gap-4 rounded-lg p-4 text-left transition-colors duration-150"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                  }}
                >
                  <div
                    className="p-2 rounded-md flex-shrink-0"
                    style={{ background: "rgba(59,130,246,0.08)" }}
                  >
                    <div className="text-blue-400 [&>svg]:w-5 [&>svg]:h-5">{tool.icon}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white mb-0.5">{tool.title}</h4>
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      {tool.description}
                    </p>
                  </div>
                  <ArrowRight
                    className="w-4 h-4 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  />
                </button>
              ))}
          </div>
        </div>

        {/* ── Professional Tools ── */}
        <div className="mb-10">
          <p
            className="text-xs font-bold uppercase tracking-wider mb-4"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Professional Tools
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {tools
              .filter((t) => t.tier === "pro")
              .map((tool) => (
                <button
                  key={tool.id}
                  onClick={tool.action}
                  className="group flex items-start gap-4 rounded-lg p-4 text-left transition-colors duration-150 relative"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                  }}
                >
                  {"badge" in tool && tool.badge && (
                    <span
                      className="absolute top-2.5 right-2.5 text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: "rgba(16,185,129,0.15)", color: "#34d399" }}
                    >
                      {tool.badge}
                    </span>
                  )}
                  <div
                    className="p-2 rounded-md flex-shrink-0"
                    style={{ background: "rgba(16,185,129,0.08)" }}
                  >
                    <div style={{ color: "#34d399" }} className="[&>svg]:w-5 [&>svg]:h-5">
                      {tool.icon}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white mb-0.5">{tool.title}</h4>
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      {tool.description}
                    </p>
                  </div>
                  <ArrowRight
                    className="w-4 h-4 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all"
                    style={{ color: "#34d399" }}
                  />
                </button>
              ))}
          </div>
        </div>

        {/* ── Premium ── */}
        <div>
          <p
            className="text-xs font-bold uppercase tracking-wider mb-4"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Premium
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {tools
              .filter((t) => t.tier === "premium")
              .map((tool) => {
                const isLocked = "locked" in tool && tool.locked;
                return (
                  <button
                    key={tool.id}
                    onClick={isLocked ? undefined : tool.action}
                    disabled={isLocked}
                    className={`group flex items-start gap-4 rounded-lg p-4 text-left transition-colors duration-150 relative ${isLocked ? "cursor-not-allowed" : ""}`}
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      opacity: isLocked ? 0.55 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!isLocked) {
                        e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                    }}
                  >
                    <div
                      className="p-2 rounded-md flex-shrink-0"
                      style={{
                        background: isLocked ? "rgba(255,255,255,0.04)" : "rgba(16,185,129,0.08)",
                      }}
                    >
                      {isLocked ? (
                        <Lock className="w-5 h-5" style={{ color: "rgba(255,255,255,0.25)" }} />
                      ) : (
                        <div style={{ color: "#34d399" }} className="[&>svg]:w-5 [&>svg]:h-5">
                          {tool.icon}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-white mb-0.5 flex items-center gap-2">
                        {tool.title}
                        {"comingSoon" in tool && tool.comingSoon && (
                          <span
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                            style={{
                              background: "rgba(255,255,255,0.06)",
                              color: "rgba(255,255,255,0.3)",
                            }}
                          >
                            Soon
                          </span>
                        )}
                      </h4>
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: "rgba(255,255,255,0.35)" }}
                      >
                        {tool.description}
                      </p>
                    </div>
                    {!isLocked && (
                      <ArrowRight
                        className="w-4 h-4 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all"
                        style={{ color: "rgba(255,255,255,0.4)" }}
                      />
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      </div>
    </>
  );
};
