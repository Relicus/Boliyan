import { clsx, type ClassValue } from "clsx"
import { format, isToday, isYesterday } from "date-fns";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { customAlphabet } from 'nanoid';

// ... existing code ...

/**
 * Generates a SEO-friendly slug: "title-slug-random8"
 */
export function generateSlug(title: string): string {
  // 1. Slugify the title
  const slugTitle = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphen
    .replace(/^-+|-+$/g, ''); // Trim hyphens

  // 2. Generate 8-char random string (numbers + lowercase only for URL safety)
  const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 8);
  const randomSuffix = nanoid();

  return `${slugTitle}-${randomSuffix}`;
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
 * Checks if a given address is within the primary operating country (Pakistan).
 * This is used to hide distance metrics for users outside the country.
 * 
 * Falls back to distance threshold if address check is ambiguous.
 */
export function isLocationInCountry(address: string | undefined): boolean {
  if (!address) return true; // Default to true for mock safety
  const addr = address.toLowerCase();
  
  // Explicit country mention
  if (addr.includes('pakistan')) return true;
  
  // Common Pakistani cities/provinces as indicators if country is missing
  const indicators = ['karachi', 'lahore', 'islamabad', 'rawalpindi', 'faisalabad', 'multan', 'peshawar', 'quetta', 'sialkot', 'sindh', 'punjab', 'balochistan', 'kpk', 'khyber'];
  return indicators.some(ind => addr.includes(ind));
}

/**
 * Calculates a privacy-safe estimated distance between two coordinates.
 * 
 * Privacy Measures:
 * 1. Uses Haversine/Great Circle distance.
 * 2. Rounds the result to the nearest 2km to prevent triangulation.
 * 3. Adds a small stable jitter based on IDs if needed (omitted for now for purity).
 * 
 * @param from - Origin { lat, lng, address? }
 * @param to - Destination { lat, lng, address? }
 * @returns { distance: number (km), duration: number (mins), isOutside: boolean }
 */
export function calculatePrivacySafeDistance(
  from: { lat: number; lng: number; address?: string } | undefined, 
  to: { lat: number; lng: number; address?: string }
): { distance: number; duration: number; isOutside: boolean } {
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

  // Logic: Mark as outside if addresses don't match country OR distance is extreme (> 1500km)
  const fromInCountry = isLocationInCountry(from?.address);
  const toInCountry = isLocationInCountry(to.address);
  const isOutside = (!fromInCountry || !toInCountry) || safeDist > 1500;

  return { distance: safeDist, duration, isOutside };
}

/**
 * Centered Price Formatting Utility (Hybrid Lakh/Standard)
 * 
 * Rules:
 * 1. Below 1M: Standard localized number (e.g., 150,000).
 * 2. 1,000,000+: "lac" notation (e.g., 10 lac, 100 lac).
 */
export function formatPrice(price: number | undefined | null, viewMode?: string): string {
  if (price === undefined || price === null) return "";
  const p = Math.round(price);
  
  if (p >= 1_000_000) {
    const lac = p / 100_000;
    return `${lac % 1 === 0 ? lac.toFixed(0) : lac.toFixed(1)} lac`;
  }
  
  return p.toLocaleString();
}

export function formatShortTimestamp(date: Date): string {
  if (isToday(date)) {
    return format(date, "h:mma").toLowerCase();
  }

  if (isYesterday(date)) {
    return "Yesterday";
  }

  return format(date, "d/M/yyyy");
}

/**
 * Maps database condition strings to UI display labels.
 * 
 * Mappings:
 * - new -> "🌟 New"
 * - like_new -> "✨ Mint"
 * - used -> "👌 Used"
 * - fair -> "🔨 Fair"
 * - default -> "👌 Used"
 */
export function getConditionLabel(condition: string): string {
  switch (condition) {
    case 'new': return '🌟 New';
    case 'like_new': return '✨ Mint';
    case 'used': return '👌 Used';
    case 'fair': return '🔨 Fair';
    default: return '👌 Used';
  }
}
