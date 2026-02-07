import type { Item, Bid } from "@/types";
import type { Database } from "@/types/database.types";

// ---------------------------------------------------------------------------
// Shared row type — used by MarketplaceContext, SearchContext, useListingsPolling
// ---------------------------------------------------------------------------

export type MarketplaceListingRow = Database['public']['Views']['marketplace_listings']['Row'];

// ---------------------------------------------------------------------------
// Marketplace Filters
// ---------------------------------------------------------------------------

export interface MarketplaceFilters {
  category: string | null;
  search: string;
  radius: number;
  locationMode: 'current' | 'city' | 'country';
  city: string;
  currentCoords: { lat: number; lng: number } | null;
  sortBy: 'trending' | 'nearest' | 'ending_soon' | 'luxury' | 'newest' | 'watchlist';
  minPrice: number | null;
  maxPrice: number | null;
  condition: 'new' | 'like_new' | 'used' | 'fair' | 'all';
  listingType: 'all' | 'public' | 'hidden';
}

export const DEFAULT_MARKETPLACE_FILTERS: MarketplaceFilters = {
  category: null,
  search: "",
  radius: 500,
  locationMode: 'country',
  city: "",
  currentCoords: null,
  sortBy: 'trending',
  minPrice: null,
  maxPrice: null,
  condition: 'all',
  listingType: 'all',
};

// ---------------------------------------------------------------------------
// Marketplace Context Shape
// ---------------------------------------------------------------------------

export interface MarketplaceContextType {
  items: Item[];
  bids: Bid[];
  itemsById: Record<string, Item>;
  bidsById: Record<string, Bid>;
  feedIds: string[];
  involvedIds: string[];
  isLoading: boolean;
  isLoadingMore: boolean;
  isRevalidating: boolean;
  hasMore: boolean;
  loadMore: () => void;
  addItem: (item: Omit<Item, 'id' | 'createdAt' | 'bidCount' | 'bidAttemptsCount'>) => void;
  updateItem: (id: string, updates: Partial<Omit<Item, 'id' | 'createdAt' | 'bidCount' | 'bidAttemptsCount'>>) => void;
  deleteItem: (id: string) => void;
  placeBid: (itemId: string, amount: number, type: 'public' | 'private') => Promise<boolean>;
  toggleWatch: (itemId: string) => void;
  watchedItemIds: string[];
  rejectBid: (bidId: string) => void;
  acceptBid: (bidId: string) => Promise<string | undefined>;
  confirmExchange: (conversationId: string, role: 'buyer' | 'seller') => Promise<boolean>;
  filters: MarketplaceFilters;
  setFilter: <K extends keyof MarketplaceFilters>(key: K, value: MarketplaceFilters[K]) => void;
  updateFilters: (updates: Partial<MarketplaceFilters>) => void;
  resetFilters: () => void;
  lastBidTimestamp: number | null;
  setLastBidTimestamp: (ts: number | null) => void;
  refreshInvolvedItems: () => Promise<void>;
  refresh: () => Promise<void>;
  liveFeed: {
    pendingCount: number;
    loadPending: () => void;
    isPollingActive: boolean;
    showContinuePrompt: boolean;
    continueWatching: () => void;
    pauseUpdates: () => void;
  };
}
