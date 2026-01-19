"use client";

import React from 'react';
import { useAuth, AuthProvider } from '@/context/AuthContext';
import { useMarketplace, MarketplaceProvider } from '@/context/MarketplaceContext';
import { useChat, ChatProvider } from '@/context/ChatContext';
import { TimeProvider, useTime } from '@/context/TimeContext';
import { useSearch, SearchProvider } from '@/context/SearchContext';
import { useReviews, ReviewProvider } from '@/context/ReviewContext';

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
  
  const acceptBidCompat = async (bidId: string) => {
    await marketplace.acceptBid(bidId);
    
    // Find the bid to get details for conversation
    const bid = marketplace.bids.find(b => b.id === bidId);
    if (!bid) return undefined;
    
    // Find item
    const item = marketplace.items.find(i => i.id === bid.itemId);
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
  };

  return {
    ...auth,
    ...marketplace,
    ...chat,
    ...reviews,
    searchState: search, // Avoid name collision if any, or just spread?
    // Spreading might conflict with 'filters' in marketplace.
    // Let's namespace search or check if conflicts exist.
    // marketplace has 'filters' property. search has 'filters' property. CONFLICT.
    // We should probably NOT spread 'search' blindly if it conflicts.
    // Providing 'search' as a sub-object is safer.
    search: search,
    
    now: time.now,
    acceptBid: acceptBidCompat, // Override with composite function
    isLoading: marketplace.isLoading, // Explicitly map common conflicts if any
    
    // Override setFilter to sync both contexts for shared filters
    setFilter: (key: string, value: any) => {
      // Update Marketplace Context
      if (key === 'category' || key === 'search' || key === 'minPrice' || key === 'maxPrice' || key === 'sortBy' || key === 'listingType' || key === 'condition') {
        marketplace.setFilter(key as any, value);
      }
      
      // Update Search Context if it's a shared filter
      const searchKeyMap: Record<string, string> = {
        'search': 'query',
        'category': 'category',
        'minPrice': 'minPrice',
        'maxPrice': 'maxPrice',
        'sortBy': 'sortBy',
        'condition': 'condition'
      };
      
      if (key in searchKeyMap) {
        let searchValue = value;
        if (key === 'sortBy') {
          // Map Marketplace Sorts to Search Sorts
          if (value === 'luxury') searchValue = 'price_high';
          if (value === 'trending') searchValue = 'newest';
          if (value === 'watchlist') return; // Not supported in search
        }
        search.updateFilter(searchKeyMap[key] as any, searchValue);
      }
    }
  };
}
