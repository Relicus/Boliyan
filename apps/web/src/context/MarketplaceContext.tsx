"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Item, Bid } from "@/types";
import { useAuth } from "./AuthContext";
import { supabase } from "@/lib/supabase";
import { transformListingToItem, transformBidToHydratedBid, ListingWithSeller, BidWithProfile } from "@/lib/transform";
import { generateCacheKey, getFromCache, setCache } from "@/lib/cache";
import { useBidRealtime } from "@/hooks/useBidRealtime";
import { sonic } from "@/lib/sonic";
import type { Database } from "@/types/database.types";
import { normalize, upsertEntities, upsertEntity, removeEntity } from "@/lib/store-helpers";
import { useViewport } from "./ViewportContext";

interface MarketplaceFilters {

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

interface MarketplaceContextType {
  items: Item[];
  bids: Bid[];
  itemsById: Record<string, Item>;
  bidsById: Record<string, Bid>;
  feedIds: string[];
  involvedIds: string[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  addItem: (item: Omit<Item, 'id' | 'createdAt' | 'bidCount'>) => void;
  updateItem: (id: string, updates: Partial<Omit<Item, 'id' | 'createdAt' | 'bidCount'>>) => void;
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
  lastBidTimestamp: number | null;
  setLastBidTimestamp: (ts: number | null) => void;
  refreshInvolvedItems: () => Promise<void>;
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

type MarketplaceListingRow = Database['public']['Views']['marketplace_listings']['Row'];
type BidInsert = Database['public']['Tables']['bids']['Insert'];
type BidUpdate = Database['public']['Tables']['bids']['Update'];
type ListingUpdate = Database['public']['Tables']['listings']['Update'];
type WatchlistRow = Database['public']['Tables']['watchlist']['Row'];

export function MarketplaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { visibleIds } = useViewport();

  const [itemsById, setItemsById] = useState<Record<string, Item>>({});
  const [bidsById, setBidsById] = useState<Record<string, Bid>>({});
  const [feedIds, setFeedIds] = useState<string[]>([]);
  const [involvedIds, setInvolvedIds] = useState<string[]>([]);
  const [watchedItemIds, setWatchedItemIds] = useState<string[]>([]);
  
  // Refs for stable callback access to frequently-changing state
  // This prevents recreating 11+ functions on every state change
  const itemsByIdRef = useRef(itemsById);
  const bidsByIdRef = useRef(bidsById);
  const watchedItemIdsRef = useRef(watchedItemIds);

  useEffect(() => { itemsByIdRef.current = itemsById; }, [itemsById]);
  useEffect(() => { bidsByIdRef.current = bidsById; }, [bidsById]);
  
  // Fix: Use ref to access latest watchlist in fetchItems without triggering re-fetch loop
  useEffect(() => {
    watchedItemIdsRef.current = watchedItemIds;
  }, [watchedItemIds]);

  // Derived arrays for backward compatibility
  const items = useMemo(() => feedIds.map(id => itemsById[id]).filter(Boolean), [feedIds, itemsById]);
  const bids = useMemo(() => Object.values(bidsById), [bidsById]);

  // Combined IDs for realtime subscription (Participation + Viewport)
  const activeIds = useMemo(() => {
    const combined = new Set(visibleIds);
    involvedIds.forEach(id => combined.add(id));
    return combined;
  }, [visibleIds, involvedIds]);


  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [lastBidTimestamp, setLastBidTimestamp] = useState<number | null>(null);
  const loadingLockRef = React.useRef(false);
  const ITEMS_PER_PAGE = 8;

  const [filters, setFilters] = useState<MarketplaceFilters>({
    category: null,
    search: "",
    radius: 500,
    locationMode: 'country',
    city: "", // Changed from 'Karachi' to empty
    currentCoords: null,
    sortBy: 'trending',
    minPrice: null,
    maxPrice: null,
    condition: 'all',
    listingType: 'all',
  });

  // Load persistence & Auto-Locate on mount
  useEffect(() => {
    let mounted = true;
    const locationSetRef = { current: false };

    const setLocation = (lat: number, lng: number, city: string, isHighAccuracy: boolean = false) => {
        if (!mounted) return;
        
        // Don't downgrade accuracy: If we already have high accuracy (GPS), don't let IP overwrite it
        if (locationSetRef.current && !isHighAccuracy) {
             return;
        }
        
        setFilters(prev => ({
            ...prev,
            locationMode: 'current',
            currentCoords: { lat, lng },
            city: city
        }));
        
        locationSetRef.current = true;
        
        try {
            localStorage.setItem('boliyan_filters', JSON.stringify({
                radius: 500,
                locationMode: 'current',
                city: city,
                currentCoords: { lat, lng }
            }));
        } catch (e) { /* ignore */ }
    };

    const fetchIpLocation = async () => {
        // If GPS already set location, don't bother with IP
        if (locationSetRef.current) return;

        // Increased timeout to 8s for slower networks/APIs
        const fetchWithTimeout = async (url: string, timeout = 8000) => {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeout);
            try {
                const response = await fetch(url, { signal: controller.signal });
                clearTimeout(id);
                return response;
            } catch (err) {
                clearTimeout(id);
                throw err;
            }
        };

        try {
            // Primary: ipapi.co
            const res = await fetchWithTimeout('https://ipapi.co/json/');
            if (!res.ok) throw new Error('IP API failed');
            const data = await res.json();
            
            if (data.latitude && data.longitude && data.country_code === 'PK') {
                // Only update if GPS hasn't beaten us to it
                if (!locationSetRef.current) {
                    setLocation(parseFloat(data.latitude), parseFloat(data.longitude), data.city || "Unknown", false);
                }
                return;
            }
            throw new Error('Invalid IP location');
        } catch (err) {
            console.warn("Primary IP failed, trying backup...", err);
            // Backup: ipwho.is
            try {
                const res = await fetchWithTimeout('https://ipwho.is/');
                const data = await res.json();
                if (data.success && data.country_code === 'PK') {
                    if (!locationSetRef.current) {
                        setLocation(parseFloat(data.latitude), parseFloat(data.longitude), data.city || "Unknown", false);
                    }
                    return; // Success
                }
            } catch (e) {
                console.warn("All auto-locate methods failed");
            }
        }
    };

    const initializeLocation = async () => {
        try {
            const saved = localStorage.getItem('boliyan_filters');
            if (saved) {
                const parsed = JSON.parse(saved);
                
                // VALIDATION: Only restore if city is valid (not empty, not "Set Location")
                // If invalid, we ignore the saved state and proceed to auto-locate
                const isValidCity = parsed.city && 
                                    parsed.city !== "" && 
                                    parsed.city !== "Set Location" &&
                                    parsed.city !== "Locating...";

                if (isValidCity && mounted) {
                    setFilters(prev => ({
                        ...prev,
                        radius: parsed.radius ?? prev.radius,
                        locationMode: parsed.locationMode ?? prev.locationMode,
                        city: parsed.city,
                        currentCoords: parsed.currentCoords ?? prev.currentCoords
                    }));
                    locationSetRef.current = true;
                    // Intentionally NOT returning here.
                    // We restore the cached location for instant UI, but we CONTINUING to run auto-locate
                    // in the background to verify/update it if the user moved.
                }
            }

            // --- Parallel Strategy: Race IP and GPS ---
            
            // 1. Trigger IP fetch immediately (don't await)
            fetchIpLocation();

            // 2. Trigger GPS immediately
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        if (!mounted) return;
                        const { latitude, longitude } = position.coords;
                        
                        // Reverse geocode to get city name
                        try {
                            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
                            const data = await res.json();
                            const city = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || "Current Location";
                            
                            // GPS always overrides IP (pass true for isHighAccuracy)
                            setLocation(latitude, longitude, city, true);
                            locationSetRef.current = true;
                        } catch (e) {
                            setLocation(latitude, longitude, "Current Location", true);
                        }
                    },
                    (error) => {
                        console.log("GPS denied/unavailable", error);
                        // Do nothing, IP fetch is already running or finished
                    },
                    { timeout: 7000, maximumAge: 0 }
                );
            }

            // 3. Fail-safe timeout
            // If after 5 seconds neither has set location, default to "Set Location" prompt
            setTimeout(() => {
                if (mounted && !locationSetRef.current) {
                    console.log("Location initialization timed out, forcing default.");
                    setFilters(prev => ({ ...prev, city: 'Set Location', locationMode: 'country' }));
                }
            }, 5000);

        } catch (e) {
            console.warn("Failed to init filters", e);
        }
    };

    initializeLocation();

    return () => { mounted = false; };
  }, []);

  // Save persistence on change
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

  // --- HELPER FUNCTIONS ---
  // Note: Geolocation helper functions kept if needed for future hybrid sorting, 
  // though primary filtering is now Server-Side where possible.
  
  const fetchItems = useCallback(async (targetPage: number, reset: boolean = false) => {
      if (loadingLockRef.current) return;
      loadingLockRef.current = true;
      
      const cacheKey = generateCacheKey('marketplace', { ...filters, page: targetPage });
      let usedCache = false;

      // --- 1. CHECK CACHE (L1/L2) ---
      if (reset) {
          const { data: cachedItems, isStale } = await getFromCache<Item[]>(cacheKey);
          
          if (cachedItems) {
              setItemsById(prev => upsertEntities(prev, cachedItems));
              setFeedIds(cachedItems.map(i => i.id));
              setHasMore(cachedItems.length === ITEMS_PER_PAGE);
              setIsLoading(false);
              usedCache = true;
              
              if (!isStale) {
                  loadingLockRef.current = false;
                  return;
              }
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
            let query = supabase.from('marketplace_listings').select(`
                id,
                title,
                description,
                images,
                seller_id,
                asked_price,
                category,
                auction_mode,
                created_at,
                ends_at,
                go_live_at,
                search_vector,
                status,
                seller_name,
                seller_avatar,
                seller_rating,
                seller_rating_count,
                seller_location,
                bid_count,
                high_bid,
                high_bidder_id,
                condition,
                slug,
                contact_phone,
                location_lat,
                location_lng,
                location_address
            `, { count: 'exact' }).eq('status', 'active');

            query = query.lte('go_live_at', new Date().toISOString());

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
          } else if (filters.listingType === 'hidden') {
               // Match 'hidden' primarily, keeping 'sealed' as fallback for any legacy records
               query = query.in('auction_mode', ['hidden', 'sealed']);
          } // 'all' does nothing

           // --- APPLY SORT ---
           switch (filters.sortBy) {
              case 'trending': 
                  // Sort by bid_count (popularity), then by created_at (freshness)
                  query = query.order('bid_count', { ascending: false })
                               .order('created_at', { ascending: false });
                  break;
              
              case 'newest':
                  // Fix: Explicitly sort by date to prevent fall-through to luxury
                  query = query.order('created_at', { ascending: false });
                  break;

              case 'luxury':
                  query = query.order('asked_price', { ascending: false });
                  break;

              case 'watchlist':
                   // Fix: Filter by watched IDs using Ref to avoid dependency loop
                   const currentWatchedIds = watchedItemIdsRef.current;
                   if (currentWatchedIds.length > 0) {
                       query = query.in('id', currentWatchedIds);
                   } else {
                       // Return no results if watchlist is empty
                       query = query.eq('id', '00000000-0000-0000-0000-000000000000');
                   }
                   query = query.order('created_at', { ascending: false });
                   break;

              case 'ending_soon':
                  // Sort by ends_at ascending (soonest first)
                  // Note: 'ends_at' is available in the marketplace_listings view
                  query = query.order('ends_at', { ascending: true });
                  break;

              case 'nearest':
                  // Fallback: Default to newest until PostGIS is implemented
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

           if (listingsError) throw listingsError;

           let fetchedItems: Item[] = [];
            if (listingsData) {
                fetchedItems = (listingsData as unknown as MarketplaceListingRow[]).map((row) => transformListingToItem(row as unknown as ListingWithSeller));
            }

           // --- CLIENT-SIDE SORTING OVERRIDES ---
           // If 'watchlist' sort is selected, we might need to fetch more or re-sort client side 
           // since we can't easily join user specific watchlist state in simple query.

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
               // Fallback if count is missing (shouldn't happen with count: 'exact')
               setHasMore(fetchedItems.length === ITEMS_PER_PAGE);
           }

       } catch (err: unknown) {
           console.error("Fetch Items Error:", err);
           if (err && typeof err === 'object') {
              console.error("Fetch Items Error Details:", JSON.stringify(err, null, 2));
           }
       } finally {
          setIsLoading(false);
          setIsLoadingMore(false);
          loadingLockRef.current = false;
      }
  }, [filters, ITEMS_PER_PAGE]);

  // --- EFFECT: Trigger Fetch on Filter Change ---
  useEffect(() => {
      setPage(1);
      // Removed 500ms debounce - category/sort changes should be instant
      fetchItems(1, true);
  }, [fetchItems]);

  // --- Realtime Subscription (Bids) ---
  const handleRealtimeBid = useCallback((newBid: Bid) => {
      // Play sound if someone ELSE bids on an item the user is watching
      // Use ref to avoid re-subscription on watchlist toggle
      if (user && newBid.bidderId !== user.id && watchedItemIdsRef.current.includes(newBid.itemId)) {
          sonic.tick(); // Subtle notification
      }

      setBidsById(prev => {
          // Regression Guard: Protect optimistic state
          // If our local optimistic update is ahead of the server echo (due to latency/cache),
          // preserve the higher local count so beads don't flicker/reset.
          const existing = prev[newBid.id];
          if (existing) {
              const localCount = existing.update_count || 0;
              const serverCount = newBid.update_count || 0;
              
              if (localCount > serverCount) {
                  // Keep our local optimistic count
                  newBid.update_count = localCount;
              }
          }
          return upsertEntity(prev, newBid);
      });

      setItemsById(prevItems => {
        const item = prevItems[newBid.itemId];
        if (!item) return prevItems;

        const currentMax = item.currentHighBid || 0;
        const isNewHigh = newBid.amount > currentMax;
        const isSameHighBidder = item.currentHighBidderId === newBid.bidderId;

        const updatedItem = {
           ...item,
           bidCount: isSameHighBidder ? item.bidCount : item.bidCount + 1,
           currentHighBid: (isNewHigh || isSameHighBidder) ? newBid.amount : currentMax,
           currentHighBidderId: (isNewHigh || isSameHighBidder) ? newBid.bidderId : item.currentHighBidderId
        };

        return upsertEntity(prevItems, updatedItem);
      });
  }, [user]);

  useBidRealtime(handleRealtimeBid, activeIds, user?.id);

  const loadMore = useCallback(() => {
      // Prevent loading more if initial load is processing (isLoading)
      if (isLoading || isLoadingMore || !hasMore || loadingLockRef.current) return;
      const nextPage = page + 1;
      setPage(nextPage);
      fetchItems(nextPage, false);
  }, [isLoading, isLoadingMore, hasMore, page, fetchItems]);

  const addItem = useCallback((newItem: Omit<Item, 'id' | 'createdAt' | 'bidCount'>) => {
    console.log("addItem - logic pending refactor in selling phase", newItem);
  }, []);

  const updateItem = useCallback(async (id: string, updates: Partial<Omit<Item, 'id' | 'createdAt' | 'bidCount'>>) => {
     const dbUpdates: ListingUpdate = {};
     if (updates.status) dbUpdates.status = updates.status;
     if (updates.title) dbUpdates.title = updates.title;

      const { error } = await supabase
        .from('listings')
        .update(dbUpdates)
        .eq('id', id);
     
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
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);

    if (error) {
        console.error("Failed to delete item:", error);
    } else {
        setItemsById(prev => removeEntity(prev, id));
        setFeedIds(prev => prev.filter(fid => fid !== id));
        setInvolvedIds(prev => prev.filter(iid => iid !== id));
    }
  }, []);


  const placeBid = useCallback(async (itemId: string, amount: number, type: 'public' | 'private'): Promise<boolean> => {
    if (!user) {
        console.error("Must be logged in to bid");
        return false;
    }
    
    // Note: Validation (70% minimum, etc.) is already done in useBidding hook
    // We just need to insert into database and update local state
    
    // Find item if available (may not be in current filtered view)
    const originalItem = itemsByIdRef.current[itemId];
    const existingBid = bidsByIdRef.current[`${itemId}-${user.id}`] || Object.values(bidsByIdRef.current).find(b => b.itemId === itemId && b.bidderId === user.id);
    
    // --- OPTIMISTIC UPDATE START ---
    // 1. Create a temporary bid object
    const optimisticBid: Bid = {
        id: existingBid ? existingBid.id : `temp-${Date.now()}`,
        itemId: itemId,
        bidderId: user.id,
        amount: amount,
        status: 'pending',
        message: type === 'private' ? 'Private Bid' : 'Public Bid',
        createdAt: new Date().toISOString(),
        bidder: user,
        update_count: existingBid ? (existingBid.update_count || 0) + 1 : 0
    } as unknown as Bid;

    // 2. Update local Bids state
    setBidsById(prev => upsertEntity(prev, optimisticBid));

    // 3. Update local Items state
    if (originalItem) {
        const currentMax = originalItem.currentHighBid || 0;
        const isNewHigh = amount > currentMax;
        const updatedItem = {
            ...originalItem,
            bidCount: originalItem.bidCount + 1,
            currentHighBid: isNewHigh ? amount : currentMax,
            currentHighBidderId: isNewHigh ? user.id : originalItem.currentHighBidderId
        };
        setItemsById(prev => upsertEntity(prev, updatedItem));
    }
    // --- OPTIMISTIC UPDATE END ---


    // Use UPSERT to handle the unique constraint on (listing_id, bidder_id)
    // This allows users to update their existing bid instead of creating duplicates
    const bidPayload: BidInsert = {
      listing_id: itemId,
      bidder_id: user.id,
      amount: amount,
      message: type === 'private' ? 'Private Bid' : 'Public Bid',
      status: 'pending'
    };

    // Debug: Check auth state before making the call
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('[placeBid] Auth state:', {
      hasSession: !!sessionData.session,
      authUid: sessionData.session?.user?.id,
      appUserId: user.id,
      idsMatch: sessionData.session?.user?.id === user.id
    });

    const { data, error } = await supabase
      .from('bids')
      .upsert(bidPayload, { onConflict: 'listing_id,bidder_id' })
      .select();
    
    console.log('[placeBid] Supabase response:', { dataLength: data?.length, error, data });

    // Only trust the bid when Supabase confirms it.
    if (error || !data || data.length === 0) {
        console.error("Failed to place bid:", {
            message: error?.message || 'No data returned',
            details: error?.details,
            hint: error?.hint,
            dataLength: data?.length
        });
        
        // Handle Server-Level Cooldown Error
        if (error?.message?.includes('COOLDOWN_ACTIVE')) {
           setLastBidTimestamp(Date.now());
        }

        // Rollback optimistic bids update
        setBidsById(prev => {
             if (existingBid) {
                 return upsertEntity(prev, existingBid);
             }
             return removeEntity(prev, optimisticBid.id);
        });
        // Rollback items update if we modified it
        if (originalItem) {
            setItemsById(prev => upsertEntity(prev, originalItem));
        }

        return false;
    }
    
    // Add to involved and watchlist on success
    setInvolvedIds(prev => Array.from(new Set([...prev, itemId])));
    if (!watchedItemIdsRef.current.includes(itemId)) {
         setWatchedItemIds(prev => [...prev, itemId]);
         // Persist to database
         supabase
             .from('watchlist')
             .insert({ user_id: user.id, listing_id: itemId })
             .then(({ error }) => {
                 if (error) console.error("Auto-add to watchlist failed:", error);
             });
    }
    
    // Set global cooldown timestamp
    setLastBidTimestamp(Date.now());
    
    return true;
  }, [user]);

  // --- EFFECT: Fetch User Bids on Mount/User Change ---
  useEffect(() => {
    if (!user) {
        setBidsById({});
        return;
    }

    const fetchUserBids = async () => {
        // Fetch bids relevant to the user:
        // 1. Bids the user has placed (as a buyer)
        // 2. Bids placed on the user's listings (as a seller)
        // We split these into two queries for maximum reliability and better performance
        try {
            const [myBidsRes, incomingBidsRes] = await Promise.all([
                // Bids I made
                supabase
                    .from('bids')
                    .select('*, profiles(*)')
                    .eq('bidder_id', user.id),
                // Bids on my items
                supabase
                    .from('bids')
                    .select('*, profiles(*), listings!inner(seller_id)')
                    .eq('listings.seller_id', user.id)
            ]);

            if (myBidsRes.error) throw myBidsRes.error;
            if (incomingBidsRes.error) throw incomingBidsRes.error;

            const allBidsRaw = [...(myBidsRes.data || []), ...(incomingBidsRes.data || [])];
            
            // Deduplicate by ID
            const uniqueBidsMap = new Map();
            allBidsRaw.forEach(bid => uniqueBidsMap.set(bid.id, bid));
            const uniqueBids = Array.from(uniqueBidsMap.values());

            // Transform and hydrate
            const hydratedBids = uniqueBids.map(b => transformBidToHydratedBid(b as unknown as BidWithProfile));
            setBidsById(normalize(hydratedBids));

            // Sync lastBidTimestamp from server history for accurate cooldowns
            const myBids = hydratedBids.filter(b => b.bidderId === user.id);
            if (myBids.length > 0) {
                // Find the most recent bid timestamp
                const latestBidTime = Math.max(...myBids.map(b => new Date(b.createdAt).getTime()));
                setLastBidTimestamp(latestBidTime);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            console.error("Error fetching user bids:", message);
        }
    };

    fetchUserBids();
  }, [user]);

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
            const ids = (data as WatchlistRow[])
              .map((row) => row.listing_id)
              .filter((id): id is string => !!id);
            setWatchedItemIds(ids);
        }
    };

    fetchWatchlist();
  }, [user]);


  const toggleWatch = useCallback(async (itemId: string) => {
    if (!user) {
        // UI fallback only? Or prompt login? For now just local until refresh or login check
        console.warn("User not logged in, watchlist is local-only temporarily");
        setWatchedItemIds(prev => 
          prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
        );
        return;
    }

    const isWatched = watchedItemIdsRef.current.includes(itemId);
    
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
        } else {
            // Check if we should remove from involvedIds (only if no bid)
            const hasBid = Object.values(bidsByIdRef.current).some(b => b.itemId === itemId && b.bidderId === user.id);
            if (!hasBid) {
                setInvolvedIds(prev => prev.filter(id => id !== itemId));
            }
        }
    } else {
        // Add
        const { error } = await supabase
            .from('watchlist')
            .insert({ user_id: user.id, listing_id: itemId });
            
          if (error) {
            console.error("Failed to add to watchlist:", error);
             // Rollback
             setWatchedItemIds(prev => prev.filter(id => id !== itemId));
        } else {
            setInvolvedIds(prev => Array.from(new Set([...prev, itemId])));
        }
    }

  }, [user]);

  const setFilter = useCallback(<K extends keyof MarketplaceFilters>(key: K, value: MarketplaceFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateFilters = useCallback((updates: Partial<MarketplaceContextType['filters']>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  const rejectBid = useCallback(async (bidId: string) => {
      const bidUpdates: BidUpdate = { status: 'ignored' };
      const { error } = await supabase
        .from('bids')
        .update(bidUpdates)
        .eq('id', bidId);
      if (error) console.error("Failed to reject bid", error);
      else setBidsById(prev => {
          if (!prev[bidId]) return prev;
          return upsertEntity(prev, { ...prev[bidId], status: 'ignored' });
      });
  }, []);

  const acceptBid = useCallback(async (bidId: string) => {
      const bidUpdates: BidUpdate = { status: 'accepted' };
      const { error } = await supabase
        .from('bids')
        .update(bidUpdates)
        .eq('id', bidId);
      if (error) return undefined;
      setBidsById(prev => {
          if (!prev[bidId]) return prev;
          return upsertEntity(prev, { ...prev[bidId], status: 'accepted' });
      });
      return bidId;
  }, []);


  const confirmExchange = useCallback(async (conversationId: string, role: 'buyer' | 'seller') => {
    if (!user) return false;

    const timestamp = new Date().toISOString();
    const update: Database['public']['Tables']['conversations']['Update'] = role === 'seller' 
        ? { seller_confirmed_at: timestamp } 
        : { buyer_confirmed_at: timestamp };

    const { error } = await supabase
        .from('conversations')
        .update(update)
        .eq('id', conversationId);
        
    if (error) {
        console.error("Failed to confirm exchange:", error);
        return false;
    }
    return true;
  }, [user]);

  const refreshInvolvedItems = React.useCallback(async () => {
    if (!user) return;

    try {
      // Fetch item IDs from bids and watchlist
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

      // Fetch full item details for these IDs
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select('*')
        .in('id', allInvolvedIds);

      if (error) throw error;

      if (data) {
        const transformedItems = data.map(row => transformListingToItem(row as unknown as ListingWithSeller));
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

  const contextValue = useMemo<MarketplaceContextType>(() => ({
    items, bids, itemsById, bidsById, feedIds, involvedIds,
    isLoading, isLoadingMore, hasMore, loadMore, addItem,
    updateItem, deleteItem, placeBid, toggleWatch, watchedItemIds,
    rejectBid, acceptBid, confirmExchange, filters, setFilter,
    updateFilters, lastBidTimestamp, setLastBidTimestamp, refreshInvolvedItems
  }), [
    items, bids, itemsById, bidsById, feedIds, involvedIds,
    isLoading, isLoadingMore, hasMore, watchedItemIds, filters, lastBidTimestamp,
    // All functions now stable via useCallback
    loadMore, addItem, updateItem, deleteItem, placeBid, toggleWatch,
    rejectBid, acceptBid, confirmExchange, setFilter, updateFilters,
    setLastBidTimestamp, refreshInvolvedItems
  ]);

  return (
    <MarketplaceContext.Provider value={contextValue}>
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
