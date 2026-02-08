"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Item, Bid } from "@/types";
import { useAuth } from "./AuthContext";
import { supabase } from "@/lib/supabase";
import { transformListingToItem, ListingWithSeller } from "@/lib/transform";
import { generateCacheKey, getFromCache, setCache } from "@/lib/cache";
import { useListingsPolling } from "@/hooks/useListingsPolling";
import { upsertEntities, upsertEntity, removeEntity } from "@/lib/store-helpers";
import { useViewport } from "./ViewportContext";
import { calculateDistance, sortByDistance } from "@/lib/searchUtils";
import { useBids } from "./BidContext";
import { useWatchlist } from "./WatchlistContext";
import { WatchlistProviderBridge, BidProviderBridge } from "./marketplace-bridges";
import { MARKETPLACE_SELECT_COLUMNS, transformRows } from "./marketplace-fetcher";

// Re-export types so existing consumers don't break
export type { MarketplaceFilters, MarketplaceContextType } from "./marketplace-types";
export { DEFAULT_MARKETPLACE_FILTERS } from "./marketplace-types";
import type { MarketplaceFilters, MarketplaceContextType } from "./marketplace-types";
import { DEFAULT_MARKETPLACE_FILTERS } from "./marketplace-types";

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// MarketplaceCore — the actual provider logic
// Runs INSIDE BidProvider + WatchlistProvider so it can consume both hooks.
// ---------------------------------------------------------------------------

function MarketplaceCore({ children }: { children: React.ReactNode }) {
  const { user, myLocation } = useAuth();
  const { visibleIds } = useViewport();

  // --- Import from split contexts ---
  const bidCtx = useBids();
  const watchCtx = useWatchlist();

  // --- Item state (stays here) ---
  const [itemsById, setItemsById] = useState<Record<string, Item>>({});
  const [feedIds, setFeedIds] = useState<string[]>([]);
  const [involvedIds, setInvolvedIds] = useState<string[]>([]);

  const itemsByIdRef = useRef(itemsById);
  useEffect(() => { itemsByIdRef.current = itemsById; }, [itemsById]);

  const initialSyncDone = useRef(false);

  // Derived arrays for backward compatibility
  const items = useMemo(() => feedIds.map(id => itemsById[id]).filter(Boolean), [feedIds, itemsById]);

  // Combined IDs for realtime subscription
  const activeIds = useMemo(() => {
    const combined = new Set(visibleIds);
    involvedIds.forEach(id => combined.add(id));
    return combined;
  }, [visibleIds, involvedIds]);

  useEffect(() => {
    const sharedActiveIds = (globalThis as Record<string, unknown>).__activeBidIds as Set<string> | undefined;
    if (!sharedActiveIds) return;
    sharedActiveIds.clear();
    activeIds.forEach((id) => sharedActiveIds.add(id));
  }, [activeIds]);

  // --- Expose bridge callbacks to BidContext via refs ---
  // BidContext calls these refs when bids land or succeed
  const onBidLandedRef = useRef<(bid: Bid) => void>(() => {});
  const onBidPlacedSuccessRef = useRef<(itemId: string) => void>(() => {});
  const onBidRollbackRef = useRef<(itemId: string) => void>(() => {});

  onBidLandedRef.current = useCallback((newBid: Bid) => {
    setItemsById(prevItems => {
      const item = prevItems[newBid.itemId];
      if (!item) return prevItems;

      const currentMax = item.currentHighBid || 0;
      const isNewHigh = newBid.amount > currentMax;
      const isSameHighBidder = item.currentHighBidderId === newBid.bidderId;
      const nextAttempts = (item.bidAttemptsCount ?? item.bidCount) + 1;

      const updatedItem = {
        ...item,
        bidCount: isSameHighBidder ? item.bidCount : item.bidCount + 1,
        bidAttemptsCount: nextAttempts,
        currentHighBid: (isNewHigh || isSameHighBidder) ? newBid.amount : currentMax,
        currentHighBidderId: (isNewHigh || isSameHighBidder) ? newBid.bidderId : item.currentHighBidderId
      };

      return upsertEntity(prevItems, updatedItem);
    });
  }, []);

  onBidPlacedSuccessRef.current = useCallback((itemId: string) => {
    setInvolvedIds(prev => Array.from(new Set([...prev, itemId])));
    void watchCtx.addToWatchlist(itemId);
  }, [watchCtx]);

  onBidRollbackRef.current = useCallback((itemId: string) => {
    void (async () => {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('id', itemId)
        .single();

      if (error || !data) return;

      const reconciledItem = transformListingToItem(data as unknown as ListingWithSeller);
      setItemsById(prev => upsertEntity(prev, reconciledItem));
    })();
  }, []);

  // Register bridge refs on BidContext (via the global that BidContext reads)
  useEffect(() => {
    (globalThis as Record<string, unknown>).__bidBridge = {
      onBidLanded: onBidLandedRef,
      onBidPlacedSuccess: onBidPlacedSuccessRef,
      onBidRollback: onBidRollbackRef,
    };
    return () => {
      delete (globalThis as Record<string, unknown>).__bidBridge;
    };
  }, []);

  const onInvolvedChangeRef = useRef<(action: 'add' | 'remove', itemId: string) => void>(() => {});

  onInvolvedChangeRef.current = useCallback((action: 'add' | 'remove', itemId: string) => {
    if (action === 'add') {
      setInvolvedIds(prev => Array.from(new Set([...prev, itemId])));
      return;
    }

    const stillHasBid = Object.values(bidCtx.bidsById).some((bid) => bid.itemId === itemId);
    if (stillHasBid) return;
    setInvolvedIds(prev => prev.filter(id => id !== itemId));
  }, [bidCtx.bidsById]);

  useEffect(() => {
    (globalThis as Record<string, unknown>).__marketplaceBridge = {
      onInvolvedChange: onInvolvedChangeRef,
    };
    return () => {
      delete (globalThis as Record<string, unknown>).__marketplaceBridge;
    };
  }, []);

  // --- Loading / Pagination ---
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [page, setPage] = useState(1);
  const pageRef = useRef(1);
  const [hasMore, setHasMore] = useState(true);
  const loadingLockRef = React.useRef(false);
  const inFlightFetchesRef = useRef(0);
  const fetchIntentIdRef = useRef(0);
  const ITEMS_PER_PAGE = 12;
  const NEWEST_CACHE_TTL_MS = 90_000;

  // --- Filters ---
  const [filters, setFilters] = useState<MarketplaceFilters>(DEFAULT_MARKETPLACE_FILTERS);
  const filtersRef = useRef(filters);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // 1. Initial Load: Restore saved browsing filters
  useEffect(() => {
    try {
      const saved = localStorage.getItem('boliyan_filters');
      if (saved) {
        const parsed = JSON.parse(saved);
        const isValidCity = parsed.city &&
          parsed.city !== "" &&
          parsed.city !== "Set Location" &&
          parsed.city !== "Locating...";

        if (isValidCity) {
          setFilters(prev => ({
            ...prev,
            radius: parsed.radius ?? prev.radius,
            locationMode: parsed.locationMode ?? prev.locationMode,
            city: parsed.city,
            currentCoords: parsed.currentCoords ?? prev.currentCoords
          }));
          initialSyncDone.current = true;
        }
      }
    } catch { /* ignore */ }
  }, []);

  // 2. Initial Sync: If no saved filter, match user's physical location
  useEffect(() => {
    if (!initialSyncDone.current && myLocation && !filters.currentCoords) {
      setFilters(prev => ({
        ...prev,
        city: myLocation.city,
        currentCoords: { lat: myLocation.lat, lng: myLocation.lng },
        locationMode: 'current'
      }));
      initialSyncDone.current = true;
    }
  }, [myLocation, filters.currentCoords]);

  // 3. Persist browsing filters on change
  useEffect(() => {
    try {
      const toSave = {
        radius: filters.radius,
        locationMode: filters.locationMode,
        city: filters.city,
        currentCoords: filters.currentCoords
      };
      localStorage.setItem('boliyan_filters', JSON.stringify(toSave));
    } catch (e) {
      console.warn("Failed to save filters", e);
    }
  }, [filters.radius, filters.locationMode, filters.city, filters.currentCoords]);

  // --- FETCH ITEMS ---
  const fetchItems = useCallback(async (targetPage: number, reset: boolean = false, force: boolean = false) => {
    const intentId = ++fetchIntentIdRef.current;
    const isSuperseded = () => fetchIntentIdRef.current !== intentId;

    if (loadingLockRef.current && !reset) {
      return;
    }

    inFlightFetchesRef.current += 1;
    loadingLockRef.current = true;

    const activeFilters = filtersRef.current;
    const cacheKey = generateCacheKey('marketplace', { ...activeFilters, page: targetPage });
    let usedCache = false;

    // --- 1. CHECK CACHE (L1/L2) ---
    if (reset && !force) {
      const cacheOptions = activeFilters.sortBy === 'newest' ? { ttl: NEWEST_CACHE_TTL_MS } : undefined;
      const { data: cachedItems, isStale } = await getFromCache<Item[]>(cacheKey, cacheOptions);

      if (cachedItems) {
        if (isSuperseded()) return;
        setItemsById(prev => upsertEntities(prev, cachedItems));
        setFeedIds(cachedItems.map(i => i.id));
        setIsLoading(false);
        usedCache = true;

        let serverQuery = supabase
          .from('marketplace_listings')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active')
          .lte('go_live_at', new Date().toISOString());

        if (activeFilters.category && activeFilters.category !== "All Items") {
          serverQuery = serverQuery.eq('category', activeFilters.category);
        }
        if (activeFilters.condition && activeFilters.condition !== 'all') {
          serverQuery = serverQuery.eq('condition', activeFilters.condition);
        }
        if (activeFilters.listingType === 'public') {
          serverQuery = serverQuery.eq('auction_mode', 'visible');
        } else if (activeFilters.listingType === 'hidden') {
          serverQuery = serverQuery.in('auction_mode', ['hidden', 'sealed']);
        }

        const { count: serverCount } = await serverQuery;
        if (isSuperseded()) return;

        if (serverCount !== null) {
          // Server count is authoritative — use it directly
          setHasMore(serverCount > cachedItems.length);
        } else {
          // Fallback heuristic only when count is unavailable
          setHasMore(cachedItems.length === ITEMS_PER_PAGE);
        }

        if (!isStale && (serverCount === null || serverCount <= cachedItems.length)) {
          return;
        }
        setIsRevalidating(true);
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
      let query = supabase.from('marketplace_listings').select(
        MARKETPLACE_SELECT_COLUMNS, { count: 'exact' }
      ).eq('status', 'active');

      query = query.lte('go_live_at', new Date().toISOString());

      // --- APPLY FILTERS ---
      if (activeFilters.category && activeFilters.category !== "All Items") {
        query = query.eq('category', activeFilters.category);
      }

      if (activeFilters.search) {
        const searchTerm = `%${activeFilters.search}%`;
        query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`);
      }

      if (activeFilters.minPrice !== null) {
        query = query.gte('asked_price', activeFilters.minPrice);
      }
      if (activeFilters.maxPrice !== null) {
        query = query.lte('asked_price', activeFilters.maxPrice);
      }

      if (activeFilters.condition && activeFilters.condition !== 'all') {
        query = query.eq('condition', activeFilters.condition);
      }

      if (activeFilters.listingType === 'public') {
        query = query.eq('auction_mode', 'visible');
      } else if (activeFilters.listingType === 'hidden') {
        query = query.in('auction_mode', ['hidden', 'sealed']);
      }

      // --- APPLY SORT ---
      switch (activeFilters.sortBy) {
        case 'trending':
          query = query.order('bid_count', { ascending: false })
            .order('created_at', { ascending: false });
          break;

        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;

        case 'luxury':
          query = query.order('asked_price', { ascending: false });
          break;

        case 'watchlist': {
          const currentWatchedIds = watchCtx.watchedItemIdsRef.current;
          if (currentWatchedIds && currentWatchedIds.length > 0) {
            query = query.in('id', currentWatchedIds);
          } else {
            query = query.eq('id', '00000000-0000-0000-0000-000000000000');
          }
          query = query.order('created_at', { ascending: false });
          break;
        }

        case 'ending_soon':
          query = query.order('ends_at', { ascending: true });
          break;

        case 'nearest':
          query = query.order('created_at', { ascending: false });
          break;

        default:
          query = query.order('created_at', { ascending: false });
      }

      // --- PAGINATION ---
      const from = (targetPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data: listingsData, error: listingsError, count } = await query;
      if (isSuperseded()) return;

      if (listingsError) throw listingsError;

      let fetchedItems: Item[] = [];
      if (listingsData) {
        let fetchedArr = transformRows(listingsData);

        // --- CLIENT-SIDE LOCATION FILTERING ---
        if (activeFilters.currentCoords && activeFilters.radius < 500) {
          const currentCoords = activeFilters.currentCoords;
          const isStrictLocationMode = activeFilters.sortBy === 'nearest';
          fetchedArr = fetchedArr.filter(item => {
            const itemLat = item.location?.lat;
            const itemLng = item.location?.lng;
            if (itemLat === undefined || itemLng === undefined) {
              return !isStrictLocationMode;
            }

            const dist = calculateDistance(
              currentCoords.lat,
              currentCoords.lng,
              itemLat,
              itemLng
            );
            return dist <= activeFilters.radius;
          });
        }

        // --- CLIENT-SIDE SORTING OVERRIDES ---
        if (activeFilters.sortBy === 'nearest' && activeFilters.currentCoords) {
          fetchedArr = sortByDistance(fetchedArr, activeFilters.currentCoords.lat, activeFilters.currentCoords.lng);
        }

        fetchedItems = fetchedArr;
      }

      // --- UPDATE STATE ---
      if (reset) {
        setItemsById(prev => upsertEntities(prev, fetchedItems));
        setFeedIds(fetchedItems.map(i => i.id));
        setCache(cacheKey, fetchedItems);
      } else {
        setItemsById(prev => upsertEntities(prev, fetchedItems));
        setFeedIds(prev => {
          const existingIds = new Set(prev);
          const trulyNewIds = fetchedItems.map(i => i.id).filter(id => !existingIds.has(id));
          return [...prev, ...trulyNewIds];
        });
        setCache(cacheKey, fetchedItems);
      }

      if (count !== null) {
        setHasMore((targetPage * ITEMS_PER_PAGE) < count);
      } else {
        setHasMore(fetchedItems.length === ITEMS_PER_PAGE);
      }

    } catch (err: unknown) {
      if (isSuperseded()) {
        return;
      }

      // Stop pagination on any error (e.g., 416 Range Not Satisfiable)
      setHasMore(false);

      const errorRecord = err && typeof err === 'object' ? err as Record<string, unknown> : null;
      const status = typeof errorRecord?.status === 'number' ? errorRecord.status : null;
      const code = typeof errorRecord?.code === 'string' ? errorRecord.code : null;
      const message = typeof errorRecord?.message === 'string' ? errorRecord.message : null;
      const details = typeof errorRecord?.details === 'string' ? errorRecord.details : null;
      const hint = typeof errorRecord?.hint === 'string' ? errorRecord.hint : null;
      const normalizedMessage = (message ?? '').toLowerCase();
      const normalizedDetails = (details ?? '').toLowerCase();
      const isRangeError =
        status === 416 ||
        code === 'PGRST103' ||
        normalizedMessage.includes('range') ||
        normalizedDetails.includes('range') ||
        normalizedDetails.includes('offset');

      if (isRangeError) {
        return;
      }

      const hasStructuredError = status !== null || Boolean(code || message || details || hint);
      if (!hasStructuredError) {
        console.warn("[MarketplaceContext] Fetch Items Error (unstructured):", err);
        return;
      }

      console.error("[MarketplaceContext] Fetch Items Error:", {
        status,
        code,
        message,
        details,
        hint,
        raw: err,
      });
    } finally {
      inFlightFetchesRef.current = Math.max(0, inFlightFetchesRef.current - 1);
      loadingLockRef.current = inFlightFetchesRef.current > 0;

      // Always clear loading flags when no fetches remain in-flight.
      // The isSuperseded guard correctly protects DATA writes (items, feedIds,
      // hasMore) higher up, but loading indicators must always resolve to
      // avoid stuck skeletons when multiple fetches race on mobile.
      if (!isSuperseded() || inFlightFetchesRef.current === 0) {
        setIsLoading(false);
        setIsLoadingMore(false);
        setIsRevalidating(false);
      }
    }
  }, [ITEMS_PER_PAGE, watchCtx.watchedItemIdsRef]);

  const refresh = useCallback(async () => {
    await fetchItems(1, true, true);
  }, [fetchItems]);

  // --- EFFECT: Trigger Fetch on Filter Change ---
  const filtersKey = JSON.stringify(filters);
  useEffect(() => {
    setPage(1);
    pageRef.current = 1;
    setHasMore(false); // Prevent stale loadMore before new fetch completes
    fetchItems(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  // --- LIVE FEED POLLING (New Listings) ---
  const handleNewListings = useCallback((newItems: Item[]) => {
    setItemsById(prev => upsertEntities(prev, newItems));
    setFeedIds(prev => {
      const existingIds = new Set(prev);
      const newIds = newItems.map(i => i.id).filter(id => !existingIds.has(id));
      return [...newIds, ...prev];
    });
  }, []);

  const {
    pendingCount,
    loadPending,
    isPollingActive,
    showContinuePrompt,
    continueWatching,
    pauseUpdates,
  } = useListingsPolling({
    enabled: filters.sortBy === 'newest',
    onNewListings: handleNewListings,
  });

  // Sync pageRef with page state
  useEffect(() => { pageRef.current = page; }, [page]);

  const loadMore = useCallback(() => {
    if (isLoading || isLoadingMore || !hasMore || loadingLockRef.current) return;
    const nextPage = pageRef.current + 1;
    pageRef.current = nextPage;
    setPage(nextPage);
    fetchItems(nextPage, false);
  }, [fetchItems, hasMore, isLoading, isLoadingMore]);

  const addItem = useCallback((_newItem: Omit<Item, 'id' | 'createdAt' | 'bidCount' | 'bidAttemptsCount'>) => {
    // TODO: Implement in selling phase
  }, []);

  const updateItem = useCallback(async (id: string, updates: Partial<Omit<Item, 'id' | 'createdAt' | 'bidCount' | 'bidAttemptsCount'>>) => {
    const { error } = await supabase.rpc('update_listing_fields', {
      p_listing_id: id,
      p_status: updates.status ?? null,
      p_title: updates.title ?? null
    });

    if (error) {
      console.error("Failed to update item:", error);
    } else {
      setItemsById(prev => {
        if (!prev[id]) return prev;
        return upsertEntity(prev, { ...prev[id], ...updates });
      });
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    const { error } = await supabase.rpc('delete_listing', { p_listing_id: id });

    if (error) {
      console.error("Failed to delete item:", error);
    } else {
      setItemsById(prev => removeEntity(prev, id));
      setFeedIds(prev => prev.filter(fid => fid !== id));
      setInvolvedIds(prev => prev.filter(iid => iid !== id));
    }
  }, []);

  const setFilter = useCallback(<K extends keyof MarketplaceFilters>(key: K, value: MarketplaceFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateFilters = useCallback((updates: Partial<MarketplaceContextType['filters']>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(prev => ({
      ...DEFAULT_MARKETPLACE_FILTERS,
      // Preserve location identity but clear restrictive radius
      locationMode: prev.locationMode,
      city: prev.city,
      currentCoords: prev.currentCoords,
    }));
  }, []);

  const refreshInvolvedItems = React.useCallback(async () => {
    if (!user) return;

    try {
      const [bidsRes, watchlistRes] = await Promise.all([
        supabase.from('bids').select('listing_id').eq('bidder_id', user.id),
        supabase.from('watchlist').select('listing_id').eq('user_id', user.id)
      ]);

      const bidItemIds = (bidsRes.data || []).map(b => b.listing_id).filter((id): id is string => !!id);
      const watchlistIds = (watchlistRes.data || []).map(w => w.listing_id).filter((id): id is string => !!id);

      const allInvolvedIds = Array.from(new Set([...bidItemIds, ...watchlistIds]));

      if (allInvolvedIds.length === 0) {
        setInvolvedIds([]);
        return;
      }

      const { data, error } = await supabase
        .from('marketplace_listings')
        .select('*')
        .in('id', allInvolvedIds);

      if (error) throw error;

      if (data) {
        const transformedItems = transformRows(data);
        setItemsById(prev => upsertEntities(prev, transformedItems));
        setInvolvedIds(allInvolvedIds);
      }
    } catch (err) {
      console.error("Error refreshing involved items:", err);
    }
  }, [user]);

  // Initial fetch of involved items
  useEffect(() => {
    refreshInvolvedItems();
  }, [refreshInvolvedItems]);

  const liveFeed = useMemo(() => ({
    pendingCount,
    loadPending,
    isPollingActive,
    showContinuePrompt,
    continueWatching,
    pauseUpdates,
  }), [pendingCount, loadPending, isPollingActive, showContinuePrompt, continueWatching, pauseUpdates]);

  // --- Aggregate context value (same shape as the original) ---
  const contextValue = useMemo<MarketplaceContextType>(() => ({
    items,
    bids: bidCtx.bids,
    itemsById,
    bidsById: bidCtx.bidsById,
    feedIds,
    involvedIds,
    isLoading, isLoadingMore, isRevalidating, hasMore, loadMore, addItem,
    updateItem, deleteItem,
    placeBid: bidCtx.placeBid,
    toggleWatch: watchCtx.toggleWatch,
    watchedItemIds: watchCtx.watchedItemIds,
    rejectBid: bidCtx.rejectBid,
    acceptBid: bidCtx.acceptBid,
    confirmExchange: bidCtx.confirmExchange,
    filters, setFilter,
    updateFilters, resetFilters,
    lastBidTimestamp: bidCtx.lastBidTimestamp,
    setLastBidTimestamp: bidCtx.setLastBidTimestamp,
    refreshInvolvedItems,
    refresh,
    liveFeed,
  }), [
    items, bidCtx.bids, itemsById, bidCtx.bidsById, feedIds, involvedIds,
    isLoading, isLoadingMore, isRevalidating, hasMore,
    watchCtx.watchedItemIds, filters, bidCtx.lastBidTimestamp,
    loadMore, addItem, updateItem, deleteItem,
    bidCtx.placeBid, watchCtx.toggleWatch,
    bidCtx.rejectBid, bidCtx.acceptBid, bidCtx.confirmExchange,
    setFilter, updateFilters, resetFilters,
    bidCtx.setLastBidTimestamp, refreshInvolvedItems, refresh, liveFeed,
  ]);

  return (
    <MarketplaceContext.Provider value={contextValue}>
      {children}
    </MarketplaceContext.Provider>
  );
}


// ---------------------------------------------------------------------------
// Public Provider — sets up: Watchlist → Bid → Core
// ---------------------------------------------------------------------------

export function MarketplaceProvider({ children }: { children: React.ReactNode }) {
  return (
    <WatchlistProviderBridge>
      <BidProviderBridge>
        <MarketplaceCore>{children}</MarketplaceCore>
      </BidProviderBridge>
    </WatchlistProviderBridge>
  );
}


// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMarketplace() {
  const context = useContext(MarketplaceContext);
  if (context === undefined) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return context;
}
