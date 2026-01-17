"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useMarketplace } from "@/context/MarketplaceContext";
import { useSearch } from "@/context/SearchContext";
import ItemCard from "./ItemCard";
import ItemCardSkeleton from "./ItemCardSkeleton";
import EmptyState from "@/components/ui/EmptyState";
import SmartFilterBar, { FILTERS } from "./SmartFilterBar";
import CategoryNav from "@/components/search/CategoryNav"; // Replaces CategoryBar
import { LocationSelector } from "./LocationSelector";
import { Button } from "@/components/ui/button";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { LayoutGrid, Grid3x3, Grid2x2, X, Gavel } from "lucide-react";
import PriceSelector from "./PriceSelector";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES } from "@/lib/constants";

// Listing type options for dropdown
const LISTING_TYPES = [
  { id: 'all', label: 'All Types' },
  { id: 'public', label: 'Public Bid' },
  { id: 'sealed', label: 'Sealed Bid' },
] as const;

type ViewMode = 'compact' | 'comfortable' | 'spacious';

export default function MarketplaceGrid() {
  const { items: marketplaceItems, filters: mpFilters, setFilter: setMpFilter, isLoading: mpLoading, isLoadingMore, hasMore, loadMore } = useMarketplace();
  const { searchResults, isSearching, filters: searchFilters, setFilters: setSearchFilters, executeSearch } = useSearch();

  const [viewMode, setViewMode] = useState<ViewMode>('compact');
  
  // Decide which items to show
  // If search query or category is active in SearchContext, we use searchResults
  const isSearchActive = !!searchFilters.query || !!searchFilters.category || searchFilters.minPrice !== undefined || searchFilters.maxPrice !== undefined;
  
  // Logic: 
  // If Search is active, use SearchContext
  // Else, use MarketplaceContext (default feed)
  // Note: MarketplaceContext handles infinite scroll better for feed. SearchContext handles global search.
  // We need to bridge them or decide priority.
  // For this Phase 7c, SearchContext takes priority when active.
  
  const displayItems = isSearchActive ? searchResults : marketplaceItems;
  const isLoading = isSearchActive ? isSearching : mpLoading;

  // Sync Search Filters with MP Filters (if needed for UI consistency)
  // OR just use SearchFilters solely.
  
  // Trigger search execution when filters change (handled in SearchContext effect usually, or we call it)
  useEffect(() => {
      if (isSearchActive) {
          executeSearch();
      }
  }, [searchFilters, executeSearch, isSearchActive]);
  
  
  // Infinite Scroll Trigger
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const entry = useIntersectionObserver(loadMoreRef, {
    threshold: 0,
    rootMargin: '200px', // Trigger when 80% down (approx 1 card height remaining)
  });

  useEffect(() => {
    // Only load more for MP feed. Search pagination not yet implemented in this phase plan (limited to 50)
    if (!isSearchActive && entry?.isIntersecting && hasMore && !isLoadingMore && !isLoading) {
      loadMore();
    }
  }, [entry, hasMore, isLoadingMore, isLoading, loadMore, isSearchActive]);


  // Set default view mode based on screen size
  useEffect(() => {
    if (window.innerWidth >= 768) {
      setViewMode('comfortable');
    }
  }, []);


  // Grid class mapping based on view mode
  const getGridClasses = () => {
    switch (viewMode) {
      case 'spacious':
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3";
      case 'comfortable':
        return "grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
      case 'compact':
      default:
        return "grid-cols-[repeat(auto-fill,minmax(165px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]";
    }
  };

  const getGridStyle = () => {
    return {};
  };

  // Helper to sync UI to SearchContext
  const handleCategoryChange = (val: string | null) => {
      setSearchFilters({ ...searchFilters, category: val || undefined });
  };

  return (
    <div id="marketplace-grid-root" className="px-4 pb-4 pt-2 md:px-4 md:pb-4 md:pt-2">
      <div className="mb-4 md:mb-0 bg-white border border-slate-200/60 shadow-sm rounded-2xl flex flex-col gap-0 md:bg-transparent md:border-0 md:shadow-none">
        <div className="flex flex-col gap-2 pt-2 pb-2 md:py-0">
          {/* MOBILE: New Enhanced "Search & Filter" Mobile Header */}
          <div id="mobile-search-filter-container" className="md:hidden flex flex-col gap-2 px-4 mb-2">
            
            {/* Filter Grid Container */}
            <div className="flex flex-col gap-2">
              
              {/* Row 1: Sort, Category, Type, View */}
              <div className="grid grid-cols-4 gap-2">
                {/* 1. Sort Tab */}
                <Select 
                  value={searchFilters.sortBy} 
                  onValueChange={(value) => setSearchFilters({...searchFilters, sortBy: value as any})}
                >
                  <SelectTrigger id="mobile-sort-select" className="!h-auto w-full flex flex-col items-center justify-center gap-1 p-2 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 active:scale-95 active:bg-slate-200 transition-all duration-200 ease-in-out [&>span]:w-full [&_svg.lucide-chevron-down]:hidden shadow-sm hover:shadow-md">
                     {(() => {
                        const activeFilter = FILTERS.find(f => f.id === searchFilters.sortBy) || FILTERS[0];
                        const Icon = activeFilter.icon;
                        return (
                          <>
                            <Icon className={`h-5 w-5 ${activeFilter.color}`} />
                            <span className="text-[10px] font-medium leading-none text-slate-600 truncate w-full text-center">
                              {activeFilter.label.split(' ')[0]}
                            </span>
                          </>
                        );
                     })()}
                  </SelectTrigger>
                  <SelectContent className="z-[200]" position="popper" sideOffset={4}>
                    {FILTERS.map((f) => (
                      <SelectItem key={f.id} value={f.id} className="text-sm">
                        <span className="flex items-center gap-2">
                          <f.icon className={`h-4 w-4 ${f.color}`} />
                          {f.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* 2. Category Tab */}
                <Select 
                  value={searchFilters.category || 'All Items'} 
                  onValueChange={(value) => handleCategoryChange(value === 'All Items' ? null : value)}
                >
                  <SelectTrigger id="mobile-category-select" className="!h-auto w-full flex flex-col items-center justify-center gap-1 p-2 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 active:scale-95 active:bg-slate-200 transition-all duration-200 ease-in-out [&>span]:w-full [&_svg.lucide-chevron-down]:hidden shadow-sm hover:shadow-md">
                     {(() => {
                        const activeCat = CATEGORIES.find(c => c.label === searchFilters.category) || CATEGORIES[0];
                        const Icon = activeCat.icon;
                        return (
                          <>
                            <Icon className="h-5 w-5 text-blue-500" />
                            <span className="text-[10px] font-medium leading-none text-slate-600 truncate w-full text-center">
                              {searchFilters.category ? searchFilters.category.split(' ')[0] : 'Categories'}
                            </span>
                          </>
                        );
                     })()}
                  </SelectTrigger>
                  <SelectContent className="z-[200]" position="popper" sideOffset={4}>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.label} value={cat.label} className="text-sm">
                        <span className="flex items-center gap-2">
                          <cat.icon className="h-4 w-4 text-slate-500" />
                          {cat.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* 3. Type Tab */}
                <Select 
                  value={mpFilters.listingType} 
                  onValueChange={(value) => setMpFilter('listingType', value as typeof mpFilters.listingType)}
                >
                  <SelectTrigger id="mobile-type-select" className="!h-auto w-full flex flex-col items-center justify-center gap-1 p-2 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 active:scale-95 active:bg-slate-200 transition-all duration-200 ease-in-out [&>span]:w-full [&_svg.lucide-chevron-down]:hidden shadow-sm hover:shadow-md">
                     {(() => {
                        return (
                          <>
                            <Gavel className={`h-5 w-5 ${mpFilters.listingType !== 'all' ? 'text-purple-500' : 'text-slate-500'}`} />
                            <span className="text-[10px] font-medium leading-none text-slate-600 truncate w-full text-center">
                              {mpFilters.listingType === 'all' ? 'Type' : mpFilters.listingType === 'public' ? 'Public' : 'Sealed'}
                            </span>
                          </>
                        );
                     })()}
                  </SelectTrigger>
                  <SelectContent className="z-[200]" position="popper" sideOffset={4}>
                    {LISTING_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id} className="text-sm">
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* 4. View Toggle (Cycle) */}
                <Button
                  variant="outline"
                  className="h-auto flex flex-col items-center justify-center gap-1 p-2 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 active:scale-95 active:bg-slate-200 transition-all duration-200 ease-in-out border-0 shadow-sm hover:shadow-md ring-1 ring-slate-200"
                  onClick={() => {
                    setViewMode(viewMode === 'compact' ? 'spacious' : 'compact');
                  }}
                >
                  {viewMode === 'compact' && <Grid3x3 className="h-5 w-5 text-slate-700" />}
                  {viewMode === 'comfortable' && <Grid2x2 className="h-5 w-5 text-slate-700" />}
                  {viewMode === 'spacious' && <LayoutGrid className="h-5 w-5 text-slate-700" />}
                  
                  <span className="text-[10px] font-medium leading-none text-slate-600 truncate w-full text-center">
                     View
                  </span>
                </Button>
              </div>

              {/* Row 2: Location, Price */}
              <div className="grid grid-cols-2 gap-2">
                {/* 5. Location (Span 1) */}
                <div className="w-full">
                  <LocationSelector 
                    variant="mobile-grid" 
                    className="w-full" 
                    align="start" 
                  />
                </div>

                {/* 6. Price (Span 1) */}
                <div className="w-full">
                  <PriceSelector />
                </div>
              </div>
            </div>
          </div>

          {/* DESKTOP: Full Filter Buttons Row */}
          <div id="smart-filters-row" className="hidden md:flex items-center gap-4 md:px-0">
            <div className="flex-1 overflow-x-auto scrollbar-hide flex items-center gap-4">
              <SmartFilterBar />
              
              <AnimatePresence>
                {(searchFilters.query || searchFilters.category) && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2 pr-4 shrink-0"
                  >
                    <div className="h-6 w-px bg-slate-200 mx-2" />
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 font-bold py-1 px-3 flex items-center gap-2 rounded-full whitespace-nowrap">
                      {searchFilters.query ? `"${searchFilters.query}"` : searchFilters.category}
                      <button 
                        onClick={() => {
                          if (searchFilters.query) setSearchFilters({...searchFilters, query: ''});
                          if (searchFilters.category) setSearchFilters({...searchFilters, category: undefined});
                        }}
                        className="hover:bg-blue-100 p-0.5 rounded-full transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* View Toggle Controls (Desktop) */}
            <div id="view-mode-toggles" className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200 shadow-sm shrink-0">
                  <Button
                  id="view-mode-compact-btn"
                  variant={viewMode === 'compact' ? 'default' : 'ghost'}
                  size="icon"
                  className={`h-8 w-8 rounded-lg ${viewMode === 'compact' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                  onClick={() => setViewMode('compact')}
                  title="Compact View"
                  >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  id="view-mode-comfortable-btn"
                  variant={viewMode === 'comfortable' ? 'default' : 'ghost'}
                  size="icon"
                  className={`h-8 w-8 rounded-lg ${viewMode === 'comfortable' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                  onClick={() => setViewMode('comfortable')}
                  title="Comfortable View"
                  >
                  <Grid2x2 className="h-4 w-4" />
                </Button>
                <Button
                  id="view-mode-spacious-btn"
                  variant={viewMode === 'spacious' ? 'default' : 'ghost'}
                  size="icon"
                  className={`h-8 w-8 rounded-lg ${viewMode === 'spacious' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                  onClick={() => setViewMode('spacious')}
                  title="Spacious View"
                  >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
            </div>
          </div>
          
          {/* Mobile Active Search Filter Badge (shown below dropdowns when searching) */}
          <AnimatePresence>
            {searchFilters.query && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="md:hidden flex items-center px-4"
              >
                <Badge variant="secondary" className="bg-blue-600 text-white border-blue-600 font-bold py-1.5 px-4 flex items-center gap-2 rounded-full whitespace-nowrap shadow-sm">
                  Search: {searchFilters.query}
                  <button 
                    onClick={() => setSearchFilters({...searchFilters, query: ''})}
                    className="bg-white/20 hover:bg-white/30 p-0.5 rounded-full transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

        {/* Category Bar Row */}
        <div id="category-bar-row" className="hidden md:block pb-2 md:px-0">
           <CategoryNav />
        </div>
      
      
      <motion.div 
        id="marketplace-grid-container"
        className={`grid gap-3 ${getGridClasses()}`}
        style={getGridStyle()}
      >
        {isLoading ? (
          // Initial Load Skeletons
          Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={`skeleton-initial-${i}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <ItemCardSkeleton viewMode={viewMode} />
            </motion.div>
          ))
        ) : (
          <>
            {/* Stable Item List */}
            {displayItems.map((item, index) => {
              const seller = item.seller!; // Items are hydrated with sellers in MarketplaceContext
              // Stagger: Only animate items in current "page" (8 items at a time)
              const pagePosition = index % 8;
              
              // Directions: left, right, bottom, top
              const directions = [
                { x: -30, y: 0 },
                { x: 30, y: 0 },
                { x: 0, y: 30 },
                { x: 0, y: -20 },
              ];
              // Use item.id hash for stable randomness per page batch
              const pageNumber = Math.floor(index / 8);
              const hashCode = (displayItems[pageNumber * 8]?.id || 'x').split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
              const dirIndex = Math.abs(hashCode) % directions.length;
              const direction = directions[dirIndex];
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: direction.x, y: direction.y }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ 
                    duration: 0.35,
                    delay: pagePosition * 0.04,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                >
                  <ItemCard item={item} seller={seller} viewMode={viewMode} />
                </motion.div>
              );
            })}

            {/* Infinite Scroll Skeletons */}
            {isLoadingMore && !isSearchActive && Array.from({ length: 4 }).map((_, i) => (
              <motion.div
                key={`skeleton-more-${i}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <ItemCardSkeleton viewMode={viewMode} />
              </motion.div>
            ))}
          </>
        )}
      </motion.div>

      {/* Sentinel for Infinite Scroll - Always render so Ref attaches, but logic handles trigger */}
      <div 
        ref={loadMoreRef} 
        className="h-4 w-full flex items-center justify-center pointer-events-none opacity-0" 
      />


      {!isLoading && displayItems.length === 0 && (
        <EmptyState />
      )}
    </div>
  );
}
