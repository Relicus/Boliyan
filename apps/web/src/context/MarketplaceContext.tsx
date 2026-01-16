"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Item, Bid } from "@/types";
import { useAuth } from "./AuthContext";
import { useTime } from "./TimeContext";
import { supabase } from "@/lib/supabase";
import { transformListingToItem, ListingWithSeller, transformBidToHydratedBid, BidWithProfile } from "@/lib/transform";

interface MarketplaceContextType {
  items: Item[];
  bids: Bid[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  addItem: (item: Omit<Item, 'id' | 'createdAt' | 'bidCount'>) => void;
  updateItem: (id: string, updates: Partial<Omit<Item, 'id' | 'createdAt' | 'bidCount'>>) => void;
  deleteItem: (id: string) => void;
  placeBid: (itemId: string, amount: number, type: 'public' | 'private') => void;
  toggleWatch: (itemId: string) => void;
  watchedItemIds: string[];
  rejectBid: (bidId: string) => void;
  acceptBid: (bidId: string) => Promise<string | undefined>;
  filters: {
    category: string | null;
    search: string;
    radius: number;
    locationMode: 'current' | 'city' | 'country';
    city: string;
    currentCoords: { lat: number; lng: number } | null;
    sortBy: 'trending' | 'nearest' | 'ending_soon' | 'luxury' | 'newest' | 'watchlist';
    minPrice: number | null;
    maxPrice: number | null;
    listingType: 'all' | 'public' | 'sealed';
  };
  setFilter: (key: keyof MarketplaceContextType['filters'], value: any) => void;
  updateFilters: (updates: Partial<MarketplaceContextType['filters']>) => void;
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export function MarketplaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth(); // Needed for user-specific sort/filter (e.g. watchlist sort)
  // const { now } = useTime(); // Unused for now

  const [allItems, setAllItems] = useState<Item[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [bids, setBids] = useState<Bid[]>([]); // Initialize empty, fetch real bids
  const [watchedItemIds, setWatchedItemIds] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadingLockRef = React.useRef(false);
  const ITEMS_PER_PAGE = 8;

  const [filters, setFilters] = useState<MarketplaceContextType['filters']>({
    category: null,
    search: "",
    radius: 500,
    locationMode: 'country',
    city: 'Karachi',
    currentCoords: null,
    sortBy: 'trending',
    minPrice: null,
    maxPrice: null,
    listingType: 'all',
  });

  // --- HELPER FUNCTIONS ---
  const deg2rad = (deg: number) => deg * (Math.PI / 180);
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
  };

  const applyFiltersAndSort = () => {
     let result = allItems.filter(item => {
      if (filters.category && filters.category !== "All Items" && item.category !== filters.category) return false;
      
      if (filters.search) {
        const query = filters.search.toLowerCase();
        if (!item.title.toLowerCase().includes(query) && !item.description.toLowerCase().includes(query)) return false;
      }

      const currentPrice = item.currentHighBid || item.askPrice;
      if (filters.minPrice !== null && currentPrice < filters.minPrice) return false;
      if (filters.maxPrice !== null && currentPrice > filters.maxPrice) return false;

      if (filters.listingType === 'public' && !item.isPublicBid) return false;
      if (filters.listingType === 'sealed' && item.isPublicBid) return false;

      if (filters.sortBy === 'watchlist') {
         if (!watchedItemIds.includes(item.id)) return false;
      }

      if (filters.locationMode !== 'country' && filters.radius < 500) {
        // Use embedded seller location if available, fallback to mock if absolutely necessary (or fail safe)
        const sellerLoc = item.seller?.location;
        if (sellerLoc && filters.currentCoords) {
          const dist = getDistance(
            filters.currentCoords.lat,
            filters.currentCoords.lng,
            sellerLoc.lat,
            sellerLoc.lng
          );
          if (dist > filters.radius) return false;
        }
      }
      return true;
    });

    result = result.sort((a, b) => {
      // Use embedded seller data for sorting
      const sellerA = a.seller;
      const sellerB = b.seller;

      switch (filters.sortBy) {
          case 'nearest': {
            if (!filters.currentCoords || !sellerA?.location || !sellerB?.location) return 0;
            const distA = getDistance(filters.currentCoords.lat, filters.currentCoords.lng, sellerA.location.lat, sellerA.location.lng);
            const distB = getDistance(filters.currentCoords.lat, filters.currentCoords.lng, sellerB.location.lat, sellerB.location.lng);
            return distA - distB;
          }
          case 'ending_soon': return new Date(a.expiryAt).getTime() - new Date(b.expiryAt).getTime();
          case 'luxury': return b.askPrice - a.askPrice;
          case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'watchlist': {
             // Safe user check
             const userId = user?.id;
             if (!userId) return 0; 
             
             const aIsHigh = a.currentHighBidderId === userId;
             const bIsHigh = b.currentHighBidderId === userId;
             if (aIsHigh && !bIsHigh) return -1;
             if (!aIsHigh && bIsHigh) return 1;

             const aHasBid = bids.some(bid => bid.itemId === a.id && bid.bidderId === userId);
             const bHasBid = bids.some(bid => bid.itemId === b.id && bid.bidderId === userId);
             if (aHasBid && !bHasBid) return -1;
             if (!aHasBid && bHasBid) return 1;

             return b.bidCount - a.bidCount;
          }
          case 'trending':
          default: return b.bidCount - a.bidCount;
      }
    });

    return result;
  };

  // --- DATA FETCHING & REALTIME Subscription ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      // 1. Fetch Listings
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select('*, profiles(*)');
      
      let fetchedItems: Item[] = [];
      if (listingsData) {
        fetchedItems = listingsData.map(row => transformListingToItem(row as unknown as ListingWithSeller));
      } else if (listingsError) {
        console.error('Error fetching listings:', listingsError);
        // Ensure UI doesn't break, maybe set empty or keep loading false
      }

      // 2. Fetch Bids with Bidder Profiles
      const { data: bidsData, error: bidsError } = await supabase
        .from('bids')
        .select('*, profiles(*)');
      
      if (bidsData) {
        const transformedBids: Bid[] = (bidsData as unknown as BidWithProfile[]).map(transformBidToHydratedBid);
        setBids(transformedBids);

        // Hydrate Items with Bid Data (High Bid, Count)
        fetchedItems = fetchedItems.map(item => {
           const itemBids = transformedBids.filter(b => b.itemId === item.id);
           if (itemBids.length === 0) return item;

           const maxBid = Math.max(...itemBids.map(b => b.amount));
           const highBid = itemBids.find(b => b.amount === maxBid);
           
           return {
             ...item,
             bidCount: itemBids.length,
             currentHighBid: maxBid,
             currentHighBidderId: highBid?.bidderId
           };
        });
      }

      // Deduplicate items by ID (safeguard against DB duplicates)
      const uniqueItems = Array.from(new Map(fetchedItems.map(item => [item.id, item])).values());

      setAllItems(uniqueItems);
      setIsLoading(false);
    };

    fetchData();

    // 3. Realtime Subscription (Bids)
    const channel = supabase
      .channel('public:bids')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bids' }, async (payload) => {
        const newBidRaw = payload.new as any;
        
        // Fetch profile for the new bidder to maintain hydration
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', newBidRaw.bidder_id)
          .single();

        const newBid: Bid = transformBidToHydratedBid({
          ...newBidRaw,
          profiles: profile
        } as unknown as BidWithProfile);

        setBids(prev => [...prev, newBid]);

        // Update Item State safely
        setAllItems(prevItems => prevItems.map(item => {
          if (item.id === newBid.itemId) {
              const currentMax = item.currentHighBid || 0;
              const isNewHigh = newBid.amount > currentMax;
              return {
                 ...item,
                 bidCount: item.bidCount + 1,
                 currentHighBid: isNewHigh ? newBid.amount : currentMax,
                 currentHighBidderId: isNewHigh ? newBid.bidderId : item.currentHighBidderId
              };
          }
          return item;
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); 

  // Local effect for Filters/Pagination
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    const filtered = applyFiltersAndSort();
    const firstPage = filtered.slice(0, ITEMS_PER_PAGE);
    setItems(firstPage);
    setHasMore(firstPage.length < filtered.length);
  }, [
    allItems, 
    filters.category, filters.search, filters.sortBy, filters.minPrice, filters.maxPrice, 
    filters.listingType, filters.locationMode, filters.radius,
    user?.id // User change can affect 'watchlist' sort
  ]);

  const loadMore = async () => {
    if (isLoadingMore || !hasMore || loadingLockRef.current) return;
    
    loadingLockRef.current = true;
    setIsLoadingMore(true);
    
    try {
      // Small artificial delay for smooth transition
      await new Promise(resolve => setTimeout(resolve, 800));

      const filtered = applyFiltersAndSort();
      const start = page * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      const nextPage = filtered.slice(start, end);

      if (nextPage.length > 0) {
        setItems(prev => {
          // One final safety check: don't append if ID already exists in prev
          const existingIds = new Set(prev.map(i => i.id));
          const trulyNewItems = nextPage.filter(i => !existingIds.has(i.id));
          return [...prev, ...trulyNewItems];
        });
        setPage(prev => prev + 1);
        setHasMore(end < filtered.length);
      } else {
        setHasMore(false);
      }
    } finally {
      setIsLoadingMore(false);
      loadingLockRef.current = false;
    }
  };

  // Keep simplified local addItem for now (will replace in Selling step)
  const addItem = (newItem: Omit<Item, 'id' | 'createdAt' | 'bidCount'>) => {
    // This will be replaced by direct Supabase INSERT in 'Selling' phase
    // For now, if called, it might not persist, but 'placeBid' works.
    console.log("addItem called locally - Logic pending update in Selling phase");
  };

  const updateItem = async (id: string, updates: Partial<Omit<Item, 'id' | 'createdAt' | 'bidCount'>>) => {
     // Transform updates to snake_case if necessary (simple for now)
     const dbUpdates: any = {};
     if (updates.status) dbUpdates.status = updates.status;
     if (updates.title) dbUpdates.title = updates.title;
     // ... add others as needed

     const { error } = await (supabase.from('listings') as any).update(dbUpdates as any).eq('id', id);
     
     if (error) {
         console.error("Failed to update item:", error);
     } else {
         setAllItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
     }
  };

  const deleteItem = (id: string) => {
    setAllItems(prev => prev.filter(i => i.id !== id));
  };

  const placeBid = async (itemId: string, amount: number, type: 'public' | 'private') => {
    if (!user) {
        console.error("Must be logged in to bid");
        return;
    }
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // Client-side Validation Checks
    const minBidAllowed = item.askPrice * 0.7;
    if (amount < minBidAllowed) {
      console.warn(`Bid too low`);
      return;
    }

    // Insert into Supabase
    const { error } = await (supabase.from('bids') as any).insert({
        listing_id: itemId,
        bidder_id: user.id,
        amount: amount,
        message: type === 'private' ? 'Private Bid' : 'Public Bid',
        status: 'pending'
    } as any);

    if (error) {
        console.error("Failed to place bid:", error);
    } else {
        if (!watchedItemIds.includes(itemId)) {
             setWatchedItemIds(prev => [...prev, itemId]);
        }
    }
  };

  const toggleWatch = (itemId: string) => {
    setWatchedItemIds(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const setFilter = (key: keyof MarketplaceContextType['filters'], value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  const updateFilters = (updates: Partial<MarketplaceContextType['filters']>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  };

  const rejectBid = async (bidId: string) => {
      const { error } = await (supabase.from('bids') as any).update({ status: 'rejected' } as any).eq('id', bidId);
      if (error) console.error("Failed to reject bid", error);
      else setBids(prev => prev.map(b => b.id === bidId ? { ...b, status: 'rejected' } : b));
  };

  const acceptBid = async (bidId: string) => {
      // 1. Update Bid Status
      const { error } = await (supabase.from('bids') as any).update({ status: 'accepted' } as any).eq('id', bidId);
      if (error) {
          console.error("Failed to accept bid", error);
          return undefined;
      }

      setBids(prev => prev.map(b => b.id === bidId ? { ...b, status: 'accepted' } : b));
      return bidId;
  };

  return (
    <MarketplaceContext.Provider value={{ items, bids, isLoading, isLoadingMore, hasMore, loadMore, addItem, updateItem, deleteItem, placeBid, toggleWatch, watchedItemIds, rejectBid, acceptBid, filters, setFilter, updateFilters }}>
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  const context = useContext(MarketplaceContext);
  if (context === undefined) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return context;
}
