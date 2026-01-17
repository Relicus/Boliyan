'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import type { Item } from '@/types';
import type { SearchFilters, Category, SearchSuggestion } from '@/types';
import { sortByDistance } from '@/lib/searchUtils';
import { transformListingToItem, ListingWithSeller } from '@/lib/transform';

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

export function SearchProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  const [filters, setFiltersState] = useState<SearchFilters>(defaultFilters);
  const [searchResults, setSearchResults] = useState<Item[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);

  const setFilters = (newFilters: SearchFilters) => {
    setFiltersState(newFilters);
  };

  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFiltersState(defaultFilters);
  };

  const executeSearch = useCallback(async () => {
    setIsSearching(true);
    
    try {
      let query = supabase
        .from('listings')
        .select('*, seller:profiles!seller_id(*)', { count: 'exact' });
        
      if (filters.status !== 'all') {
          query = query.eq('status', 'active'); // defaulting to active if not all? or use filters.status? 
          // Previous code: filters.status === 'all' ? undefined : 'active'
          // implied if not all, strictly 'active'? Or filters.status value?
          // Default filters say status: 'active'.
          // If user selects 'all', we skip this. If 'active', we filter 'active'.
      }

      // Full-text search
      if (filters.query) {
        // Using Supabase textSearch if migration applied
        // If not, this might fail or we should use ILIKE as fallback if column missing
        // For robustness given the plan, we assume migration is run or will be run.
        // Falls back to ILIKE if search_vector column not indexed properly or accessible? 
        // No, TSVector usage is explicit.
        query = query.textSearch('search_vector', filters.query, {
          type: 'websearch',
          config: 'english',
        });
        
        // Save to search history
        if (user) {
          /* Fire and forget history insert */
          (supabase.from('search_history') as any).insert({
            user_id: user.id,
            query: filters.query,
          }).then(({ error }: { error: any }) => { 
             if(error) console.warn("Search history save failed", error); 
          });
        }
      }

      // Category filter
      if (filters.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      // Price range
      if (filters.minPrice !== undefined) {
        query = query.gte('ask_price', filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        query = query.lte('ask_price', filters.maxPrice);
      }

      // Sorting
      // Note: 'nearest' is handled client side after fetch usually unless PostGIS
      switch (filters.sortBy) {
        case 'price_low':
          query = query.order('ask_price', { ascending: true });
          break;
        case 'price_high':
          query = query.order('ask_price', { ascending: false });
          break;
        case 'ending_soon':
          query = query.order('expiry_at', { ascending: true });
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
        let items = data.map(row => transformListingToItem(row as unknown as ListingWithSeller));
        
        // Client-side sort for 'nearest'
        if (filters.sortBy === 'nearest' && filters.location) {
          items = sortByDistance(items, filters.location.lat, filters.location.lng);
        }
        
        setSearchResults(items);
        setTotalResults(count || 0);
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
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');
    
    if (data) {
      // Get counts per category (active items)
      const { data: counts } = await supabase
        .from('listings')
        .select('category')
        .eq('status', 'active');
      
      const countMap = (counts || []).reduce((acc: any, row: any) => {
        acc[row.category] = (acc[row.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      setCategories(data.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        parentId: cat.parent_id,
        count: countMap[cat.id] || 0,
      })));
    }
  }, []);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

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
        recent.forEach((r: any) => {
            if(!unique.has(r.query)) {
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
        
        (titleData as any[]).forEach((item) => {
            const t = item.title;
            if (!uniqueTitles.has(t.toLowerCase())) {
                uniqueTitles.add(t.toLowerCase());
                results.push({ type: 'item', text: t });
            }
        });
    }

    setSuggestions(results.slice(0, 8)); // Cap total suggestions
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
  
  // Initial category fetch
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <SearchContext.Provider
      value={{
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
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) throw new Error('useSearch must be used within SearchProvider');
  return context;
}
