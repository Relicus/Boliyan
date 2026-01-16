"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Item, Bid } from "@/types";
import { mockItems, mockBids, mockUsers } from "@/lib/mock-data";
import { useAuth } from "./AuthContext";
import { useTime } from "./TimeContext";
import { supabase } from "@/lib/supabase";
import { transformListingToItem, ListingWithSeller } from "@/lib/transform";

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
  acceptBid: (bidId: string) => string | undefined;
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
  const { now } = useTime(); // Might be needed for sorting by ending soon (dynamic)

  // Initialize with empty array, will fetch from Supabase
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [bids, setBids] = useState<Bid[]>(mockBids);
  const [watchedItemIds, setWatchedItemIds] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
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

  // --- MOCK BACKEND SIMULATION HELPERS ---
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
        const seller = mockUsers.find(u => u.id === item.sellerId);
        if (seller?.location && filters.currentCoords) {
          const dist = getDistance(
            filters.currentCoords.lat,
            filters.currentCoords.lng,
            seller.location.lat,
            seller.location.lng
          );
          if (dist > filters.radius) return false;
        }
      }
      return true;
    });

    result = result.sort((a, b) => {
      const sellerA = mockUsers.find(u => u.id === a.sellerId);
      const sellerB = mockUsers.find(u => u.id === b.sellerId);

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
             const aIsHigh = a.currentHighBidderId === user.id;
             const bIsHigh = b.currentHighBidderId === user.id;
             if (aIsHigh && !bIsHigh) return -1;
             if (!aIsHigh && bIsHigh) return 1;

             const aHasBid = bids.some(bid => bid.itemId === a.id && bid.bidderId === user.id);
             const bHasBid = bids.some(bid => bid.itemId === b.id && bid.bidderId === user.id);
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

  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('listings')
        .select('*, profiles(*)');

      if (error) {
        console.error('Error fetching listings:', error);
        // Fallback to mock data if DB fails (or is empty) so UI doesn't break
        // This is optional, but good for "Zero to Hero" transition
        setAllItems(mockItems); 
      } else if (data) {
        const transformedItems = data.map(row => transformListingToItem(row as unknown as ListingWithSeller));
        setAllItems(transformedItems);
      }

      setIsLoading(false);
    };

    fetchItems();
  }, []); // Run once on mount

  // Local effect to handle Filtering & Pagination based on `allItems` state
  useEffect(() => {
    // When `allItems` or `filters` change, reset page to 1 and apply logic
    setPage(1);
    setHasMore(true);
    
    // Slight delay to simulate processing/network if needed, or instant
    const filtered = applyFiltersAndSort();
    const firstPage = filtered.slice(0, ITEMS_PER_PAGE);
    
    setItems(firstPage);
    setHasMore(firstPage.length < filtered.length);
  }, [
    allItems, // Re-run when DB data arrives
    filters.category, filters.search, filters.sortBy, filters.minPrice, filters.maxPrice, 
    filters.listingType, filters.locationMode, filters.radius,
  ]);

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);

    await new Promise(resolve => setTimeout(resolve, 800));

    const filtered = applyFiltersAndSort();
    const start = page * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const nextPage = filtered.slice(start, end);

    if (nextPage.length > 0) {
      setItems(prev => [...prev, ...nextPage]);
      setPage(prev => prev + 1);
      setHasMore(end < filtered.length);
    } else {
      setHasMore(false);
    }

    setIsLoadingMore(false);
  };

  const addItem = (newItem: Omit<Item, 'id' | 'createdAt' | 'bidCount'>) => {
    const item: Item = {
      ...newItem,
      id: `i${Date.now()}`,
      bidCount: 0,
      createdAt: new Date().toISOString(),
    };
    setAllItems(prev => [item, ...prev]);
    setItems(prev => [item, ...prev]);
  };
  const updateItem = (id: string, updates: Partial<Omit<Item, 'id' | 'createdAt' | 'bidCount'>>) => {
    const updater = (prevItems: Item[]) => prevItems.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    setAllItems(updater);
    setItems(updater);
  };

  const deleteItem = (id: string) => {
    const filterer = (prevItems: Item[]) => prevItems.filter(item => item.id !== id);
    setAllItems(filterer);
    setItems(filterer);
    setBids(prev => prev.filter(bid => bid.itemId !== id));
  };

  const placeBid = (itemId: string, amount: number, type: 'public' | 'private') => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const minBidAllowed = item.askPrice * 0.7;
    if (amount < minBidAllowed) {
      console.warn(`Attempted to place a bid (${amount}) lower than 70% of ask price (${minBidAllowed})`);
      return;
    }
    if (type === 'public' && item.currentHighBid && amount < item.currentHighBid) {
      console.warn("Attempted to place a bid lower than the current high bid");
      return;
    }
    if (item.sellerId === user.id) {
      console.warn("Attempted to bid on own item");
      return;
    }

    const newBid: Bid = {
      id: `b${Date.now()}`,
      itemId,
      bidderId: user.id,
      amount,
      status: 'pending',
      type,
      createdAt: new Date().toISOString(),
    };

    setBids(prev => [...prev, newBid]);

    const updateStats = (prevItems: Item[]) => prevItems.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          bidCount: item.bidCount + 1,
          currentHighBid: item.currentHighBid ? Math.max(item.currentHighBid, amount) : amount,
          currentHighBidderId: (!item.currentHighBid || amount > item.currentHighBid) ? user.id : item.currentHighBidderId
        };
      }
      return item;
    });

    setAllItems(updateStats);
    setItems(updateStats);

    setWatchedItemIds(prev => prev.includes(itemId) ? prev : [...prev, itemId]);
  };

  const toggleWatch = (itemId: string) => {
    setWatchedItemIds(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId) 
        : [...prev, itemId]
    );
  };

  // setFilter & updateFilters
  const setFilter = (key: keyof MarketplaceContextType['filters'], value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  const updateFilters = (updates: Partial<MarketplaceContextType['filters']>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  };

  const rejectBid = (bidId: string) => {
    setBids(prev => prev.map(b => 
      b.id === bidId ? { ...b, status: 'rejected' as const } : b
    ));
  };

  const acceptBid = (bidId: string) => {
    // This logic relies on starting a conversation, which is in ChatContext
    // The consumer (component) should call useChat().startConversation() after this succeeds,
    // OR we can pass a callback. For now, we'll return the conv ID if we had access, but we don't.
    // In this split architecture, MarketplaceContext handles the BID state update.
    
    // We update the bid state here:
    setBids(prev => prev.map(b => 
      b.id === bidId ? { ...b, status: 'accepted' as const } : b
    ));
    
    // The component calling this (e.g. valid bid card) will also need to call useChat().startConversation()
    // We return 'success' or the bid details to help the component know what to do.
    return undefined; // Deprecated return pattern, component handles orchestration
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
