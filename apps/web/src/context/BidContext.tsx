"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Bid } from "@/types";
import { useAuth } from "./AuthContext";
import { supabase } from "@/lib/supabase";
import { transformBidToHydratedBid, BidWithProfile } from "@/lib/transform";
import { normalize, upsertEntity, removeEntity } from "@/lib/store-helpers";
import { useBidRealtime } from "@/hooks/useBidRealtime";
import { sonic } from "@/lib/sonic";
import type { Database } from "@/types/database.types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Callback MarketplaceContext provides so bid events can update item state */
export interface BidItemBridge {
  /** Called when a bid lands (realtime or local) so items can update high-bid */
  onBidLanded: (bid: Bid) => void;
  /** Called when a bid is successfully placed to auto-add item to watchlist/involved */
  onBidPlacedSuccess: (itemId: string) => void;
  /** Called when optimistic bid fails so item state can be reconciled */
  onBidRollback?: (itemId: string) => void;
}

interface BidContextType {
  bids: Bid[];
  bidsById: Record<string, Bid>;
  placeBid: (itemId: string, amount: number, type: 'public' | 'private') => Promise<boolean>;
  rejectBid: (bidId: string) => void;
  acceptBid: (bidId: string) => Promise<string | undefined>;
  confirmExchange: (conversationId: string, role: 'buyer' | 'seller') => Promise<boolean>;
  lastBidTimestamp: number | null;
  setLastBidTimestamp: (ts: number | null) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const BidContext = createContext<BidContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function BidProvider({
  children,
  bridge,
  activeIds,
  watchedItemIdsRef,
}: {
  children: React.ReactNode;
  bridge: BidItemBridge;
  activeIds: Set<string>;
  watchedItemIdsRef: React.RefObject<string[]>;
}) {
  const { user } = useAuth();

  const [bidsById, setBidsById] = useState<Record<string, Bid>>({});
  const bidsByIdRef = useRef(bidsById);
  useEffect(() => { bidsByIdRef.current = bidsById; }, [bidsById]);

  const bids = useMemo(() => Object.values(bidsById), [bidsById]);

  const [lastBidTimestamp, setLastBidTimestamp] = useState<number | null>(null);

  // Keep bridge ref stable so callbacks don't re-create
  const bridgeRef = useRef(bridge);
  useEffect(() => { bridgeRef.current = bridge; }, [bridge]);

  // --- Realtime Subscription (Bids) ---
  const handleRealtimeBid = useCallback((newBid: Bid) => {
    // Play sound if someone ELSE bids on an item the user is watching
    if (user && newBid.bidderId !== user.id && watchedItemIdsRef.current.includes(newBid.itemId)) {
      sonic.tick();
    }

    setBidsById(prev => {
      // Regression Guard: Protect optimistic state
      const existing = prev[newBid.id];
      if (existing) {
        const localCount = existing.update_count || 0;
        const serverCount = newBid.update_count || 0;
        if (localCount > serverCount) {
          newBid.update_count = localCount;
        }
      }
      return upsertEntity(prev, newBid);
    });

    // Bridge: let MarketplaceContext update item high-bid
    bridgeRef.current.onBidLanded(newBid);
  }, [user, watchedItemIdsRef]);

  useBidRealtime(handleRealtimeBid, activeIds, user?.id);

  // --- Fetch User Bids on Mount/User Change ---
  useEffect(() => {
    if (!user) {
      setBidsById({});
      return;
    }

    const fetchUserBids = async () => {
      try {
        const [myBidsRes, incomingBidsRes] = await Promise.all([
          supabase
            .from('bids')
            .select('*, profiles(*)')
            .eq('bidder_id', user.id),
          supabase
            .from('bids')
            .select('*, profiles(*), listings!inner(seller_id)')
            .eq('listings.seller_id', user.id)
        ]);

        if (myBidsRes.error) throw myBidsRes.error;
        if (incomingBidsRes.error) throw incomingBidsRes.error;

        const allBidsRaw = [...(myBidsRes.data || []), ...(incomingBidsRes.data || [])];
        const uniqueBidsMap = new Map();
        allBidsRaw.forEach(bid => uniqueBidsMap.set(bid.id, bid));
        const uniqueBids = Array.from(uniqueBidsMap.values());

        const hydratedBids = uniqueBids.map(b => transformBidToHydratedBid(b as unknown as BidWithProfile));
        setBidsById(normalize(hydratedBids));

        // Sync lastBidTimestamp from server history for accurate cooldowns
        const myBids = hydratedBids.filter(b => b.bidderId === user.id);
        if (myBids.length > 0) {
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

  // --- Place Bid ---
  const placeBid = useCallback(async (itemId: string, amount: number, type: 'public' | 'private'): Promise<boolean> => {
    if (!user) {
      console.error("Must be logged in to bid");
      return false;
    }

    const existingBid = Object.values(bidsByIdRef.current).find(b => b.itemId === itemId && b.bidderId === user.id);

    // --- OPTIMISTIC UPDATE ---
    const optimisticBidId = existingBid ? existingBid.id : `temp-${Date.now()}`;
    const optimisticBid: Bid = {
      id: optimisticBidId,
      itemId: itemId,
      bidderId: user.id,
      amount: amount,
      status: 'pending',
      message: type === 'private' ? 'Private Bid' : 'Public Bid',
      createdAt: new Date().toISOString(),
      bidder: user,
      update_count: existingBid ? (existingBid.update_count || 0) + 1 : 0
    } as unknown as Bid;

    setBidsById(prev => upsertEntity(prev, optimisticBid));

    // Bridge: let MarketplaceContext do optimistic item update
    bridgeRef.current.onBidLanded(optimisticBid);

    const { data, error } = await supabase.rpc('place_bid', {
      p_listing_id: itemId,
      p_amount: amount,
      p_message: type === 'private' ? 'Private Bid' : 'Public Bid'
    });



    if (error || !data) {
      console.error("Failed to place bid:", {
        message: error?.message || 'No data returned',
        details: error?.details,
        hint: error?.hint,
        dataPresent: !!data
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

      bridgeRef.current.onBidRollback?.(itemId);
      return false;
    }

    const bidRow = data as Database['public']['Tables']['bids']['Row'];
    const resolvedBid: Bid = {
      id: bidRow.id,
      itemId: bidRow.listing_id || itemId,
      bidderId: bidRow.bidder_id || user.id,
      bidder: user,
      amount: Number(bidRow.amount ?? amount),
      status: (bidRow.status || 'pending') as Bid['status'],
      type: type === 'private' ? 'private' : 'public',
      createdAt: bidRow.created_at || new Date().toISOString(),
      update_count: bidRow.update_count ?? optimisticBid.update_count
    };

    setBidsById(prev => {
      const next = { ...prev };
      if (optimisticBidId !== resolvedBid.id) {
        delete next[optimisticBidId];
      }
      return upsertEntity(next, resolvedBid);
    });

    // Bridge: let MarketplaceContext add to involved + watchlist
    bridgeRef.current.onBidPlacedSuccess(itemId);

    // Set global cooldown timestamp
    setLastBidTimestamp(Date.now());

    return true;
  }, [user]);

  // --- Reject Bid ---
  const rejectBid = useCallback(async (bidId: string) => {
    const { error } = await supabase.rpc('reject_bid', { p_bid_id: bidId });
    if (error) console.error("Failed to reject bid", error);
    else setBidsById(prev => {
      if (!prev[bidId]) return prev;
      return upsertEntity(prev, { ...prev[bidId], status: 'ignored' });
    });
  }, []);

  // --- Accept Bid ---
  const acceptBid = useCallback(async (bidId: string) => {
    const { data, error } = await supabase.rpc('accept_bid', { p_bid_id: bidId });
    if (error || !data) return undefined;
    const result = Array.isArray(data) ? data[0] : data;
    if (!result?.conversation_id) return undefined;
    setBidsById(prev => {
      if (!prev[bidId]) return prev;
      return upsertEntity(prev, { ...prev[bidId], status: 'accepted' });
    });
    return result.conversation_id as string;
  }, []);

  // --- Confirm Exchange ---
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

  const contextValue = useMemo<BidContextType>(() => ({
    bids,
    bidsById,
    placeBid,
    rejectBid,
    acceptBid,
    confirmExchange,
    lastBidTimestamp,
    setLastBidTimestamp,
  }), [
    bids, bidsById, placeBid, rejectBid, acceptBid,
    confirmExchange, lastBidTimestamp
  ]);

  return (
    <BidContext.Provider value={contextValue}>
      {children}
    </BidContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useBids() {
  const context = useContext(BidContext);
  if (context === undefined) {
    throw new Error('useBids must be used within a BidProvider');
  }
  return context;
}
