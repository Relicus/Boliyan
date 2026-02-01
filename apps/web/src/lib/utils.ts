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
  to: { lat: number; lng: number; address?: string } | undefined
): { distance: number; duration: number; isOutside: boolean } {
  // If either location is missing, we cannot calculate distance.
  // We return isOutside: true to ensure the distance badge is hidden.
  if (!from || !to) {
    return { distance: 0, duration: 0, isOutside: true };
  }

  // If no user location, default to a generic "Far" distance or specific center
  // For this mock, we'll assume a fixed user location if undefined
  const userLat = from.lat;
  const userLng = from.lng;

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
 * Helper to format duration into human-readable units.
 * - Less than 60 mins: "Xmin"  
 * - 60-1440 mins (1-24h): "Xh"
 * - More than 1440 mins: null (hidden)
 */
function formatDuration(minutes: number): string | null {
  if (minutes <= 0 || minutes > 1440) return null; // Hide if invalid or > 24 hours
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.round(minutes / 60);
  return `${hours}h`;
}

/**
 * Logic to determine if a distance should be shown and how to format it.
 * 
 * Display Rules:
 * 1. Hide if distance > 100km
 * 2. Hide if duration > 24 hours (1440 mins)
 * 3. Show hours if duration >= 60 mins
 * 4. Show mins if duration < 60 mins
 */
export function getDistanceDisplayInfo(distance: number, duration: number) {
  // Hide entirely if too far (>100km) or would take more than a day
  const shouldHide = distance > 100 || duration > 1440;
  const isFar = shouldHide;
  
  // Format duration appropriately
  const formattedDuration = formatDuration(duration);
  
  // Build labels
  const label = shouldHide ? null : `${distance}km • ${formattedDuration}`;
  const distanceLabel = shouldHide ? null : `${distance} km`;
  const durationLabel = shouldHide ? null : formattedDuration;
  
  return {
    isFar,
    shouldHide,
    label,
    distanceLabel,
    durationLabel,
  };
}

/**
 * Centered Price Formatting Utility (Hybrid Lakh/Standard)

 * 
 * Rules:
 * 1. Below 1M: Standard localized number (e.g., 150,000).
 * 2. 1,000,000+: "lac" notation (e.g., 10 lac, 100 lac).
 */
export function formatPrice(price: number | undefined | null): string {
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

export function formatCountdown(targetMs: number, nowMs: number): string {
  const diff = Math.max(0, targetMs - nowMs);
  const totalMins = Math.ceil(diff / 60000);
  const days = Math.floor(totalMins / (60 * 24));
  const hours = Math.floor((totalMins % (60 * 24)) / 60);
  const mins = totalMins % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

/**
 * Generates a WhatsApp deep link with a pre-filled message.
 */
export function getWhatsAppUrl(phone: string, text: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  // Ensure it starts with a country code if it looks like a local number
  // For Pakistan, if it starts with 03..., we prefix with 92
  let finalPhone = cleanPhone;
  if (finalPhone.startsWith("03") && finalPhone.length === 11) {
    finalPhone = "92" + finalPhone.substring(1);
  }

  const lines = text.split(/\r?\n/);
  const encodedText = lines.map(encodeURIComponent).join('%0a');
  const isDesktop = typeof navigator !== 'undefined' && !/Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
  const baseUrl = isDesktop ? 'https://web.whatsapp.com/send' : 'whatsapp://send';
  return `${baseUrl}?phone=${finalPhone}&text=${encodedText}`;
}

type WhatsAppMessageRole = 'buyer' | 'seller';

interface WhatsAppMessageOptions {
  role: WhatsAppMessageRole;
  productName?: string;
  askPrice?: number | null;
  bidPrice?: number | null;
  city?: string;
  productUrl?: string;
  distance?: number | null;
  duration?: number | null;
}

function buildWhatsAppMessage({
  role,
  productName,
  askPrice,
  bidPrice,
  city,
  productUrl,
  distance,
  duration
}: WhatsAppMessageOptions): string {
  const safeName = productName?.trim() || 'Item';
  const safeAsk = typeof askPrice === 'number' ? formatPrice(askPrice) : 'N/A';
  const safeBid = typeof bidPrice === 'number' ? formatPrice(bidPrice) : 'N/A';
  const safeCity = city?.trim();
  const safeProductUrl = productUrl?.trim() || 'https://boliyan.pk';
  
  // Use centralized formatting - will return null if too far
  const { label: locationText } = (typeof distance === 'number' && typeof duration === 'number')
    ? getDistanceDisplayInfo(distance, duration)
    : { label: null };

  const title = role === 'seller' ? 'Deal Follow-Up' : 'Item Inquiry';
  const bidLabel = role === 'seller' ? 'Your Bid' : 'My Bid';
  const closeLine = role === 'seller' ? 'Ready to proceed?' : "Let's finalize details.";

  const lines = [
    `*Boliyan • ${title}*`,
    '',
    `*Item:* ${safeName}`,
    `*Ask:* ${safeAsk}`,
    `*${bidLabel}:* ${safeBid}`,
    safeCity ? `*City:* ${safeCity}` : null,
    locationText,
    '',
    `_${closeLine}_`,
    '',
    'Product:',
    safeProductUrl,
    ''
  ];

  return lines.filter((line) => line !== undefined && line !== null).join('\n');
}

/**
 * Centralized WhatsApp message builder for deals.
 * Takes core entities and handles all data extraction internally.
 */
interface WhatsAppDealOptions {
  item?: {
    id?: string;
    slug?: string;
    title?: string;
    askPrice?: number;
    location?: {
      city?: string;
      address?: string;
      lat?: number;
      lng?: number;
    };
  };
  bidAmount?: number | null;
  myRole: 'buyer' | 'seller';
  myLocation?: { lat: number; lng: number; address?: string };
  otherUserLocation?: { lat: number; lng: number; address?: string };
}

export function buildWhatsAppMessageForDeal({
  item,
  bidAmount,
  myRole,
  myLocation,
  otherUserLocation
}: WhatsAppDealOptions): string {
  // Build product URL
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://boliyan.pk';
  const shortCode = getListingShortCode(item?.slug);
  const productSlug = item?.slug || item?.id;
  const productUrl = shortCode 
    ? `${siteUrl}/p/${shortCode}` 
    : (productSlug ? `${siteUrl}/product/${productSlug}` : siteUrl);

  // Extract city
  const rawCity = item?.location?.city || (item?.location?.address ? getFuzzyLocationString(item.location.address) : '');
  const city = rawCity && rawCity !== 'Unknown Location' ? rawCity : undefined;

  // Calculate distance between parties
  const { distance, duration, isOutside } = calculatePrivacySafeDistance(myLocation, otherUserLocation);

  return buildWhatsAppMessage({
    role: myRole,
    productName: item?.title,
    askPrice: item?.askPrice,
    bidPrice: bidAmount,
    city,
    productUrl,
    distance: isOutside ? null : distance,
    duration: isOutside ? null : duration
  });
}

export function getMapUrl(location?: {
  lat?: number;
  lng?: number;
  address?: string;
}): string | undefined {
  if (!location) return undefined;
  const { lat, lng, address } = location;
  if (typeof lat === 'number' && typeof lng === 'number') {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }
  if (address?.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }
  return undefined;
}

export function getListingShortCode(slug?: string): string | undefined {
  if (!slug) return undefined;
  const trimmed = slug.trim();
  if (!trimmed) return undefined;
  const lastDash = trimmed.lastIndexOf('-');
  if (lastDash === -1 || lastDash === trimmed.length - 1) return undefined;
  return trimmed.slice(lastDash + 1);
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
