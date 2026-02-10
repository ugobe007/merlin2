/**
 * Location Step (Fly.io Quality Bar) — SSOT-Compliant
 *
 * Conversion flow:
 * - ZIP/postal typed → progressive intel hydration (primeLocationIntel)
 * - Optional business name/address → submitLocation(rawInput, businessInfo)
 * - If businessCard produced → explicit confirm/skip gate (SSOT)
 *
 * IMPORTANT:
 * - No step indexing assumptions (0 vs 1).
 * - No navigation. Shell + SSOT handle transitions.
 * - Must NOT write business searchQuery into locationRawInput.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { WizardState as WizardV7State, EnergyGoal } from "@/wizard/v7/hooks/useWizardV7";
import IntelStrip from "../shared/IntelStrip";
import BusinessProfileCard from "../shared/BusinessProfileCard";
import GoalsModal from "./GoalsModal";

type Country = "US" | "International";
type BusinessInfo = { name?: string; address?: string };

type Actions = {
  updateLocationRaw: (value: string) => void;

  // SSOT accepts optional rawInput + businessInfo (do not rely on stale state)
  submitLocation: (rawInput?: string, businessInfo?: BusinessInfo) => Promise<void>;

  // Progressive hydration for intel (ZIP change)
  // Returns intel for callers that need it; UI components can ignore the return value
  primeLocationIntel: (zipOrInput: string) => Promise<unknown> | void;

  // Goals actions (Feb 10, 2026)
  toggleGoal: (goal: EnergyGoal) => void;
  confirmGoals: (value: boolean) => void;

  // Explicit business gate actions (SSOT)
  confirmBusiness: (value: boolean) => Promise<void>;
  skipBusiness: () => void;

  // SSOT sync while typing
  setBusinessDraft: (patch: Partial<{ name: string; address: string }>) => void;
};

interface Props {
  state: WizardV7State;
  actions: Actions;
}

export default function Step1LocationV7({ state, actions }: Props) {
  // ✅ Destructure actions so effects don't depend on unstable object identity
  const {
    updateLocationRaw,
    submitLocation,
    primeLocationIntel,
    toggleGoal,
    confirmGoals,
    confirmBusiness,
    skipBusiness,
    setBusinessDraft,
  } = actions;

  const [country, setCountry] = useState<Country>("US");

  // ZIP input is UI-local for better typing control, but always sync ZIP into SSOT.
  const [zipValue, setZipValue] = useState<string>(() => (state.locationRawInput ?? "").trim());

  // Goals modal state (shown after location confirmed)
  const [showGoalsModal, setShowGoalsModal] = useState(false);

  // Business inputs (UI-local for typing UX; SSOT draft is authoritative)
  const [businessValue, setBusinessValue] = useState<string>("");
  const [addressValue, setAddressValue] = useState<string>("");
  const [isResolvingBusiness, setIsResolvingBusiness] = useState(false);

  // Debounce ref for primeLocationIntel
  const zipDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -----------------------------
  // Trigger goals modal after location confirmed
  // -----------------------------
  useEffect(() => {
    // Show goals modal if location confirmed but goals not yet confirmed
    if (state.locationConfirmed && !state.goalsConfirmed && !showGoalsModal) {
      setShowGoalsModal(true);
    }
  }, [state.locationConfirmed, state.goalsConfirmed, showGoalsModal]);

  // -----------------------------
  // Rehydrate business fields from SSOT draft (only if UI is empty)
  // -----------------------------
  useEffect(() => {
    const draftName = state.businessDraft?.name?.trim();
    const draftAddr = state.businessDraft?.address?.trim();

    if (draftName && !businessValue) setBusinessValue(draftName);
    if (draftAddr && !addressValue) setAddressValue(draftAddr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.businessDraft?.name, state.businessDraft?.address]);

  // -----------------------------
  // Keep ZIP UI in sync with SSOT if SSOT changes externally (rare)
  // -----------------------------
  useEffect(() => {
    const ssot = (state.locationRawInput ?? "").trim();
    if (!ssot) return;

    // Only update UI if SSOT has a valid input and differs
    if (ssot !== zipValue) {
      setZipValue(ssot);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.locationRawInput]);

  // -----------------------------
  // ZIP validation + normalization
  // -----------------------------
  const normalizedZip = useMemo(() => {
    const raw = zipValue.trim();
    if (country === "US") return raw.replace(/\D/g, "").slice(0, 5);
    return raw;
  }, [zipValue, country]);

  const isValidZip = useMemo(() => {
    if (country === "US") return /^\d{5}$/.test(normalizedZip);
    return normalizedZip.length >= 3;
  }, [country, normalizedZip]);

  // -----------------------------
  // ZIP change → sync into SSOT + debounced progressive intel hydration
  // NOTE: only sync ZIP/postal, never business query strings.
  // -----------------------------
  useEffect(() => {
    const ssotRaw = (state.locationRawInput ?? "").trim();

    // ✅ Prevent SSOT churn if value unchanged
    if (ssotRaw !== normalizedZip) {
      updateLocationRaw(normalizedZip);
    }

    if (zipDebounceRef.current) clearTimeout(zipDebounceRef.current);
    if (!isValidZip) return;

    zipDebounceRef.current = setTimeout(() => {
      primeLocationIntel(normalizedZip);
    }, 250);

    return () => {
      if (zipDebounceRef.current) clearTimeout(zipDebounceRef.current);
    };
  }, [normalizedZip, isValidZip, updateLocationRaw, primeLocationIntel, state.locationRawInput]);

  // -----------------------------
  // Business lookup:
  // - Build a search query for resolveLocation
  // - DO NOT write that query into locationRawInput
  // - Pass businessInfo directly to SSOT (avoid stale draft)
  // -----------------------------
  const handleBusinessLookup = async () => {
    const name = businessValue.trim();
    const addr = addressValue.trim();
    if (!name) return;

    const locationContext = [addr, normalizedZip].filter(Boolean).join(" ");
    const searchQuery = locationContext ? `${name}, ${locationContext}` : name;

    setIsResolvingBusiness(true);
    try {
      // Keep SSOT draft synced
      setBusinessDraft({ name, address: addr });

      // ✅ CRITICAL: do NOT call updateLocationRaw(searchQuery)
      await submitLocation(searchQuery, {
        name,
        address: addr || undefined,
      });
    } finally {
      setIsResolvingBusiness(false);
    }
  };

  // If SSOT already locked industry with high confidence, hint that Next will skip.
  const canSkipIndustry = useMemo(() => {
    return Boolean(state.industryLocked && state.industry !== "auto");
  }, [state.industryLocked, state.industry]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, position: "relative" }}>

      {/* Headline */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* TrueQuote badge — aligned with subtitle, right side */}
        <div
          style={{
            position: "absolute",
            top: 120,
            right: 24,
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 18px",
            borderRadius: 12,
            background: "rgba(249, 168, 37, 0.06)",
            border: "1px solid rgba(249, 168, 37, 0.18)",
            zIndex: 2,
          }}
        >
          <span style={{ fontSize: 16, color: "#f9a825" }}>◎</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#f9a825", letterSpacing: "0.3px" }}>TrueQuote™</span>
          <span style={{ width: 1, height: 14, background: "rgba(255,255,255,0.10)" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#4ade80" }}>Verified</span>
        </div>

        <h1
          style={{
            fontSize: 64,
            fontWeight: 700,
            letterSpacing: "-1.5px",
            color: "rgba(255, 255, 255, 0.98)",
            margin: 0,
            marginBottom: 6,
            lineHeight: 1.1,
            textTransform: "lowercase",
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
              filter: "drop-shadow(0 0 24px rgba(34, 211, 238, 0.4))",
            }}
          >
            energy savings
          </span>
          …
        </h1>

        <h2
          style={{
            fontSize: 44,
            fontWeight: 600,
            letterSpacing: "-0.8px",
            color: "rgba(255, 255, 255, 0.70)",
            margin: 0,
            marginBottom: 20,
            lineHeight: 1.2,
            textTransform: "lowercase",
          }}
        >
          starting with location.
        </h2>

        <p
          style={{
            fontSize: 15,
            color: "rgba(232, 235, 243, 0.6)",
            margin: 0,
            lineHeight: 1.75,
            maxWidth: 680,
            fontWeight: 400,
          }}
        >
          Your location helps us estimate savings using utility rates, demand charges, solar potential,
          weather profile, and incentives.
        </p>

        {/* Resolved City/State — shown right below description when ZIP resolves */}
        {state.location && (
          <div
            style={{
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#4ade80",
                boxShadow: "0 0 8px rgba(74, 222, 128, 0.5)",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "rgba(232, 235, 243, 0.92)",
                letterSpacing: "-0.3px",
              }}
            >
              {state.location.city && (
                <span>{state.location.city}</span>
              )}
              {state.location.state && state.location.city && (
                <span style={{ color: "rgba(232, 235, 243, 0.35)", margin: "0 4px" }}>,</span>
              )}
              {state.location.state && (
                <span style={{ color: "#22D3EE" }}>
                  {state.location.state}
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* ── Location Results (above ZIP so users see feedback immediately) ── */}
      {isValidZip && (state.location || state.locationIntel) && (
        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Intel Strip — energy metrics */}
          <IntelStrip intel={state.locationIntel} />
        </div>
      )}

      {/* Country Toggle + ZIP */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 12, alignItems: "center" }}>
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
              border:
                country === "International"
                  ? "1px solid rgba(79,140,255,0.55)"
                  : "1px solid rgba(255,255,255,0.12)",
              background: country === "International" ? "rgba(79,140,255,0.14)" : "rgba(255,255,255,0.04)",
              color: "rgba(232,235,243,0.92)",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            🌐 Intl
          </button>
        </div>

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
            type="text"
            inputMode="numeric"
            value={zipValue}
            onChange={(e) => {
              const raw = e.target.value;
              // Normalize at input edge for US to prevent SSOT snap/jump
              const v = country === "US" ? raw.replace(/\D/g, "").slice(0, 5) : raw;
              setZipValue(v);
            }}
            placeholder={country === "US" ? "ZIP code (e.g., 89052)" : "Postal code"}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            data-lpignore="true"
            data-1p-ignore
            name="merlin-zip-nofill"
            className={`merlin-zip-input${isValidZip ? " zip-valid" : ""}`}
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
              transition: "box-shadow 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* Business Lookup */}
      <div
        style={{
          padding: 24,
          borderRadius: 18,
          background: "linear-gradient(135deg, rgba(18, 22, 40, 0.55) 0%, rgba(79, 140, 255, 0.04) 100%)",
          border: "1px solid rgba(79, 140, 255, 0.15)",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.2), 0 0 40px rgba(79, 140, 255, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, rgba(79, 140, 255, 0.25) 0%, rgba(139, 92, 246, 0.15) 100%)",
              boxShadow: "0 0 16px rgba(79, 140, 255, 0.25)",
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
            <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(232, 235, 243, 0.92)", letterSpacing: "0.2px" }}>
              Find Your Business
            </div>
            <div style={{ fontSize: 11, fontWeight: 500, color: "rgba(232, 235, 243, 0.4)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
              Optional — improves accuracy
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: 13,
            color: "rgba(34, 211, 238, 0.7)",
            marginBottom: 18,
            lineHeight: 1.6,
            paddingLeft: 48,
          }}
        >
          Adding your business helps Merlin tailor equipment sizing, load profiles, and incentive eligibility to your exact facility.
        </div>

        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 600,
              color: "rgba(232, 235, 243, 0.5)",
              marginBottom: 5,
              textTransform: "uppercase",
              letterSpacing: "0.3px",
            }}
          >
            Business Name
          </label>

          <input
            type="text"
            value={businessValue}
            onChange={(e) => {
              const v = e.target.value;
              setBusinessValue(v);
              setBusinessDraft({ name: v });
            }}
            placeholder="e.g. Hilton Garden Inn"
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
          <label
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 600,
              color: "rgba(232, 235, 243, 0.5)",
              marginBottom: 5,
              textTransform: "uppercase",
              letterSpacing: "0.3px",
            }}
          >
            Street Address or City{" "}
            <span style={{ opacity: 0.6, fontWeight: 400, textTransform: "none" }}>(optional)</span>
          </label>

          <input
            type="text"
            value={addressValue}
            onChange={(e) => {
              const v = e.target.value;
              setAddressValue(v);
              setBusinessDraft({ address: v });
            }}
            placeholder="e.g. 123 Main St, Las Vegas"
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
          className="merlin-cta-button"
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
                : "0 6px 28px rgba(37, 99, 235, 0.5), 0 0 40px rgba(59, 130, 246, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
            color: isResolvingBusiness || !businessValue.trim() ? "rgba(232, 235, 243, 0.35)" : "#fff",
            fontSize: 15,
            fontWeight: 700,
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
              <span style={{ fontSize: 16 }}>📍</span>
              Find My Location
            </>
          )}
        </button>
      </div>

      {/* Business Card */}
      <BusinessProfileCard
        data={state.businessCard}
        showIndustryInference={true}
        onEdit={() => {
          const n = state.businessCard?.name ?? "";
          const a = state.businessCard?.address ?? "";
          setBusinessValue(n);
          setAddressValue(a);
          setBusinessDraft({ name: n, address: a });
        }}
      />

      {/* Business Confirmation Gate */}
      {state.businessCard && !state.businessConfirmed && (
        <div
          style={{
            padding: 20,
            borderRadius: 16,
            background: "rgba(139, 92, 246, 0.08)",
            border: "1px solid rgba(139, 92, 246, 0.25)",
            boxShadow: "0 4px 20px rgba(139, 92, 246, 0.15)",
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(232, 235, 243, 0.95)", marginBottom: 8 }}>
            Is this your business?
          </div>

          <div style={{ fontSize: 13, color: "rgba(232, 235, 243, 0.6)", marginBottom: 16, lineHeight: 1.5 }}>
            Confirming helps us personalize your savings analysis with industry-specific defaults.
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => confirmBusiness(true)}
              disabled={state.isBusy}
              style={{
                flex: 1,
                minWidth: 140,
                padding: "12px 20px",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
                boxShadow: "0 4px 16px rgba(139, 92, 246, 0.4)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 800,
                cursor: state.isBusy ? "not-allowed" : "pointer",
                opacity: state.isBusy ? 0.6 : 1,
              }}
            >
              ✓ Yes, this is correct
            </button>

            <button
              type="button"
              onClick={() => skipBusiness()}
              disabled={state.isBusy}
              style={{
                flex: 1,
                minWidth: 140,
                padding: "12px 20px",
                borderRadius: 12,
                border: "1px solid rgba(255, 255, 255, 0.15)",
                background: "rgba(255, 255, 255, 0.05)",
                color: "rgba(232, 235, 243, 0.85)",
                fontSize: 14,
                fontWeight: 700,
                cursor: state.isBusy ? "not-allowed" : "pointer",
                opacity: state.isBusy ? 0.6 : 1,
              }}
            >
              Skip — I&apos;ll choose manually
            </button>
          </div>
        </div>
      )}

      {/* Skip hint if SSOT locked industry */}
      {canSkipIndustry && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            background: "rgba(74, 222, 128, 0.1)",
            boxShadow: "0 2px 8px rgba(74, 222, 128, 0.15)",
            fontSize: 13,
            color: "rgba(74, 222, 128, 0.9)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 16 }}>✓</span>
          Industry detected with high confidence. Click Next to jump to your load profile.
        </div>
      )}

      {/* ✅ Goals hint (appears before modal for no-surprise UX) */}
      {state.locationConfirmed && !state.goalsConfirmed && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            background: "rgba(79, 140, 255, 0.06)",
            border: "1px solid rgba(79, 140, 255, 0.12)",
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 18 }}>🔥</div>
          <div style={{ fontSize: 13, color: "rgba(232, 235, 243, 0.9)" }}>
            Tell Merlin what you want to achieve (reduce bills, backup power, EV charge).{" "}
            <button
              type="button"
              onClick={() => {
                setShowGoalsModal(true);
                // Scroll modal anchor into view
                setTimeout(() => {
                  const el = document.getElementById("goals-modal-anchor");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 100);
              }}
              style={{
                marginLeft: 8,
                textDecoration: "underline",
                background: "none",
                border: "none",
                color: "#4F8CFF",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              Choose goals
            </button>
          </div>
        </div>
      )}

      {/* ✅ Scroll anchor for goals modal */}
      <div id="goals-modal-anchor" style={{ height: 1, width: 1, opacity: 0 }} />

      {/* Goals Modal - appears after location confirmed */}
      <GoalsModal
        isOpen={showGoalsModal}
        selectedGoals={state.goals}
        onToggleGoal={toggleGoal}
        onContinue={() => {
          confirmGoals(true);
          setShowGoalsModal(false);
        }}
        onSkip={() => {
          confirmGoals(true); // Mark as confirmed even if skipped
          setShowGoalsModal(false);
        }}
      />

    </div>
  );
}
