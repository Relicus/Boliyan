import { Item } from "@/types";

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function sortByDistance(items: Item[], userLat: number, userLng: number): Item[] {
  // Items without location are pushed to bottom
  return [...items].sort((a, b) => {
    // Handling cases where location might be missing on seller/item (defaults to 0 or null checks)
    // Note: Type definition for Item -> Seller currently has location mandatory, but good to be safe
    const latA = a.seller?.location?.lat;
    const lngA = a.seller?.location?.lng;
    const latB = b.seller?.location?.lat;
    const lngB = b.seller?.location?.lng;

    if (latA === undefined || lngA === undefined) return 1;
    if (latB === undefined || lngB === undefined) return -1;

    const distA = calculateDistance(userLat, userLng, latA, lngA);
    const distB = calculateDistance(userLat, userLng, latB, lngB);

    return distA - distB;
  });
}
