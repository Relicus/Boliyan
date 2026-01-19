import { Database } from '@/types/database.types';
import { Item, User, Bid, Conversation } from '@/types';

type ListingRow = Database['public']['Tables']['listings']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

import { CITY_COORDINATES } from './locations';

// We need a joined type because we will fetch listings with their sellers
export type ListingWithSeller = ListingRow & {
  profiles?: ProfileRow | null;
  
  // Fields from 'marketplace_listings' view
  seller_name?: string | null;
  seller_avatar?: string | null;
  seller_rating?: number | null;
  seller_rating_count?: number | null;
  seller_location?: string | null;
  
  bid_count?: number | null;
  high_bid?: number | null;
  high_bidder_id?: string | null;
};

export function transformProfileToUser(profile: ProfileRow): User {
  const cityCoords = profile.location ? CITY_COORDINATES[profile.location] : null;
  
  return {
    id: profile.id,
    name: profile.full_name || 'Anonymous',
    avatar: profile.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + profile.id,
    rating: profile.rating || 0,
    reviewCount: profile.rating_count || 0,
    location: {
      lat: cityCoords?.lat || 24.8607, // Default to Karachi if unknown
      lng: cityCoords?.lng || 67.0011,
      address: profile.location || 'Karachi' // Default to Karachi instead of 'Unknown' for better UI
    },
    isVerified: false,
    badges: [],
    stats: {
      bidsAcceptedByMe: 0,
      myBidsAccepted: 0
    }
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
              address: listing.seller_location || 'Karachi'
          },
          isVerified: false,
          badges: [],
          stats: { bidsAcceptedByMe: 0, myBidsAccepted: 0 }
      };
  }

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
    images: imageUrls,
    sellerId: listing.seller_id || 'unknown',
    seller: seller,
    askPrice: listing.asked_price,
    category: listing.category || 'Other',
    condition: (listing as any).condition || 'used',
    isPublicBid: isPublicBid,
    
    // Server-side stats if available
    currentHighBid: listing.high_bid !== undefined ? Number(listing.high_bid) : undefined,
    currentHighBidderId: listing.high_bidder_id || undefined,
    bidCount: listing.bid_count !== undefined ? Number(listing.bid_count) : 0,
    
    createdAt: listing.created_at || new Date().toISOString(),
    expiryAt: expiryAt,
    listingDuration: 72,
    status: (listing as any).status || 'active'
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
    status: (bid.status as any) || 'pending',
    type: 'public', // Defaulting since bid_type was removed from schema
    createdAt: bid.created_at || new Date().toISOString()
  };
}

export type ConversationWithHydration = Database['public']['Tables']['conversations']['Row'] & {
  listings: ListingWithSeller | null;
  seller_profile: ProfileRow | null;
  bidder_profile: ProfileRow | null;
  last_message?: string;
  updated_at?: string;
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
    lastMessage: conv.last_message,
    updatedAt: conv.updated_at || conv.created_at || new Date().toISOString(),
    expiresAt: (conv as any).expires_at
  };
}
