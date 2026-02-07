import { Database } from '@/types/database.types';
import { Item, User, Bid, Conversation } from '@/types';

type ListingRow = Database['public']['Tables']['listings']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

import { CITY_COORDINATES } from './constants/locations';

// We need a joined type because we will fetch listings with their sellers
export type ListingWithSeller = ListingRow & {
  profiles?: ProfileRow | null;
  
  // Fields from 'marketplace_listings' view
  seller_name?: string | null;
  seller_avatar?: string | null;
  seller_rating?: number | null;
  seller_rating_count?: number | null;
  seller_location?: string | null;
  
  // Listing specific location (from view)
  location_lat?: number | null;
  location_lng?: number | null;
  location_address?: string | null;
  
  bid_count?: number | null;
  bid_attempts_count?: number | null;
  high_bid?: number | null;
  high_bidder_id?: string | null;
  
  slug?: string | null;
  go_live_at?: string | null;
  last_edited_at?: string | null;
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
  auction_mode?: string | null;
  status?: string | null;
  moderation_status?: 'pending' | 'approved' | 'rejected' | null;
  rejection_reason?: string | null;
};

export function transformProfileToUser(profile: ProfileRow): User {
  const cityCoords = profile.location ? CITY_COORDINATES[profile.location] : null;
  
  // Prefer explicit lat/lng from DB, fallback to city map, fallback to default
  const lat = profile.location_lat ?? cityCoords?.lat ?? 24.8607;
  const lng = profile.location_lng ?? cityCoords?.lng ?? 67.0011;
  const address = profile.location || 'Karachi';

  return {
    id: profile.id,
    name: profile.full_name || 'Anonymous',
    avatar: profile.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + profile.id,
    phone: profile.phone || undefined,
    rating: profile.rating || 0,
    reviewCount: profile.rating_count || 0,
    location: {
      lat,
      lng,
      address,
      city: profile.location || undefined // Historically 'location' was just city name
    },
    isVerified: false,
    badges: [],
    stats: {
      bidsAcceptedByMe: 0,
      myBidsAccepted: 0
    },
    sellerSuccessRate: profile.seller_success_rate ?? 100,
    buyerSuccessRate: profile.buyer_success_rate ?? 100
  };
}

export function transformListingToItem(listing: ListingWithSeller): Item {
  // Handle both nested 'profiles' (legacy join) and flat 'seller_*' (view)
  let seller: User | undefined;

  if (listing.profiles) {
      seller = transformProfileToUser(listing.profiles);
  } else if (listing.seller_name || listing.seller_id) {
      // Reconstruct User from flat view columns
      const cityCoords = listing.seller_location ? CITY_COORDINATES[listing.seller_location] : null;
      seller = {
          id: listing.seller_id || 'unknown',
          name: listing.seller_name || 'Anonymous',
          avatar: listing.seller_avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (listing.seller_id || 'x'),
          rating: listing.seller_rating || 0,
          reviewCount: listing.seller_rating_count || 0,
          location: {
              lat: cityCoords?.lat || 24.8607,
              lng: cityCoords?.lng || 67.0011,
              address: listing.seller_location || 'Karachi',
              city: listing.seller_location || undefined
          },
          isVerified: false,
          badges: [],
          stats: { bidsAcceptedByMe: 0, myBidsAccepted: 0 }
      };
  }

  // Calculate expiry
  const createdAt = listing.created_at ? new Date(listing.created_at).getTime() : Date.now();
  
  // Use DB 'ends_at' if available (randomized timers), otherwise fallback to 30 days (720h)
  const expiryAt = listing.ends_at 
    ? listing.ends_at 
    : new Date(createdAt + 720 * 60 * 60 * 1000).toISOString();

  // Basic Auction Mode mapping
  const isPublicBid = listing.auction_mode === 'visible';

  const isValidCondition = (value: string | null | undefined): value is Item['condition'] =>
    value === 'new' || value === 'like_new' || value === 'used' || value === 'fair';

  const isValidStatus = (value: string | null | undefined): value is Item['status'] =>
    value === 'active' || value === 'completed' || value === 'cancelled' || value === 'hidden' || value === 'expired';

  // Image URL Transformation
  // We assume images in DB are filenames/paths (e.g. "chair.jpg")
  // We prepend the R2 public base URL: [NEXT_PUBLIC_R2_DOMAIN]/<objectKey>
  const storageUrl = process.env.NEXT_PUBLIC_R2_DOMAIN || '';

  const imageUrls = (listing.images || []).map(img => {
    if (img.startsWith('http')) return img; // Already a full URL
    if (!storageUrl) return img;
    return `${storageUrl}/${img}`;
  });

  // Resolve item location: prefer item-specific location -> then seller location -> then default
  const itemLat = listing.location_lat ?? seller?.location.lat ?? 24.8607;
  const itemLng = listing.location_lng ?? seller?.location.lng ?? 67.0011;
  const itemAddress = listing.location_address ?? seller?.location.address ?? 'Karachi';

  return {
    id: listing.id,
    slug: listing.slug || undefined,
    title: listing.title,
    description: listing.description || '',
    images: imageUrls,
    sellerId: listing.seller_id || 'unknown',
    seller: seller,
    contactPhone: listing.contact_phone || undefined,
    contactWhatsapp: listing.contact_whatsapp || undefined,
    askPrice: listing.asked_price,
    category: listing.category || 'Other',
    condition: isValidCondition(listing.condition) ? listing.condition : 'used',
    isPublicBid: isPublicBid,
    
    // Server-side stats if available
    currentHighBid: listing.high_bid && listing.high_bid > 0 
      ? Number(listing.high_bid) 
      : undefined,
    currentHighBidderId: listing.high_bidder_id || undefined,
    bidCount: listing.bid_count !== undefined ? Number(listing.bid_count) : 0,
    bidAttemptsCount: listing.bid_attempts_count !== undefined
      ? Number(listing.bid_attempts_count)
      : (listing.bid_count !== undefined ? Number(listing.bid_count) : 0),
    
    createdAt: listing.created_at || new Date().toISOString(),
    expiryAt: expiryAt,
    listingDuration: 720,
    status: isValidStatus(listing.status) ? listing.status : 'active',
    goLiveAt: listing.go_live_at || undefined,
    lastEditedAt: listing.last_edited_at || undefined,
    
    // New Location Field
    location: {
        lat: itemLat,
        lng: itemLng,
        address: itemAddress,
        city: listing.seller_location || undefined // Fallback to seller city if no explicit city field on item yet
    },
    
    // Moderation Fields
    moderationStatus: listing.moderation_status || undefined,
    rejectionReason: listing.rejection_reason || undefined
  };
}
export type BidWithProfile = Database['public']['Tables']['bids']['Row'] & {
  profiles: ProfileRow | null;
};

export function transformBidToHydratedBid(bid: BidWithProfile): Bid {
  return {
    id: bid.id,
    itemId: bid.listing_id || '',
    bidderId: bid.bidder_id || '',
    bidder: bid.profiles ? transformProfileToUser(bid.profiles) : undefined,
    amount: Number(bid.amount),
    status: (bid.status || 'pending') as Bid['status'],
    type: 'public', // Defaulting since bid_type was removed from schema
    createdAt: bid.created_at || new Date().toISOString(),
    update_count: bid.update_count || 0
  };
}

export type ConversationWithHydration = Database['public']['Tables']['conversations']['Row'] & {
  listings: ListingWithSeller | null;
  seller_profile: ProfileRow | null;
  bidder_profile: ProfileRow | null;
};

export function transformConversationToHydratedConversation(conv: ConversationWithHydration): Conversation {
  return {
    id: conv.id,
    itemId: conv.listing_id || '',
    item: conv.listings ? transformListingToItem(conv.listings) : undefined,
    sellerId: conv.seller_id || '',
    seller: conv.seller_profile ? transformProfileToUser(conv.seller_profile) : undefined,
    bidderId: conv.bidder_id || '',
    bidder: conv.bidder_profile ? transformProfileToUser(conv.bidder_profile) : undefined,
    lastMessage: conv.last_message || undefined,
    updatedAt: conv.updated_at || conv.created_at || new Date().toISOString(),
    expiresAt: conv.expires_at || undefined,
    sellerConfirmedAt: conv.seller_confirmed_at || undefined,
    buyerConfirmedAt: conv.buyer_confirmed_at || undefined,
    isSealed: conv.is_sealed || false,
    shortCode: conv.short_code || undefined
  };
}
