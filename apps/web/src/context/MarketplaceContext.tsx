"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Item, Bid } from "@/types";
import { useAuth } from "./AuthContext";
import { useTime } from "./TimeContext";
import { supabase } from "@/lib/supabase";
import { transformListingToItem, ListingWithSeller, transformBidToHydratedBid, BidWithProfile } from "@/lib/transform";
import { generateCacheKey, getFromCache, setCache } from "@/lib/cache";
import { useBidRealtime } from "@/hooks/useBidRealtime";

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
    condition: 'new' | 'like_new' | 'used' | 'fair' | 'all';
    listingType: 'all' | 'public' | 'sealed';
  };
  setFilter: (key: keyof MarketplaceContextType['filters'], value: any) => void;
  updateFilters: (updates: Partial<MarketplaceContextType['filters']>) => void;
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export function MarketplaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [items, setItems] = useState<Item[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
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
    condition: 'all',
    listingType: 'all',
  });

  // --- HELPER FUNCTIONS ---
  // Note: Geolocation helper functions kept if needed for future hybrid sorting, 
  // though primary filtering is now Server-Side where possible.
  
  const fetchItems = async (targetPage: number, reset: boolean = false) => {
      if (loadingLockRef.current) return;
      loadingLockRef.current = true;
      
      const cacheKey = generateCacheKey('marketplace', { ...filters, page: targetPage });
      let usedCache = false;

      // --- 1. CHECK CACHE (L1/L2) ---
      if (reset) {
          // Only check cache on reset (initial load or filter change). 
          // LoadMore usually needs fresh data or sequential cache logic which is complex.
          const { data: cachedItems, isStale } = await getFromCache<Item[]>(cacheKey);
          
          if (cachedItems) {
              setItems(cachedItems);
              setHasMore(cachedItems.length === ITEMS_PER_PAGE);
              setIsLoading(false);
              usedCache = true;
              
              if (!isStale) {
                  // Fresh cache! No need to fetch.
                  loadingLockRef.current = false;
                  return;
              }
              // If stale, we continue to fetch in background (SWR)
              console.log(`[Marketplace] Cache stale for ${cacheKey}, revalidating...`);
          }
      }

      if (!usedCache) {
          if (reset) {
              setIsLoading(true);
          } else {
              setIsLoadingMore(true);
          }
      }

        try {
            // PHASE 4: Use 'marketplace_listings' Master View for server-side aggregation
            // This replaces the raw 'listings' fetch + 'profiles' join + separate 'bids' fetch
            let query = (supabase.from('marketplace_listings') as any).select(`
                id,
                title,
                description,
                images,
                seller_id,
                asked_price,
                category,
                auction_mode,
                created_at,
                status,
                seller_name,
                seller_avatar,
                seller_rating,
                seller_rating_count,
                seller_location,
                bid_count,
                high_bid,
                high_bidder_id,
                condition
            `, { count: 'exact' }).eq('status', 'active');

            // --- APPLY FILTERS ---
          if (filters.category && filters.category !== "All Items") {
              query = query.eq('category', filters.category);
          }

          if (filters.search) {
              const searchTerm = `%${filters.search}%`;
              query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`);
          }

          if (filters.minPrice !== null) {
              query = query.gte('asked_price', filters.minPrice);
          }
          if (filters.maxPrice !== null) {
              query = query.lte('asked_price', filters.maxPrice);
          }
          
          if (filters.condition && filters.condition !== 'all') {
              query = query.eq('condition', filters.condition);
          }


          if (filters.listingType === 'public') {
              query = query.eq('auction_mode', 'visible');
          } else if (filters.listingType === 'sealed') {
               // Match both 'sealed' and 'hidden' for secret/sealed bids
               query = query.in('auction_mode', ['sealed', 'hidden']);
          } // 'all' does nothing

           // --- APPLY SORT ---
           // Mapping 'trending' to 'created_at' for now as per plan constraints
           switch (filters.sortBy) {
              case 'trending': 
                  // Sort by bid_count (popularity), then by created_at (freshness)
                  query = query.order('bid_count', { ascending: false })
                               .order('created_at', { ascending: false });
                  break;
              case 'newest':
              case 'luxury':
                  query = query.order('asked_price', { ascending: false });
                  break;
              case 'ending_soon':
                  // Note: DB doesn't have expiry column directly, transforming in JS usually. 
                  // If we rely on created_at for expiry (72h), oldest created is ending soonest.
                  query = query.order('created_at', { ascending: true });
                  break;
              // 'nearest' and 'watchlist' are tricky server-side without complex queries/schema changes.
              // Fallback: Default to newest for robust fetch, client can optionally refinements if needed, 
              // but we promised server-side.
              default:
                  query = query.order('created_at', { ascending: false });
           }

           // --- PAGINATION ---
           const from = (targetPage - 1) * ITEMS_PER_PAGE;
           const to = from + ITEMS_PER_PAGE - 1;
           query = query.range(from, to);

           const { data: listingsData, error: listingsError, count } = await query;

           if (listingsError) throw listingsError;

           let fetchedItems: Item[] = [];
           if (listingsData) {
               fetchedItems = listingsData.map((row: any) => transformListingToItem(row as unknown as ListingWithSeller));
           }

           // --- CLIENT-SIDE SORTING OVERRIDES ---
           // If 'watchlist' sort is selected, we might need to fetch more or re-sort client side 
           // since we can't easily join user specific watchlist state in simple query.

           // --- UPDATE STATE ---
           if (reset) {
               setItems(fetchedItems);
               // Cache the fresh page
               setCache(cacheKey, fetchedItems);
           } else {
               setItems(prev => {
                   const existingIds = new Set(prev.map(i => i.id));
                   const trulyNew = fetchedItems.filter(i => !existingIds.has(i.id));
                   return [...prev, ...trulyNew];
               });
               // We only cache individual pages for 'reset' scenarios currently to keep it simple.
               // Complex pagination caching (merging pages) is error prone.
               // But we SHOULD cache this new page so if user refreshes on page 3, they might get page 3 fast?
               // Actually, 'fetchItems' is called with specific page.
               setCache(cacheKey, fetchedItems);
           }
           
           if (count !== null) {
               setHasMore((targetPage * ITEMS_PER_PAGE) < count);
           } else {
               // Fallback if count is missing (shouldn't happen with count: 'exact')
               setHasMore(fetchedItems.length === ITEMS_PER_PAGE);
           }

      } catch (err) {
          console.error("Fetch Items Error:", err);
          if (err && typeof err === 'object') {
             console.error("Fetch Items Error Details:", JSON.stringify(err, null, 2));
          }
      } finally {
          setIsLoading(false);
          setIsLoadingMore(false);
          loadingLockRef.current = false;
      }
  };

  // --- EFFECT: Trigger Fetch on Filter Change ---
  useEffect(() => {
      setPage(1);
      // Debounce could be added here if search typing triggers this strictly
      const timeoutId = setTimeout(() => {
          fetchItems(1, true);
      }, 500); // 500ms debounce for typing/sliders

      return () => clearTimeout(timeoutId);
  }, [
      filters.category, filters.search, filters.sortBy, filters.minPrice, filters.maxPrice, 
      filters.listingType, filters.condition
      // Radius/Location ignored for server-side query as per plan/limitations
  ]);

  // --- Realtime Subscription (Bids) ---
  const handleRealtimeBid = React.useCallback((newBid: Bid) => {
      setBids(prev => [...prev, newBid]);

      setItems(prevItems => prevItems.map(item => {
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
  }, []);

  useBidRealtime(handleRealtimeBid);

  const loadMore = () => {
      if (isLoadingMore || !hasMore || loadingLockRef.current) return;
      const nextPage = page + 1;
      setPage(nextPage);
      fetchItems(nextPage, false);
  };

  const addItem = (newItem: Omit<Item, 'id' | 'createdAt' | 'bidCount'>) => {
    console.log("addItem - logic pending refactor in selling phase");
  };

  const updateItem = async (id: string, updates: Partial<Omit<Item, 'id' | 'createdAt' | 'bidCount'>>) => {
     const dbUpdates: any = {};
     if (updates.status) dbUpdates.status = updates.status;
     if (updates.title) dbUpdates.title = updates.title;

     const { error } = await (supabase.from('listings') as any).update(dbUpdates as any).eq('id', id);
     
     if (error) {
         console.error("Failed to update item:", error);
     } else {
         setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
     }
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const placeBid = async (itemId: string, amount: number, type: 'public' | 'private') => {
    if (!user) {
        console.error("Must be logged in to bid");
        return;
    }
    
    // Note: Validation (70% minimum, etc.) is already done in useBidding hook
    // We just need to insert into database and update local state
    
    // Find item if available (may not be in current filtered view)
    const item = items.find(i => i.id === itemId);
    
    // --- OPTIMISTIC UPDATE START ---
    // 1. Create a temporary bid object
    const optimisticBid: Bid = {
        id: `temp-${Date.now()}`,
        itemId: itemId,
        bidderId: user.id,
        amount: amount,
        status: 'pending',
        message: type === 'private' ? 'Private Bid' : 'Public Bid',
        createdAt: new Date().toISOString(),
        bidder: user
    } as unknown as Bid;

    // 2. Update local Bids state
    setBids(prev => [...prev, optimisticBid]);

    // 3. Update local Items state (only if item is in current view)
    if (item) {
        setItems(prevItems => prevItems.map(i => {
           if (i.id === itemId) {
               const currentMax = i.currentHighBid || 0;
               const isNewHigh = amount > currentMax;
               return {
                   ...i,
                   bidCount: i.bidCount + 1,
                   currentHighBid: isNewHigh ? amount : currentMax,
                   currentHighBidderId: isNewHigh ? user.id : i.currentHighBidderId
               };
           }
           return i;
        }));
    }
    // --- OPTIMISTIC UPDATE END ---

    // Debug logging
    console.log("[placeBid] Attempting upsert with:", {
        listing_id: itemId,
        bidder_id: user.id,
        amount: amount,
        type: type
    });

    // Use UPSERT to handle the unique constraint on (listing_id, bidder_id)
    // This allows users to update their existing bid instead of creating duplicates
    const { data, error } = await (supabase.from('bids') as any).upsert({
        listing_id: itemId,
        bidder_id: user.id,
        amount: amount,
        message: type === 'private' ? 'Private Bid' : 'Public Bid',
        status: 'pending'
    } as any, { 
        onConflict: 'listing_id,bidder_id'
    }).select();

    console.log("[placeBid] Supabase response - data:", data, "error:", error);

    // Check for error (Supabase returns null for no error, not empty object)
    if (error || !data || data.length === 0) {
        console.error("Failed to place bid:", { error, data, userId: user.id, itemId });
        // Rollback optimistic bids update
        setBids(prev => prev.filter(b => b.id !== optimisticBid.id));
        // Rollback items update if we modified it
        if (item) {
            setItems(prevItems => prevItems.map(i => {
                if (i.id === itemId) {
                    return {
                        ...i,
                        bidCount: Math.max(0, i.bidCount - 1),
                        // Note: We can't perfectly rollback high bid, but this is better than nothing
                    };
                }
                return i;
            }));
        }
        return;
    }
    
    // Add to watchlist on success
    if (!watchedItemIds.includes(itemId)) {
         setWatchedItemIds(prev => [...prev, itemId]);
    }
  };

  // --- EFFECT: Fetch Watchlist on Mount/User Change ---
  useEffect(() => {
    if (!user) {
        setWatchedItemIds([]);
        return;
    }

    const fetchWatchlist = async () => {
        const { data, error } = await supabase
            .from('watchlist')
            .select('listing_id')
            .eq('user_id', user.id);
        
        if (error) {
            console.error("Error fetching watchlist:", error);
        } else if (data) {
            setWatchedItemIds(data.map((row: any) => row.listing_id));
        }
    };

    fetchWatchlist();
  }, [user]);


  const toggleWatch = async (itemId: string) => {
    if (!user) {
        // UI fallback only? Or prompt login? For now just local until refresh or login check
        console.warn("User not logged in, watchlist is local-only temporarily");
        setWatchedItemIds(prev => 
          prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
        );
        return;
    }

    const isWatched = watchedItemIds.includes(itemId);
    
    // Optimistic Update
    setWatchedItemIds(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );

    if (isWatched) {
        // Remove
        const { error } = await supabase
            .from('watchlist')
            .delete()
            .match({ user_id: user.id, listing_id: itemId });
        
        if (error) {
            console.error("Failed to remove from watchlist:", error);
            // Rollback
            setWatchedItemIds(prev => [...prev, itemId]);
        }
    } else {
        // Add
        const { error } = await (supabase
            .from('watchlist') as any)
            .insert({ user_id: user.id, listing_id: itemId });
            
          if (error) {
            console.error("Failed to add to watchlist:", error);
             // Rollback
             setWatchedItemIds(prev => prev.filter(id => id !== itemId));
        }
    }
  };

  const setFilter = (key: keyof MarketplaceContextType['filters'], value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  const updateFilters = (updates: Partial<MarketplaceContextType['filters']>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  };

  const rejectBid = async (bidId: string) => {
      const { error } = await (supabase.from('bids') as any).update({ status: 'ignored' } as any).eq('id', bidId);
      if (error) console.error("Failed to reject bid", error);
      else setBids(prev => prev.map(b => b.id === bidId ? { ...b, status: 'ignored' } : b));
  };

  const acceptBid = async (bidId: string) => {
      const { error } = await (supabase.from('bids') as any).update({ status: 'accepted' } as any).eq('id', bidId);
      if (error) return undefined;
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
