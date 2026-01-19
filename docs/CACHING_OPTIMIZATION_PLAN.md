# Caching & Server Resource Optimization Plan

**Created:** 2026-01-19  
**Status:** Ready for Implementation  
**Priority:** High - Performance Critical

---

## Executive Summary

This plan outlines a multi-layered caching strategy to minimize server resource usage while maintaining real-time bid updates. The goal is to make category/filter switching feel instant by serving cached data while revalidating in the background.

---

## Current State Analysis

### Problems Identified

1. **No caching layer**: Every filter/category change triggers a fresh Supabase fetch
2. **Duplicate fetches**: `MarketplaceContext` and `SearchContext` fetch overlapping data independently
3. **Over-fetching**: Queries use `SELECT *` instead of specific columns
4. **Duplicate realtime channels**: Two separate channels listening to the same `bids` table
5. **No debounce on suggestions**: `fetchSuggestions` fires on every keystroke
6. **Categories fetched on every mount**: Static data treated as dynamic

### Current Data Flow

```
User changes filter
        ↓
┌─────────────────────────────┐
│  Debounce 500ms             │
└─────────────────────────────┘
        ↓
┌─────────────────────────────┐
│  Fetch from Supabase        │ ← Always hits server
│  + Fetch bids separately    │
└─────────────────────────────┘
        ↓
┌─────────────────────────────┐
│  Transform & Render         │
└─────────────────────────────┘
```

---

## Proposed Architecture

### Caching Layers

| Layer | Storage | Speed | TTL | Purpose |
|-------|---------|-------|-----|---------|
| **L1** | Memory (useRef Map) | < 1ms | Session | Hot cache for recent views |
| **L2** | IndexedDB (idb-keyval) | < 50ms | 5 minutes | Persistent across refreshes |
| **L3** | Supabase | Network | N/A | Source of truth |

### New Data Flow (SWR Pattern)

```
User changes filter
        ↓
┌─────────────────────────────┐
│  1. Generate cache key      │
│     from filter state       │
└─────────────────────────────┘
        ↓
┌─────────────────────────────┐
│  2. Check L1 (memory Map)   │ ← Instant (< 1ms)
│     HIT? → Render immediately
└─────────────────────────────┘
        ↓ miss
┌─────────────────────────────┐
│  3. Check L2 (IndexedDB)    │ ← Fast (< 50ms)
│     HIT? → Render immediately
│     Check if stale (> 5min) │
└─────────────────────────────┘
        ↓ miss or stale
┌─────────────────────────────┐
│  4. Background fetch from   │
│     Supabase (non-blocking) │
└─────────────────────────────┘
        ↓
┌─────────────────────────────┐
│  5. Update cache + UI       │
│     (merge with realtime)   │
└─────────────────────────────┘
        ↓
┌─────────────────────────────┐
│  6. Realtime subscription   │ ← Already exists
│     pushes bid updates      │
└─────────────────────────────┘
```

### Hybrid Strategy: Static vs Dynamic Data

| Data Type | Caching Strategy | Reason |
|-----------|------------------|--------|
| Item title, images, description | Cache aggressively (5 min TTL) | Rarely changes |
| Asked price, category | Cache aggressively | Set by seller, rarely changes |
| Bid count, high bid | **DO NOT CACHE** - Use realtime | Changes frequently |
| Seller info | Cache aggressively | Profile data is stable |

---

## Implementation Plan

### Phase 1: Core Caching (HIGH PRIORITY)

#### Task 1.1: Create Cache Utility
**File:** `apps/web/src/lib/cache.ts`

```typescript
// Proposed API
interface CacheOptions {
  ttl?: number;          // Time-to-live in ms (default: 5 minutes)
  namespace?: string;    // Prefix for cache keys
}

// Functions to implement
export function generateCacheKey(filters: object, page: number): string;
export async function getFromCache<T>(key: string): Promise<{ data: T | null; isStale: boolean }>;
export async function setCache<T>(key: string, data: T): Promise<void>;
export function clearCache(namespace?: string): Promise<void>;
```

**Implementation Details:**
- Use `idb-keyval` (already installed) for L2
- Use `Map<string, { data: T; timestamp: number }>` for L1
- Cache key = MD5 hash or JSON.stringify of filter object

#### Task 1.2: Integrate into MarketplaceContext
**File:** `apps/web/src/context/MarketplaceContext.tsx`

**Changes:**
1. Import cache utility
2. Before fetching, check cache
3. If cache hit and fresh, return immediately
4. If cache hit but stale, render cached → fetch in background
5. On successful fetch, update both caches
6. Realtime subscription continues to update bid values on cached items

**Key Code Location:** `fetchItems()` function (line 74-216)

#### Task 1.3: Integrate into SearchContext
**File:** `apps/web/src/context/SearchContext.tsx`

**Changes:**
- Same pattern as MarketplaceContext
- Key Code Location: `executeSearch()` function (line 66-216)

#### Task 1.4: Database Indexes
**Run in Supabase SQL Editor**

```sql
-- Performance indexes for filter queries
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_asked_price ON listings(asked_price);

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_listings_status_category ON listings(status, category);
CREATE INDEX IF NOT EXISTS idx_listings_status_created ON listings(status, created_at DESC);

-- Optimize bid lookups (critical for card rendering)
CREATE INDEX IF NOT EXISTS idx_bids_listing_id ON bids(listing_id);
CREATE INDEX IF NOT EXISTS idx_bids_listing_amount ON bids(listing_id, amount DESC);

-- Optimize watchlist queries
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_user_listing ON watchlist(user_id, listing_id);
```

---

### Phase 2: Payload Optimization (MEDIUM PRIORITY)

#### Task 2.1: Reduce SELECT Columns in MarketplaceContext

**Current (line 85):**
```typescript
.select('*, profiles(*)', { count: 'exact' })
```

**Optimized:**
```typescript
.select(`
  id,
  title,
  description,
  asked_price,
  images,
  category,
  auction_mode,
  status,
  created_at,
  location_city,
  location_lat,
  location_lng,
  seller_id,
  profiles!seller_id(id, name, avatar_url, rating)
`, { count: 'exact' })
```

#### Task 2.2: Reduce SELECT Columns in SearchContext

**Current (line 70-72):**
```typescript
.select('*, profiles(*)', { count: 'exact' })
```

**Optimized:** Same as above

#### Task 2.3: Create Bid Aggregation View/RPC

Instead of fetching all bids and computing max client-side:

**SQL View:**
```sql
CREATE OR REPLACE VIEW listing_bid_stats AS
SELECT 
  listing_id,
  COUNT(*) as bid_count,
  MAX(amount) as high_bid,
  (SELECT bidder_id FROM bids b2 
   WHERE b2.listing_id = bids.listing_id 
   ORDER BY amount DESC LIMIT 1) as high_bidder_id
FROM bids
WHERE status != 'rejected'
GROUP BY listing_id;
```

**Or Supabase RPC:**
```sql
CREATE OR REPLACE FUNCTION get_listings_with_stats(
  p_category TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'active',
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  -- ... other columns
  bid_count BIGINT,
  high_bid NUMERIC,
  high_bidder_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.*,
    COALESCE(bs.bid_count, 0),
    bs.high_bid,
    bs.high_bidder_id
  FROM listings l
  LEFT JOIN listing_bid_stats bs ON l.id = bs.listing_id
  WHERE l.status = p_status
    AND (p_category IS NULL OR l.category = p_category)
  ORDER BY l.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;
```

#### Task 2.4: Consolidate Realtime Channels

**Current State:**
- `MarketplaceContext.tsx:235` - Channel: `public:bids`
- `SearchContext.tsx:327` - Channel: `public:search_bids`

**Proposed:** Create a shared `BidRealtimeContext` or move to a shared hook:

**File:** `apps/web/src/context/BidRealtimeContext.tsx` (new)

```typescript
// Single channel, multiple subscribers
export function useBidUpdates(itemIds: string[], onBidUpdate: (bid) => void)
```

---

### Phase 3: Polish (LOW PRIORITY)

#### Task 3.1: Debounce fetchSuggestions

**File:** `SearchContext.tsx:246`

```typescript
// Add debounce ref
const suggestionDebounceRef = useRef<NodeJS.Timeout>();

const fetchSuggestions = useCallback(async (query: string) => {
  if (suggestionDebounceRef.current) {
    clearTimeout(suggestionDebounceRef.current);
  }
  
  suggestionDebounceRef.current = setTimeout(async () => {
    // ... existing logic
  }, 300); // 300ms debounce
}, [user, categories]);
```

#### Task 3.2: Cache Categories

Categories rarely change. Cache in IndexedDB with 24-hour TTL:

```typescript
// In fetchCategories()
const cached = await getFromCache<Category[]>('categories');
if (cached.data && !cached.isStale) {
  setCategories(cached.data);
  return;
}

// ... fetch from DB
await setCache('categories', data, { ttl: 24 * 60 * 60 * 1000 }); // 24 hours
```

#### Task 3.3: Prefetch Next Page

When user scrolls to 80% of the grid, prefetch next page into cache:

```typescript
// In MarketplaceGrid.tsx or MarketplaceContext
useEffect(() => {
  if (entry?.isIntersecting && hasMore && !isLoadingMore) {
    // Prefetch into cache without updating UI
    prefetchPage(page + 1);
  }
}, [entry]);
```

---

## Expected Outcomes

### Performance Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Category switch | 300-800ms | < 50ms | ~90% faster |
| Filter change | 500-1000ms | < 50ms | ~95% faster |
| Page refresh | 300-800ms | < 100ms | ~85% faster |
| Server requests | Every action | First load + stale | ~70-80% reduction |

### User Experience

- **Instant feedback**: UI updates immediately on filter changes
- **No loading spinners**: Cached data shown while fresh data loads
- **Real-time bids**: Bid values still update in real-time
- **Offline resilience**: Basic browsing works with cached data

---

## Files to Create/Modify

### New Files
```
apps/web/src/lib/cache.ts              # Caching utility
apps/web/docs/CACHING_OPTIMIZATION_PLAN.md  # This document
```

### Modified Files
```
apps/web/src/context/MarketplaceContext.tsx  # Add cache layer
apps/web/src/context/SearchContext.tsx       # Add cache layer
```

### Database Changes (SQL to run manually)
- Index creation script (provided above)
- Optional: Bid stats view/RPC

---

## Rollback Plan

If caching causes issues:

1. **Quick disable**: Add environment variable `DISABLE_CACHE=true`
2. **Clear user cache**: Provide a "Clear Cache" button in settings
3. **Full rollback**: Revert to previous context implementations

---

## Testing Checklist

- [ ] Cache hit returns data instantly
- [ ] Cache miss fetches from server
- [ ] Stale cache shows data + fetches in background
- [ ] Realtime bid updates work on cached items
- [ ] Filter changes use cached data
- [ ] Page refresh uses L2 cache
- [ ] New listings appear after cache expires
- [ ] Cache clears properly on logout

---

## Dependencies

- `idb-keyval` - Already installed (v6.2.2)
- No new dependencies required

---

## References

- [SWR Pattern](https://swr.vercel.app/)
- [IndexedDB via idb-keyval](https://github.com/jakearchibald/idb-keyval)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
