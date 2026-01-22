export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface Badge {
  id: string;
  name: string;
  description: string;
  tier: BadgeTier;
  icon: string; // Lucide icon name or image URL
  category: 'seller' | 'buyer' | 'special';
}

export interface UserStats {
  bidsAcceptedByMe: number; // Seller metric: How many bids I accepted
  myBidsAccepted: number;   // Buyer metric: How many of my bids were accepted
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  phone?: string;
  rating: number; // 0-5
  reviewCount: number;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  badges: Badge[];
  stats: UserStats;
  isVerified?: boolean;
}

export interface Item {
  id: string;
  slug?: string;
  title: string;
  description: string;
  images: string[];
  sellerId: string;
  seller?: User; // Embedded seller profile for UI & Logic
  askPrice: number;
  category: string;
  condition: 'new' | 'like_new' | 'used' | 'fair';
  isPublicBid: boolean;
  currentHighBid?: number;
  currentHighBidderId?: string;
  bidCount: number;
  createdAt: string;
  expiryAt: string;
  listingDuration: 24 | 48 | 72;
  status: 'active' | 'completed' | 'cancelled' | 'hidden';
}

export interface Bid {
  id: string;
  itemId: string;
  bidderId: string;
  bidder?: User; // Hydrated bidder profile
  amount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'shortlisted' | 'ignored';
  type: 'public' | 'private';
  createdAt: string;
  update_count?: number; // Added for 70/150/3 protocol
}

export interface LocationInfo {
  distanceKm: number;
  durationMins: number;
}

export interface Conversation {
  id: string;
  itemId: string;
  item?: Item;
  sellerId: string;
  seller?: User;
  bidderId: string;
  bidder?: User;
  lastMessage?: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface SearchFilters {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: {
    lat: number;
    lng: number;
    radiusKm: number;
  };
  condition?: 'new' | 'like_new' | 'used' | 'fair' | 'all';
  sortBy?: 'newest' | 'price_low' | 'price_high' | 'nearest' | 'ending_soon';
  status?: 'active' | 'all';
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  parentId?: string;
  count?: number; // Number of active listings
}

export interface SearchSuggestion {
  type: 'recent' | 'popular' | 'category' | 'item';
  text: string;
  category?: string;
}
