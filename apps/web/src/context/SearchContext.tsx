'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import type { Item, Bid } from '@/types';
import type { SearchFilters, Category, SearchSuggestion } from '@/types';
import { sortByDistance, calculateDistance } from '@/lib/searchUtils';
import { generateCacheKey, getFromCache, setCache } from '@/lib/cache';
import { useBidRealtime } from '@/hooks/useBidRealtime';
import { useViewport } from './ViewportContext';
import type { Database } from '@/types/database.types';
import { transformListingToItem, ListingWithSeller } from '@/lib/transform';
import { MARKETPLACE_SELECT_COLUMNS, transformRows } from '@/context/marketplace-fetcher';

interface SearchContextType {

  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  updateFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
  clearFilters: () => void;
  
  searchResults: Item[];
  isSearching: boolean;
  totalResults: number;
  
  executeSearch: () => Promise<void>;
  
  categories: Category[];
  fetchCategories: () => Promise<void>;
  
  suggestions: SearchSuggestion[];
  fetchSuggestions: (query: string) => Promise<void>;
  
  getSimilarItems: (item: Item) => Promise<Item[]>;
}

const defaultFilters: SearchFilters = {
  query: '',
  category: undefined,
  minPrice: undefined,
  maxPrice: undefined,
  location: undefined,
  sortBy: 'newest',
  status: 'active',
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);


type ListingRow = Database['public']['Tables']['listings']['Row'];
type CategoryRow = Database['public']['Tables']['categories']['Row'];
type SearchHistoryRow = Database['public']['Tables']['search_history']['Row'];
type CategoryCountRow = Pick<ListingRow, 'category'>;
type SearchHistoryQueryRow = Pick<SearchHistoryRow, 'query'>;

export function SearchProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { visibleIds } = useViewport();
  
  const [filters, setFiltersState] = useState<SearchFilters>(defaultFilters);

  const [searchResults, setSearchResults] = useState<Item[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const lastQueryRef = useRef<string>("");

  const setFilters = useCallback((newFilters: SearchFilters) => {
    setFiltersState(newFilters);
  }, []);

  const updateFilter = useCallback(<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, []);

  const executeSearch = useCallback(async () => {
    // Generate cache key
    const cacheKey = generateCacheKey('search', filters as Record<string, unknown>);
    
    // --- 1. CHECK CACHE (L1/L2) ---
    // Only use cache if not page 1? Wait, search is always page 1 currently (no pagination in UI yet)
    // SWR pattern
    // We can't await easily inside a synchronous-looking start, but we can set state
    // For search, we might want to check cache first before setting isSearching=true?
    // Actually, setting isSearching=true is fine, then we check cache.
    setIsSearching(true);
    
    const { data: cachedItems, isStale } = await getFromCache<Item[]>(cacheKey);
    if (cachedItems) {
        setSearchResults(cachedItems);
        // Note: totalResults might be inaccurate if we don't cache it too, but Item[] is main thing
        setTotalResults(cachedItems.length); // Approximation or store separately
        setIsSearching(false);
         if (!isStale) {
             return;
         }
    }
    try {
            let query = supabase
        .from('marketplace_listings')
        .select(MARKETPLACE_SELECT_COLUMNS, { count: 'exact' });
        
      if (filters.status !== 'all') {
          query = query.eq('status', 'active'); // defaulting to active if not all? or use filters.status? 
          // Previous code: filters.status === 'all' ? undefined : 'active'
          // implied if not all, strictly 'active'? Or filters.status value?
          // Default filters say status: 'active'.
          // If user selects 'all', we skip this. If 'active', we filter 'active'.
      }

      query = query.lte('go_live_at', new Date().toISOString());

      // Hybrid ranked search: exact matches first, fuzzy matches second
      if (filters.query) {
        const searchTerm = filters.query.trim();
        
        // Use ILIKE to get ALL potential matches (including typos and partial words)
        // This ensures we never miss a result
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        
        // Save to search history
        if (user) {
          /* Fire and forget history insert */
          supabase
            .from('search_history')
            .insert({
              user_id: user.id,
              query: filters.query,
            })
            .then(({ error }) => {
              if (error) console.warn("Search history save failed", error);
            });
        }
      }

      // Category filter
      if (filters.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      switch (filters.sortBy) {
        case 'price_low':
          query = query.order('asked_price', { ascending: true });
          break;
        case 'price_high':
          query = query.order('asked_price', { ascending: false });
          break;
        case 'ending_soon':
          // Using created_at asc as proxy for ending soon (oldest listings end soonest)
          query = query.order('created_at', { ascending: true });
          break;
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false });
      }

      // Limit results
      const { data, count, error } = await query.limit(50);

      if (error) throw error;

      if (data) {
        // Transform
        // Need to cast to unknown first to match ListingWithSeller interface structure expectations
        // Transform database rows to items
        let items = transformRows(data);

        // --- CLIENT-SIDE LOCATION FILTERING ---
        if (filters.location && filters.location.radiusKm < 500) {
          items = items.filter(item => {
              const itemLat = item.location?.lat;
              const itemLng = item.location?.lng;
              if (itemLat === undefined || itemLng === undefined) return false;
              
              const dist = calculateDistance(
                  filters.location!.lat, 
                  filters.location!.lng, 
                  itemLat, 
                  itemLng
              );
              return dist <= filters.location!.radiusKm;
          });
        }

        // --- PHASE 4 OPTIMIZATION: REMOVED SEPARATE BIDS FETCH ---
        // Bid stats are now included in the 'marketplace_listings' view.
        
        // Rank results: exact matches first, then partial matches
        if (filters.query) {
          const searchLower = filters.query.toLowerCase().trim();
          items = items.sort((a, b) => {
            const aTitleLower = a.title.toLowerCase();
            const bTitleLower = b.title.toLowerCase();
            
            // Exact title match gets highest priority
            const aExactTitle = aTitleLower === searchLower;
            const bExactTitle = bTitleLower === searchLower;
            if (aExactTitle && !bExactTitle) return -1;
            if (!aExactTitle && bExactTitle) return 1;
            
            // Title starts with query gets second priority
            const aStartsWith = aTitleLower.startsWith(searchLower);
            const bStartsWith = bTitleLower.startsWith(searchLower);
            if (aStartsWith && !bStartsWith) return -1;
            if (!aStartsWith && bStartsWith) return 1;
            
            // Title contains whole word gets third priority
            const aWholeWord = new RegExp(`\\b${searchLower}\\b`, 'i').test(aTitleLower);
            const bWholeWord = new RegExp(`\\b${searchLower}\\b`, 'i').test(bTitleLower);
            if (aWholeWord && !bWholeWord) return -1;
            if (!aWholeWord && bWholeWord) return 1;
            
            // Otherwise maintain original order (newest first)
            return 0;
          });
        }
        
        // Client-side sort for 'nearest'
        if (filters.sortBy === 'nearest' && filters.location) {
          items = sortByDistance(items, filters.location.lat, filters.location.lng);
        }
        
        setSearchResults(items);
        setTotalResults(count || 0);
        
        // Cache results
        setCache(cacheKey, items);
      }
    } catch (err) {
      console.error("Search failed:", err);
      setSearchResults([]);
      setTotalResults(0);
    } finally {
      setIsSearching(false);
    }
  }, [filters, user]);

  const fetchCategories = useCallback(async () => {
    // Check Cache (24h TTL)
    const cacheKey = generateCacheKey('categories', {});
    const { data: cachedCats, isStale } = await getFromCache<Category[]>(cacheKey, { ttl: 24 * 60 * 60 * 1000 });
    
    if (cachedCats) {
        setCategories(cachedCats);
        if (!isStale) return;
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');

    if (error) {
      console.warn('[Search] Failed to fetch categories:', error);
    }
    
    if (data) {
      // Get counts per category (active items)
      // Note: We might want to optimize this count query too or accept it's slow-ish
      const { data: counts } = await supabase
        .from('listings')
        .select('category')
        .eq('status', 'active');
      
      const countMap = (counts || []).reduce<Record<string, number>>((acc, row: CategoryCountRow) => {
        if (row.category) {
          acc[row.category] = (acc[row.category] || 0) + 1;
        }
        return acc;
      }, {});
      
      const newCategories = (data as CategoryRow[]).map((cat) => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon || 'tag',
        parentId: undefined,
        count: countMap[cat.name] || 0,
      }));

      setCategories(newCategories);
      setCache(cacheKey, newCategories, { ttl: 24 * 60 * 60 * 1000 });
    }
  }, []);

  // Debounce ref for suggestions
  const suggestionDebounceRef = useRef<NodeJS.Timeout>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }
    
    // Clear previous timer
    if (suggestionDebounceRef.current) {
        clearTimeout(suggestionDebounceRef.current);
    }

    // Set new timer
    suggestionDebounceRef.current = setTimeout(async () => {
        const results: SearchSuggestion[] = [];

        // 1. Recent searches from user
        if (user) {
          const { data: recent } = await supabase
            .from('search_history')
            .select('query')
            .eq('user_id', user.id)
            .ilike('query', `%${query}%`)
            .order('created_at', { ascending: false })
            .limit(3);
          
          if (recent) {
            const unique = new Set();
            recent.forEach((r: SearchHistoryQueryRow) => {
                if (r.query && !unique.has(r.query)) {
                    unique.add(r.query);
                    results.push({ type: 'recent', text: r.query });
                }
            });
          }
        }

        // 2. Category suggestions (Top 2)
        const matchingCats = categories.filter((c) =>
          c.name.toLowerCase().includes(query.toLowerCase())
        );
        results.push(...matchingCats.slice(0, 2).map((c) => ({
          type: 'category' as const,
          text: c.name,
          category: c.id,
        })));

        // 3. Item Title suggestions (distinct-ish via limit)
        // Supabase doesn't support 'distinct' easily on select without RPC, 
        // so we just fetch a few and dedupe client side for now.
        const { data: titleData } = await supabase
            .from('listings')
            .select('title')
            .eq('status', 'active')
            .ilike('title', `%${query}%`)
            .limit(5);

        if (titleData) {
            const uniqueTitles = new Set(results.map(r => r.text.toLowerCase())); // specific dedupe against existing
            
            (titleData as ListingRow[]).forEach((item) => {
                if (!item.title) return;
                const t = item.title;
                if (!uniqueTitles.has(t.toLowerCase())) {
                    uniqueTitles.add(t.toLowerCase());
                    results.push({ type: 'item', text: t });
                }
            });
        }

        setSuggestions(results.slice(0, 8)); // Cap total suggestions
    }, 300); // 300ms debounce
  }, [user, categories]);

  const getSimilarItems = useCallback(async (item: Item): Promise<Item[]> => {
    // Basic similarity: same category, +/- 50% price
    const { data } = await supabase
      .from('listings')
      .select('*, seller:profiles!seller_id(*)')
      .eq('category', item.category)
      .eq('status', 'active')
      .neq('id', item.id)
      .gte('ask_price', item.askPrice * 0.5)
      .lte('ask_price', item.askPrice * 1.5)
      .limit(6);

    return data?.map(row => transformListingToItem(row as unknown as ListingWithSeller)) || [];
  }, []);

  // --- Realtime Subscription (Bids) ---
  const handleRealtimeBid = useCallback((newBid: Bid) => {
      // Find if this bid belongs to any of our search results
      setSearchResults(prevItems => prevItems.map(item => {
        if (item.id === newBid.itemId) { // Note: newBid is already transformed/hydrated from hook
            const amount = Number(newBid.amount);
            const currentMax = item.currentHighBid || 0;
            const isNewHigh = amount > currentMax;
            const nextAttempts = (item.bidAttemptsCount ?? item.bidCount) + 1;
            return {
               ...item,
               bidCount: item.bidCount + 1,
               bidAttemptsCount: nextAttempts,
               currentHighBid: isNewHigh ? amount : currentMax,
               currentHighBidderId: isNewHigh ? newBid.bidderId : item.currentHighBidderId
            };
        }
        return item;
      }));
  }, []);

  useBidRealtime(handleRealtimeBid, visibleIds);

  
  // Initial category fetch
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const normalizedQuery = filters.query?.trim() ?? "";
    if (!normalizedQuery) {
      if (lastQueryRef.current) {
        setSearchResults([]);
        setTotalResults(0);
      }
      setIsSearching(false);
      lastQueryRef.current = "";
      return;
    }

    lastQueryRef.current = normalizedQuery;
    executeSearch();
  }, [filters, executeSearch]);

  const contextValue = useMemo(() => ({
    filters,
    setFilters,
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
    setFilters,
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
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) throw new Error('useSearch must be used within SearchProvider');
  return context;
}
