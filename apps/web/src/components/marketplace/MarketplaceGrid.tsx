"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect, useSyncExternalStore } from "react";
import type { SearchFilters } from "@/types";
import { useMarketplace } from "@/context/MarketplaceContext";
import { useSearch } from "@/context/SearchContext";
import ItemCard from "./ItemCard";
import AdCard from "@/components/ads/AdCard";
import ItemCardSkeleton from "./ItemCardSkeleton";
import EmptyState from "@/components/ui/EmptyState";
import SmartFilterBar, { FILTERS } from "./SmartFilterBar";
import ClearFiltersButton from "./ClearFiltersButton";
import CategoryNav from "@/components/search/CategoryNav";
import { LocationSelector } from "./LocationSelector";
import { Button } from "@/components/ui/button";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { LayoutGrid, Grid3x3, Grid2x2, Gavel } from "lucide-react";
import PriceSelector from "./PriceSelector";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CATEGORIES } from "@/lib/constants";
import { NewListingsToast } from "@/components/ui/NewListingsToast";
import { ContinueBrowsingModal } from "@/components/ui/ContinueBrowsingModal";

// Listing type options for dropdown
const LISTING_TYPES = [
  { id: 'all', label: 'All Types' },
  { id: 'public', label: 'Public Bid' },
  { id: 'hidden', label: 'Hidden Bid' },
] as const;

type ViewMode = 'compact' | 'comfortable' | 'spacious';
type FilterId = typeof FILTERS[number]['id'];


const subscribeToViewport = (callback: () => void) => {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
};

const getSearchSortFilterId = (sort?: SearchFilters['sortBy']): FilterId => {
  if (sort === 'price_high') return 'luxury';
  if (sort === 'ending_soon') return 'ending_soon';
  if (sort === 'nearest') return 'nearest';
  return 'newest';
};

const mapFilterToSearchSort = (id: FilterId): SearchFilters['sortBy'] | null => {
  if (id === 'luxury') return 'price_high';
  if (id === 'ending_soon') return 'ending_soon';
  if (id === 'nearest') return 'nearest';
  if (id === 'watchlist') return null;
  return 'newest';
};

const getViewportSnapshot = () => (typeof window !== "undefined" ? window.innerWidth >= 768 : false);
const getServerSnapshot = () => false;

export default function MarketplaceGrid() {
  const { items: marketplaceItems, filters: mpFilters, setFilter: setMpFilter, isLoading: mpLoading, isLoadingMore, isRevalidating, hasMore, loadMore, liveFeed } = useMarketplace();
  const { searchResults, isSearching, filters: searchFilters, setFilters: setSearchFilters } = useSearch();
  
  // Live feed toast dismiss state
  const [toastDismissed, setToastDismissed] = useState(false);

  const isDesktop = useSyncExternalStore(subscribeToViewport, getViewportSnapshot, getServerSnapshot);
  const [manualViewMode, setManualViewMode] = useState<ViewMode | null>(null);
  const viewMode = manualViewMode ?? (isDesktop ? 'comfortable' : 'compact');
  const [isChangingView, setIsChangingView] = useState(false);
  const viewChangeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Decide which items to show
  // Only switch to search mode when there's an actual TEXT query
  // Category filtering should use MarketplaceContext to avoid double-fetching
  const isSearchActive = (searchFilters.query?.trim().length ?? 0) > 0;
  const displayItems = isSearchActive ? searchResults : marketplaceItems;
  const currentSortId = isSearchActive ? getSearchSortFilterId(searchFilters.sortBy) : mpFilters.sortBy;
  
  // Toast shows when: pending items exist AND user hasn't dismissed
  // After loading pending items, pendingCount goes to 0 which hides toast
  // Effective loading state: 
  // We want to show skeletons if we're REALLY loading or if we're briefly transitioning viewMode
  const isLoading = (isSearchActive ? isSearching : mpLoading) || isChangingView;

  // Handle view mode changes with a clean "blink" to skeletons
  const handleViewModeChange = (newMode: ViewMode) => {
    if (newMode === viewMode) return;
    
    // Clear any existing timer
    if (viewChangeTimerRef.current) clearTimeout(viewChangeTimerRef.current);
    
    setIsChangingView(true);
    setManualViewMode(newMode);
    
    // Brief window to show skeletons and allow browser to recalc layout
    viewChangeTimerRef.current = setTimeout(() => {
      setIsChangingView(false);
      viewChangeTimerRef.current = null;
    }, 350); // Balanced for speed and visibility
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (viewChangeTimerRef.current) clearTimeout(viewChangeTimerRef.current);
    };
  }, []);

  // NOTE: Removed duplicate executeSearch trigger.
  // SearchContext.executeSearch is called internally when filters change via its own useEffect.
  // Double-triggering was causing visual "refresh" flicker.
  
  
  // Infinite Scroll Trigger
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const entry = useIntersectionObserver(loadMoreRef, {
    threshold: 0,
    rootMargin: '800px', // Aggressive prefetch: Trigger when 800px from bottom (approx 3 screen heights)
  });

  useEffect(() => {
    // Only load more for MP feed. Search pagination not yet implemented in this phase plan (limited to 50)
    if (!isSearchActive && entry?.isIntersecting && hasMore && !isLoadingMore && !isLoading) {
      loadMore();
    }
  }, [entry, hasMore, isLoadingMore, isLoading, loadMore, isSearchActive]);




  // Grid class mapping based on view mode
  const getGridClasses = () => {
    switch (viewMode) {
      case 'spacious':
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3";
      case 'comfortable':
        return "grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
      case 'compact':
      default:
        return "grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(165px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]";
    }
  };

  const getGridStyle = () => {
    return {};
  };

  // Helper to sync category changes to MarketplaceContext (not SearchContext)
  // This prevents category changes from interfering with the search query state
  const handleCategoryChange = (val: string | null) => {
      setMpFilter('category', val);
  };

  return (
    <div id="marketplace-grid-root" className="px-4 pb-4 pt-2 md:px-4 md:pb-4 md:pt-2">
      {/* Subtle Refresh Indicator - shows during background cache revalidation */}
      {isRevalidating && (
        <div id="revalidating-indicator" className="fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-pulse" />
      )}
      {/* Live Feed UI Components */}
      {!toastDismissed && liveFeed.pendingCount > 0 && mpFilters.sortBy === 'newest' && (
        <NewListingsToast
          count={liveFeed.pendingCount}
          onLoad={() => {
            liveFeed.loadPending();
            setToastDismissed(true);
          }}
          onDismiss={() => setToastDismissed(true)}
        />
      )}
      <ContinueBrowsingModal
        open={liveFeed.showContinuePrompt}
        onContinue={liveFeed.continueWatching}
        onPause={liveFeed.pauseUpdates}
      />
      <div className="mb-4 md:mb-0 bg-white border border-slate-200/60 shadow-sm rounded-2xl flex flex-col gap-0 md:bg-transparent md:border-0 md:shadow-none">
        <div className="flex flex-col gap-2 pt-2 pb-2 md:py-0">
          {/* MOBILE: New Enhanced "Search & Filter" Mobile Header */}
          <div id="mobile-search-filter-container" className="md:hidden flex flex-col gap-2 px-4 mb-2">
            
            {/* Filter Grid Container */}
            <div className="flex flex-col gap-2">
              
              {/* Clear Filters Row (shown when filters active) */}
              <ClearFiltersButton variant="mobile" className="w-full" />
              
              {/* Row 1: Sort, Category, Type, View */}
              <div className="grid grid-cols-4 gap-2">
                {/* 1. Sort Tab */}
                <Select 
                  value={currentSortId}
                  onValueChange={(value) => {
                    if (isSearchActive) {
                      const mappedSort = mapFilterToSearchSort(value as FilterId);
                      if (!mappedSort) return;
                      setSearchFilters({ ...searchFilters, sortBy: mappedSort });
                    } else {
                      setMpFilter('sortBy', value as typeof mpFilters.sortBy);
                    }
                  }}
                >
                  <SelectTrigger id="mobile-sort-select" className="!h-auto w-full flex flex-col items-center justify-center gap-1 p-2 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 active:scale-y-95 active:bg-slate-200 transition-all duration-200 ease-in-out [&>span]:w-full [&_svg.lucide-chevron-down]:hidden shadow-sm hover:shadow-md">
                     {(() => {
                        const activeFilter = FILTERS.find(f => f.id === currentSortId) || FILTERS[0];
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
                  value={mpFilters.category || 'All Items'} 
                  onValueChange={(value) => handleCategoryChange(value === 'All Items' ? null : value)}
                >
                  <SelectTrigger id="mobile-category-select" className="!h-auto w-full flex flex-col items-center justify-center gap-1 p-2 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 active:scale-y-95 active:bg-slate-200 transition-all duration-200 ease-in-out [&>span]:w-full [&_svg.lucide-chevron-down]:hidden shadow-sm hover:shadow-md">
                     {(() => {
                        const activeCat = CATEGORIES.find(c => c.label === mpFilters.category) || CATEGORIES[0];
                        const Icon = activeCat.icon;
                        return (
                          <>
                            <Icon className="h-5 w-5 text-blue-500" />
                            <span className="text-[10px] font-medium leading-none text-slate-600 truncate w-full text-center">
                              {mpFilters.category ? mpFilters.category.split(' ')[0] : 'Categories'}
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
                  <SelectTrigger id="mobile-type-select" className="!h-auto w-full flex flex-col items-center justify-center gap-1 p-2 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 active:scale-y-95 active:bg-slate-200 transition-all duration-200 ease-in-out [&>span]:w-full [&_svg.lucide-chevron-down]:hidden shadow-sm hover:shadow-md">
                     {(() => {
                        return (
                          <>
                             <Gavel className={`h-5 w-5 ${mpFilters.listingType !== 'all' ? 'text-blue-500' : 'text-slate-500'}`} />
                            <span className="text-[10px] font-medium leading-none text-slate-600 truncate w-full text-center">
                              {mpFilters.listingType === 'all' ? 'Type' : mpFilters.listingType === 'public' ? 'Public' : 'Hidden'}
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
                  id="mobile-view-toggle"
                  variant="outline"
                  className="!h-auto w-full flex flex-col items-center justify-center gap-1 p-2 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 active:scale-y-95 active:bg-slate-200 transition-all duration-200 ease-in-out shadow-sm hover:shadow-md"
                  onClick={() => {
                    handleViewModeChange(viewMode === 'compact' ? 'spacious' : 'compact');
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
              <ClearFiltersButton variant="inline" />
              <SmartFilterBar />
            </div>

            {/* View Toggle Controls (Desktop) */}
            {/* View Toggle Controls (Desktop) */}
            <ToggleGroup 
              id="view-mode-toggles"
              type="single" 
              value={viewMode} 
              onValueChange={(val) => val && handleViewModeChange(val as ViewMode)}
              className="bg-slate-50 h-9 rounded-xl border border-slate-200 shadow-sm shrink-0 overflow-hidden"
            >
              <ToggleGroupItem 
                value="compact" 
                aria-label="Compact View" 
                className="h-full w-10 data-[state=on]:bg-slate-900 data-[state=on]:text-white data-[state=on]:shadow-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 p-0"
              >
                <Grid3x3 className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="comfortable" 
                aria-label="Comfortable View"
                className="h-full w-10 data-[state=on]:bg-slate-900 data-[state=on]:text-white data-[state=on]:shadow-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 p-0"
              >
                <Grid2x2 className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="spacious" 
                aria-label="Spacious View"
                className="h-full w-10 data-[state=on]:bg-slate-900 data-[state=on]:text-white data-[state=on]:shadow-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 p-0"
              >
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          

        </div>
      </div>

        {/* Category Bar Row */}
        <div id="category-bar-row" className="hidden md:block pb-2 md:px-0">
           <CategoryNav />
        </div>
      
      
      <div 
        id="marketplace-grid-container"
        className={`grid gap-3 ${getGridClasses()}`}
        style={getGridStyle()}
      >
        {isLoading ? (
          // Skeletons during Load or View Change
          // No AnimatePresence wrapper -> Instant mount/unmount logic, but we can animate Entry of new items.
          <>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={`skeleton-initial-${i}`}>
                <ItemCardSkeleton viewMode={viewMode} />
              </div>
            ))}
          </>
        ) : (
          // Actual Content
          <>
            {displayItems.map((item, index) => {
              const seller = item.seller!;
              const isAdSpot = (index + 1) % 6 === 0;

              return (
                <div key={`container-${item.id}`} className="contents">
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ duration: 0.3 }} // Smooth entry
                  >
                    <ItemCard item={item} seller={seller} viewMode={viewMode} />
                  </motion.div>
                  
                  {isAdSpot && (
                    <motion.div
                       key={`ad-card-${index}`}
                       initial={{ opacity: 0 }} 
                       animate={{ opacity: 1 }} 
                       transition={{ duration: 0.3 }}
                    >
                      <AdCard id={`in-feed-${index}`} viewMode={viewMode} />
                    </motion.div>
                  )}
                </div>
              );
            })}

            {/* Infinite Scroll Skeletons */}
            {isLoadingMore && !isSearchActive && Array.from({ length: 4 }).map((_, i) => (
              <div key={`skeleton-more-${i}`}>
                <ItemCardSkeleton viewMode={viewMode} />
              </div>
            ))}
          </>
        )}
      </div>

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
