/**
 * useListingsPolling - Smart batched polling for new listings
 * 
 * Features:
 * 1. Polls every 30 seconds for new listings (only when sortBy: 'newest')
 * 2. Pauses when tab is hidden (saves resources)
 * 3. Shows "Continue browsing?" prompt after 5 minutes of inactivity
 * 4. Returns pending items count for UI notification
 * 
 * Note: This does NOT affect realtime subscriptions (bids, notifications)
 * which continue running in background via WebSocket.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Item } from '@/types';
import { MARKETPLACE_SELECT_COLUMNS, transformRows } from '@/context/marketplace-fetcher';

// Configuration
const POLL_INTERVAL_MS = 30_000; // 30 seconds
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const ACTIVITY_EVENTS = ['mousemove', 'scroll', 'click', 'keypress', 'touchstart'] as const;

interface UseListingsPollingOptions {
  enabled: boolean; // Only enable for sortBy: 'newest'
  onNewListings: (items: Item[]) => void;
}

interface UseListingsPollingReturn {
  pendingCount: number;
  pendingItems: Item[];
  loadPending: () => void;
  isPollingActive: boolean;
  showContinuePrompt: boolean;
  continueWatching: () => void;
  pauseUpdates: () => void;
}

export function useListingsPolling({
  enabled,
  onNewListings,
}: UseListingsPollingOptions): UseListingsPollingReturn {
  // State - SSR-safe defaults
  const [isPollingActive, setIsPollingActive] = useState(true);
  const [showContinuePrompt, setShowContinuePrompt] = useState(false);
  const [pendingItems, setPendingItems] = useState<Item[]>([]);

  // Refs for stable access without re-renders
  const lastFetchRef = useRef<string | null>(null);
  const lastActivityRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Derived state
  const pendingCount = pendingItems.length;

  // Update activity timestamp
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Dismiss prompt when user becomes active
  useEffect(() => {
    if (!showContinuePrompt) return;

    const dismissPrompt = () => {
      setShowContinuePrompt(false);
      updateActivity();
    };

    ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, dismissPrompt, { passive: true, once: true });
    });

    return () => {
      ACTIVITY_EVENTS.forEach(event => {
        window.removeEventListener(event, dismissPrompt);
      });
    };
  }, [showContinuePrompt, updateActivity]);

  // Fetch new listings since last fetch
  const fetchNewListings = useCallback(async (): Promise<Item[]> => {
    // Lazy initialize lastFetch
    if (lastFetchRef.current === null) {
      lastFetchRef.current = new Date().toISOString();
      return []; // First call just sets the baseline
    }

    try {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select(MARKETPLACE_SELECT_COLUMNS)
        .eq('status', 'active')
        .gt('created_at', lastFetchRef.current)
        .lte('go_live_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('[useListingsPolling] Fetch error:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Transform to Item type
      const items = transformRows(data);

      return items;
    } catch (err) {
      console.error('[useListingsPolling] Unexpected error:', err);
      return [];
    }
  }, []);

  // Main polling logic
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Don't poll if disabled or user paused
    if (!enabled || !isPollingActive) {
      return;
    }

    // Check if tab is visible (SSR-safe)
    const isVisible = typeof document !== 'undefined' ? !document.hidden : true;
    if (!isVisible) {
      return;
    }

    // Initialize activity tracker
    if (lastActivityRef.current === null) {
      lastActivityRef.current = Date.now();
    }

    const poll = async () => {
      // Check if tab is still visible
      if (document.hidden) {
        return;
      }

      // Check for inactivity
      const inactiveMs = Date.now() - (lastActivityRef.current ?? Date.now());
      if (inactiveMs > INACTIVITY_TIMEOUT_MS) {
        setShowContinuePrompt(true);
        return;
      }

      // Fetch new listings
      const newItems = await fetchNewListings();
      
      if (newItems.length > 0) {
        // Update the lastFetch timestamp
        lastFetchRef.current = new Date().toISOString();
        
        // Add to pending items
        setPendingItems(prev => {
          const existingIds = new Set(prev.map(i => i.id));
          const trulyNew = newItems.filter(i => !existingIds.has(i.id));
          return [...trulyNew, ...prev];
        });
      }
    };

    // Initial fetch
    poll();

    // Set up interval
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    // Visibility change handler
    const handleVisibility = () => {
      if (!document.hidden) {
        updateActivity();
        poll(); // Fetch immediately when tab becomes visible
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enabled, isPollingActive, fetchNewListings, updateActivity]);

  // Load pending items into the feed
  const loadPending = useCallback(() => {
    if (pendingItems.length > 0) {
      onNewListings(pendingItems);
      setPendingItems([]);
    }
  }, [pendingItems, onNewListings]);

  // Continue watching after inactivity prompt
  const continueWatching = useCallback(() => {
    setShowContinuePrompt(false);
    lastActivityRef.current = Date.now();
    setIsPollingActive(true);
  }, []);

  // Pause updates (user chose to stop)
  const pauseUpdates = useCallback(() => {
    setShowContinuePrompt(false);
    setIsPollingActive(false);
  }, []);

  return {
    pendingCount,
    pendingItems,
    loadPending,
    isPollingActive,
    showContinuePrompt,
    continueWatching,
    pauseUpdates,
  };
}
