import { Database } from '@/types/database.types';
import { Item, User } from '@/types';

type ListingRow = Database['public']['Tables']['listings']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

// We need a joined type because we will fetch listings with their sellers
export type ListingWithSeller = ListingRow & {
  profiles: ProfileRow | null;
};

export function transformProfileToUser(profile: ProfileRow): User {
  return {
    id: profile.id,
    name: profile.full_name || 'Anonymous',
    avatar: profile.avatar_url || 'https://github.com/shadcn.png', // Default avatar
    rating: profile.rating || 0,
    reviewCount: profile.rating_count || 0,
    location: {
      lat: 0, // Geo not in schema yet, defaulting
      lng: 0,
      name: profile.location || 'Unknown'
    },
    verified: false, // Default
    joinedDate: profile.created_at || new Date().toISOString()
  };
}

export function transformListingToItem(listing: ListingWithSeller): Item {
  const seller = listing.profiles ? transformProfileToUser(listing.profiles) : {
    id: 'unknown',
    name: 'Unknown Seller',
    avatar: '',
    rating: 0,
    reviewCount: 0,
    location: { lat: 0, lng: 0, name: 'Unknown' },
    verified: false,
    joinedDate: new Date().toISOString()
  };

  // Calculate expiry (Default to 72 hours after creation)
  const createdAt = listing.created_at ? new Date(listing.created_at).getTime() : Date.now();
  const expiryAt = new Date(createdAt + 72 * 60 * 60 * 1000).toISOString();

  // Basic Auction Mode mapping
  const isPublicBid = listing.auction_mode === 'visible';

  // Image URL Transformation
  // We assume images in DB are filenames/paths (e.g. "chair.jpg")
  // We prepend the Storage bucket URL: [ProjectURL]/storage/v1/object/public/listings/
  const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL 
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listings`
    : '';

  const imageUrls = (listing.images || []).map(img => {
    if (img.startsWith('http')) return img; // Already a full URL
    return `${storageUrl}/${img}`;
  });

  return {
    id: listing.id,
    title: listing.title,
    description: listing.description || '',
    askPrice: listing.asked_price,
    images: imageUrls,
    category: listing.category || 'Other',
    condition: 'Used', // Default, not in schema
    seller: seller,
    likes: 0, // Not in schema
    postedAt: listing.created_at || new Date().toISOString(),
    expiryAt: expiryAt,
    isPublicBid: isPublicBid,
    currentHighBid: null, // Would need fetching bids to populate
    currentHighBidderId: null,
    minBid: listing.asked_price * 0.7 // Business rule applied here too
  };
}
