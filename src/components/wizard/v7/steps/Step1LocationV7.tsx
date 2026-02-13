/**
 * Location Step (Fly.io Quality Bar) — SSOT-Compliant
 *
 * Conversion flow:
 * - ZIP/postal typed → progressive intel hydration (primeLocationIntel)
 * - Optional business name/address → submitLocation(rawInput, businessInfo)
 * - Business auto-confirmed on search (no confirm/skip gate)
 * - Industry inferred inline during submitLocation when business provided
 * - Goals modal opens after location confirmed
 *
 * IMPORTANT:
 * - No step indexing assumptions (0 vs 1).
 * - No navigation. Shell + SSOT handle transitions.
 * - Must NOT write business searchQuery into locationRawInput.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { WizardState as WizardV7State, EnergyGoal } from "@/wizard/v7/hooks/useWizardV7";
import IntelStripInline from "../shared/IntelStripInline";
import BusinessProfileCard from "../shared/BusinessProfileCard";
import GoalsModal from "./GoalsModal";
import { TrueQuoteBadgeCanonical } from "@/components/shared/TrueQuoteBadgeCanonical";
import TrueQuoteModal from "@/components/shared/TrueQuoteModal";

type Country = "US" | "International";
type BusinessInfo = { name?: string; address?: string };

type Actions = {
  updateLocationRaw: (value: string) => void;
  submitLocation: (rawInput?: string, businessInfo?: BusinessInfo) => Promise<void>;
  primeLocationIntel: (zipOrInput: string) => Promise<unknown> | void;

  toggleGoal: (goal: EnergyGoal) => void;
  confirmGoals: (value: boolean) => void;

  confirmBusiness: (value: boolean) => Promise<void>;
  skipBusiness: () => void;

  setBusinessDraft: (patch: Partial<{ name: string; address: string }>) => void;
  setLocationConfirmed: (value: boolean) => void;
};

interface Props {
  state: WizardV7State;
  actions: Actions;
  /** Called when goals are confirmed — auto-advance to next step */
  onGoalsConfirmedAdvance?: () => void;
}

export default function Step1LocationV7({ state, actions, onGoalsConfirmedAdvance }: Props) {
  const {
    updateLocationRaw,
    submitLocation,
    primeLocationIntel,
    toggleGoal,
    confirmGoals,
    // skipBusiness removed Feb 12 (auto-confirm on search)
    setBusinessDraft,
    setLocationConfirmed,
  } = actions;

  const [country, setCountry] = useState<Country>("US");
  const [zipValue, setZipValue] = useState<string>(() => (state.locationRawInput ?? "").trim());
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [showTrueQuoteModal, setShowTrueQuoteModal] = useState(false);

  const [businessValue, setBusinessValue] = useState<string>("");
  const [addressValue, setAddressValue] = useState<string>("");
  const [isResolvingBusiness, setIsResolvingBusiness] = useState(false);
  const [businessSearchError, setBusinessSearchError] = useState<string | null>(null);

  const zipDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ✅ FIX Feb 12: Business auto-confirms on search. No confirm gate needed.
  // Goals modal opens when locationConfirmed && !goalsConfirmed (single path).

  // ✅ FIX Feb 13: NO auto-open goals modal.
  // User reviews their business card first, then clicks "Continue" in bottom nav.
  // handleNext in WizardV7Page calls requestGoalsModal() when locationConfirmed && !goalsConfirmed.
  // Auto-open ONLY for the non-business path (ZIP-only → no business card to review).
  const goalsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (goalsTimerRef.current) { clearTimeout(goalsTimerRef.current); goalsTimerRef.current = null; }

    // Only auto-open when there's NO business card to review
    if (
      state.locationConfirmed &&
      !state.goalsConfirmed &&
      !showGoalsModal &&
      !state.isBusy &&
      !state.businessCard  // ← Don't auto-open when business card is present
    ) {
      goalsTimerRef.current = setTimeout(() => setShowGoalsModal(true), 400);
    }

    return () => { if (goalsTimerRef.current) clearTimeout(goalsTimerRef.current); };
  }, [state.locationConfirmed, state.goalsConfirmed, showGoalsModal, state.isBusy, state.businessCard]);

  // ✅ FIX Feb 13: Scroll to top when business card appears so user can see & review it
  useEffect(() => {
    if (state.businessConfirmed && state.businessCard) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Also try the wizard scroll container (modal path)
      const scrollContainer = document.querySelector('[data-wizard-scroll]') as HTMLElement | null;
      if (scrollContainer) scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [state.businessConfirmed, state.businessCard]);

  // Rehydrate business fields from SSOT draft (only if UI empty)
  useEffect(() => {
    const draftName = state.businessDraft?.name?.trim();
    const draftAddr = state.businessDraft?.address?.trim();
    if (draftName && !businessValue) setBusinessValue(draftName);
    if (draftAddr && !addressValue) setAddressValue(draftAddr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.businessDraft?.name, state.businessDraft?.address]);

  // Keep ZIP UI in sync if SSOT changes externally
  useEffect(() => {
    const ssot = (state.locationRawInput ?? "").trim();
    if (ssot && ssot !== zipValue) setZipValue(ssot);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.locationRawInput]);

  const normalizedZip = useMemo(() => {
    const raw = zipValue.trim();
    if (country === "US") return raw.replace(/\D/g, "").slice(0, 5);
    return raw;
  }, [zipValue, country]);

  const isValidZip = useMemo(() => {
    if (country === "US") return /^\d{5}$/.test(normalizedZip);
    return normalizedZip.length >= 3;
  }, [country, normalizedZip]);

  // ZIP change → sync to SSOT + debounced intel hydration
  useEffect(() => {
    const ssotRaw = (state.locationRawInput ?? "").trim();
    if (ssotRaw !== normalizedZip) updateLocationRaw(normalizedZip);

    if (zipDebounceRef.current) clearTimeout(zipDebounceRef.current);
    if (!isValidZip) return;

    zipDebounceRef.current = setTimeout(() => {
      primeLocationIntel(normalizedZip);
    }, 250);

    return () => {
      if (zipDebounceRef.current) clearTimeout(zipDebounceRef.current);
    };
  }, [normalizedZip, isValidZip, updateLocationRaw, primeLocationIntel, state.locationRawInput]);

  const handleBusinessLookup = async () => {
    const name = businessValue.trim();
    const addr = addressValue.trim();
    if (!name) return;

    // ✅ FIX Feb 13: Require ZIP before business search — geocoder needs geographic context
    if (!isValidZip) {
      setBusinessSearchError("Please enter your ZIP code above first — it helps us find the right location.");
      // Focus the ZIP input
      const el = document.getElementById("merlin-zip-input") as HTMLInputElement | null;
      el?.focus();
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setBusinessSearchError(null);
    const locationContext = [addr, normalizedZip].filter(Boolean).join(" ");
    const searchQuery = locationContext ? `${name}, ${locationContext}` : name;

    setIsResolvingBusiness(true);
    try {
      setBusinessDraft({ name, address: addr });

      // CRITICAL: do not write searchQuery into locationRawInput.
      await submitLocation(searchQuery, { name, address: addr || undefined });
    } catch (err) {
      // Show a friendly inline error instead of letting the SSOT error display at the top
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("No location found") || msg.includes("VALIDATION")) {
        setBusinessSearchError("Couldn't find that business. Try adding more details to the address field (city, state).");
      } else {
        setBusinessSearchError("Search failed — please try again.");
      }
    } finally {
      setIsResolvingBusiness(false);
    }
  };

  const canSkipIndustry = useMemo(() => {
    return Boolean(state.industryLocked && state.industry !== "auto");
  }, [state.industryLocked, state.industry]);

  const showIntel = isValidZip && Boolean(state.locationIntel);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, position: "relative" }}>

      {/* ✅ Confirmed business profile card — prominent at TOP */}
      {state.businessConfirmed && state.businessCard && (
        <div style={{ marginBottom: 4 }}>
          <BusinessProfileCard
            data={state.businessCard}
            showIndustryInference={true}
            onTrueQuoteClick={() => setShowTrueQuoteModal(true)}
            onEdit={() => {
              // Pre-fill search fields and un-confirm to re-open search form
              // SET_BUSINESS_DRAFT resets businessConfirmed: false in the reducer
              const n = state.businessCard?.name ?? "";
              const a = state.businessCard?.address ?? "";
              setBusinessValue(n);
              setAddressValue(a);
              setBusinessDraft({ name: n, address: a });
            }}
          />
        </div>
      )}

      {/* Hero Section */}
      <div style={{ position: "relative", zIndex: 1 }}>

        {/* TrueQuote badge — clickable */}
        <div style={{ marginBottom: 18, position: "relative", zIndex: 2 }}>
          <TrueQuoteBadgeCanonical
            onClick={() => setShowTrueQuoteModal(true)}
            showTooltip={true}
          />
        </div>

        <h1
          style={{
            fontSize: 56,
            fontWeight: 800,
            letterSpacing: "-1.8px",
            color: "rgba(255, 255, 255, 0.98)",
            margin: 0,
            marginBottom: 6,
            lineHeight: 1.08,
            textTransform: "lowercase",
            position: "relative",
            zIndex: 1,
          }}
        >
          unlock your{" "}
          <span
            className="merlin-gradient-text"
            style={{
              background: "linear-gradient(135deg, #4F8CFF 0%, #22D3EE 50%, #06B6D4 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            energy savings
          </span>
          …
        </h1>

        <h2
          style={{
            fontSize: 36,
            fontWeight: 600,
            letterSpacing: "-0.6px",
            color: "rgba(255, 255, 255, 0.55)",
            margin: 0,
            marginBottom: 16,
            lineHeight: 1.2,
            textTransform: "lowercase",
            position: "relative",
            zIndex: 1,
          }}
        >
          starting with location.
        </h2>

        <p
          style={{
            fontSize: 13,
            color: "rgba(232, 235, 243, 0.38)",
            margin: 0,
            lineHeight: 1.6,
            maxWidth: 600,
            fontWeight: 400,
            position: "relative",
            zIndex: 1,
          }}
        >
          Utility rates · solar potential · demand charges · incentives
        </p>

        {/* Resolved City/State */}
        {state.location && (
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12, position: "relative", zIndex: 1 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#4ade80",
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 20, fontWeight: 700, color: "rgba(232, 235, 243, 0.92)", letterSpacing: "-0.3px" }}>
              {state.location.city && <span>{state.location.city}</span>}
              {state.location.state && state.location.city && (
                <span style={{ color: "rgba(232, 235, 243, 0.35)", margin: "0 4px" }}>,</span>
              )}
              {state.location.state && <span style={{ color: "#22D3EE" }}>{state.location.state}</span>}
            </span>
          </div>
        )}
      </div>

      {/* ✅ Location Intelligence — inline data row */}
      {showIntel && (
        <IntelStripInline intel={state.locationIntel} />
      )}

      {/* ✅ Primary input block MUST be immediately after headline */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Country + ZIP row */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setCountry("US")}
              style={{
                height: 44,
                padding: "0 14px",
                borderRadius: 12,
                border: country === "US" ? "1px solid rgba(79,140,255,0.55)" : "1px solid rgba(255,255,255,0.12)",
                background: country === "US" ? "rgba(79,140,255,0.14)" : "rgba(255,255,255,0.04)",
                color: "rgba(232,235,243,0.92)",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              🇺🇸 US
            </button>
            <button
              type="button"
              onClick={() => setCountry("International")}
              style={{
                height: 44,
                padding: "0 14px",
                borderRadius: 12,
                border: country === "International" ? "1px solid rgba(79,140,255,0.55)" : "1px solid rgba(255,255,255,0.12)",
                background: country === "International" ? "rgba(79,140,255,0.14)" : "rgba(255,255,255,0.04)",
                color: "rgba(232,235,243,0.92)",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              🌐 Intl
            </button>
          </div>

          {/* If location confirmed, show a confirmed card instead of editable input */}
          {!state.locationConfirmed ? (
            <>
              <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    position: "absolute",
                    left: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 18,
                    color: "rgba(34, 211, 238, 0.5)",
                  }}
                >
                  ◎
                </span>

                <input
                  id="merlin-zip-input"
                  type="text"
                  inputMode="numeric"
                  value={zipValue}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const v = country === "US" ? raw.replace(/\D/g, "").slice(0, 5) : raw;
                    setZipValue(v);
                    // Hardening: if user edits ZIP while confirmed, unconfirm immediately
                    if (state.locationConfirmed) setLocationConfirmed(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && isValidZip && !state.isBusy) {
                      submitLocation(normalizedZip);
                    }
                  }}
                  placeholder={country === "US" ? "ZIP code (e.g., 89052)" : "Postal code"}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  data-lpignore="true"
                  data-1p-ignore
                  name="merlin-zip-nofill"
                  style={{
                    width: "100%",
                    height: 56,
                    paddingLeft: 48,
                    paddingRight: 16,
                    borderRadius: 14,
                    border: "none",
                    background: "rgba(15, 18, 35, 0.6)",
                    boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.2), 0 1px 0 rgba(255, 255, 255, 0.03)",
                    fontSize: 16,
                    color: "rgba(232, 235, 243, 0.95)",
                    outline: "none",
                  }}
                />
              </div>

              {/* Continue button — inline with ZIP row */}
              <button
                type="button"
                onClick={() => submitLocation(normalizedZip)}
                disabled={!isValidZip || state.isBusy}
                style={{
                  height: 56,
                  padding: "0 24px",
                  borderRadius: 14,
                  border: "none",
                  background:
                    !isValidZip || state.isBusy
                      ? "rgba(79, 140, 255, 0.12)"
                      : "linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #3b82f6 100%)",
                  boxShadow:
                    !isValidZip || state.isBusy
                      ? "none"
                      : "0 4px 16px rgba(37, 99, 235, 0.4)",
                  color: !isValidZip || state.isBusy ? "rgba(232, 235, 243, 0.3)" : "#fff",
                  fontSize: 15,
                  fontWeight: 900,
                  letterSpacing: "0.3px",
                  cursor: !isValidZip || state.isBusy ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  transition: "all 0.2s ease",
                }}
              >
                {state.isBusy ? "Analyzing…" : "Continue →"}
              </button>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                borderRadius: 14,
                padding: "14px 16px",
                background: "rgba(74, 222, 128, 0.08)",
                border: "1px solid rgba(74, 222, 128, 0.22)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "#4ade80", fontWeight: 900 }}>✓</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(232,235,243,0.92)" }}>
                    Location confirmed
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(232,235,243,0.65)" }}>
                    {state.location?.postalCode ?? state.locationRawInput ?? normalizedZip}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  // ✅ Must unconfirm so the ZIP input renders again
                  setLocationConfirmed(false);
                  requestAnimationFrame(() => {
                    const el = document.getElementById("merlin-zip-input") as HTMLInputElement | null;
                    el?.focus();
                    el?.select();
                  });
                }}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.05)",
                  color: "rgba(232,235,243,0.85)",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Edit
              </button>
            </div>
          )}
        </div>

        {/* ✅ Intel moved to above ZIP input — see above */}

      </div>

      {/* Business: if confirmed, show a hard confirmation card and collapse the form */}
      {!state.businessConfirmed && (
        <div
          style={{
            padding: 24,
            borderRadius: 18,
            background: "linear-gradient(135deg, rgba(18, 22, 40, 0.55) 0%, rgba(79, 140, 255, 0.04) 100%)",
            border: "1px solid rgba(79, 140, 255, 0.15)",
            boxShadow:
              "0 4px 16px rgba(0, 0, 0, 0.2)",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, rgba(79, 140, 255, 0.25) 0%, rgba(139, 92, 246, 0.15) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F8CFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "rgba(232, 235, 243, 0.92)" }}>
                Find My Business
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(232, 235, 243, 0.4)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                Optional — improves accuracy
              </div>
            </div>
          </div>

          <div style={{ fontSize: 13, color: "rgba(34, 211, 238, 0.7)", marginBottom: 18, lineHeight: 1.6, paddingLeft: 48 }}>
            Adding your business helps Merlin tailor equipment sizing, load profiles, and incentive eligibility to your exact facility.
          </div>

          {/* Inline validation error */}
          {businessSearchError && (
            <div style={{
              marginBottom: 12,
              padding: "10px 14px",
              borderRadius: 10,
              background: "rgba(251, 191, 36, 0.08)",
              border: "1px solid rgba(251, 191, 36, 0.25)",
              fontSize: 13,
              color: "rgba(251, 191, 36, 0.9)",
              lineHeight: 1.5,
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
            }}>
              <span style={{ flexShrink: 0, fontSize: 14 }}>⚠️</span>
              <span>{businessSearchError}</span>
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(232, 235, 243, 0.5)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.3px" }}>
              Business Name
            </label>
            <input
              type="text"
              value={businessValue}
              onChange={(e) => {
                const v = e.target.value;
                setBusinessValue(v);
                setBusinessDraft({ name: v });
                if (businessSearchError) setBusinessSearchError(null);
              }}
              placeholder="e.g. Dash Car Wash"
              style={{
                width: "100%",
                height: 46,
                padding: "0 14px",
                borderRadius: 10,
                border: "none",
                background: "rgba(10, 14, 28, 0.5)",
                boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.2)",
                fontSize: 14,
                color: "rgba(232, 235, 243, 0.95)",
                outline: "none",
              }}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(232, 235, 243, 0.5)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.3px" }}>
              Street Address or City <span style={{ opacity: 0.6, fontWeight: 500, textTransform: "none" }}>(optional)</span>
            </label>
            <input
              type="text"
              value={addressValue}
              onChange={(e) => {
                const v = e.target.value;
                setAddressValue(v);
                setBusinessDraft({ address: v });
                if (businessSearchError) setBusinessSearchError(null);
              }}
              placeholder="e.g. Eastern Blvd, Henderson"
              style={{
                width: "100%",
                height: 46,
                padding: "0 14px",
                borderRadius: 10,
                border: "none",
                background: "rgba(10, 14, 28, 0.5)",
                boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.2)",
                fontSize: 14,
                color: "rgba(232, 235, 243, 0.95)",
                outline: "none",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleBusinessLookup();
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleBusinessLookup}
            disabled={isResolvingBusiness || !businessValue.trim()}
            style={{
              width: "100%",
              padding: "14px 20px",
              borderRadius: 12,
              border: "none",
              background:
                isResolvingBusiness || !businessValue.trim()
                  ? "rgba(79, 140, 255, 0.12)"
                  : "linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #3b82f6 100%)",
              boxShadow:
                isResolvingBusiness || !businessValue.trim()
                  ? "none"
                  : "0 2px 8px rgba(0, 0, 0, 0.3)",
              color: isResolvingBusiness || !businessValue.trim() ? "rgba(232, 235, 243, 0.35)" : "#fff",
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: "0.3px",
              cursor: isResolvingBusiness || !businessValue.trim() ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {isResolvingBusiness ? (
              <>
                <span style={{ animation: "spin 1s linear infinite" }}>⟳</span>
                Locating…
              </>
            ) : (
              <>
                <span style={{ fontSize: 16 }}>🔎</span>
                Search Business
              </>
            )}
          </button>
        </div>
      )}

      {/* Business card shown at top when confirmed — search form collapses */}

      {/* ✅ Action card: Industry detected + Goals CTA — must be visually prominent */}
      {(canSkipIndustry || (state.locationConfirmed && !state.goalsConfirmed)) && (
        <div
          style={{
            padding: 0,
            borderRadius: 16,
            background: "linear-gradient(135deg, rgba(79, 140, 255, 0.12) 0%, rgba(74, 222, 128, 0.10) 100%)",
            border: "1.5px solid rgba(79, 140, 255, 0.30)",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
            overflow: "hidden",
          }}
        >
          {/* Industry detected badge */}
          {canSkipIndustry && (
            <div
              style={{
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                borderBottom: !state.goalsConfirmed ? "1px solid rgba(255,255,255,0.08)" : "none",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: "rgba(74, 222, 128, 0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                ✓
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "rgba(74, 222, 128, 1)" }}>
                  Industry detected: {state.industry ? state.industry.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : ""}
                </div>
                <div style={{ fontSize: 12, color: "rgba(232, 235, 243, 0.6)", marginTop: 2 }}>
                  We'll skip straight to your load profile
                </div>
              </div>
            </div>
          )}

          {/* Goals CTA — big, prominent button */}
          {state.locationConfirmed && !state.goalsConfirmed && (
            <div
              style={{
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "rgba(232, 235, 243, 0.95)" }}>
                  🔥 What are your energy goals?
                </div>
                <div style={{ fontSize: 12, color: "rgba(232, 235, 243, 0.55)", marginTop: 3, lineHeight: 1.4 }}>
                  Reduce bills, backup power, EV charging — helps Merlin size your system
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGoalsModal(true)}
                style={{
                  padding: "12px 24px",
                  borderRadius: 12,
                  border: "none",
                  background: "linear-gradient(135deg, #4F8CFF 0%, #6C5CE7 100%)",
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: 14,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                  transition: "opacity 0.15s",
                  flexShrink: 0,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.opacity = "0.9";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.opacity = "1";
                }}
              >
                Set Goals
              </button>
            </div>
          )}

          {/* Goals confirmed — show check */}
          {state.locationConfirmed && state.goalsConfirmed && (
            <div
              style={{
                padding: "12px 20px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ color: "#4ade80", fontWeight: 900, fontSize: 14 }}>✓</span>
              <span style={{ fontSize: 13, color: "rgba(232, 235, 243, 0.7)" }}>
                Goals set — ready to continue
              </span>
              <button
                type="button"
                onClick={() => setShowGoalsModal(true)}
                style={{
                  marginLeft: "auto",
                  background: "none",
                  border: "none",
                  color: "rgba(79, 140, 255, 0.8)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Edit
              </button>
            </div>
          )}
        </div>
      )}

      <GoalsModal
        isOpen={showGoalsModal}
        selectedGoals={state.goals}
        onToggleGoal={toggleGoal}
        onContinue={() => {
          confirmGoals(true);
          setShowGoalsModal(false);
          // ✅ FIX: Auto-advance after goals confirmed — don't strand user on Step 1
          if (onGoalsConfirmedAdvance) {
            // Small delay to let state settle before navigation
            setTimeout(() => onGoalsConfirmedAdvance(), 80);
          }
        }}
        onSkip={() => {
          confirmGoals(true);
          setShowGoalsModal(false);
          // ✅ FIX: Also auto-advance on skip
          if (onGoalsConfirmedAdvance) {
            setTimeout(() => onGoalsConfirmedAdvance(), 80);
          }
        }}
      />

      {/* TrueQuote™ explainer modal */}
      <TrueQuoteModal
        isOpen={showTrueQuoteModal}
        onClose={() => setShowTrueQuoteModal(false)}
      />
    </div>
  );
}
