/**
 * WIZARD V8 — STEP 1: LOCATION
 *
 * Visual parity with V7 Step 1:
 *  • US / International country toggle
 *  • ZIP input styled as V7 (icon inside, 56px, gradient bg) with inline Continue →
 *  • Confirmed location card with city, state + green dot
 *  • IntelStripInline (utility rate · demand · sun hours · grade · climate)
 *  • "Find My Business" section (optional – local state only, improves display accuracy)
 *
 * RULE 3: No API calls here. All fetching stays in useWizardV8.ts.
 *
 * NOTE: Google Places API
 * - Currently using legacy `Autocomplete` (deprecated March 2025)
 * - ⚠️ Browser will show deprecation warning (safe to ignore for now)
 * - Migration to `PlaceAutocompleteElement` planned for v8.1
 * - Legacy API will continue to work with 12 months notice before discontinuation
 * - See: https://developers.google.com/maps/documentation/javascript/places-migration-overview
 *
 * PERFORMANCE NOTE (March 9, 2026):
 * - Fixed excessive re-renders by removing `actions` from useEffect deps
 * - Added explicit fields parameter for better data extraction
 * - Added comprehensive error handling and logging
 */

import React, { useRef, useEffect, useState } from "react";
import type { WizardState, WizardActions } from "../wizardState";
import IntelStripInline from "@/components/wizard/v7/shared/IntelStripInline";

// Google Maps API key from environment
const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyB9VeakhIGZQgCKmTiZ3ml0RvnvlT0dNrY";

// Track if script is loading to prevent duplicate loads
let isScriptLoading = false;
let isScriptLoaded = false;

// Load Google Places API with proper async loading
function loadGoogleMapsScript(): Promise<void> {
  console.log("[Step1V8] loadGoogleMapsScript called", {
    isScriptLoaded,
    isScriptLoading,
    hasGoogle: !!window.google,
    hasPlaces: !!window.google?.maps?.places,
  });

  if (typeof window === "undefined") return Promise.resolve();
  if (isScriptLoaded || window.google?.maps?.places) {
    isScriptLoaded = true;
    console.log("[Step1V8] Google Maps already loaded");
    return Promise.resolve();
  }
  if (isScriptLoading) {
    console.log("[Step1V8] Google Maps already loading, waiting...");
    // Already loading, wait for it
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkInterval);
          isScriptLoaded = true;
          console.log("[Step1V8] Google Maps loaded (via wait)");
          resolve();
        }
      }, 100);
    });
  }

  isScriptLoading = true;
  console.log("[Step1V8] Loading Google Maps script...");
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => {
      isScriptLoaded = true;
      isScriptLoading = false;
      console.log("[Step1V8] Google Maps script loaded successfully");
      resolve();
    };
    script.onerror = (err) => {
      isScriptLoading = false;
      console.error("[Step1V8] Google Maps script failed to load:", err);
      reject(new Error("Failed to load Google Maps API"));
    };
    document.head.appendChild(script);
  });
}

// ── Design tokens (match V7/Supabase dark) ────────────────────────────────────
const T = {
  bg: "#080b14",
  cardBg: "rgba(255,255,255,0.03)",
  cardBorder: "rgba(255,255,255,0.06)",
  inputBg: "rgba(255,255,255,0.04)",
  accent: "#3ECF8E",
  accentDim: "rgba(62,207,142,0.12)",
  accentBorder: "rgba(62,207,142,0.35)",
  textPrimary: "rgba(232,235,243,0.98)",
  textSub: "rgba(232,235,243,0.55)",
  textMuted: "rgba(232,235,243,0.35)",
  borderHover: "rgba(255,255,255,0.14)",
};

type Country = "US" | "International";

interface Step1Props {
  state: WizardState;
  actions: WizardActions;
}

export function Step1V8({ state, actions }: Step1Props) {
  const zipRef = useRef<HTMLInputElement>(null);
  const businessInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Local UI state — no impact on wizard SSOT state until submitLocation is called
  const [country, setCountry] = useState<Country>("US");
  const [businessName, setBusinessName] = useState("");
  const [addressValue, setAddressValue] = useState("");
  const [businessError, setBusinessError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);

  const { intel, intelStatus, locationRaw, locationStatus, location, error, isBusy } = state;

  // Derived state
  const locationConfirmed = location !== null;
  const normalizedZip =
    country === "US" ? locationRaw.replace(/\D/g, "").slice(0, 5) : locationRaw.trim();
  const isValidZip = country === "US" ? /^\d{5}$/.test(normalizedZip) : normalizedZip.length >= 3;

  useEffect(() => {
    zipRef.current?.focus();
  }, []);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    console.log("[Step1V8] Autocomplete useEffect triggered", {
      hasBusinessInput: !!businessInputRef.current,
      hasAutocomplete: !!autocompleteRef.current,
      country,
      locationConfirmed,
    });

    // Early return if input not rendered yet (locationConfirmed=false)
    if (!businessInputRef.current || autocompleteRef.current) return;

    const initAutocomplete = async () => {
      try {
        console.log("[Step1V8] Starting autocomplete initialization...");
        // Ensure Google Maps API is loaded
        await loadGoogleMapsScript();

        console.log("[Step1V8] After loadGoogleMapsScript, checking window.google...", {
          hasGoogle: !!window.google,
          hasMaps: !!window.google?.maps,
          hasPlaces: !!window.google?.maps?.places,
          hasInput: !!businessInputRef.current,
        });

        if (!window.google?.maps?.places || !businessInputRef.current) {
          console.warn("[Step1V8] Cannot initialize autocomplete - missing dependencies");
          return;
        }

        console.log("[Step1V8] Creating Autocomplete instance...");
        const autocomplete = new window.google.maps.places.Autocomplete(businessInputRef.current, {
          types: ["establishment"],
          componentRestrictions: country === "US" ? { country: "us" } : undefined,
          fields: [
            "name",
            "formatted_address",
            "address_components",
            "geometry",
            "photos",
            "place_id",
            "types",
          ],
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          console.log("[Step1V8] Place selected:", {
            name: place.name,
            hasAddress: !!place.formatted_address,
            hasPhotos: !!place.photos?.length,
            hasGeometry: !!place.geometry,
            types: place.types,
          });

          if (place.formatted_address) {
            setSelectedPlace(place);
            setBusinessName(place.name || "");
            setBusinessError(null);

            // Extract ZIP from address components
            const zipComponent = place.address_components?.find((comp) =>
              comp.types.includes("postal_code")
            );
            if (zipComponent) {
              actions.setLocationRaw(zipComponent.short_name);
            }

            // Auto-submit business after selection
            setTimeout(() => {
              let photoUrl: string | undefined;
              try {
                photoUrl = place.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 300 });
              } catch (err) {
                console.warn("[Step1V8] Failed to get photo URL:", err);
              }

              const businessData = {
                placeId: place.place_id,
                formattedAddress: place.formatted_address,
                photoUrl,
                lat: place.geometry?.location?.lat(),
                lng: place.geometry?.location?.lng(),
              };

              console.log("[Step1V8] Auto-submitting business with Google Place data:", {
                name: place.name || "",
                hasPhoto: !!photoUrl,
                hasLocation: !!(businessData.lat && businessData.lng),
                address: businessData.formattedAddress,
              });

              actions.setBusiness(place.name || "", businessData);
            }, 100);
          } else {
            console.warn("[Step1V8] Place missing formatted_address");
          }
        });

        autocompleteRef.current = autocomplete;
        console.log("[Step1V8] Google Places Autocomplete initialized");
      } catch (err) {
        console.error("[Step1V8] Failed to load Google Maps API:", err);
      }
    };

    void initAutocomplete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, locationConfirmed]);

  const isFetching = locationStatus === "fetching" || isBusy;

  const showIntelStrip =
    isValidZip &&
    (intel !== null ||
      intelStatus.utility === "fetching" ||
      intelStatus.solar === "fetching" ||
      intelStatus.weather === "fetching");

  // Build intel prop for IntelStripInline
  const intelStripData = intel
    ? {
        utilityRate: intel.utilityRate,
        demandCharge: intel.demandCharge,
        peakSunHours: intel.peakSunHours,
        solarGrade: intel.solarGrade,
        weatherProfile: intel.weatherProfile,
        avgTempF: intel.avgTempF,
        utilityProvider: intel.utilityProvider,
        utilityStatus: intelStatus.utility,
        solarStatus: intelStatus.solar,
        weatherStatus: intelStatus.weather,
      }
    : {
        utilityStatus: intelStatus.utility,
        solarStatus: intelStatus.solar,
        weatherStatus: intelStatus.weather,
      };

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const v = country === "US" ? raw.replace(/\D/g, "").slice(0, 5) : raw;
    actions.setLocationRaw(v);
  };

  const handleSubmit = () => {
    if (!isValidZip || isFetching) return;
    void actions.submitLocation();
  };

  const handleBusinessSearch = () => {
    if (!businessName.trim()) return;
    if (!isValidZip) {
      setBusinessError("Please enter your ZIP code above first.");
      zipRef.current?.focus();
      return;
    }
    setBusinessError(null);

    // Use selected place from autocomplete if available
    if (selectedPlace) {
      let photoUrl: string | undefined;
      try {
        photoUrl = selectedPlace.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 300 });
      } catch (err) {
        console.warn("[Step1V8] Failed to get photo URL:", err);
      }

      const businessData = {
        placeId: selectedPlace.place_id,
        formattedAddress: selectedPlace.formatted_address,
        photoUrl,
        lat: selectedPlace.geometry?.location?.lat(),
        lng: selectedPlace.geometry?.location?.lng(),
      };

      console.log("[Step1V8] Setting business with data:", {
        name: selectedPlace.name || businessName.trim(),
        hasPhoto: !!photoUrl,
        hasLocation: !!(businessData.lat && businessData.lng),
        address: businessData.formattedAddress,
      });

      actions.setBusiness(selectedPlace.name || businessName.trim(), businessData);
    } else {
      console.log("[Step1V8] Setting business without Google Place data");
      // Fallback: use manual input without Google data
      actions.setBusiness(businessName.trim());
    }

    // Geocode ZIP if not already done
    if (!locationConfirmed) {
      void actions.submitLocation();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div>
        <h1
          style={{
            fontSize: "clamp(28px,6vw,52px)",
            fontWeight: 800,
            letterSpacing: "-1.8px",
            color: T.textPrimary,
            margin: 0,
            marginBottom: 6,
            lineHeight: 1.08,
            textTransform: "lowercase",
          }}
        >
          unlock your{" "}
          <span
            style={{
              background: "linear-gradient(135deg,#4F8CFF 0%,#22D3EE 50%,#06B6D4 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            energy savings
          </span>
          …
        </h1>

        <p style={{ fontSize: 15, color: T.textSub, margin: 0, marginBottom: 4, lineHeight: 1.6 }}>
          Enter your location to get utility rates, solar potential, and incentive data.
        </p>

        <p
          style={{
            fontSize: 11,
            color: T.textMuted,
            margin: 0,
            letterSpacing: "0.04em",
            fontWeight: 500,
          }}
        >
          Utility rates · Solar potential · Demand charges · Incentives
        </p>
      </div>

      {/* ── Confirmed city/state ──────────────────────────────────────────── */}
      {locationConfirmed && location && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#4ade80",
              flexShrink: 0,
            }}
          />
          <span
            style={{ fontSize: 20, fontWeight: 700, color: T.textPrimary, letterSpacing: "-0.3px" }}
          >
            {location.city && <span>{location.city}</span>}
            {location.city && location.state && (
              <span style={{ color: "rgba(232,235,243,0.35)", margin: "0 4px" }}>,</span>
            )}
            {location.state && <span style={{ color: T.accent }}>{location.state}</span>}
          </span>
        </div>
      )}

      {/* ── Intel strip ──────────────────────────────────────────────────── */}
      {showIntelStrip && <IntelStripInline intel={intelStripData} />}

      {/* ── Primary input block ──────────────────────────────────────────── */}
      <div>
        {/* Country toggle + ZIP row */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {/* Country toggle */}
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            {(["US", "International"] as Country[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCountry(c)}
                style={{
                  height: 44,
                  padding: "0 14px",
                  borderRadius: 8,
                  border:
                    country === c
                      ? "1px solid rgba(62,207,142,0.45)"
                      : "1px solid rgba(255,255,255,0.08)",
                  background: country === c ? T.accentDim : "rgba(255,255,255,0.03)",
                  color: country === c ? T.accent : "rgba(232,235,243,0.70)",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: 13,
                  transition: "all 0.15s ease",
                }}
              >
                {c === "US" ? "US" : "Intl"}
              </button>
            ))}
          </div>

          {/* ZIP input — or confirmed card */}
          {!locationConfirmed ? (
            <>
              <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
                {/* Location pin icon */}
                <span
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 17,
                    color: "rgba(62,207,142,0.45)",
                    pointerEvents: "none",
                  }}
                >
                  ◎
                </span>
                <input
                  ref={zipRef}
                  id="merlin-zip-input"
                  type="text"
                  inputMode={country === "US" ? "numeric" : "text"}
                  value={locationRaw}
                  onChange={handleZipChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmit();
                  }}
                  placeholder={country === "US" ? "ZIP code (e.g., 89052)" : "Postal code"}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  style={{
                    width: "100%",
                    height: 52,
                    paddingLeft: 40,
                    paddingRight: 14,
                    borderRadius: 8,
                    border: isValidZip
                      ? "1px solid rgba(62,207,142,0.30)"
                      : "1px solid rgba(255,255,255,0.06)",
                    background:
                      "linear-gradient(135deg,rgba(139,92,246,0.09),rgba(59,130,246,0.09))",
                    fontSize: 17,
                    color: T.textPrimary,
                    outline: "none",
                    transition: "border-color 0.2s",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Inline Continue button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isValidZip || isFetching}
                style={{
                  height: 44,
                  padding: "0 20px",
                  borderRadius: 8,
                  border:
                    !isValidZip || isFetching
                      ? "2px solid rgba(255,255,255,0.08)"
                      : `2px solid ${T.accent}`,
                  background: "transparent",
                  color: !isValidZip || isFetching ? "rgba(232,235,243,0.25)" : T.accent,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: !isValidZip || isFetching ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  transition: "all 0.15s ease",
                }}
              >
                {isFetching ? "Analyzing…" : "Continue →"}
              </button>
            </>
          ) : (
            /* Confirmed pill */
            <div
              style={{
                flex: 1,
                borderRadius: 8,
                padding: "10px 14px",
                background: "rgba(62,207,142,0.06)",
                border: "1px solid rgba(62,207,142,0.20)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: T.accent, fontWeight: 700 }}>✓</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>
                    Location confirmed
                  </div>
                  <div style={{ fontSize: 12, color: T.textSub }}>
                    {location?.zip ?? normalizedZip}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  actions.setLocationRaw("");
                  requestAnimationFrame(() => zipRef.current?.focus());
                }}
                style={{
                  padding: "5px 11px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  color: T.textSub,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Edit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
            fontSize: 13,
            color: "#f87171",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>⚠️</span>
          <span style={{ flex: 1 }}>{error.message}</span>
          <button
            onClick={actions.clearError}
            style={{
              color: "#fca5a5",
              textDecoration: "underline",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            dismiss
          </button>
        </div>
      )}

      {/* ── Grid Reliability Question (shown after location confirmed) ──────── */}
      {locationConfirmed && !state.business && (
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.08)",
            marginBottom: 20,
          }}
        >
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.textPrimary, marginBottom: 4 }}>
              ⚡ How reliable is your grid power?
            </div>
            <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.5 }}>
              This helps us determine if backup generation is needed for your facility.
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 10,
            }}
          >
            {(
              [
                {
                  value: "reliable",
                  label: "✅ Reliable",
                  desc: "Rare outages",
                  color: "rgba(34,197,94,0.20)",
                  activeColor: "rgba(34,197,94,0.50)",
                },
                {
                  value: "occasional-outages",
                  label: "⚠️ Occasional",
                  desc: "Few times/year",
                  color: "rgba(251,191,36,0.20)",
                  activeColor: "rgba(251,191,36,0.50)",
                },
                {
                  value: "frequent-outages",
                  label: "🔴 Frequent",
                  desc: "Monthly issues",
                  color: "rgba(249,115,22,0.20)",
                  activeColor: "rgba(249,115,22,0.50)",
                },
                {
                  value: "unreliable",
                  label: "💥 Unreliable",
                  desc: "Weekly outages",
                  color: "rgba(239,68,68,0.20)",
                  activeColor: "rgba(239,68,68,0.50)",
                },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => actions.setGridReliability(option.value)}
                style={{
                  padding: 12,
                  borderRadius: 10,
                  border:
                    state.gridReliability === option.value
                      ? `2px solid ${option.activeColor}`
                      : "1px solid rgba(255,255,255,0.08)",
                  background:
                    state.gridReliability === option.value
                      ? option.color
                      : "rgba(255,255,255,0.02)",
                  color: T.textPrimary,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.15s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <div>{option.label}</div>
                <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 400 }}>
                  {option.desc}
                </div>
              </button>
            ))}
          </div>

          {(state.gridReliability === "frequent-outages" ||
            state.gridReliability === "unreliable") && (
            <div
              style={{
                marginTop: 12,
                padding: 10,
                borderRadius: 8,
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.25)",
                fontSize: 12,
                color: "#fca5a5",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>🔋</span>
              <span style={{ flex: 1 }}>
                <strong>Backup generator recommended.</strong> We'll include it in your quote
                automatically.
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Add-on Preferences (shown after location confirmed) ───────────── */}
      {locationConfirmed && !state.business && (
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            background: "rgba(139,92,246,0.04)",
            border: "1px solid rgba(139,92,246,0.20)",
            marginBottom: 20,
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.textPrimary, marginBottom: 4 }}>
              💡 Enhance Your Energy System
            </div>
            <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.5 }}>
              Let Merlin know if you want solar, EV charging, or backup power — we'll optimize your
              BESS sizing accordingly.
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            {/* Solar checkbox */}
            <button
              type="button"
              onClick={() => actions.setAddonPreference("solar", !state.wantsSolar)}
              style={{
                padding: 14,
                borderRadius: 10,
                border: state.wantsSolar
                  ? "2px solid rgba(251,191,36,0.50)"
                  : "1px solid rgba(255,255,255,0.08)",
                background: state.wantsSolar ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.02)",
                color: T.textPrimary,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 10,
                transition: "all 0.15s ease",
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  border: state.wantsSolar
                    ? "2px solid #fbbf24"
                    : "2px solid rgba(255,255,255,0.15)",
                  background: state.wantsSolar ? "#fbbf24" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {state.wantsSolar && <span style={{ fontSize: 12, color: "#000" }}>✓</span>}
              </div>
              <span style={{ flex: 1 }}>☀️ Add Solar PV</span>
            </button>

            {/* EV Charging checkbox */}
            <button
              type="button"
              onClick={() => actions.setAddonPreference("ev", !state.wantsEVCharging)}
              style={{
                padding: 14,
                borderRadius: 10,
                border: state.wantsEVCharging
                  ? "2px solid rgba(59,130,246,0.50)"
                  : "1px solid rgba(255,255,255,0.08)",
                background: state.wantsEVCharging
                  ? "rgba(59,130,246,0.08)"
                  : "rgba(255,255,255,0.02)",
                color: T.textPrimary,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 10,
                transition: "all 0.15s ease",
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  border: state.wantsEVCharging
                    ? "2px solid #3b82f6"
                    : "2px solid rgba(255,255,255,0.15)",
                  background: state.wantsEVCharging ? "#3b82f6" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {state.wantsEVCharging && <span style={{ fontSize: 12, color: "#fff" }}>✓</span>}
              </div>
              <span style={{ flex: 1 }}>⚡ Add EV Charging</span>
            </button>

            {/* Generator checkbox */}
            <button
              type="button"
              onClick={() => actions.setAddonPreference("generator", !state.wantsGenerator)}
              style={{
                padding: 14,
                borderRadius: 10,
                border: state.wantsGenerator
                  ? "2px solid rgba(239,68,68,0.50)"
                  : "1px solid rgba(255,255,255,0.08)",
                background: state.wantsGenerator
                  ? "rgba(239,68,68,0.08)"
                  : "rgba(255,255,255,0.02)",
                color: T.textPrimary,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 10,
                transition: "all 0.15s ease",
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  border: state.wantsGenerator
                    ? "2px solid #ef4444"
                    : "2px solid rgba(255,255,255,0.15)",
                  background: state.wantsGenerator ? "#ef4444" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {state.wantsGenerator && <span style={{ fontSize: 12, color: "#fff" }}>✓</span>}
              </div>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                <span>🔋 Add Generator</span>
                {(state.gridReliability === "frequent-outages" ||
                  state.gridReliability === "unreliable") &&
                  state.wantsGenerator && (
                    <span
                      style={{
                        fontSize: 9,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: "rgba(251,191,36,0.20)",
                        color: "#fbbf24",
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                      }}
                    >
                      AUTO
                    </span>
                  )}
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ── Find My Business / Business Confirmation ──────────────────────── */}
      {locationConfirmed && !state.business ? (
        /* Business search form */
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            background: T.cardBg,
            border: `1px solid ${T.cardBorder}`,
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: T.accentDim,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={T.accent}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary }}>
                Find My Business
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: T.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Skip industry selection
              </div>
            </div>
          </div>

          <p
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.40)",
              margin: "0 0 14px 44px",
              lineHeight: 1.6,
            }}
          >
            Merlin will detect your industry and skip straight to your custom questionnaire.
          </p>

          {/* Business name validation error */}
          {businessError && (
            <div
              style={{
                marginBottom: 10,
                padding: "8px 12px",
                borderRadius: 8,
                background: "rgba(251,191,36,0.08)",
                border: "1px solid rgba(251,191,36,0.25)",
                fontSize: 12,
                color: "rgba(251,191,36,0.9)",
                display: "flex",
                gap: 6,
              }}
            >
              <span>⚠️</span>
              <span>{businessError}</span>
            </div>
          )}

          {/* Business Name */}
          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                display: "block",
                fontSize: 10,
                fontWeight: 500,
                color: T.textMuted,
                marginBottom: 4,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Business Name
            </label>
            <input
              ref={businessInputRef}
              type="text"
              value={businessName}
              onChange={(e) => {
                setBusinessName(e.target.value);
                setBusinessError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  // Only allow Enter if autocomplete dropdown is not open
                  // This prevents bypassing autocomplete selection
                  if (selectedPlace || !autocompleteRef.current) {
                    handleBusinessSearch();
                  } else {
                    console.log(
                      "[Step1V8] Enter blocked - please select from autocomplete dropdown"
                    );
                  }
                }
              }}
              placeholder="e.g., Wow Car Wash, Sunset Hotel, City Hospital"
              autoComplete="off"
              style={{
                width: "100%",
                height: 42,
                padding: "0 12px",
                borderRadius: 7,
                border: "1px solid rgba(255,255,255,0.06)",
                background: T.inputBg,
                fontSize: 13,
                color: T.textPrimary,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Street Address */}
          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                display: "block",
                fontSize: 10,
                fontWeight: 500,
                color: T.textMuted,
                marginBottom: 4,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Street Address{" "}
              <span style={{ opacity: 0.6, fontWeight: 400, textTransform: "none" }}>
                (optional — improves map accuracy)
              </span>
            </label>
            <input
              type="text"
              value={addressValue}
              onChange={(e) => {
                setAddressValue(e.target.value);
                setBusinessError(null);
                actions.setBusinessAddress(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (selectedPlace || !autocompleteRef.current) {
                    handleBusinessSearch();
                  }
                }
              }}
              placeholder="e.g., 1234 S Maryland Parkway"
              style={{
                width: "100%",
                height: 42,
                padding: "0 12px",
                borderRadius: 7,
                border: "1px solid rgba(255,255,255,0.06)",
                background: T.inputBg,
                fontSize: 13,
                color: T.textPrimary,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Search button */}
          <button
            type="button"
            onClick={handleBusinessSearch}
            disabled={!businessName.trim() || isFetching}
            style={{
              width: "100%",
              padding: "11px 18px",
              borderRadius: 8,
              border:
                !businessName.trim() || isFetching
                  ? "2px solid rgba(255,255,255,0.08)"
                  : "2px solid #10b981",
              background: "transparent",
              color: !businessName.trim() || isFetching ? "rgba(232,235,243,0.25)" : "#10b981",
              fontSize: 13,
              fontWeight: 600,
              cursor: !businessName.trim() || isFetching ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {isFetching ? "Detecting..." : "Find My Business"}
          </button>

          {/* Skip button */}
          <button
            type="button"
            onClick={() => actions.goToStep(2)}
            style={{
              width: "100%",
              marginTop: 10,
              padding: "9px 18px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "transparent",
              color: T.textSub,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Skip — I'll select my industry manually
          </button>
        </div>
      ) : state.business && locationConfirmed ? (
        /* Business confirmation card - V6 pattern */
        <div
          style={{
            borderRadius: 16,
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)",
            border: "1px solid rgba(255,255,255,0.10)",
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}
        >
          {/* Header with photo and basic info - V6 style */}
          <div style={{ padding: 24, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "start", gap: 16 }}>
              {/* Photo */}
              {state.business.photoUrl ? (
                <img
                  src={state.business.photoUrl}
                  alt={state.business.name}
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 12,
                    objectFit: "cover",
                    border: "2px solid rgba(62,207,142,0.3)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                    flexShrink: 0,
                  }}
                  onError={(e) => {
                    // Hide image if it fails to load
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 96,
                    height: 96,
                    background:
                      "linear-gradient(135deg, rgba(62,207,142,0.2) 0%, rgba(62,207,142,0.1) 100%)",
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid rgba(62,207,142,0.3)",
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="rgba(62,207,142,0.6)"
                    strokeWidth="1.5"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 3v18" />
                  </svg>
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: T.textPrimary,
                    letterSpacing: "-0.5px",
                    lineHeight: 1.2,
                    marginBottom: 8,
                  }}
                >
                  {state.business.name}
                </div>
                {state.business.formattedAddress && (
                  <div
                    style={{
                      fontSize: 13,
                      color: T.textSub,
                      marginBottom: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span
                      style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      {state.business.formattedAddress}
                    </span>
                  </div>
                )}
                {state.business.detectedIndustry && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 16px",
                      background: "rgba(62,207,142,0.15)",
                      border: "1px solid rgba(62,207,142,0.3)",
                      borderRadius: 20,
                      fontSize: 13,
                      fontWeight: 600,
                      color: T.accent,
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {state.business.detectedIndustry.replace("_", " ").replace("-", " ")} •{" "}
                    {Math.round(state.business.confidence * 100)}% match
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional details section */}
          <div style={{ padding: 24, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {/* Business details grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 16,
                marginBottom: 20,
              }}
            >
              {/* Location */}
              {location && (
                <div
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: T.textMuted,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 4,
                    }}
                  >
                    📍 Location
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: T.textPrimary,
                      lineHeight: 1.4,
                    }}
                  >
                    {state.business.formattedAddress ||
                      state.business.address ||
                      `${location.city}, ${location.state} ${location.zip}`}
                  </div>
                </div>
              )}

              {/* Website */}
              {state.business.website && (
                <div
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: T.textMuted,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 4,
                    }}
                  >
                    🌐 Website
                  </div>
                  <a
                    href={state.business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: T.accent,
                      lineHeight: 1.4,
                      textDecoration: "none",
                    }}
                  >
                    {state.business.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}

              {/* Estimated roof space */}
              {state.business.estimatedRoofSpaceSqFt && (
                <div
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: "rgba(62,207,142,0.06)",
                    border: "1px solid rgba(62,207,142,0.15)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: "rgba(62,207,142,0.7)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 4,
                    }}
                  >
                    ☀️ Est. Roof Space
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: T.accent,
                      lineHeight: 1.4,
                    }}
                  >
                    {state.business.estimatedRoofSpaceSqFt.toLocaleString()} sq ft
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 500,
                        color: "rgba(62,207,142,0.6)",
                        marginTop: 2,
                      }}
                    >
                      ~{Math.round(state.business.estimatedRoofSpaceSqFt / 100)} kW solar potential
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Industry detection */}
            {state.business.detectedIndustry ? (
              <div
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: "rgba(62,207,142,0.06)",
                  border: "1px solid rgba(62,207,142,0.25)",
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "rgba(62,207,142,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={T.accent}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "rgba(62,207,142,0.7)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginBottom: 2,
                      }}
                    >
                      Industry Detected
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: T.accent,
                        letterSpacing: "-0.2px",
                      }}
                    >
                      {state.business.detectedIndustry
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(62,207,142,0.65)",
                    lineHeight: 1.5,
                    paddingLeft: 42,
                  }}
                >
                  We'll skip industry selection and go straight to your custom questionnaire
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: "rgba(251,191,36,0.05)",
                  border: "1px solid rgba(251,191,36,0.20)",
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(251,191,36,0.9)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div
                  style={{ flex: 1, fontSize: 12, color: "rgba(251,191,36,0.9)", lineHeight: 1.5 }}
                >
                  Industry not detected — you'll select manually on the next step
                </div>
              </div>
            )}

            {/* Google Maps Static Map */}
            {state.business.lat && state.business.lng && (
              <div style={{ marginBottom: 20, borderRadius: 12, overflow: "hidden" }}>
                <img
                  src={`https://maps.googleapis.com/maps/api/staticmap?center=${state.business.lat},${state.business.lng}&zoom=15&size=600x200&scale=2&maptype=roadmap&markers=color:0x3ecf8e|${state.business.lat},${state.business.lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""}&style=feature:all|element:labels|visibility:on&style=feature:road|element:geometry|color:0x2d3748&style=feature:landscape|element:geometry|color:0x1a202c&style=feature:water|element:geometry|color:0x0f172a`}
                  alt="Business location map"
                  style={{
                    width: "100%",
                    height: 200,
                    objectFit: "cover",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  onError={(e) => {
                    // Hide map if it fails to load
                    e.currentTarget.parentElement!.style.display = "none";
                  }}
                />
              </div>
            )}

            {/* Location info */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 14,
                borderRadius: 10,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: "rgba(59,130,246,0.10)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(59,130,246,0.8)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: T.textMuted,
                    marginBottom: 2,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Location
                </div>
                {state.business?.address && (
                  <div
                    style={{ fontSize: 13, color: T.textPrimary, fontWeight: 500, marginBottom: 3 }}
                  >
                    {state.business.address}
                  </div>
                )}
                <div style={{ fontSize: 14, color: T.textPrimary, fontWeight: 600 }}>
                  {location?.city && location?.state
                    ? `${location.city}, ${location.state}`
                    : location?.zip}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Confirm button */}
              <button
                type="button"
                onClick={() => actions.confirmBusiness()}
                style={{
                  width: "100%",
                  padding: "14px 24px",
                  borderRadius: 12,
                  border: "none",
                  background: T.accent,
                  color: "#000",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  boxShadow: "0 4px 16px rgba(62,207,142,0.25)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 24px rgba(62,207,142,0.35)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(62,207,142,0.25)";
                }}
              >
                {state.business.detectedIndustry ? (
                  <>
                    Confirm & Skip to Questionnaire
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </>
                ) : (
                  <>
                    Confirm & Select Industry
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </>
                )}
              </button>

              {/* Edit button */}
              <button
                type="button"
                onClick={() => {
                  setBusinessName("");
                  actions.setBusiness("");
                }}
                style={{
                  width: "100%",
                  padding: "11px 20px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "transparent",
                  color: T.textSub,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.20)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  e.currentTarget.style.color = T.textPrimary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)";
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = T.textSub;
                }}
              >
                Edit Business Name
              </button>
            </div>
          </div>
          {/* Close additional details section */}
        </div>
      ) : null}
    </div>
  );
}

export default Step1V8;
