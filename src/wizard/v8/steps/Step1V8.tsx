import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import IntelStripInline from "@/components/wizard/v7/shared/IntelStripInline";
import type { BusinessData, WizardActions, WizardState } from "../wizardState";

// CRITICAL: Google Maps API key from environment
// Fallback to hardcoded key if env var not available (Docker build issue)
const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyDppNx91-dadZiyNJBcqDhQn9H5mkDdruw";

// VERSION CHECK - This will immediately log when Step1V8 is loaded
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🚀 STEP1V8 LOADED - VERSION 1072");
console.log("📅 Build: March 11, 2026 - 16:30 UTC");
console.log("🔑 ENV VAR:", import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? "✅ Set" : "❌ Missing");
console.log("🔑 ACTUAL KEY:", GOOGLE_MAPS_API_KEY ? "✅ Using key" : "❌ No key");
console.log("🔑 KEY VALUE:", GOOGLE_MAPS_API_KEY?.substring(0, 20) + "...");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

const T = {
  accent: "#3ECF8E",
  accentSoft: "rgba(62,207,142,0.10)",
  accentBorder: "rgba(62,207,142,0.28)",
  textPrimary: "rgba(232,235,243,0.98)",
  textSecondary: "rgba(232,235,243,0.64)",
  textMuted: "rgba(232,235,243,0.42)",
  panel: "rgba(255,255,255,0.03)",
  panelBorder: "rgba(255,255,255,0.08)",
  input: "rgba(255,255,255,0.04)",
  warning: "rgba(251,191,36,0.10)",
  warningBorder: "rgba(251,191,36,0.24)",
};

type Country = "US" | "International";

type GooglePlacesLibrary = {
  Place?: new (options: { id: string }) => {
    fetchFields: (request: { fields: string[] }) => Promise<void>;
    id?: string;
    displayName?: string | { text?: string };
    formattedAddress?: string;
    editorialSummary?: string | { text?: string };
    websiteURI?: string;
    location?: { lat?: number | (() => number); lng?: number | (() => number) };
    photos?: Array<{
      getURI?: (opts?: { maxWidth?: number; maxHeight?: number }) => string;
      authorAttributions?: Array<{
        displayName?: string;
        uri?: string;
        photoURI?: string;
      }>;
    }>;
  };
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions: (request: Record<string, unknown>) => Promise<{
      suggestions?: Array<{
        placePrediction?: {
          placeId: string;
          text?: { text: string };
          mainText?: { text: string };
          secondaryText?: { text: string };
          toPlace: () => {
            fetchFields: (request: { fields: string[] }) => Promise<void>;
            id?: string;
            displayName?: string | { text?: string };
            formattedAddress?: string;
            editorialSummary?: string | { text?: string };
            websiteURI?: string;
            location?: { lat?: number | (() => number); lng?: number | (() => number) };
            photos?: Array<{
              getURI?: (opts?: { maxWidth?: number; maxHeight?: number }) => string;
              authorAttributions?: Array<{
                displayName?: string;
                uri?: string;
                photoURI?: string;
              }>;
            }>;
          };
        };
      }>;
    }>;
  };
  AutocompleteSessionToken: new () => unknown;
};

type BusinessSuggestion = {
  placeId: string;
  label: string;
  primaryText: string;
  secondaryText?: string;
  prediction: {
    toPlace: () => {
      fetchFields: (request: { fields: string[] }) => Promise<void>;
      id?: string;
      displayName?: string | { text?: string };
      formattedAddress?: string;
      editorialSummary?: string | { text?: string };
      websiteURI?: string;
      location?: { lat?: number | (() => number); lng?: number | (() => number) };
      photos?: Array<{
        getURI?: (opts?: { maxWidth?: number; maxHeight?: number }) => string;
        authorAttributions?: Array<{
          displayName?: string;
          uri?: string;
          photoURI?: string;
        }>;
      }>;
    };
  };
};

let googleMapsPromise: Promise<void> | null = null;

function loadGoogleMapsScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps unavailable during SSR"));
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(new Error("Missing VITE_GOOGLE_MAPS_API_KEY"));
  }

  if (typeof window.google?.maps?.importLibrary === "function") {
    return Promise.resolve();
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById("merlin-v8-google-maps");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "merlin-v8-google-maps";
    script.async = true;
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}` +
      "&libraries=places&loading=async&v=weekly";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

function getCoordinate(value?: number | (() => number)) {
  return typeof value === "function" ? value() : value;
}

function getPhotoPayload(place: {
  photos?: Array<{
    getURI?: (opts?: { maxWidth?: number; maxHeight?: number }) => string;
    authorAttributions?: Array<{
      displayName?: string;
      uri?: string;
      photoURI?: string;
    }>;
  }>;
}) {
  const photo = place.photos?.[0];
  const attribution = photo?.authorAttributions?.[0];

  // DETAILED DEBUG LOGGING v1069
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("[Step1V8] 🔍 PHOTO EXTRACTION v1069");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Place object:", place);
  console.log("Photos array:", place.photos);
  console.log("Photos array length:", place.photos?.length);
  console.log("First photo object:", photo);
  console.log("Photo has getURI method:", !!photo?.getURI);
  console.log("Photo getURI type:", typeof photo?.getURI);
  console.log("Attribution:", attribution);

  let photoUrl: string | undefined;

  try {
    photoUrl = photo?.getURI?.({ maxWidth: 480, maxHeight: 320 });
    console.log("✅ Photo URL extracted:", photoUrl);
  } catch (error) {
    console.error("❌ Error calling getURI:", error);
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  return {
    photoUrl,
    photoAttributionName: attribution?.displayName,
    photoAttributionUri: attribution?.uri,
  };
}

function titleCaseIndustry(industry: string) {
  return industry
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

type Step1Props = {
  state: WizardState;
  actions: WizardActions;
};

export function Step1V8({ state, actions }: Step1Props) {
  const zipRef = useRef<HTMLInputElement>(null);
  const placesLibraryRef = useRef<GooglePlacesLibrary | null>(null);
  const sessionTokenRef = useRef<unknown | null>(null);
  const suggestionRequestIdRef = useRef(0);

  const [country, setCountry] = useState<Country>("US");
  const [businessName, setBusinessName] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [businessError, setBusinessError] = useState<string | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [businessSuggestions, setBusinessSuggestions] = useState<BusinessSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<BusinessSuggestion | null>(null);
  const [previewBusiness, setPreviewBusiness] = useState<BusinessData | null>(null);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [isResolvingBusiness, setIsResolvingBusiness] = useState(false);

  const { intel, intelStatus, locationRaw, locationStatus, location, error, isBusy } = state;
  const locationConfirmed = location !== null;
  const normalizedZip =
    country === "US" ? locationRaw.replace(/\D/g, "").slice(0, 5) : locationRaw.trim();
  const isValidZip = country === "US" ? /^\d{5}$/.test(normalizedZip) : normalizedZip.length >= 3;
  const isLocationBusy = locationStatus === "fetching" || isBusy;
  const activeBusiness = state.business ?? previewBusiness;
  const showIntelStrip =
    isValidZip &&
    (intel !== null ||
      intelStatus.utility === "fetching" ||
      intelStatus.solar === "fetching" ||
      intelStatus.weather === "fetching");

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

  useEffect(() => {
    zipRef.current?.focus();
  }, []);

  const ensurePlacesLibrary = useCallback(async (): Promise<GooglePlacesLibrary | null> => {
    try {
      await loadGoogleMapsScript();
      if (!window.google?.maps?.importLibrary) return null;
      if (!placesLibraryRef.current) {
        placesLibraryRef.current = (await window.google.maps.importLibrary(
          "places"
        )) as unknown as GooglePlacesLibrary;
      }
      setGoogleError(null);
      return placesLibraryRef.current;
    } catch {
      setGoogleError("Google business search is temporarily unavailable.");
      return null;
    }
  }, []);

  const buildPreviewBusiness = useCallback(
    (overrides?: Partial<BusinessData>): BusinessData => ({
      name: businessName.trim(),
      address: streetAddress.trim() || undefined,
      description: overrides?.description || state.business?.description,
      photoAttributionName: overrides?.photoAttributionName || state.business?.photoAttributionName,
      photoAttributionUri: overrides?.photoAttributionUri || state.business?.photoAttributionUri,
      detectedIndustry: state.business?.detectedIndustry ?? null,
      confidence: state.business?.confidence ?? 0,
      placeId: overrides?.placeId,
      formattedAddress:
        overrides?.formattedAddress || streetAddress.trim() || location?.formattedAddress,
      photoUrl: overrides?.photoUrl,
      lat: overrides?.lat ?? location?.lat,
      lng: overrides?.lng ?? location?.lng,
      estimatedRoofSpaceSqFt: state.business?.estimatedRoofSpaceSqFt,
      website: overrides?.website || state.business?.website,
    }),
    [
      businessName,
      location?.formattedAddress,
      location?.lat,
      location?.lng,
      state.business,
      streetAddress,
    ]
  );

  const enrichSuggestion = useCallback(
    async (suggestion: BusinessSuggestion): Promise<Partial<BusinessData>> => {
      console.log("🔍 enrichSuggestion CALLED for:", suggestion.primaryText);

      const placesLibrary = await ensurePlacesLibrary();
      console.log("📚 Places library loaded:", !!placesLibrary);

      const fallbackAddress =
        suggestion.secondaryText ||
        suggestion.label ||
        streetAddress.trim() ||
        location?.formattedAddress;

      try {
        if (placesLibrary?.Place) {
          console.log("✅ Using placesLibrary.Place (NEW API)");
          const place = new placesLibrary.Place({ id: suggestion.placeId });
          console.log("📍 Place created, fetching fields...");

          await place.fetchFields({
            fields: [
              "displayName",
              "formattedAddress",
              "location",
              "photos",
              "id",
              "websiteURI",
              "editorialSummary",
            ],
          });

          console.log("📦 Place details fetched:", {
            hasPhotos: !!place.photos,
            photoCount: place.photos?.length,
          });

          return {
            placeId: place.id || suggestion.placeId,
            formattedAddress: place.formattedAddress || fallbackAddress,
            ...getPhotoPayload(place),
            website: place.websiteURI,
            description:
              typeof place.editorialSummary === "string"
                ? place.editorialSummary
                : place.editorialSummary?.text,
            lat: getCoordinate(place.location?.lat) ?? location?.lat,
            lng: getCoordinate(place.location?.lng) ?? location?.lng,
          };
        }

        console.log("⚠️ Fallback: Using prediction.toPlace() (OLD API)");
        const place = suggestion.prediction.toPlace();
        await place.fetchFields({
          fields: [
            "displayName",
            "formattedAddress",
            "location",
            "photos",
            "id",
            "websiteURI",
            "editorialSummary",
          ],
        });
        return {
          placeId: place.id || suggestion.placeId,
          formattedAddress: place.formattedAddress || fallbackAddress,
          ...getPhotoPayload(place),
          website: place.websiteURI,
          description:
            typeof place.editorialSummary === "string"
              ? place.editorialSummary
              : place.editorialSummary?.text,
          lat: getCoordinate(place.location?.lat) ?? location?.lat,
          lng: getCoordinate(place.location?.lng) ?? location?.lng,
        };
      } catch {
        return {
          placeId: suggestion.placeId,
          formattedAddress: fallbackAddress,
          lat: location?.lat,
          lng: location?.lng,
        };
      }
    },
    [ensurePlacesLibrary, location?.formattedAddress, location?.lat, location?.lng, streetAddress]
  );

  useEffect(() => {
    if (!locationConfirmed || !businessName.trim() || selectedSuggestion) {
      setBusinessSuggestions([]);
      setIsSuggestionsLoading(false);
      return;
    }

    const requestId = suggestionRequestIdRef.current + 1;
    suggestionRequestIdRef.current = requestId;

    const timer = globalThis.setTimeout(async () => {
      const placesLibrary = await ensurePlacesLibrary();
      if (!placesLibrary) return;

      if (!sessionTokenRef.current) {
        sessionTokenRef.current = new placesLibrary.AutocompleteSessionToken();
      }

      setIsSuggestionsLoading(true);

      try {
        const { suggestions = [] } =
          await placesLibrary.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: businessName.trim(),
            includedRegionCodes: country === "US" ? ["US"] : undefined,
            inputOffset: businessName.trim().length,
            sessionToken: sessionTokenRef.current,
          });

        if (suggestionRequestIdRef.current !== requestId) return;

        const validSuggestions = suggestions
          .map((item) => {
            const prediction = item.placePrediction;
            if (!prediction) return null;
            return {
              placeId: prediction.placeId,
              label: prediction.text?.text || prediction.mainText?.text || businessName.trim(),
              primaryText:
                prediction.mainText?.text || prediction.text?.text || businessName.trim(),
              secondaryText: prediction.secondaryText?.text,
              prediction,
            } as BusinessSuggestion;
          })
          .filter((item): item is BusinessSuggestion => item !== null)
          .slice(0, 5);

        setBusinessSuggestions(validSuggestions);
      } catch {
        if (suggestionRequestIdRef.current === requestId) {
          setBusinessSuggestions([]);
        }
      } finally {
        if (suggestionRequestIdRef.current === requestId) {
          setIsSuggestionsLoading(false);
        }
      }
    }, 250);

    return () => globalThis.clearTimeout(timer);
  }, [businessName, country, ensurePlacesLibrary, locationConfirmed, selectedSuggestion]);

  const handleZipChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    const value = country === "US" ? raw.replace(/\D/g, "").slice(0, 5) : raw;
    actions.setLocationRaw(value);
  };

  const handleLocationSubmit = () => {
    if (!isValidZip || isLocationBusy) return;
    void actions.submitLocation();
  };

  const resetBusinessFlow = () => {
    setBusinessName("");
    setStreetAddress("");
    setBusinessError(null);
    setGoogleError(null);
    setSelectedSuggestion(null);
    setPreviewBusiness(null);
    setBusinessSuggestions([]);
    sessionTokenRef.current = null;
    actions.setBusiness("");
  };

  const commitBusinessPreview = (business: BusinessData) => {
    setPreviewBusiness(business);
    actions.setBusiness(business.name, {
      address: business.address,
      website: business.website,
      description: business.description,
      photoAttributionName: business.photoAttributionName,
      photoAttributionUri: business.photoAttributionUri,
      placeId: business.placeId,
      formattedAddress: business.formattedAddress,
      photoUrl: business.photoUrl,
      lat: business.lat,
      lng: business.lng,
    });
  };

  const handleSuggestionSelect = async (suggestion: BusinessSuggestion) => {
    setBusinessError(null);
    setSelectedSuggestion(suggestion);
    setBusinessSuggestions([]);
    setIsResolvingBusiness(true);

    const preview = buildPreviewBusiness({
      placeId: suggestion.placeId,
      formattedAddress: suggestion.secondaryText || suggestion.label,
    });
    setBusinessName(suggestion.primaryText);
    commitBusinessPreview({
      ...preview,
      name: suggestion.primaryText || preview.name,
    });

    try {
      const details = await enrichSuggestion(suggestion);
      commitBusinessPreview({
        ...preview,
        name: suggestion.primaryText || preview.name,
        ...details,
      });
    } finally {
      setIsResolvingBusiness(false);
      sessionTokenRef.current = null;
    }
  };

  const resolveBusinessFromQuery = useCallback(async (): Promise<BusinessSuggestion | null> => {
    const placesLibrary = await ensurePlacesLibrary();
    if (!placesLibrary || !businessName.trim()) return null;

    const query = [businessName.trim(), streetAddress.trim(), location?.city, location?.state]
      .filter(Boolean)
      .join(", ");

    if (!query) return null;

    const sessionToken = new placesLibrary.AutocompleteSessionToken();

    try {
      const { suggestions = [] } =
        await placesLibrary.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: query,
          includedRegionCodes: country === "US" ? ["US"] : undefined,
          inputOffset: query.length,
          sessionToken,
        });

      const prediction = suggestions[0]?.placePrediction;
      if (!prediction) return null;

      return {
        placeId: prediction.placeId,
        label: prediction.text?.text || prediction.mainText?.text || query,
        primaryText: prediction.mainText?.text || prediction.text?.text || query,
        secondaryText: prediction.secondaryText?.text,
        prediction,
      };
    } catch {
      return null;
    }
  }, [businessName, country, ensurePlacesLibrary, location?.city, location?.state, streetAddress]);

  const handleBusinessContinue = async () => {
    if (!businessName.trim()) {
      setBusinessError("Enter your business name to continue.");
      return;
    }
    if (!locationConfirmed) {
      setBusinessError("Confirm your location first.");
      return;
    }

    setBusinessError(null);
    setIsResolvingBusiness(true);

    const preview = buildPreviewBusiness();
    commitBusinessPreview(preview);

    try {
      if (selectedSuggestion) {
        const details = await enrichSuggestion(selectedSuggestion);
        commitBusinessPreview({ ...preview, ...details });
      } else {
        const autoSuggestion = businessSuggestions[0] ?? (await resolveBusinessFromQuery());
        if (autoSuggestion) {
          await handleSuggestionSelect(autoSuggestion);
        }
        return;
      }
    } finally {
      setIsResolvingBusiness(false);
    }
  };

  const handleConfirmBusiness = () => {
    if (activeBusiness && !state.business) {
      actions.setBusiness(activeBusiness.name, {
        address: activeBusiness.address,
        website: activeBusiness.website,
        description: activeBusiness.description,
        photoAttributionName: activeBusiness.photoAttributionName,
        photoAttributionUri: activeBusiness.photoAttributionUri,
        placeId: activeBusiness.placeId,
        formattedAddress: activeBusiness.formattedAddress,
        photoUrl: activeBusiness.photoUrl,
        lat: activeBusiness.lat,
        lng: activeBusiness.lng,
      });
      globalThis.setTimeout(() => actions.confirmBusiness(), 0);
      return;
    }
    actions.confirmBusiness();
  };

  const businessSummaryLine = useMemo(() => {
    if (!activeBusiness) return null;
    return (
      activeBusiness.formattedAddress ||
      activeBusiness.address ||
      location?.formattedAddress ||
      null
    );
  }, [activeBusiness, location?.formattedAddress]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(28px,6vw,50px)",
            lineHeight: 1.05,
            letterSpacing: "-1.6px",
            color: T.textPrimary,
            fontWeight: 800,
            textTransform: "lowercase",
          }}
        >
          unlock your <span style={{ color: T.accent }}>energy savings</span>
        </h1>
        <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.6, color: T.textSecondary }}>
          Confirm your ZIP, then match your business so Merlin can route you into the right
          questionnaire immediately.
        </p>
      </div>

      {error && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            background: "rgba(239,68,68,0.10)",
            border: "1px solid rgba(239,68,68,0.26)",
            color: "#fca5a5",
            fontSize: 13,
          }}
        >
          {error.message}
        </div>
      )}

      <div
        style={{
          padding: 18,
          borderRadius: 14,
          background: T.panel,
          border: `1px solid ${T.panelBorder}`,
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {(["US", "International"] as Country[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setCountry(value)}
                style={{
                  height: 42,
                  padding: "0 14px",
                  borderRadius: 8,
                  border:
                    country === value
                      ? `1px solid ${T.accentBorder}`
                      : "1px solid rgba(255,255,255,0.08)",
                  background: country === value ? T.accentSoft : "rgba(255,255,255,0.03)",
                  color: country === value ? T.accent : T.textSecondary,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {value === "US" ? "US" : "Intl"}
              </button>
            ))}
          </div>

          {!locationConfirmed ? (
            <>
              <input
                ref={zipRef}
                type="text"
                inputMode={country === "US" ? "numeric" : "text"}
                value={locationRaw}
                onChange={handleZipChange}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleLocationSubmit();
                }}
                placeholder={country === "US" ? "ZIP code" : "Postal code"}
                style={{
                  flex: 1,
                  minWidth: 220,
                  height: 52,
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: T.input,
                  color: T.textPrimary,
                  padding: "0 14px",
                  fontSize: 18,
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={handleLocationSubmit}
                disabled={!isValidZip || isLocationBusy}
                style={{
                  height: 46,
                  padding: "0 18px",
                  borderRadius: 10,
                  border: `1px solid ${isValidZip ? T.accentBorder : "rgba(255,255,255,0.08)"}`,
                  background: isValidZip ? T.accentSoft : "rgba(255,255,255,0.03)",
                  color: isValidZip ? T.accent : T.textMuted,
                  fontWeight: 700,
                  cursor: isValidZip ? "pointer" : "not-allowed",
                }}
              >
                {isLocationBusy ? "Checking..." : "Confirm Location"}
              </button>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                minWidth: 240,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 10,
                background: T.accentSoft,
                border: `1px solid ${T.accentBorder}`,
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, textTransform: "uppercase" }}>
                  Location Confirmed
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.textPrimary }}>
                  {location.city && location.state
                    ? `${location.city}, ${location.state}`
                    : location.formattedAddress}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetBusinessFlow();
                  actions.clearLocation();
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  color: T.textSecondary,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Edit
              </button>
            </div>
          )}
        </div>
      </div>

      {showIntelStrip && <IntelStripInline intel={intelStripData} />}

      {locationConfirmed && !activeBusiness && (
        <div
          style={{
            padding: 18,
            borderRadius: 14,
            background: T.panel,
            border: `1px solid ${T.panelBorder}`,
            display: "grid",
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.textPrimary }}>
              Match your business
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: T.textSecondary }}>
              Merlin uses your business match to detect industry and skip Step 2 when possible.
            </div>
          </div>

          {googleError && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                background: T.warning,
                border: `1px solid ${T.warningBorder}`,
                color: "rgba(251,191,36,0.92)",
                fontSize: 12,
              }}
            >
              {googleError} You can still continue with a typed business name.
            </div>
          )}

          {businessError && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                background: "rgba(239,68,68,0.10)",
                border: "1px solid rgba(239,68,68,0.24)",
                color: "#fca5a5",
                fontSize: 12,
              }}
            >
              {businessError}
            </div>
          )}

          <div style={{ display: "grid", gap: 12 }}>
            <input
              type="text"
              value={businessName}
              onChange={(event) => {
                setBusinessName(event.target.value);
                setBusinessError(null);
                setSelectedSuggestion(null);
                setPreviewBusiness(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleBusinessContinue();
                }
              }}
              placeholder="Business name"
              autoComplete="off"
              style={{
                width: "100%",
                height: 46,
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.10)",
                background: T.input,
                color: T.textPrimary,
                padding: "0 14px",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
              }}
            />

            {businessSuggestions.length > 0 && !selectedSuggestion && (
              <div
                style={{
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(8,11,20,0.98)",
                  overflow: "hidden",
                }}
              >
                {businessSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.placeId}
                    type="button"
                    onClick={() => void handleSuggestionSelect(suggestion)}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      border: "none",
                      borderTop: index === 0 ? "none" : "1px solid rgba(255,255,255,0.06)",
                      background: "transparent",
                      color: T.textPrimary,
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{suggestion.primaryText}</div>
                    {suggestion.secondaryText && (
                      <div style={{ marginTop: 3, fontSize: 11, color: T.textSecondary }}>
                        {suggestion.secondaryText}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            <input
              type="text"
              value={streetAddress}
              onChange={(event) => {
                setStreetAddress(event.target.value);
                setBusinessError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleBusinessContinue();
                }
              }}
              placeholder="Street address (optional)"
              style={{
                width: "100%",
                height: 46,
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.10)",
                background: T.input,
                color: T.textPrimary,
                padding: "0 14px",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {businessName.trim() && !selectedSuggestion && (
              <div style={{ fontSize: 12, color: T.textSecondary }}>
                {isSuggestionsLoading
                  ? "Searching Google Places..."
                  : businessSuggestions.length > 0
                    ? "Select a Google match for the richest business card, or continue with your typed entry."
                    : "No Google match required. Merlin can continue with the typed business."}
              </div>
            )}

            <button
              type="button"
              onClick={() => void handleBusinessContinue()}
              disabled={!businessName.trim() || isResolvingBusiness}
              style={{
                width: "100%",
                height: 48,
                borderRadius: 12,
                border:
                  businessName.trim() && !isResolvingBusiness
                    ? `1px solid ${T.accentBorder}`
                    : "1px solid rgba(255,255,255,0.08)",
                background:
                  businessName.trim() && !isResolvingBusiness
                    ? T.accentSoft
                    : "rgba(255,255,255,0.03)",
                color: businessName.trim() && !isResolvingBusiness ? T.accent : T.textMuted,
                fontSize: 14,
                fontWeight: 800,
                cursor: businessName.trim() && !isResolvingBusiness ? "pointer" : "not-allowed",
              }}
            >
              {isResolvingBusiness
                ? "Building business card..."
                : "Continue to business confirmation"}
            </button>
          </div>
        </div>
      )}

      {locationConfirmed && activeBusiness && (
        <div
          style={{
            borderRadius: 16,
            background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
            border: "1px solid rgba(255,255,255,0.10)",
            overflow: "hidden",
            boxShadow: "0 8px 30px rgba(0,0,0,0.28)",
          }}
        >
          <div style={{ padding: 24, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              {activeBusiness.photoUrl ? (
                <div style={{ width: 96, flexShrink: 0 }}>
                  <img
                    src={activeBusiness.photoUrl}
                    alt={activeBusiness.name}
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: 14,
                      objectFit: "cover",
                      border: `1px solid ${T.accentBorder}`,
                      display: "block",
                    }}
                  />
                  {activeBusiness.photoAttributionName && (
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 10,
                        lineHeight: 1.3,
                        color: T.textMuted,
                      }}
                    >
                      Photo by{" "}
                      {activeBusiness.photoAttributionUri ? (
                        <a
                          href={activeBusiness.photoAttributionUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: T.textSecondary, textDecoration: "none" }}
                        >
                          {activeBusiness.photoAttributionName}
                        </a>
                      ) : (
                        activeBusiness.photoAttributionName
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 14,
                    background: T.accentSoft,
                    border: `1px solid ${T.accentBorder}`,
                    color: T.accent,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 28,
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {activeBusiness.name.charAt(0).toUpperCase()}
                </div>
              )}

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: T.textPrimary }}>
                  {activeBusiness.name}
                </div>
                {businessSummaryLine && (
                  <div
                    style={{ marginTop: 8, fontSize: 13, color: T.textSecondary, lineHeight: 1.5 }}
                  >
                    {businessSummaryLine}
                  </div>
                )}
                {activeBusiness.description && (
                  <div
                    style={{
                      marginTop: 10,
                      maxWidth: 560,
                      fontSize: 12,
                      lineHeight: 1.55,
                      color: T.textSecondary,
                    }}
                  >
                    {activeBusiness.description}
                  </div>
                )}
                {activeBusiness.detectedIndustry && (
                  <div
                    style={{
                      display: "inline-flex",
                      marginTop: 12,
                      padding: "6px 12px",
                      borderRadius: 999,
                      background: T.accentSoft,
                      border: `1px solid ${T.accentBorder}`,
                      color: T.accent,
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {titleCaseIndustry(activeBusiness.detectedIndustry)} detected
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ padding: 24, display: "grid", gap: 18 }}>
            {activeBusiness.lat && activeBusiness.lng && (
              <div
                style={{
                  overflow: "hidden",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <iframe
                  title={`${activeBusiness.name} map`}
                  src={`https://maps.google.com/maps?q=${activeBusiness.lat},${activeBusiness.lng}&z=15&output=embed`}
                  style={{ width: "100%", height: 220, border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
              }}
            >
              <div
                style={{
                  padding: 14,
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div style={{ fontSize: 10, textTransform: "uppercase", color: T.textMuted }}>
                  ZIP Location
                </div>
                <div style={{ marginTop: 4, fontSize: 14, fontWeight: 700, color: T.textPrimary }}>
                  {location.city && location.state
                    ? `${location.city}, ${location.state}`
                    : location.formattedAddress}
                </div>
              </div>

              <div
                style={{
                  padding: 14,
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div style={{ fontSize: 10, textTransform: "uppercase", color: T.textMuted }}>
                  Business Match
                </div>
                <div style={{ marginTop: 4, fontSize: 14, fontWeight: 700, color: T.textPrimary }}>
                  {activeBusiness.formattedAddress ||
                    activeBusiness.address ||
                    "Typed business entry"}
                </div>
              </div>

              {activeBusiness.website && (
                <div
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div style={{ fontSize: 10, textTransform: "uppercase", color: T.textMuted }}>
                    Website
                  </div>
                  <a
                    href={activeBusiness.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block",
                      marginTop: 4,
                      fontSize: 14,
                      fontWeight: 700,
                      color: T.accent,
                      textDecoration: "none",
                    }}
                  >
                    {activeBusiness.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <button
                type="button"
                onClick={handleConfirmBusiness}
                style={{
                  width: "100%",
                  height: 50,
                  borderRadius: 12,
                  border: "none",
                  background: T.accent,
                  color: "#03140b",
                  fontSize: 14,
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                {activeBusiness.detectedIndustry
                  ? "Confirm & Skip to Questionnaire"
                  : "Confirm & Select Industry"}
              </button>

              <button
                type="button"
                onClick={resetBusinessFlow}
                style={{
                  width: "100%",
                  height: 44,
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "transparent",
                  color: T.textSecondary,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Edit Business Name
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Step1V8;
