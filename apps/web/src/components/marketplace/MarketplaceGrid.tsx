"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { useApp } from "@/lib/store";
import { mockUsers } from "@/lib/mock-data";
import ItemCard from "./ItemCard";
import ItemCardSkeleton from "./ItemCardSkeleton";
import EmptyState from "@/components/ui/EmptyState";
import SmartFilterBar, { FILTERS } from "./SmartFilterBar";
import CategoryBar from "./CategoryBar";
import { LocationSelector } from "./LocationSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, LayoutGrid, Grid3x3, Grid2x2, RefreshCw, X, Gavel, RotateCcw } from "lucide-react";
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
  const { items, filters, setFilter, bids, user, watchedItemIds } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>('compact');
  const [isLoading, setIsLoading] = useState(true);
  const [stableSortedIds, setStableSortedIds] = useState<string[]>([]);

  // Simulate loading on mount
  useEffect(() => {
    // Set default view mode based on screen size
    if (window.innerWidth >= 768) {
      setViewMode('comfortable');
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []); // Run once on mount

  // Reload when sort changes
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [filters.category, filters.sortBy]); // Run when category or sort changes

  // Calculate Distance (Haversine Formula)
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  // 1. Calculate sorting only when filters change or items are added/removed (NOT when deep props change)
  // This ensures that bidding (which updates an item's bidCount/price) does not cause the card to jump positions.
  useEffect(() => {
    const sorted = items.filter(item => {
      // 1. Category Filter
      if (filters.category && filters.category !== "All Items" && item.category !== filters.category) {
        return false;
      }
      
      // 2. Search Filter
      if (filters.search) {
        const query = filters.search.toLowerCase();
        if (!item.title.toLowerCase().includes(query) && !item.description.toLowerCase().includes(query)) {
          return false;
        }
      }

      // 3. Price Filter
      const currentPrice = item.currentHighBid || item.askPrice;
      if (filters.minPrice !== null && currentPrice < filters.minPrice) return false;
      if (filters.maxPrice !== null && currentPrice > filters.maxPrice) return false;

      // 4. Listing Type Filter
      if (filters.listingType === 'public' && !item.isPublicBid) return false;
      if (filters.listingType === 'sealed' && item.isPublicBid) return false;

      // 5. Watchlist Filter
      if (filters.sortBy === 'watchlist') {
        if (!watchedItemIds.includes(item.id)) return false;
      }

      // 6. Location Filter (Actual distance logic)
      if (filters.locationMode !== 'country' && filters.radius < 500) {
        const seller = mockUsers.find(u => u.id === item.sellerId);
        if (seller?.location && filters.currentCoords) {
          const dist = getDistance(
            filters.currentCoords.lat,
            filters.currentCoords.lng,
            seller.location.lat,
            seller.location.lng
          );
          if (dist > filters.radius) return false;
        } else if (filters.locationMode === 'city') {
          // If we have city name but no coordinates yet or seller has no location
          // In mock data seller always has location, and city selection sets currentCoords
          // So this is a safety check.
        }
      }
      
      return true;
    }).sort((a, b) => {
      const sellerA = mockUsers.find(u => u.id === a.sellerId);
      const sellerB = mockUsers.find(u => u.id === b.sellerId);

      switch (filters.sortBy) {
          case 'nearest': {
            if (!filters.currentCoords || !sellerA?.location || !sellerB?.location) return 0;
            const distA = getDistance(filters.currentCoords.lat, filters.currentCoords.lng, sellerA.location.lat, sellerA.location.lng);
            const distB = getDistance(filters.currentCoords.lat, filters.currentCoords.lng, sellerB.location.lat, sellerB.location.lng);
            return distA - distB;
          }
          case 'ending_soon': return new Date(a.expiryAt).getTime() - new Date(b.expiryAt).getTime();
          case 'luxury': return b.askPrice - a.askPrice;
          case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'watchlist': {
            // Priority 1: High Bidder
            const aIsHigh = a.currentHighBidderId === user.id;
            const bIsHigh = b.currentHighBidderId === user.id;
            if (aIsHigh && !bIsHigh) return -1;
            if (!aIsHigh && bIsHigh) return 1;

            // Priority 2: Has Bid (but not high)
            const aHasBid = bids.some(bid => bid.itemId === a.id && bid.bidderId === user.id);
            const bHasBid = bids.some(bid => bid.itemId === b.id && bid.bidderId === user.id);
            if (aHasBid && !bHasBid) return -1;
            if (!aHasBid && bHasBid) return 1;

            // Priority 3: Fallback to bid count / trending
            return b.bidCount - a.bidCount;
          }
          case 'trending':
          default: return b.bidCount - a.bidCount;
      }
    });

    setStableSortedIds(sorted.map(item => item.id));
    // Important: We dep on items.length so new items trigger re-sort.
    // We EXPLICITLY do not depend on 'items' content, 'bids', or 'watchedItemIds' to prevent re-sorting on interaction.
    // We decompose 'filters' to primitives to ensure stability.
  }, [
    items.length, 
    filters.category, 
    filters.search, 
    filters.sortBy, 
    filters.minPrice, 
    filters.maxPrice, 
    filters.listingType,
    filters.locationMode,
    filters.radius,
    // Note: We exclude watchedItemIds to prevent jumping when bidding (which auto-watches).
    // In 'watchlist' sort mode, this means newly watched items won't appear until refresh/filter change, which is consistent with "stable view".
  ]);

  // 2. Map ids back to latest item data for rendering
  const itemsToDisplay = useMemo(() => {
    return stableSortedIds
      .map(id => items.find(i => i.id === id))
      .filter((item): item is typeof items[0] => !!item);
  }, [stableSortedIds, items]); // accessing 'items' here is fine, it just updates the data inside the card, doesn't reorder


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

  return (
    <div id="marketplace-grid-root" className="px-4 pb-4 pt-2 md:px-4 md:pb-4 md:pt-2">
      <div className="mb-4 bg-white border border-slate-200/60 shadow-sm rounded-2xl flex flex-col gap-0">
        <div className="flex flex-col gap-2 pt-2 pb-2">
          {/* MOBILE: New Enhanced "Search & Filter" Mobile Header */}
          <div id="mobile-search-filter-container" className="md:hidden flex flex-col gap-2 px-4 mb-2">
            
            {/* Filter Grid Container */}
            <div className="flex flex-col gap-2">
              
              {/* Row 1: Sort, Category, Type, View */}
              <div className="grid grid-cols-4 gap-2">
                {/* 1. Sort Tab */}
                <Select 
                  value={filters.sortBy} 
                  onValueChange={(value) => setFilter('sortBy', value as typeof filters.sortBy)}
                >
                  <SelectTrigger id="mobile-sort-select" className="!h-auto w-full flex flex-col items-center justify-center gap-1 p-2 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 active:scale-95 active:bg-slate-200 transition-all duration-200 ease-in-out [&>span]:w-full [&_svg.lucide-chevron-down]:hidden shadow-sm hover:shadow-md">
                     {(() => {
                        const activeFilter = FILTERS.find(f => f.id === filters.sortBy) || FILTERS[0];
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
                  value={filters.category || 'All Items'} 
                  onValueChange={(value) => setFilter('category', value === 'All Items' ? null : value)}
                >
                  <SelectTrigger id="mobile-category-select" className="!h-auto w-full flex flex-col items-center justify-center gap-1 p-2 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 active:scale-95 active:bg-slate-200 transition-all duration-200 ease-in-out [&>span]:w-full [&_svg.lucide-chevron-down]:hidden shadow-sm hover:shadow-md">
                     {(() => {
                        const activeCat = CATEGORIES.find(c => c.label === filters.category) || CATEGORIES[0];
                        const Icon = activeCat.icon;
                        return (
                          <>
                            <Icon className="h-5 w-5 text-blue-500" />
                            <span className="text-[10px] font-medium leading-none text-slate-600 truncate w-full text-center">
                              {filters.category ? filters.category.split(' ')[0] : 'Categories'}
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
                  value={filters.listingType} 
                  onValueChange={(value) => setFilter('listingType', value as typeof filters.listingType)}
                >
                  <SelectTrigger id="mobile-type-select" className="!h-auto w-full flex flex-col items-center justify-center gap-1 p-2 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 active:scale-95 active:bg-slate-200 transition-all duration-200 ease-in-out [&>span]:w-full [&_svg.lucide-chevron-down]:hidden shadow-sm hover:shadow-md">
                     {(() => {
                        return (
                          <>
                            <Gavel className={`h-5 w-5 ${filters.listingType !== 'all' ? 'text-purple-500' : 'text-slate-500'}`} />
                            <span className="text-[10px] font-medium leading-none text-slate-600 truncate w-full text-center">
                              {filters.listingType === 'all' ? 'Type' : filters.listingType === 'public' ? 'Public' : 'Sealed'}
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
                  <LocationSelector variant="mobile-grid" className="w-full" align="start" />
                </div>

                {/* 6. Price (Span 1) */}
                <div className="w-full">
                  <PriceSelector />
                </div>
              </div>

            </div>
          </div>

          {/* DESKTOP: Full Filter Buttons Row */}
          <div id="smart-filters-row" className="hidden md:flex items-center gap-4 px-4">
            <div className="flex-1 overflow-x-auto scrollbar-hide flex items-center gap-4">
              <SmartFilterBar />
              
              <AnimatePresence>
                {(filters.search || filters.category) && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2 pr-4 shrink-0"
                  >
                    <div className="h-6 w-px bg-slate-200 mx-2" />
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 font-bold py-1 px-3 flex items-center gap-2 rounded-full whitespace-nowrap">
                      {filters.search ? `"${filters.search}"` : filters.category}
                      <button 
                        onClick={() => {
                          if (filters.search) setFilter('search', '');
                          if (filters.category) setFilter('category', 'All Items');
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
            {filters.search && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="md:hidden flex items-center px-4"
              >
                <Badge variant="secondary" className="bg-blue-600 text-white border-blue-600 font-bold py-1.5 px-4 flex items-center gap-2 rounded-full whitespace-nowrap shadow-sm">
                  Search: {filters.search}
                  <button 
                    onClick={() => setFilter('search', '')}
                    className="bg-white/20 hover:bg-white/30 p-0.5 rounded-full transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Category Bar Row */}
        <div id="category-bar-row" className="hidden md:block px-4 pb-2">
           <CategoryBar />
        </div>
      </div>
      
      <motion.div 
        layout
        id="marketplace-grid-container"
        className={`grid gap-3 ${getGridClasses()}`}
        style={getGridStyle()}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        <AnimatePresence mode="popLayout">
          {isLoading ? (
             // Skeleton Layout
             Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={`skeleton-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ItemCardSkeleton viewMode={viewMode} />
                </motion.div>
             ))
          ) : (
            itemsToDisplay.map((item) => {
              const seller = mockUsers.find(u => u.id === item.sellerId) || mockUsers[0];
              return (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 350, 
                    damping: 30,
                    opacity: { duration: 0.2 }
                  }}
                >
                  <ItemCard item={item} seller={seller} viewMode={viewMode} />
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </motion.div>

      {!isLoading && itemsToDisplay.length === 0 && (
        <EmptyState />
      )}
    </div>
  );
}
