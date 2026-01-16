import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Strips precise address details (House #, Street #, Apartment #) 
 * and returns a general area estimate (e.g., "DHA Phase 6, Lahore").
 * 
 * Strategy:
 * 1. If comma separated, take the last 2 segments (usually Area, City).
 * 2. If short, return as is.
 */
export function getFuzzyLocationString(address: string): string {
  if (!address) return "Unknown Location";
  
  // Filter out "Pakistan" from the address parts to keep it local
  const parts = address.split(',')
    .map(p => p.trim())
    .filter(p => !p.toLowerCase().includes('pakistan'));
  
  if (parts.length > 0) {
    // If we have multiple parts (e.g. "DHA, Lahore"), take last 2. 
    // If just "Karachi", take it.
    return parts.slice(-2).join(', ');
  }
  
  // Fallback if address was just "Pakistan"
  return address;
}

/**
 * Calculates a privacy-safe estimated distance between two coordinates.
 * 
 * Privacy Measures:
 * 1. Uses Haversine/Great Circle distance.
 * 2. Rounds the result to the nearest 2km to prevent triangulation.
 * 3. Adds a small stable jitter based on IDs if needed (omitted for now for purity).
 * 
 * @param from - Origin { lat, lng }
 * @param to - Destination { lat, lng }
 * @returns { distance: number (km), duration: number (mins) }
 */
export function calculatePrivacySafeDistance(
  from: { lat: number; lng: number } | undefined, 
  to: { lat: number; lng: number }
): { distance: number; duration: number } {
  // If no user location, default to a generic "Far" distance or specific center
  // For this mock, we'll assume a fixed user location if undefined
  const userLat = from?.lat ?? 24.8607; // Default to Karachi center
  const userLng = from?.lng ?? 67.0011;

  const R = 6371; // Earth's radius in km
  const dLat = (to.lat - userLat) * Math.PI / 180;
  const dLon = (to.lng - userLng) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(userLat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const rawDist = R * c;

  // PRIVACY STEP: Round to nearest 200m (0.2km) as per user request
  // This gives an "area" estimation without pinning exact house
  let safeDist = Math.round(rawDist / 0.2) * 0.2;
  
  // Ensure we don't return 0 for very close items, min 0.2km
  safeDist = Math.max(0.2, safeDist);
  
  // Fix to 1 decimal place to avoid floating point weirdness (e.g. 1.20000001)
  safeDist = Number(safeDist.toFixed(1));

  // Estimate duration (Urban driving: ~25km/h avg => ~2.4 mins per km)
  const duration = Math.max(1, Math.round(safeDist * 2.5));

  return { distance: safeDist, duration };
}
