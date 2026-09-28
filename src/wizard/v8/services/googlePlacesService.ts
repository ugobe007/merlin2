// Google Maps API key — must be set via VITE_GOOGLE_MAPS_API_KEY env var
// Never hardcode API keys: use .env (local) or Fly.io secrets (production)
const GOOGLE_MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ?? "";

export type GooglePlacesLibrary = {
  Place?: new (options: { id: string }) => GooglePlace;
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions: (request: Record<string, unknown>) => Promise<{
      suggestions?: Array<{
        placePrediction?: GooglePlacePrediction;
      }>;
    }>;
  };
  AutocompleteSessionToken: new () => unknown;
};

export type GooglePlace = {
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

export type GooglePlacePrediction = {
  placeId: string;
  text?: { text: string };
  mainText?: { text: string };
  secondaryText?: { text: string };
  toPlace: () => GooglePlace;
};

export type BusinessSuggestion = {
  placeId: string;
  label: string;
  primaryText: string;
  secondaryText?: string;
  prediction: GooglePlacePrediction;
};

export type PlaceDetails = {
  placeId?: string;
  formattedAddress?: string;
  photoUrl?: string;
  photoAttributionName?: string;
  photoAttributionUri?: string;
  website?: string;
  description?: string;
  lat?: number;
  lng?: number;
};

let googleMapsPromise: Promise<void> | null = null;
let placesLibraryPromise: Promise<GooglePlacesLibrary | null> | null = null;

function hasGoogleMapsImportLibrary() {
  return typeof window.google?.maps?.importLibrary === "function";
}

function waitForGoogleMapsImportLibrary(timeoutMs = 5000): Promise<void> {
  if (hasGoogleMapsImportLibrary()) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const startedAt = Date.now();

    const checkImportLibrary = () => {
      if (hasGoogleMapsImportLibrary()) {
        resolve();
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        reject(new Error("Google Maps importLibrary unavailable after script load"));
        return;
      }

      window.setTimeout(checkImportLibrary, 50);
    };

    checkImportLibrary();
  });
}

export function loadGoogleMapsScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps unavailable during SSR"));
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(new Error("Missing VITE_GOOGLE_MAPS_API_KEY"));
  }

  if (hasGoogleMapsImportLibrary()) {
    return Promise.resolve();
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    (window as Window & { gm_authFailure?: () => void }).gm_authFailure = () => {
      console.error(
        "❌ Google Maps auth failure — key invalid, API target blocked, or domain not whitelisted"
      );
      googleMapsPromise = null;
      placesLibraryPromise = null;
      reject(new Error("Google Maps API key rejected (auth failure)"));
    };

    const existing = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existing) {
      if (hasGoogleMapsImportLibrary()) {
        resolve();
      } else {
        existing.addEventListener(
          "load",
          () => void waitForGoogleMapsImportLibrary().then(resolve, reject),
          {
            once: true,
          }
        );
        existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps")), {
          once: true,
        });
      }
      return;
    }

    const script = document.createElement("script");
    script.id = "merlin-v8-google-maps";
    script.async = true;
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}` +
      "&libraries=places&loading=async&v=weekly";
    script.onload = () => void waitForGoogleMapsImportLibrary().then(resolve, reject);
    script.onerror = () => reject(new Error("Failed to load Google Maps script (network error)"));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

export async function importGooglePlacesLibrary(): Promise<GooglePlacesLibrary | null> {
  if (placesLibraryPromise) return placesLibraryPromise;

  placesLibraryPromise = loadGoogleMapsScript()
    .then(async () => {
      if (!hasGoogleMapsImportLibrary()) {
        placesLibraryPromise = null;
        return null;
      }

      return (await window.google.maps.importLibrary("places")) as unknown as GooglePlacesLibrary;
    })
    .catch((error) => {
      placesLibraryPromise = null;
      throw error;
    });

  return placesLibraryPromise;
}

export function getCoordinate(value?: number | (() => number)) {
  return typeof value === "function" ? value() : value;
}

export function getPhotoPayload(place: Pick<GooglePlace, "photos">) {
  const photo = place.photos?.[0];
  const attribution = photo?.authorAttributions?.[0];

  let photoUrl: string | undefined;

  try {
    photoUrl = photo?.getURI?.({ maxWidth: 480, maxHeight: 320 });
  } catch {
    // photo URI unavailable
  }

  return {
    photoUrl,
    photoAttributionName: attribution?.displayName,
    photoAttributionUri: attribution?.uri,
  };
}

const TARGET_BUSINESS_DATABASE = [
  {
    name: "WOW Carwash — Spring Mountain",
    address: "3570 Spring Mountain Rd, Las Vegas, NV 89102",
    lat: 36.1265,
    lng: -115.1872,
    placeId: "wow-cw-spring-mountain",
    industry: "car_wash",
  },
  {
    name: "WOW Carwash — Charleston",
    address: "4550 E Charleston Blvd, Las Vegas, NV 89104",
    lat: 36.1589,
    lng: -115.0762,
    placeId: "wow-cw-charleston",
    industry: "car_wash",
  },
  {
    name: "WOW Carwash — Eastern",
    address: "6480 S Eastern Ave, Las Vegas, NV 89119",
    lat: 36.0712,
    lng: -115.1189,
    placeId: "wow-cw-eastern",
    industry: "car_wash",
  },
  {
    name: "WOW Carwash — Craig",
    address: "1120 W Craig Rd, North Las Vegas, NV 89032",
    lat: 36.2394,
    lng: -115.1581,
    placeId: "wow-cw-craig",
    industry: "car_wash",
  },
  {
    name: "Terrible Herbst Travel Center — Jean",
    address: "1 Terrible Trail, Jean, NV 89019",
    lat: 35.7794,
    lng: -115.3281,
    placeId: "terrible-herbst-jean",
    industry: "truck_stop",
  },
  {
    name: "Terrible Herbst Car Wash & Fuel — Rainbow",
    address: "7390 S Rainbow Blvd, Las Vegas, NV 89113",
    lat: 36.0545,
    lng: -115.2435,
    placeId: "terrible-herbst-rainbow",
    industry: "car_wash",
  },
  {
    name: "Dash Car Wash — Henderson",
    address: "1550 W Horizon Ridge Pkwy, Henderson, NV 89012",
    lat: 36.0125,
    lng: -115.0345,
    placeId: "dash-carwash-henderson",
    industry: "car_wash",
  },
  {
    name: "El Car Wash — Sawgrass",
    address: "12500 West Sunrise Blvd, Sunrise, FL 33323",
    lat: 26.1545,
    lng: -80.3235,
    placeId: "el-carwash-sawgrass",
    industry: "car_wash",
  },
];

export async function fetchBusinessSuggestions({
  input,
  countryCode = "US",
  sessionToken,
  limit = 5,
  lat,
  lng,
  city,
  _state,
  zip,
}: {
  input: string;
  countryCode?: string;
  sessionToken?: unknown;
  limit?: number;
  lat?: number;
  lng?: number;
  city?: string;
  _state?: string;
  zip?: string;
}): Promise<BusinessSuggestion[]> {
  if (!input.trim()) return [];

  // Try New Places JS API
  try {
    const placesLibrary = await importGooglePlacesLibrary();
    if (placesLibrary?.AutocompleteSuggestion) {
      const requestOptions: Record<string, unknown> = {
        input: input.trim(),
        includedRegionCodes: countryCode ? [countryCode] : undefined,
        sessionToken,
      };

      if (typeof lat === "number" && typeof lng === "number") {
        requestOptions.locationBias = {
          center: { lat, lng },
          radius: 50000,
        };
        requestOptions.origin = { lat, lng };
      }

      const { suggestions = [] } =
        await placesLibrary.AutocompleteSuggestion.fetchAutocompleteSuggestions(requestOptions);

      if (suggestions.length > 0) {
        const results: BusinessSuggestion[] = [];
        for (const item of suggestions) {
          const prediction = item.placePrediction;
          if (prediction) {
            results.push({
              placeId: prediction.placeId,
              label: prediction.text?.text || prediction.mainText?.text || input.trim(),
              primaryText: prediction.mainText?.text || prediction.text?.text || input.trim(),
              secondaryText: prediction.secondaryText?.text,
              prediction,
            });
          }
        }
        if (results.length > 0) return results.slice(0, limit);
      }
    }
  } catch (err) {
    console.warn("[googlePlacesService] AutocompleteSuggestion API notice:", err);
  }

  interface ClassicPrediction {
    place_id: string;
    description: string;
    structured_formatting?: {
      main_text?: string;
      secondary_text?: string;
    };
  }

  interface ClassicAutocompleteService {
    getPlacePredictions: (
      request: {
        input: string;
        componentRestrictions?: { country: string };
        location?: unknown;
        radius?: number;
      },
      callback: (results: ClassicPrediction[] | null, status: string) => void
    ) => void;
  }

  // Fallback 1: Classic google.maps.places.AutocompleteService
  const win =
    typeof window !== "undefined"
      ? (window as unknown as {
          google?: {
            maps?: {
              LatLng?: new (lat: number, lng: number) => unknown;
              places?: {
                AutocompleteService?: new () => ClassicAutocompleteService;
              };
            };
          };
        })
      : undefined;

  if (win?.google?.maps?.places?.AutocompleteService) {
    try {
      const ServiceClass = win.google.maps.places.AutocompleteService;
      const service = new ServiceClass();
      const requestPayload: {
        input: string;
        componentRestrictions?: { country: string };
        location?: unknown;
        radius?: number;
      } = {
        input: input.trim(),
        componentRestrictions: countryCode ? { country: countryCode } : undefined,
      };

      if (typeof lat === "number" && typeof lng === "number" && win.google?.maps?.LatLng) {
        requestPayload.location = new win.google.maps.LatLng(lat, lng);
        requestPayload.radius = 50000;
      }

      const predictions = await new Promise<ClassicPrediction[]>((resolve) => {
        service.getPlacePredictions(requestPayload, (results, status) => {
          if (status === "OK" && results) {
            resolve(results);
          } else {
            resolve([]);
          }
        });
      });

      if (predictions.length > 0) {
        return predictions.slice(0, limit).map((p) => ({
          placeId: p.place_id,
          label: p.description,
          primaryText: p.structured_formatting?.main_text || p.description.split(",")[0],
          secondaryText: p.structured_formatting?.secondary_text || p.description,
          prediction: {
            placeId: p.place_id,
            text: { text: p.description },
            mainText: { text: p.structured_formatting?.main_text || p.description },
            secondaryText: p.structured_formatting?.secondary_text
              ? { text: p.structured_formatting.secondary_text }
              : undefined,
            toPlace: () => ({ fetchFields: async () => {}, id: p.place_id }) as GooglePlace,
          },
        }));
      }
    } catch (err) {
      console.warn("[googlePlacesService] Classic AutocompleteService fallback notice:", err);
    }
  }

  // Fallback 2: Target business database lookup (matches query or zip/city/state context)
  const q = input.trim().toLowerCase();
  const matched = TARGET_BUSINESS_DATABASE.filter(
    (b) =>
      b.name.toLowerCase().includes(q) ||
      b.address.toLowerCase().includes(q) ||
      (zip && b.address.includes(zip)) ||
      (city && b.address.toLowerCase().includes(city.toLowerCase()))
  );

  return matched.slice(0, limit).map((b) => ({
    placeId: b.placeId,
    label: `${b.name}, ${b.address}`,
    primaryText: b.name,
    secondaryText: b.address,
    prediction: {
      placeId: b.placeId,
      text: { text: `${b.name}, ${b.address}` },
      mainText: { text: b.name },
      secondaryText: { text: b.address },
      toPlace: () => ({ fetchFields: async () => {}, id: b.placeId }) as GooglePlace,
    },
  }));
}

export async function enrichBusinessSuggestion({
  suggestion,
  fallbackAddress,
  fallbackLat,
  fallbackLng,
}: {
  suggestion: BusinessSuggestion;
  fallbackAddress?: string;
  fallbackLat?: number;
  fallbackLng?: number;
}): Promise<PlaceDetails> {
  // Check target business database first
  const matchedTarget = TARGET_BUSINESS_DATABASE.find((t) => t.placeId === suggestion.placeId);
  if (matchedTarget) {
    return {
      placeId: matchedTarget.placeId,
      formattedAddress: matchedTarget.address,
      lat: matchedTarget.lat,
      lng: matchedTarget.lng,
    };
  }
  const placesLibrary = await importGooglePlacesLibrary();
  const fallback = fallbackAddress || suggestion.secondaryText || suggestion.label;

  try {
    if (placesLibrary?.Place) {
      const place = new placesLibrary.Place({ id: suggestion.placeId });

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
        formattedAddress: place.formattedAddress || fallback,
        ...getPhotoPayload(place),
        website: place.websiteURI,
        description:
          typeof place.editorialSummary === "string"
            ? place.editorialSummary
            : place.editorialSummary?.text,
        lat: getCoordinate(place.location?.lat) ?? fallbackLat,
        lng: getCoordinate(place.location?.lng) ?? fallbackLng,
      };
    }

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
      formattedAddress: place.formattedAddress || fallback,
      ...getPhotoPayload(place),
      website: place.websiteURI,
      description:
        typeof place.editorialSummary === "string"
          ? place.editorialSummary
          : place.editorialSummary?.text,
      lat: getCoordinate(place.location?.lat) ?? fallbackLat,
      lng: getCoordinate(place.location?.lng) ?? fallbackLng,
    };
  } catch (error) {
    console.error("❌ Error enriching suggestion:", error);
    return {
      placeId: suggestion.placeId,
      formattedAddress: fallback,
      lat: fallbackLat,
      lng: fallbackLng,
    };
  }
}
