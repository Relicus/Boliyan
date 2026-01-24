# Boliyan Performance Optimization Plan

> **Status:** Ready for Implementation  
> **Priority:** Critical  
> **Last Updated:** 2026-01-24

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Diagnosis](#problem-diagnosis)
3. [Architecture Overview](#architecture-overview)
4. [Phase 1: Quick Stabilization (COMPLETED)](#phase-1-quick-stabilization-completed)
5. [Phase 2A: Context Stabilization](#phase-2a-context-stabilization)
6. [Phase 2B: Direct DOM Updates for Realtime](#phase-2b-direct-dom-updates-for-realtime)
7. [Phase 3: Duplicate Timer Removal](#phase-3-duplicate-timer-removal)
8. [Phase 4: Image Optimization](#phase-4-image-optimization)
9. [Verification Checklist](#verification-checklist)
10. [Future Enhancements](#future-enhancements)

---

## Executive Summary

Boliyan is a real-time bidding marketplace where performance is critical. The current architecture suffers from excessive re-renders caused by:

1. **Unstable context references** — Functions recreated every render
2. **Cascade re-renders** — One context update triggers all consumers
3. **Duplicate timers** — Multiple components running their own intervals
4. **Full component re-renders** — When only specific elements need updates

### Target Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     OPTIMIZED REAL-TIME ARCHITECTURE                        │
│                                                                             │
│   Realtime Bid Event                                                        │
│         ↓                                                                   │
│   ┌─────────────┐     ┌─────────────────────────────────────────┐          │
│   │  Update     │────►│  Direct DOM Update (instant, no render) │          │
│   │  Context    │     │  - Bid count text                       │          │
│   │  State      │     │  - High bid price (triggers animation)  │          │
│   └─────────────┘     └─────────────────────────────────────────┘          │
│         │                                                                   │
│         ▼                                                                   │
│   Memoized Provider Value (stable functions via useCallback)               │
│         │                                                                   │
│         ▼                                                                   │
│   Only affected components re-render (if props actually changed)           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Problem Diagnosis

### Issue 1: Global Re-render Cascade

```
TimeContext (1s tick)
       ↓
useApp() creates NEW object every call
       ↓
ALL consumers re-render every second
```

### Issue 2: Unstable Function References

| Context | Functions NOT in useCallback | Impact |
|---------|------------------------------|--------|
| MarketplaceContext | 11 of 12 | HIGH |
| SearchContext | 3 of 7 | MEDIUM |
| ChatContext | 6 of 6 | HIGH |

### Issue 3: Duplicate Timers

| Component | Timer Interval | Duplicates |
|-----------|----------------|------------|
| TimeContext | 1000ms | 1 (global) |
| MyBidCard | 1000ms | N cards |
| DashboardClient | 1000ms | 1 |

### Issue 4: Full Component Re-renders

When a bid updates, the entire ItemCard re-renders instead of just the bid count/price elements.

---

## Architecture Overview

### Current Data Flow (Slow)

```
Bid Event → Context State → React Re-render → Virtual DOM Diff → DOM Update
           (causes cascade)  (expensive)      (unnecessary)
```

### Optimized Data Flow (Fast)

```
Bid Event → Context State (background) 
         → Direct DOM Update (instant, parallel)
```

### Key Principles

1. **Stable References**: All context functions wrapped in `useCallback`
2. **Memoized Providers**: Provider values wrapped in `useMemo`
3. **Direct DOM for Realtime**: Bypass React for instant visual updates
4. **Shared Timers**: One global timer, components subscribe

---

## Phase 1: Quick Stabilization (COMPLETED)

These changes have already been implemented:

### 1.1 TimeContext Heartbeat (100ms → 1000ms)

**File:** `apps/web/src/context/TimeContext.tsx`

```typescript
// BEFORE
setInterval(() => setNow(Date.now()), 100);

// AFTER
setInterval(() => setNow(Date.now()), 1000);
```

### 1.2 RollingPrice with Vanilla RAF

**File:** `apps/web/src/components/common/RollingPrice.tsx`

Replaced Framer Motion `animate()` with native `requestAnimationFrame` loop:
- Cubic ease-out: `1 - Math.pow(1 - progress, 3)`
- Direct `textContent` updates (no React re-render)
- Skip animation when price unchanged (rotation won't trigger animation)

### 1.3 TimerBadge Uses Shared Time

**File:** `apps/web/src/components/common/TimerBadge.tsx`

Removed local `setInterval`, now uses `useTime()` hook from TimeContext.

---

## Phase 2A: Context Stabilization

### Overview

Wrap all context functions in `useCallback` and memoize Provider values.

---

### File 1: MarketplaceContext.tsx

**Path:** `apps/web/src/context/MarketplaceContext.tsx`

#### Step 1: Add Refs for Stable State Access

Add after line ~74 (after state declarations):

```typescript
// Refs for stable callback access to frequently-changing state
const itemsByIdRef = useRef(itemsById);
const bidsByIdRef = useRef(bidsById);

useEffect(() => { itemsByIdRef.current = itemsById; }, [itemsById]);
useEffect(() => { bidsByIdRef.current = bidsById; }, [bidsById]);
// Note: watchedItemIdsRef already exists (lines 77-80)
```

#### Step 2: Wrap Functions in useCallback

**loadMore (line ~360):**
```typescript
const loadMore = useCallback(() => {
  if (isLoading || isLoadingMore || !hasMore || loadingLockRef.current) return;
  const nextPage = page + 1;
  setPage(nextPage);
  fetchItems(nextPage, false);
}, [isLoading, isLoadingMore, hasMore, page, fetchItems]);
```

**addItem (line ~368):**
```typescript
const addItem = useCallback((newItem: Omit<Item, 'id' | 'createdAt' | 'bidCount'>) => {
  console.log("addItem - logic pending refactor", newItem);
}, []);
```

**updateItem (line ~372):**
```typescript
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
```

**deleteItem (line ~392):**
```typescript
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
```

**placeBid (line ~408):**
```typescript
const placeBid = useCallback(async (itemId: string, amount: number, type: 'public' | 'private'): Promise<boolean> => {
  if (!user) {
    console.error("Must be logged in to bid");
    return false;
  }
  
  // Use refs for current state (stable callback)
  const originalItem = itemsByIdRef.current[itemId];
  const currentBids = bidsByIdRef.current;
  const existingBid = currentBids[`${itemId}-${user.id}`] || 
    Object.values(currentBids).find(b => b.itemId === itemId && b.bidderId === user.id);
  
  // ... rest of existing logic unchanged, but replace:
  // - itemsById with itemsByIdRef.current
  // - bidsById with bidsByIdRef.current
  
}, [user]);
```

**toggleWatch (line ~598):**
```typescript
const toggleWatch = useCallback(async (itemId: string) => {
  if (!user) {
    console.warn("User not logged in, watchlist is local-only temporarily");
    setWatchedItemIds(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
    return;
  }

  // Use ref for current watchlist state
  const isWatched = watchedItemIdsRef.current.includes(itemId);
  
  // Optimistic Update
  setWatchedItemIds(prev => 
    prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
  );

  if (isWatched) {
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .match({ user_id: user.id, listing_id: itemId });
    
    if (error) {
      console.error("Failed to remove from watchlist:", error);
      setWatchedItemIds(prev => [...prev, itemId]);
    } else {
      // Use ref for current bids
      const hasBid = Object.values(bidsByIdRef.current).some(
        b => b.itemId === itemId && b.bidderId === user.id
      );
      if (!hasBid) {
        setInvolvedIds(prev => prev.filter(id => id !== itemId));
      }
    }
  } else {
    const { error } = await supabase
      .from('watchlist')
      .insert({ user_id: user.id, listing_id: itemId });
        
    if (error) {
      console.error("Failed to add to watchlist:", error);
      setWatchedItemIds(prev => prev.filter(id => id !== itemId));
    } else {
      setInvolvedIds(prev => Array.from(new Set([...prev, itemId])));
    }
  }
}, [user]);
```

**setFilter (line ~650):**
```typescript
const setFilter = useCallback(<K extends keyof MarketplaceFilters>(key: K, value: MarketplaceFilters[K]) => {
  setFilters(prev => ({ ...prev, [key]: value }));
}, []);
```

**updateFilters (line ~653):**
```typescript
const updateFilters = useCallback((updates: Partial<MarketplaceContextType['filters']>) => {
  setFilters(prev => ({ ...prev, ...updates }));
}, []);
```

**rejectBid (line ~657):**
```typescript
const rejectBid = useCallback(async (bidId: string) => {
  const bidUpdates: BidUpdate = { status: 'ignored' };
  const { error } = await supabase
    .from('bids')
    .update(bidUpdates)
    .eq('id', bidId);
  
  if (error) {
    console.error("Failed to reject bid", error);
  } else {
    setBidsById(prev => {
      if (!prev[bidId]) return prev;
      return upsertEntity(prev, { ...prev[bidId], status: 'ignored' });
    });
  }
}, []);
```

**acceptBid (line ~670):**
```typescript
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
```

**confirmExchange (find in file):**
```typescript
const confirmExchange = useCallback(async (conversationId: string, role: 'buyer' | 'seller'): Promise<boolean> => {
  // ... existing logic unchanged
}, []);
```

#### Step 3: Memoize Provider Value

Replace the Provider return (line ~748-752):

```typescript
const contextValue = useMemo<MarketplaceContextType>(() => ({
  items,
  bids,
  itemsById,
  bidsById,
  feedIds,
  involvedIds,
  isLoading,
  isLoadingMore,
  hasMore,
  loadMore,
  addItem,
  updateItem,
  deleteItem,
  placeBid,
  toggleWatch,
  watchedItemIds,
  rejectBid,
  acceptBid,
  confirmExchange,
  filters,
  setFilter,
  updateFilters,
  lastBidTimestamp,
  setLastBidTimestamp,
  refreshInvolvedItems
}), [
  items,
  bids,
  itemsById,
  bidsById,
  feedIds,
  involvedIds,
  isLoading,
  isLoadingMore,
  hasMore,
  loadMore,
  addItem,
  updateItem,
  deleteItem,
  placeBid,
  toggleWatch,
  watchedItemIds,
  rejectBid,
  acceptBid,
  confirmExchange,
  filters,
  setFilter,
  updateFilters,
  lastBidTimestamp,
  setLastBidTimestamp,
  refreshInvolvedItems
]);

return (
  <MarketplaceContext.Provider value={contextValue}>
    {children}
  </MarketplaceContext.Provider>
);
```

---

### File 2: SearchContext.tsx

**Path:** `apps/web/src/context/SearchContext.tsx`

#### Step 1: Wrap Functions in useCallback

**setFilters (line ~68):**
```typescript
const setFiltersCallback = useCallback((newFilters: SearchFilters | ((prev: SearchFilters) => SearchFilters)) => {
  if (typeof newFilters === 'function') {
    setFiltersState(newFilters);
  } else {
    setFiltersState(newFilters);
  }
}, []);

// Rename existing setFilters state setter to setFiltersState
// Use setFiltersCallback as the exposed setFilters
```

**updateFilter (line ~72):**
```typescript
const updateFilter = useCallback(<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
  setFiltersState(prev => ({ ...prev, [key]: value }));
}, []);
```

**clearFilters (line ~76):**
```typescript
const clearFilters = useCallback(() => {
  setFiltersState({
    query: '',
    category: null,
    minPrice: null,
    maxPrice: null,
    sortBy: 'relevance',
    condition: 'all'
  });
}, []);
```

#### Step 2: Memoize Provider Value

Replace the Provider return (line ~413-433):

```typescript
const contextValue = useMemo(() => ({
  filters,
  setFilters: setFiltersCallback,
  updateFilter,
  clearFilters,
  searchResults,
  isSearching,
  totalResults,
  executeSearch,
  categories,
  fetchCategories,
  suggestions,
  fetchSuggestions,
  getSimilarItems,
}), [
  filters,
  setFiltersCallback,
  updateFilter,
  clearFilters,
  searchResults,
  isSearching,
  totalResults,
  executeSearch,
  categories,
  fetchCategories,
  suggestions,
  fetchSuggestions,
  getSimilarItems,
]);

return (
  <SearchContext.Provider value={contextValue}>
    {children}
  </SearchContext.Provider>
);
```

---

### File 3: ChatContext.tsx

**Path:** `apps/web/src/context/ChatContext.tsx`

#### Step 1: Add Ref for Conversations (for startConversation)

```typescript
const conversationsRef = useRef(conversations);
useEffect(() => { conversationsRef.current = conversations; }, [conversations]);
```

#### Step 2: Wrap Functions in useCallback

**loadMessages (line ~226):**
```typescript
const loadMessages = useCallback(async (conversationId: string) => {
  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
    
  if (data) {
    const newMsgs = data.map(transformMessage);
    setMessages(prev => {
      const ids = new Set(prev.map(m => m.id));
      const uniqueNew = newMsgs.filter((m) => !ids.has(m.id));
      return [...prev, ...uniqueNew];
    });
  }
}, []);
```

**sendMessage (line ~246):**
```typescript
const sendMessage = useCallback(async (conversationId: string, content: string) => {
  if (!user) return;
  
  // Optimistic Update
  const tempId = `temp-${Date.now()}`;
  const optimMsg: Message = {
    id: tempId,
    conversationId,
    senderId: user.id,
    content,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  setMessages(prev => [...prev, optimMsg]);

  // DB Insert
  const insertPayload: MessageInsert = {
    conversation_id: conversationId,
    sender_id: user.id,
    content
  };

  const { data, error } = await supabase
    .from('messages')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    setMessages(prev => prev.filter(m => m.id !== tempId));
    return;
  }

  if (data) {
    const realMsg = transformMessage(data);
    setMessages(prev => prev.map(m => m.id === tempId ? realMsg : m));
    
    const conversationUpdates: ConversationUpdate = {
      last_message: content,
      updated_at: new Date().toISOString()
    };
    await supabase
      .from('conversations')
      .update(conversationUpdates)
      .eq('id', conversationId);
  }
}, [user]);
```

**markAsRead (line ~291):**
```typescript
const markAsRead = useCallback(async (conversationId: string) => {
  if (!user) return;

  // Local Optimistic Update
  setMessages(prev => prev.map(m => 
    m.conversationId === conversationId && m.senderId !== user.id && !m.isRead 
      ? { ...m, isRead: true } 
      : m
  ));

  // DB Update
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', user.id)
    .is('is_read', false);

  if (error) {
    console.error("Failed to mark messages as read", error);
  }
}, [user]);
```

**subscribeToConversation (line ~173):**
```typescript
const subscribeToConversation = useCallback(async (conversationId: string) => {
  if (activeSubscriptions.current.has(conversationId)) return;

  const channel = supabase.channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        const newMsg = transformMessage(payload.new as MessageRow);
        setMessages(prev => (
          prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]
        ));
      }
    )
    .subscribe();

  activeSubscriptions.current.set(conversationId, channel);
}, []);
```

**unsubscribeFromConversation (line ~209):**
```typescript
const unsubscribeFromConversation = useCallback(async (conversationId: string) => {
  const channel = activeSubscriptions.current.get(conversationId);
  if (channel) {
    await supabase.removeChannel(channel);
    activeSubscriptions.current.delete(conversationId);
  }
}, []);
```

**startConversation (line ~314):**
```typescript
const startConversation = useCallback(async (
  bidId: string,
  itemId: string,
  bidderId: string,
  sellerId: string
) => {
  // Use ref for current conversations
  const existing = conversationsRef.current.find(
    c => c.itemId === itemId && c.bidderId === bidderId
  );
  if (existing) return existing.id;

  const insertPayload: ConversationInsert = {
    bid_id: bidId,
    listing_id: itemId,
    bidder_id: bidderId,
    seller_id: sellerId,
  };

  const { data, error } = await supabase
    .from('conversations')
    .insert(insertPayload)
    .select()
    .single();

  if (data) {
    const hydrated = await fetchHydratedConversation(data.id);
    if (hydrated) {
      setConversations(prev => 
        prev.some(c => c.id === hydrated.id) ? prev : [hydrated, ...prev]
      );
    }
    return data.id;
  } else if (error?.code === '23505') {
    const { data: exist } = await supabase
      .from('conversations')
      .select('*')
      .eq('listing_id', itemId)
      .eq('bidder_id', bidderId)
      .single();
      
    if (exist) {
      const hydrated = await fetchHydratedConversation(exist.id);
      if (hydrated) {
        setConversations(prev => 
          prev.some(c => c.id === hydrated.id) ? prev : [hydrated, ...prev]
        );
      }
      return exist.id;
    }
  }
  return undefined;
}, []);
```

#### Step 3: Memoize Provider Value

Replace the Provider return (line ~358-362):

```typescript
const contextValue = useMemo<ChatContextType>(() => ({
  conversations,
  messages,
  sendMessage,
  markAsRead,
  startConversation,
  loadMessages,
  subscribeToConversation,
  unsubscribeFromConversation
}), [
  conversations,
  messages,
  sendMessage,
  markAsRead,
  startConversation,
  loadMessages,
  subscribeToConversation,
  unsubscribeFromConversation
]);

return (
  <ChatContext.Provider value={contextValue}>
    {children}
  </ChatContext.Provider>
);
```

---

### File 4: store.tsx

**Path:** `apps/web/src/lib/store.tsx`

#### Step 1: Add useMemo and useCallback imports

```typescript
import React, { useMemo, useCallback } from 'react';
```

#### Step 2: Wrap acceptBidCompat in useCallback

Replace the inline function (line ~63-92):

```typescript
const acceptBidCompat = useCallback(async (bidId: string) => {
  await marketplace.acceptBid(bidId);
  
  const bid = marketplace.bids.find(b => b.id === bidId);
  if (!bid) return undefined;
  
  const item = marketplace.items.find(i => i.id === bid.itemId);
  if (!item) return undefined;

  const convId = await chat.startConversation(bidId, bid.itemId, bid.bidderId, item.sellerId);

  const activeChats = chat.conversations.filter(c => c.itemId === item.id);
  const isNew = !activeChats.some(c => c.bidderId === bid.bidderId);
  const count = activeChats.length + (isNew ? 1 : 0);

  if (count >= 3 && item.status !== 'hidden') {
    await marketplace.updateItem(item.id, { status: 'hidden' });
  }

  return convId;
}, [marketplace, chat]);
```

#### Step 3: Wrap setFilter in useCallback

Replace the inline function (line ~144-163):

```typescript
const setFilterCompat = useCallback((key: string, value: unknown) => {
  if (isMarketplaceFilterKey(key)) {
    marketplace.setFilter(key, value as MarketplaceFilters[typeof key]);
  }

  const searchKey = searchKeyMap[key as MarketplaceFilterKey];
  if (searchKey) {
    let searchValue = value as SearchFilters[typeof searchKey];
    if (searchKey === 'sortBy') {
      if (value === 'luxury') searchValue = 'price_high';
      if (value === 'trending') searchValue = 'newest';
      if (value === 'watchlist') return;
    }
    search.updateFilter(searchKey, searchValue);
  }
}, [marketplace.setFilter, search.updateFilter]);
```

#### Step 4: Memoize the return value

Wrap the entire return object (line ~119-165):

```typescript
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
  searchState: search,
  search: search,
  now: time.now,
  time: time,
  acceptBid: acceptBidCompat,
  isLoading: auth.isLoading,
  isMarketplaceLoading: marketplace.isLoading,
  setFilter: setFilterCompat,
}), [auth, marketplace, search, chat, time, reviews, acceptBidCompat, setFilterCompat]);
```

---

## Phase 2B: Direct DOM Updates for Realtime

### Overview

When a realtime bid arrives, update the DOM directly for instant visual feedback without waiting for React re-renders.

### File: useBidRealtime.ts

**Path:** `apps/web/src/hooks/useBidRealtime.ts`

#### Add Direct DOM Update Function

Add this helper function at the top of the file:

```typescript
/**
 * Directly update DOM elements for instant visual feedback.
 * This bypasses React for performance-critical realtime updates.
 */
function updateDOMForBid(itemId: string, newAmount: number, newBidCount: number) {
  // Update bid count display
  const bidCountEl = document.querySelector(`[data-bid-count="${itemId}"]`);
  if (bidCountEl) {
    bidCountEl.textContent = `${newBidCount} ${newBidCount === 1 ? 'Bid' : 'Bids'}`;
  }

  // Update high bid price (trigger RollingPrice animation)
  const highBidEl = document.querySelector(`[data-high-bid="${itemId}"]`);
  if (highBidEl) {
    const currentValue = parseFloat(highBidEl.getAttribute('data-value') || '0');
    if (newAmount > currentValue) {
      // Dispatch custom event to trigger RollingPrice animation
      highBidEl.setAttribute('data-value', String(newAmount));
      highBidEl.dispatchEvent(new CustomEvent('bid-update', { 
        detail: { newAmount, previousAmount: currentValue } 
      }));
    }
  }
}
```

#### Modify handleRealtimeBid

In the realtime handler, add direct DOM updates BEFORE state updates:

```typescript
const handleRealtimeBid = useCallback((payload: RealtimePostgresChangesPayload<BidRow>) => {
  if (payload.eventType !== 'INSERT') return;
  
  const newBid = payload.new as BidRow;
  const itemId = newBid.listing_id;
  
  // 1. DIRECT DOM UPDATE (instant, no React)
  // Calculate new bid count (estimate, will be corrected by state update)
  const currentItem = itemsByIdRef.current[itemId];
  if (currentItem) {
    const newBidCount = currentItem.bidCount + 1;
    updateDOMForBid(itemId, newBid.amount, newBidCount);
  }
  
  // 2. STATE UPDATE (React will reconcile, but UI already updated)
  // ... existing state update logic ...
  
}, [user, onBidReceived]);
```

### File: ItemCard.tsx

Add data attributes for direct DOM targeting:

```typescript
// For bid count display
<span 
  data-bid-count={item.id}
  className="..."
>
  {bidCount} {bidCount === 1 ? 'Bid' : 'Bids'}
</span>

// For high bid display (inside RollingPrice wrapper)
<div 
  data-high-bid={item.id} 
  data-value={config.currentHighBid || 0}
>
  <RollingPrice price={config.currentHighBid || 0} />
</div>
```

### File: RollingPrice.tsx (Optional Enhancement)

Add listener for external bid updates:

```typescript
useEffect(() => {
  const element = ref.current?.parentElement;
  if (!element) return;
  
  const handleExternalUpdate = (e: CustomEvent) => {
    const { newAmount } = e.detail;
    // Trigger animation to new amount
    animateToValue(newAmount);
  };
  
  element.addEventListener('bid-update', handleExternalUpdate as EventListener);
  return () => {
    element.removeEventListener('bid-update', handleExternalUpdate as EventListener);
  };
}, []);
```

---

## Phase 3: Duplicate Timer Removal

### File 1: MyBidCard.tsx

**Path:** `apps/web/src/components/dashboard/MyBidCard.tsx`

#### Before (lines 25-30):
```typescript
const [now, setNow] = useState(() => Date.now());

useEffect(() => {
  const timer = setInterval(() => setNow(Date.now()), 1000);
  return () => clearInterval(timer);
}, []);
```

#### After:
```typescript
import { useTime } from "@/context/TimeContext";

// In component:
const { now } = useTime();
```

---

### File 2: DashboardClient.tsx

**Path:** `apps/web/src/app/dashboard/DashboardClient.tsx`

#### Before (lines 36, 48-54):
```typescript
const [now, setNow] = useState<number | null>(null);

useEffect(() => {
  setNow(Date.now());
  const timer = setInterval(() => {
    setNow(Date.now());
  }, 1000);
  return () => clearInterval(timer);
}, []);
```

#### After:
```typescript
import { useTime } from "@/context/TimeContext";

// In component (for hydration safety):
const time = useTime();
const [now, setNow] = useState<number | null>(null);

useEffect(() => {
  setNow(time.now);
}, [time.now]);
```

---

## Phase 4: Image Optimization

### File: ItemCard.tsx

**Path:** `apps/web/src/components/marketplace/ItemCard.tsx`

Find the main image element (around line ~167) and add lazy loading:

#### Before:
```typescript
<img
  id={`item-card-${item.id}-image-main`}
  src={mainImage}
  alt={`${item.title} main image`}
  className="object-cover w-full h-full object-center"
/>
```

#### After:
```typescript
<img
  id={`item-card-${item.id}-image-main`}
  src={mainImage}
  alt={`${item.title} main image`}
  loading="lazy"
  decoding="async"
  className="object-cover w-full h-full object-center"
/>
```

---

## Verification Checklist

After each phase, run these commands:

### TypeScript Check
```bash
npm run typecheck --prefix apps/web
```

### Lint Check
```bash
npm run lint --prefix apps/web
```

### Build Check
```bash
npm run build --prefix apps/web
```

### Manual Testing

1. **Timer Test:** Open marketplace, observe CPU usage. Should be minimal.
2. **Bid Test:** Place a bid, verify animation is smooth and only affected card updates.
3. **Scroll Test:** Scroll through listings, verify smooth 60fps.
4. **Realtime Test:** Have two browsers open, place bid in one, verify instant update in other.

---

## Expected Performance Improvements

| Metric | Before | After |
|--------|--------|-------|
| Global re-renders/sec | 10 | 0 (unless data changes) |
| Timer instances | 15+ | 1 |
| Context cascade re-renders | Every tick | Only on actual data change |
| Realtime bid visual delay | ~100-200ms | ~16ms (1 frame) |
| Image initial load | All at once | Lazy (visible only) |

---

## Future Enhancements

### Consider for Phase 5+

1. **Zustand Migration:** Replace Context with Zustand for true selector-based subscriptions
2. **React Compiler:** When stable, enable React Compiler for automatic memoization
3. **Virtualized List:** For 100+ items, use react-window or similar
4. **Service Worker:** Cache API responses for instant repeat loads
5. **WebSocket Multiplexing:** Single connection for all realtime channels

---

## Appendix: Quick Reference

### useCallback Pattern
```typescript
const stableFunction = useCallback((arg: Type) => {
  // Use refs for frequently-changing state
  const currentState = stateRef.current;
  // Logic here
}, [/* only stable dependencies */]);
```

### useMemo Provider Pattern
```typescript
const contextValue = useMemo<ContextType>(() => ({
  state1,
  state2,
  stableFunction1,
  stableFunction2,
}), [state1, state2, stableFunction1, stableFunction2]);

return <Context.Provider value={contextValue}>{children}</Context.Provider>;
```

### Direct DOM Update Pattern
```typescript
const element = document.querySelector(`[data-id="${id}"]`);
if (element) {
  element.textContent = newValue; // Instant, no React
}
```

---

*Document created for Boliyan Performance Optimization*
