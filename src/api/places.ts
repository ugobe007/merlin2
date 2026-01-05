/**
 * Google Places API Proxy
 * =======================
 * Proxies requests to Google Places API to avoid CORS issues
 */

const GOOGLE_PLACES_API_KEY = 'AIzaSyB9VeakhIGZQgCKmTiZ3ml0RvnvlT0dNrY';

export async function lookupPlace(address: string) {
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(address)}&inputtype=textquery&fields=name,formatted_address,types,photos,place_id,geometry,business_status&key=${GOOGLE_PLACES_API_KEY}`;
  
  const response = await fetch(url);
  return response.json();
}
