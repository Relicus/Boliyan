"use client";

import React, { useCallback, useMemo, useState, useEffect } from "react";
import type { Bid } from "@/types";
import { WatchlistProvider } from "./WatchlistContext";
import { useWatchlist } from "./WatchlistContext";
import { BidProvider, type BidItemBridge } from "./BidContext";

// ---------------------------------------------------------------------------
// WatchlistProviderBridge — forwards onInvolvedChange via globalThis ref
// ---------------------------------------------------------------------------

export function WatchlistProviderBridge({ children }: { children: React.ReactNode }) {
  const onInvolvedChange = useCallback((action: 'add' | 'remove', itemId: string) => {
    const bridge = (globalThis as Record<string, unknown>).__marketplaceBridge as {
      onInvolvedChange?: React.RefObject<(action: 'add' | 'remove', itemId: string) => void>;
    } | undefined;
    bridge?.onInvolvedChange?.current?.(action, itemId);
  }, []);

  return (
    <WatchlistProvider onInvolvedChange={onInvolvedChange}>
      {children}
    </WatchlistProvider>
  );
}

// ---------------------------------------------------------------------------
// BidProviderBridge — wires bid events to MarketplaceCore via globalThis ref
// ---------------------------------------------------------------------------

export function BidProviderBridge({ children }: { children: React.ReactNode }) {
  const watchCtx = useWatchlist();

  // Bridge: forward bid events to MarketplaceCore via globalThis ref
  const bridge = useMemo<BidItemBridge>(() => ({
    onBidLanded: (bid: Bid) => {
      const mBridge = (globalThis as Record<string, unknown>).__bidBridge as {
        onBidLanded?: React.RefObject<(bid: Bid) => void>;
      } | undefined;
      mBridge?.onBidLanded?.current?.(bid);
    },
    onBidPlacedSuccess: (itemId: string) => {
      const mBridge = (globalThis as Record<string, unknown>).__bidBridge as {
        onBidPlacedSuccess?: React.RefObject<(itemId: string) => void>;
      } | undefined;
      mBridge?.onBidPlacedSuccess?.current?.(itemId);
    },
    onBidRollback: (itemId: string) => {
      const mBridge = (globalThis as Record<string, unknown>).__bidBridge as {
        onBidRollback?: React.RefObject<(itemId: string) => void>;
      } | undefined;
      mBridge?.onBidRollback?.current?.(itemId);
    },
  }), []);

  // Active IDs for realtime: get from viewport + involved (MarketplaceCore manages)
  // Since MarketplaceCore computes activeIds from visibleIds + involvedIds,
  // we need a way to pass them. Use a shared ref set by MarketplaceCore.
  const [activeIds] = useState(() => new Set<string>());

  useEffect(() => {
    (globalThis as Record<string, unknown>).__activeBidIds = activeIds;
    return () => {
      delete (globalThis as Record<string, unknown>).__activeBidIds;
    };
  }, [activeIds]);

  return (
    <BidProvider bridge={bridge} activeIds={activeIds} watchedItemIdsRef={watchCtx.watchedItemIdsRef}>
      {children}
    </BidProvider>
  );
}
