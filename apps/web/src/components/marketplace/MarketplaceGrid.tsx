"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { useApp } from "@/lib/store";
import { mockUsers } from "@/lib/mock-data";
import ItemCard from "./ItemCard";
import ItemCardSkeleton from "./ItemCardSkeleton";
import EmptyState from "@/components/ui/EmptyState";
import SmartFilterBar from "./SmartFilterBar";
import CategoryBar from "./CategoryBar";
import { LocationSelector } from "./LocationSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, LayoutGrid, Grid3x3, Grid2x2, RefreshCw, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type ViewMode = 'compact' | 'comfortable' | 'spacious';

export default function MarketplaceGrid() {
  const { items, filters, setFilter, bids, user, watchedItemIds } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>('comfortable');
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading on mount
  useEffect(() => {
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

  // Calculate Distance (Mock)
  const getDistance = (itemId: string) => {
     const hash = itemId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
     return (hash % 80) / 10 + 1.2;
  };

  // 1. Get current sorted items from store (LIVE)
  const currentSortedItems = useMemo(() => {
    return items.filter(item => {
      // Watchlist Filter
      if (filters.sortBy === 'watchlist') {
        if (!watchedItemIds.includes(item.id)) return false;
      }

      if (filters.category && filters.category !== "All Items" && item.category !== filters.category) {
        return false;
      }
      if (filters.search) {
        const query = filters.search.toLowerCase();
        if (!item.title.toLowerCase().includes(query) && !item.description.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      const currentPrice = item.currentHighBid || item.askPrice;
      if (filters.minPrice !== null && currentPrice < filters.minPrice) return false;
      if (filters.maxPrice !== null && currentPrice > filters.maxPrice) return false;
      if (filters.listingType === 'public' && !item.isPublicBid) return false;
      if (filters.listingType === 'sealed' && item.isPublicBid) return false;
      
      return true;
    }).sort((a, b) => {
      switch (filters.sortBy) {
          case 'nearest': return getDistance(a.id) - getDistance(b.id);
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
  }, [items, filters, bids, user, watchedItemIds]);

  // 2. Stable display state
  const itemsToDisplay = currentSortedItems;


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
      <div className="mb-4 bg-white border border-slate-200/60 shadow-sm rounded-2xl flex flex-col gap-0 overflow-hidden">
        <div className="flex flex-col gap-2 pt-2 pb-2">
          {/* Filters & View Toggles Row */}
          <div id="smart-filters-row" className="flex items-center gap-4 px-4">
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

            {/* View Toggle Controls (Repositioned) */}
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
        </div>

        {/* Category Bar Row */}
        <div id="category-bar-row" className="hidden md:block px-4 pb-2">
           <CategoryBar />
        </div>
      </div>
      
      <motion.div 
        id="marketplace-grid-container"
        className={`grid gap-3 ${getGridClasses()}`}
        style={getGridStyle()}
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
                  transition={{ duration: 0.3 }}
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
