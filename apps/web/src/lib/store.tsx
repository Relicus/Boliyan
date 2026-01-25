"use client";

import React, { useMemo, useCallback } from 'react';
import { useAuth, AuthProvider } from '@/context/AuthContext';
import { useMarketplace, MarketplaceProvider } from '@/context/MarketplaceContext';
import { useChat, ChatProvider } from '@/context/ChatContext';
import { TimeProvider, useTime } from '@/context/TimeContext';
import { useSearch, SearchProvider } from '@/context/SearchContext';
import { useReviews, ReviewProvider } from '@/context/ReviewContext';
import { ViewportProvider } from '@/context/ViewportContext';
import { supabase } from '@/lib/supabase';
import { transformBidToHydratedBid, transformListingToItem, type BidWithProfile, type ListingWithSeller } from '@/lib/transform';

/* 
  LEGACY COMPATIBILITY LAYER
  This component now just aggregates the specific providers.
  The `useApp` hook aggregates the specific hooks to maintain API compatibility
  so we don't have to refactor every single component file immediately.
*/





export function AppProvider({ children }: { children: React.ReactNode }) {
  // We nest them carefully:
  // 1. Time (Global lowest level)
  // 2. Auth (User session needed for data)
  // 3. Marketplace & Chat & Search (Depend on Auth)
  
  return (
    <TimeProvider>
      <ViewportProvider>
        <AuthProvider>
          <SearchProvider>
            <MarketplaceProvider>
              <ChatProvider>
                <ReviewProvider>
                  {children}
                </ReviewProvider>
              </ChatProvider>
            </MarketplaceProvider>
          </SearchProvider>
        </AuthProvider>
      </ViewportProvider>
    </TimeProvider>
  );
}

// Re-export the legacy hook that combines everything
export function useApp() {
  const auth = useAuth();
  const marketplace = useMarketplace();
  const search = useSearch();

  const chat = useChat();
  const time = useTime();
  const reviews = useReviews();

  // Combine relevant methods to match the old interface
  // Note: 'acceptBid' in the old store did two things (update bid + start conv).
  // The new 'acceptBid' in MarketplaceContext only updates bid.
  // We patch it here for backward compatibility.
  
  const acceptBidCompat = useCallback(async (bidId: string) => {
    const updated = await marketplace.acceptBid(bidId);
    if (!updated) return undefined;

    const getBid = async () => {
      const existing = marketplace.bids.find(b => b.id === bidId);
      if (existing) return existing;

      const { data } = await supabase
        .from('bids')
        .select('*, profiles(*)')
        .eq('id', bidId)
        .single();

      if (!data) return undefined;
      return transformBidToHydratedBid(data as unknown as BidWithProfile);
    };

    const getItem = async (itemId: string) => {
      const existing = marketplace.items.find(i => i.id === itemId);
      if (existing) return existing;

      const { data } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('id', itemId)
        .single();

      if (!data) return undefined;
      return transformListingToItem(data as unknown as ListingWithSeller);
    };

    const bid = await getBid();
    if (!bid) return undefined;

    const item = await getItem(bid.itemId);
    if (!item) return undefined;

    // Start conversation via ChatContext
    const convId = await chat.startConversation(bidId, bid.itemId, bid.bidderId, item.sellerId);

    // 3-Chat Rule: Hide listing if 3rd chat is unlocked
    // Count unique conversations for this item
    // We filter from 'chat.conversations' which contains all chats for this user (Seller)
    const activeChats = chat.conversations.filter(c => c.itemId === item.id);
    
    // Safety check: Ensure we count the new one if not yet in state
    const isNew = !activeChats.some(c => c.bidderId === bid.bidderId);
    const count = activeChats.length + (isNew ? 1 : 0);

    if (count >= 3 && item.status !== 'hidden') {
        // Auto-hide the listing
        await marketplace.updateItem(item.id, { status: 'hidden' });
    }

    return convId;
  }, [marketplace, chat]);

  type MarketplaceFilters = typeof marketplace.filters;
  type MarketplaceFilterKey = keyof MarketplaceFilters;
  type SearchFilters = typeof search.filters;
  type SearchFilterKey = keyof SearchFilters;
  const setFilterCompat = useCallback((key: string, value: unknown) => {
      const marketplaceFilterKeys: MarketplaceFilterKey[] = [
        'category',
        'search',
        'minPrice',
        'maxPrice',
        'sortBy',
        'listingType',
        'condition',
        'radius'
      ];
      const searchKeyMap: Partial<Record<MarketplaceFilterKey, SearchFilterKey>> = {
        search: 'query',
        category: 'category',
        minPrice: 'minPrice',
        maxPrice: 'maxPrice',
        sortBy: 'sortBy',
        condition: 'condition'
      };
      const isMarketplaceFilterKey = (target: string): target is MarketplaceFilterKey =>
        marketplaceFilterKeys.includes(target as MarketplaceFilterKey);

      // Update Marketplace Context
      // Fix: Added 'radius' to allowed keys so location slider works
      if (isMarketplaceFilterKey(key)) {
        marketplace.setFilter(key, value as MarketplaceFilters[typeof key]);
      }

      // Update Search Context if it's a shared filter
      const searchKey = searchKeyMap[key as MarketplaceFilterKey];
      if (searchKey) {
        let searchValue = value as SearchFilters[typeof searchKey];
        if (searchKey === 'sortBy') {
          // Map Marketplace Sorts to Search Sorts
          if (value === 'luxury') searchValue = 'price_high';
          if (value === 'trending') searchValue = 'newest';
          if (value === 'watchlist') return; // Not supported in search
        }
        search.updateFilter(searchKey, searchValue);
      }
  }, [marketplace, search]);

  return useMemo(() => ({
    ...auth,
    ...marketplace,
    items: marketplace.items,
    bids: marketplace.bids,
    itemsById: marketplace.itemsById,
    bidsById: marketplace.bidsById,
    involvedIds: marketplace.involvedIds,
    ...chat,
    ...reviews,
    searchState: search, // Avoid name collision if any, or just spread?
    // Spreading might conflict with 'filters' in marketplace.
    // Let's namespace search or check if conflicts exist.
    // marketplace has 'filters' property. search has 'filters' property. CONFLICT.
    // We should probably NOT spread 'search' blindly if it conflicts.
    // Providing 'search' as a sub-object is safer.
    search: search,
    
    now: time.now, // Keep for legacy but we should move away
    time: time, // Expose raw time context if needed
    acceptBid: acceptBidCompat, // Override with composite function
    isLoading: auth.isLoading, // Stability Fix: Navbar should only load on AUTH check, not marketplace fetches
    isMarketplaceLoading: marketplace.isLoading, // Expose specific loading state if needed
    
    // Override setFilter to sync both contexts for shared filters
    setFilter: setFilterCompat
  }), [auth, marketplace, search, chat, time, reviews, acceptBidCompat, setFilterCompat]);
}
