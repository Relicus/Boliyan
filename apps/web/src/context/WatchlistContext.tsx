"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WatchlistRow = Database['public']['Tables']['watchlist']['Row'];

interface WatchlistContextType {
  watchedItemIds: string[];
  toggleWatch: (itemId: string) => void;
  addToWatchlist: (itemId: string) => Promise<void>;
  /** Ref for stable access without re-renders (used by MarketplaceContext for watchlist sort) */
  watchedItemIdsRef: React.RefObject<string[]>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function WatchlistProvider({
  children,
  onInvolvedChange,
}: {
  children: React.ReactNode;
  /** Called when watchlist changes so MarketplaceContext can update involvedIds */
  onInvolvedChange?: (action: 'add' | 'remove', itemId: string) => void;
}) {
  const { user } = useAuth();

  const [watchedItemIds, setWatchedItemIds] = useState<string[]>([]);
  const watchedItemIdsRef = useRef<string[]>(watchedItemIds);

  useEffect(() => {
    watchedItemIdsRef.current = watchedItemIds;
  }, [watchedItemIds]);

  // Keep callback refs stable
  const onInvolvedChangeRef = useRef(onInvolvedChange);
  useEffect(() => { onInvolvedChangeRef.current = onInvolvedChange; }, [onInvolvedChange]);

  // --- Fetch Watchlist on Mount/User Change ---
  useEffect(() => {
    let cancelled = false;

    const fetchWatchlist = async () => {
      if (!user) {
        if (!cancelled) {
          setWatchedItemIds([]);
        }
        return;
      }

      const { data, error } = await supabase
        .from('watchlist')
        .select('listing_id')
        .eq('user_id', user.id);

      if (cancelled) {
        return;
      }

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

    return () => {
      cancelled = true;
    };
  }, [user]);

  const toggleWatch = useCallback(async (itemId: string) => {
    if (!user) {
      // UI fallback only (local-only temporarily)
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
        onInvolvedChangeRef.current?.('remove', itemId);
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
        onInvolvedChangeRef.current?.('add', itemId);
      }
    }
  }, [user]);

  /** Programmatic add (used by BidContext after successful bid) */
  const addToWatchlist = useCallback(async (itemId: string) => {
    if (!user || watchedItemIdsRef.current.includes(itemId)) return;
    setWatchedItemIds(prev => [...prev, itemId]);
    const { error } = await supabase
      .from('watchlist')
      .insert({ user_id: user.id, listing_id: itemId });
    if (error) console.error("Auto-add to watchlist failed:", error);
  }, [user]);

  const contextValue = useMemo<WatchlistContextType>(() => ({
    watchedItemIds,
    toggleWatch,
    addToWatchlist,
    watchedItemIdsRef,
  }), [watchedItemIds, toggleWatch, addToWatchlist]);

  return (
    <WatchlistContext.Provider value={contextValue}>
      {children}
    </WatchlistContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (context === undefined) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
}
