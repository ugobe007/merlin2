/**
 * Geocoding Service
 * 
 * Uses Google Maps Geocoding API to convert addresses and ZIP codes
 * to precise coordinates for weather and location services.
 * 
 * Created: Jan 17, 2026
 */

const GOOGLE_MAPS_API_KEY = 'AIzaSyB9VeakhIGZQgCKmTiZ3ml0RvnvlT0dNrY';

export interface GeocodeResult {
  lat: number;
  lon: number;
  formattedAddress: string;
  city?: string;
  state?: string;
  stateCode?: string;
  zipCode?: string;
  country?: string;
}

interface GoogleGeocodeResponse {
  results: Array<{
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  }>;
  status: string;
}

/**
 * Geocode a ZIP code or address to get precise coordinates
 */
export async function geocodeLocation(query: string): Promise<GeocodeResult | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.warn('Google Geocoding API error:', response.status);
      return null;
    }

    const data: GoogleGeocodeResponse = await response.json();
    
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.warn('Google Geocoding returned no results:', data.status);
      return null;
    }

    const result = data.results[0];
    const components = result.address_components;

    // Extract address components
    const city = components.find(c => c.types.includes('locality'))?.long_name;
    const state = components.find(c => c.types.includes('administrative_area_level_1'))?.long_name;
    const stateCode = components.find(c => c.types.includes('administrative_area_level_1'))?.short_name;
    const zipCode = components.find(c => c.types.includes('postal_code'))?.long_name;
    const country = components.find(c => c.types.includes('country'))?.long_name;

    return {
      lat: result.geometry.location.lat,
      lon: result.geometry.location.lng,
      formattedAddress: result.formatted_address,
      city,
      state,
      stateCode,
      zipCode,
      country,
    };
  } catch (error) {
    console.error('Geocoding fetch error:', error);
    return null;
  }
}

/**
 * Reverse geocode coordinates to get address details
 */
export async function reverseGeocode(lat: number, lon: number): Promise<GeocodeResult | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.warn('Google Reverse Geocoding API error:', response.status);
      return null;
    }

    const data: GoogleGeocodeResponse = await response.json();
    
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.warn('Google Reverse Geocoding returned no results:', data.status);
      return null;
    }

    const result = data.results[0];
    const components = result.address_components;

    const city = components.find(c => c.types.includes('locality'))?.long_name;
    const state = components.find(c => c.types.includes('administrative_area_level_1'))?.long_name;
    const stateCode = components.find(c => c.types.includes('administrative_area_level_1'))?.short_name;
    const zipCode = components.find(c => c.types.includes('postal_code'))?.long_name;
    const country = components.find(c => c.types.includes('country'))?.long_name;

    return {
      lat,
      lon,
      formattedAddress: result.formatted_address,
      city,
      state,
      stateCode,
      zipCode,
      country,
    };
  } catch (error) {
    console.error('Reverse geocoding fetch error:', error);
    return null;
  }
}

/**
 * Get coordinates for a ZIP code (convenience wrapper)
 */
export async function getCoordinatesFromZip(zipCode: string): Promise<{ lat: number; lon: number } | null> {
  const result = await geocodeLocation(zipCode);
  if (result) {
    return { lat: result.lat, lon: result.lon };
  }
  return null;
}
