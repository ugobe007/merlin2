/// <reference types="google.maps" />
/**
 * GOOGLE PLACES API SERVICE
 * =========================
 * Uses Google Maps JavaScript API for client-side place lookups
 * 
 * NOTE: The API key must have Maps JavaScript API and Places API enabled
 */

export const GOOGLE_MAPS_API_KEY = 'AIzaSyB9VeakhIGZQgCKmTiZ3ml0RvnvlT0dNrY';

export interface PlaceLookupResult {
  found: boolean;
  businessName?: string;
  businessType?: string;
  formattedAddress?: string;
  photoUrl?: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  industrySlug?: string;
}

// Map Google Place types to our industry slugs
const PLACE_TYPE_TO_INDUSTRY: Record<string, string> = {
  'lodging': 'hotel',
  'hotel': 'hotel',
  'motel': 'hotel',
  'resort_hotel': 'hotel',
  'extended_stay_hotel': 'hotel',
  'bed_and_breakfast': 'hotel',
  
  'car_wash': 'car-wash',
  
  'electric_vehicle_charging_station': 'ev-charging',
  
  'store': 'retail',
  'shopping_mall': 'shopping-center',
  'department_store': 'retail',
  'supermarket': 'retail',
  'grocery_or_supermarket': 'retail',
  'convenience_store': 'retail',
  
  'restaurant': 'retail',
  'cafe': 'retail',
  'bar': 'retail',
  'food': 'retail',
  
  'office': 'office',
  'accounting': 'office',
  'lawyer': 'office',
  'insurance_agency': 'office',
  
  'factory': 'manufacturing',
  'warehouse': 'warehouse',
  'storage': 'cold-storage',
  'moving_company': 'warehouse',
  
  'hospital': 'hospital',
  'doctor': 'hospital',
  'health': 'hospital',
  'pharmacy': 'hospital',
  
  'university': 'college',
  'school': 'college',
  'secondary_school': 'college',
  'primary_school': 'college',
  
  'local_government_office': 'government',
  'city_hall': 'government',
  'courthouse': 'government',
  'post_office': 'government',
  
  'gas_station': 'gas-station',
  
  'casino': 'casino',
  
  'airport': 'airport',
  
  'apartment': 'apartment',
  'real_estate_agency': 'apartment',
};

// Industry display names
export const INDUSTRY_NAMES: Record<string, string> = {
  'hotel': 'Hotel',
  'car-wash': 'Car Wash',
  'ev-charging': 'EV Charging Station',
  'retail': 'Retail',
  'shopping-center': 'Shopping Center',
  'office': 'Office Building',
  'manufacturing': 'Manufacturing Facility',
  'warehouse': 'Warehouse',
  'cold-storage': 'Cold Storage',
  'hospital': 'Hospital',
  'college': 'College/University',
  'government': 'Government Building',
  'gas-station': 'Gas Station',
  'casino': 'Casino',
  'airport': 'Airport',
  'apartment': 'Apartment Complex',
  'data-center': 'Data Center',
};

let googleMapsLoaded = false;
let googleMapsLoadPromise: Promise<void> | null = null;

/**
 * Load Google Maps JavaScript API
 */
export function loadGoogleMapsAPI(): Promise<void> {
  if (googleMapsLoaded) {
    return Promise.resolve();
  }
  
  if (googleMapsLoadPromise) {
    return googleMapsLoadPromise;
  }
  
  googleMapsLoadPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google && window.google.maps) {
      googleMapsLoaded = true;
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      googleMapsLoaded = true;
      resolve();
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load Google Maps API'));
    };
    
    document.head.appendChild(script);
  });
  
  return googleMapsLoadPromise;
}

/**
 * Look up a business by address using Google Places API
 * Tries multiple strategies to find the actual business name
 */
export async function lookupBusinessByAddress(address: string): Promise<PlaceLookupResult> {
  try {
    await loadGoogleMapsAPI();
    
    return new Promise((resolve) => {
      const service = new google.maps.places.PlacesService(
        document.createElement('div')
      );
      
      // First, try to find the place
      const request: google.maps.places.FindPlaceFromQueryRequest = {
        query: address,
        fields: ['name', 'formatted_address', 'types', 'photos', 'place_id', 'geometry', 'business_status'],
      };
      
      service.findPlaceFromQuery(request, (
        results: google.maps.places.PlaceResult[] | null,
        status: google.maps.places.PlacesServiceStatus
      ) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
          const place = results[0];
          
          // If we got a place_id, try to get more details
          if (place.place_id) {
            const detailsRequest: google.maps.places.PlaceDetailsRequest = {
              placeId: place.place_id,
              fields: ['name', 'formatted_address', 'types', 'photos', 'geometry', 'business_status', 'website', 'formatted_phone_number']
            };
            
            service.getDetails(detailsRequest, (
              detailedPlace: google.maps.places.PlaceResult | null,
              detailsStatus: google.maps.places.PlacesServiceStatus
            ) => {
              const finalPlace = detailsStatus === google.maps.places.PlacesServiceStatus.OK && detailedPlace 
                ? detailedPlace 
                : place;
              
              // Find matching industry from place types
              let industrySlug: string | undefined;
              if (finalPlace.types) {
                for (const type of finalPlace.types) {
                  if (PLACE_TYPE_TO_INDUSTRY[type]) {
                    industrySlug = PLACE_TYPE_TO_INDUSTRY[type];
                    break;
                  }
                }
              }
              
              // Get photo URL if available
              let photoUrl: string | undefined;
              if (finalPlace.photos && finalPlace.photos.length > 0) {
                photoUrl = finalPlace.photos[0].getUrl({ maxWidth: 400, maxHeight: 300 });
              }
              
              // Check if the name looks like an address (starts with a number)
              const nameIsAddress = finalPlace.name && /^\d+\s/.test(finalPlace.name);
              
              if (nameIsAddress && finalPlace.geometry?.location) {
                // Try a nearby search to find actual businesses at this location
                const nearbyRequest: google.maps.places.PlaceSearchRequest = {
                  location: finalPlace.geometry.location,
                  radius: 50, // 50 meters
                  type: 'establishment'
                };
                
                service.nearbySearch(nearbyRequest, (
                  nearbyResults: google.maps.places.PlaceResult[] | null,
                  nearbyStatus: google.maps.places.PlacesServiceStatus
                ) => {
                  if (nearbyStatus === google.maps.places.PlacesServiceStatus.OK && nearbyResults && nearbyResults.length > 0) {
                    // Find the first result that's not just an address
                    const actualBusiness = nearbyResults.find(r => r.name && !/^\d+\s/.test(r.name));
                    
                    if (actualBusiness) {
                      // Found a real business name!
                      let nearbyIndustrySlug: string | undefined;
                      if (actualBusiness.types) {
                        for (const type of actualBusiness.types) {
                          if (PLACE_TYPE_TO_INDUSTRY[type]) {
                            nearbyIndustrySlug = PLACE_TYPE_TO_INDUSTRY[type];
                            break;
                          }
                        }
                      }
                      
                      let nearbyPhotoUrl: string | undefined;
                      if (actualBusiness.photos && actualBusiness.photos.length > 0) {
                        nearbyPhotoUrl = actualBusiness.photos[0].getUrl({ maxWidth: 400, maxHeight: 300 });
                      }
                      
                      resolve({
                        found: true,
                        businessName: actualBusiness.name,
                        businessType: actualBusiness.types?.[0],
                        formattedAddress: actualBusiness.vicinity || finalPlace.formatted_address,
                        photoUrl: nearbyPhotoUrl || photoUrl,
                        placeId: actualBusiness.place_id || place.place_id,
                        lat: actualBusiness.geometry?.location?.lat() || finalPlace.geometry?.location?.lat(),
                        lng: actualBusiness.geometry?.location?.lng() || finalPlace.geometry?.location?.lng(),
                        industrySlug: nearbyIndustrySlug || industrySlug,
                      });
                      return;
                    }
                  }
                  
                  // No better result found, use original
                  resolve({
                    found: true,
                    businessName: finalPlace.name,
                    businessType: finalPlace.types?.[0],
                    formattedAddress: finalPlace.formatted_address,
                    photoUrl,
                    placeId: place.place_id,
                    lat: finalPlace.geometry?.location?.lat(),
                    lng: finalPlace.geometry?.location?.lng(),
                    industrySlug,
                  });
                });
              } else {
                // Name doesn't look like an address, use it
                resolve({
                  found: true,
                  businessName: finalPlace.name,
                  businessType: finalPlace.types?.[0],
                  formattedAddress: finalPlace.formatted_address,
                  photoUrl,
                  placeId: place.place_id,
                  lat: finalPlace.geometry?.location?.lat(),
                  lng: finalPlace.geometry?.location?.lng(),
                  industrySlug,
                });
              }
            });
          } else {
            // No place_id, use the initial result
            let industrySlug: string | undefined;
            if (place.types) {
              for (const type of place.types) {
                if (PLACE_TYPE_TO_INDUSTRY[type]) {
                  industrySlug = PLACE_TYPE_TO_INDUSTRY[type];
                  break;
                }
              }
            }
            
            let photoUrl: string | undefined;
            if (place.photos && place.photos.length > 0) {
              photoUrl = place.photos[0].getUrl({ maxWidth: 400, maxHeight: 300 });
            }
            
            resolve({
              found: true,
              businessName: place.name,
              businessType: place.types?.[0],
              formattedAddress: place.formatted_address,
              photoUrl,
              placeId: place.place_id,
              lat: place.geometry?.location?.lat(),
              lng: place.geometry?.location?.lng(),
              industrySlug,
            });
          }
        } else {
          resolve({ found: false });
        }
      });
    });
  } catch (error) {
    console.error('Error looking up business:', error);
    return { found: false };
  }
}

/**
 * Get a static map image URL for a location
 */
export function getStaticMapUrl(lat: number, lng: number, zoom: number = 16): string {
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=400x200&scale=2&maptype=roadmap&markers=color:0x8B5CF6%7C${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
}

/**
 * Get the Google Maps embed URL for a place
 */
export function getMapEmbedUrl(placeId: string): string {
  return `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=place_id:${placeId}`;
}

// TypeScript declarations for Google Maps
declare global {
  interface Window {
    google: typeof google;
  }
}
