/**
 * EXPORT BAR — Download PDF / Word / Excel with lead capture gate
 *
 * Handles:
 * - PDF/Word/Excel export via quoteExportUtils
 * - Lead capture gate (name + email before first export for guests)
 * - Quota tracking via subscriptionService
 * - Save prompt after successful export
 * - Auth modal for "Sign Up Free"
 *
 * Extracted from Step6ResultsV7.tsx (Feb 2026 — bloat decomposition)
 */

import React, { useState, useCallback } from "react";
import { Lock, FileText, Bookmark } from "lucide-react";
import type { WizardState as WizardV7State } from "@/wizard/v7/hooks/useWizardV7";
import { buildV7ExportData } from "@/utils/buildV7ExportData";
import { exportQuoteAsPDF, exportQuoteAsWord, exportQuoteAsExcel } from "@/utils/quoteExportUtils";
import {
  trackQuoteGenerated,
  peekQuotaRemaining,
  isUserAuthenticated,
  getEffectiveTier,
} from "@/services/subscriptionService";
import { TrueQuoteBadgeCanonical } from "@/components/shared/TrueQuoteBadgeCanonical";
import { supabase } from "@/services/supabaseClient";
import AuthModal from "@/components/AuthModal";
import { devInfo, devError } from "@/wizard/v7/debug/devLog";
// import { ShareQuoteModal } from "./ShareQuoteModal"; // TEMP DISABLED - needs DB types

type ExportFormat = "pdf" | "word" | "excel";

export default function ExportBar({
  state,
  onTrueQuoteClick,
}: {
  state: WizardV7State;
  onTrueQuoteClick?: () => void;
}) {
  // const [showShareModal, setShowShareModal] = useState(false); // TEMP DISABLED
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [_quotaBlocked, setQuotaBlocked] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // ── LEAD CAPTURE GATE ────────────────────────────────────────────
  const [showLeadGate, setShowLeadGate] = useState(false);
  const [pendingFormat, setPendingFormat] = useState<ExportFormat | null>(null);
  const [leadCaptured, setLeadCaptured] = useState(() => {
    return isUserAuthenticated() || sessionStorage.getItem("merlin_lead_captured") === "true";
  });
  const [leadForm, setLeadForm] = useState({ name: "", email: "", company: "" });
  const [leadSubmitting, setLeadSubmitting] = useState(false);

  const handleLeadSubmit = useCallback(async () => {
    if (!leadForm.email || !leadForm.name) return;
    setLeadSubmitting(true);
    try {
      await supabase.from("leads").insert([
        {
          name: leadForm.name,
          email: leadForm.email,
          company: leadForm.company || null,
          source: `wizard-v7-${state.industry || "unknown"}`,
          format: pendingFormat || "pdf",
        },
      ]);
    } catch {
      // Don't block UX on lead capture failure
    }
    setLeadCaptured(true);
    sessionStorage.setItem("merlin_lead_captured", "true");
    setShowLeadGate(false);
    setLeadSubmitting(false);
  }, [leadForm, pendingFormat, state.industry]);

  const handleSkipLead = useCallback(() => {
    setLeadCaptured(true);
    sessionStorage.setItem("merlin_lead_captured", "true");
    setShowLeadGate(false);
  }, []);

  const tier = getEffectiveTier();
  const _isPremium = tier === "pro" || tier === "advanced" || tier === "business";
  const handleExport = useCallback(
    async (format: ExportFormat, bypassLeadGate = false) => {
      setError(null);
      setQuotaBlocked(false);
      setShowSavePrompt(false);

      // ── LEAD CAPTURE GATE: Show form before first export for guests ──
      if (!bypassLeadGate && !leadCaptured && !isUserAuthenticated()) {
        setPendingFormat(format);
        setShowLeadGate(true);
        return;
      }

      // ── QUOTA CHECK: Only exports count as "delivered quotes" ──
      const quota = peekQuotaRemaining("quote");
      if (!quota.allowed) {
        setQuotaBlocked(true);
        setError(
          `You've used all ${quota.limit} free quote exports this session. Sign up for more!`
        );
        return;
      }

      setExporting(format);

      try {
        const data = buildV7ExportData(state);

        switch (format) {
          case "pdf":
            await exportQuoteAsPDF(data);
            break;
          case "word":
            await exportQuoteAsWord(data);
            break;
          case "excel":
            await exportQuoteAsExcel(data);
            break;
        }

        // ✅ Track AFTER successful export — this is a "delivered quote"
        const result = trackQuoteGenerated();
        if (!result.allowed) {
          devInfo("[QuotaTracking] Export allowed but quota now exhausted:", result);
        }

        // ✅ Show save prompt for guests / free-tier users after export
        if (!isUserAuthenticated()) {
          setShowSavePrompt(true);
        }
      } catch (err) {
        devError(`Export ${format} failed:`, err);
        setError(`Export failed — ${(err as Error).message || "please try again"}`);
      } finally {
        setExporting(null);
      }
    },

    [state, leadCaptured]
  );

  // ── Auto-trigger pending export after lead capture completes ──
  React.useEffect(() => {
    if (leadCaptured && pendingFormat && !showLeadGate && !exporting) {
      const fmt = pendingFormat;
      setPendingFormat(null);
      void handleExport(fmt, true);
    }
  }, [leadCaptured, pendingFormat, showLeadGate, exporting, handleExport]);

  const hasPricing = state.quote?.pricingComplete;
  const isTrueQuote =
    hasPricing &&
    state.templateMode !== "fallback" &&
    state.quote?.confidence?.industry !== "fallback";

  const buttons: { format: ExportFormat; icon: string; label: string; locked: boolean }[] = [
    { format: "pdf", icon: "↓", label: "PDF", locked: false },
    { format: "word", icon: "↓", label: "Word", locked: false },
    { format: "excel", icon: "↓", label: "Excel", locked: false },
  ];

  return (
    <div className="rounded-xl border-2 border-[#3ECF8E]/20 bg-[#3ECF8E]/[0.03] p-4 sm:p-6">
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ flex: "1 1 200px", minWidth: 0 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "rgba(232,235,243,0.95)",
              letterSpacing: "-0.01em",
            }}
          >
            Download Quote
          </div>
          <div
            style={{
              fontSize: 13,
              color: "rgba(232,235,243,0.55)",
              marginTop: 6,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 10,
            }}
          >
            {isTrueQuote ? (
              <>
                <TrueQuoteBadgeCanonical showTooltip={false} onClick={onTrueQuoteClick} />
                <span>kW breakdown, confidence score &amp; methodology included</span>
              </>
            ) : hasPricing ? (
              <span style={{ color: "rgba(232,235,243,0.6)" }}>
                Estimate — includes financial projections
              </span>
            ) : (
              <span style={{ color: "rgba(232,235,243,0.5)" }}>
                Load profile only — pricing pending
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", flex: "0 0 auto" }}>
          {/* Export Buttons */}
          {buttons.map(({ format, icon, label, locked }) => (
            <button
              key={format}
              type="button"
              onClick={() => {
                if (locked) {
                  setError("Word & Excel exports require a Pro plan. PDF is always free!");
                  return;
                }
                void handleExport(format);
              }}
              disabled={exporting !== null}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                height: 44,
                padding: "0 14px",
                borderRadius: 12,
                minWidth: 0,
                border: locked
                  ? "2px solid rgba(148,163,184,0.15)"
                  : "2px solid rgba(62,207,142,0.30)",
                background: locked
                  ? "rgba(148,163,184,0.04)"
                  : exporting === format
                    ? "rgba(62,207,142,0.15)"
                    : "rgba(62,207,142,0.06)",
                color: locked
                  ? "rgba(148,163,184,0.45)"
                  : exporting !== null && exporting !== format
                    ? "rgba(232,235,243,0.3)"
                    : "rgba(62,207,142,0.9)",
                cursor: locked ? "pointer" : exporting !== null ? "not-allowed" : "pointer",
                fontWeight: 700,
                fontSize: 15,
                transition: "all 0.15s",
                position: "relative",
              }}
            >
              <span>{exporting === format ? "⏳" : locked ? "" : icon}</span>
              <span>{label}</span>
              {locked && <Lock className="w-3.5 h-3.5" style={{ opacity: 0.5 }} />}
            </button>
          ))}

          {/* Share Button - TEMP DISABLED until DB types regenerated */}
          {/* {state.quote && (
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              disabled={exporting !== null}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                height: 44,
                padding: "0 14px",
                borderRadius: 12,
                minWidth: 0,
                border: "2px solid rgba(59,130,246,0.30)",
                background: exporting !== null ? "rgba(59,130,246,0.06)" : "rgba(59,130,246,0.08)",
                color: exporting !== null ? "rgba(232,235,243,0.3)" : "rgba(96,165,250,0.95)",
                cursor: exporting !== null ? "not-allowed" : "pointer",
                fontWeight: 700,
                fontSize: 15,
                transition: "all 0.15s",
              }}
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          )} */}
        </div>
      </div>

      {error && (
        <div
          style={{
            marginTop: 10,
            padding: "8px 12px",
            borderRadius: 8,
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            color: "rgba(239,68,68,0.9)",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* ── SAVE PROMPT: Appears after successful export for unauthenticated users ── */}
      {showSavePrompt && (
        <div className="mt-3 rounded-xl border border-[#3ECF8E]/25 bg-[#3ECF8E]/[0.04] p-3 sm:p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 flex items-center justify-center shrink-0">
              <Bookmark className="w-4 h-4 text-[#3ECF8E]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-[#3ECF8E]">
                Save this quote to your account
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Create a free account to save, revisit, and compare your BESS quotes anytime.
              </div>
            </div>
            <button
              onClick={() => setShowAuthModal(true)}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/25 text-[#3ECF8E] text-sm font-bold hover:bg-[#3ECF8E]/20 hover:border-[#3ECF8E]/40 transition-all cursor-pointer"
            >
              Sign Up Free →
            </button>
          </div>
        </div>
      )}

      {/* ── LEAD CAPTURE GATE: Name + Email before first export ── */}
      {showLeadGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 max-w-sm w-full border border-[#3ECF8E]/30 shadow-2xl shadow-[#3ECF8E]/10 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-xl bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-[#3ECF8E]" />
              </div>
              <h3 className="text-lg font-bold text-white">Get Your Quote</h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter your details to download your personalized BESS proposal
              </p>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                required
                value={leadForm.name}
                onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/30 outline-none transition-all"
                placeholder="Your name *"
              />
              <input
                type="email"
                required
                value={leadForm.email}
                onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/30 outline-none transition-all"
                placeholder="Email address *"
              />
              <input
                type="text"
                value={leadForm.company}
                onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/30 outline-none transition-all"
                placeholder="Company (optional)"
              />
              <button
                type="button"
                onClick={() => void handleLeadSubmit()}
                disabled={leadSubmitting || !leadForm.name.trim() || !leadForm.email.includes("@")}
                className="w-full bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                {leadSubmitting ? (
                  <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                ) : (
                  <>Download Quote</>
                )}
              </button>
              <button
                type="button"
                onClick={handleSkipLead}
                className="w-full text-xs text-slate-500 hover:text-slate-400 py-1 transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AUTH MODAL: Opens when user clicks "Sign Up Free" ── */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={() => setShowAuthModal(false)}
        defaultMode="signup"
      />

      {/* ── SHARE QUOTE MODAL ── TEMP DISABLED */}
      {/* {showShareModal && state.quote && (
        <ShareQuoteModal
          quote={state.quote}
          onClose={() => setShowShareModal(false)}
        />
      )} */}
    </div>
  );
}
