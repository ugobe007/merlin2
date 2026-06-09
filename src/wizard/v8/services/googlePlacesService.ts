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

export async function fetchBusinessSuggestions({
  input,
  countryCode = "US",
  sessionToken,
  limit = 5,
}: {
  input: string;
  countryCode?: string;
  sessionToken?: unknown;
  limit?: number;
}): Promise<BusinessSuggestion[]> {
  const placesLibrary = await importGooglePlacesLibrary();
  if (!placesLibrary || !input.trim()) return [];

  const { suggestions = [] } =
    await placesLibrary.AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input: input.trim(),
      includedRegionCodes: countryCode ? [countryCode] : undefined,
      sessionToken,
    });

  return suggestions
    .map((item) => {
      const prediction = item.placePrediction;
      if (!prediction) return null;

      const suggestion: BusinessSuggestion = {
        placeId: prediction.placeId,
        label: prediction.text?.text || prediction.mainText?.text || input.trim(),
        primaryText: prediction.mainText?.text || prediction.text?.text || input.trim(),
        secondaryText: prediction.secondaryText?.text,
        prediction,
      };

      return suggestion;
    })
    .filter((item): item is BusinessSuggestion => item !== null)
    .slice(0, limit);
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
