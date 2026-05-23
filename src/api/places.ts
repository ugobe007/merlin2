/**
 * Google Places API Proxy
 * =======================
 * Proxies requests to Google Places API to avoid CORS issues
 */

const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

export async function lookupPlace(address: string) {
  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error("Missing VITE_GOOGLE_MAPS_API_KEY");
  }

  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(address)}&inputtype=textquery&fields=name,formatted_address,types,photos,place_id,geometry,business_status&key=${GOOGLE_PLACES_API_KEY}`;

  const response = await fetch(url);
  return response.json();
}
