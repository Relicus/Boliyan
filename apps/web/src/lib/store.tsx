"use client";

import React from 'react';
import { useAuth, AuthProvider } from '@/context/AuthContext';
import { useMarketplace, MarketplaceProvider } from '@/context/MarketplaceContext';
import { useChat, ChatProvider } from '@/context/ChatContext';
import { TimeProvider } from '@/context/TimeContext';

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
  // 3. Marketplace & Chat (Depend on Auth)
  
  return (
    <TimeProvider>
      <AuthProvider>
        <MarketplaceProvider>
          <ChatProvider>
            {children}
          </ChatProvider>
        </MarketplaceProvider>
      </AuthProvider>
    </TimeProvider>
  );
}

// Re-export the legacy hook that combines everything
export function useApp() {
  const auth = useAuth();
  const marketplace = useMarketplace();
  const chat = useChat();

  // Combine relevant methods to match the old interface
  // Note: 'acceptBid' in the old store did two things (update bid + start conv).
  // The new 'acceptBid' in MarketplaceContext only updates bid.
  // We patch it here for backward compatibility.
  
  const acceptBidCompat = (bidId: string) => {
    marketplace.acceptBid(bidId);
    
    // Find the bid to get details for conversation
    const bid = marketplace.bids.find(b => b.id === bidId);
    if (!bid) return undefined;
    
    // Find item
    const item = marketplace.items.find(i => i.id === bid.itemId);
    if (!item) return undefined;

    // Start conversation via ChatContext
    return chat.startConversation(bidId, bid.itemId, bid.bidderId, item.sellerId);
  };

  return {
    ...auth,
    ...marketplace,
    ...chat,
    acceptBid: acceptBidCompat, // Override with composite function
    isLoading: marketplace.isLoading // Explicitly map common conflicts if any
  };
}
