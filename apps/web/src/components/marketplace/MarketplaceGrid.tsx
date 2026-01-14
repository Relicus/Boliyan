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
import { Search, LayoutGrid, Grid3x3, Grid2x2, RefreshCw } from "lucide-react";

type ViewMode = 'compact' | 'comfortable' | 'spacious';

export default function MarketplaceGrid() {
  const { items, filters, setFilter } = useApp();
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
          case 'trending':
          default: return b.bidCount - a.bidCount;
      }
    });
  }, [items, filters]);

  // 2. Stable display state
  const [displayOrder, setDisplayOrder] = useState<string[]>([]);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);

  // Update order when filters change (Immediate UX)
  useEffect(() => {
    setDisplayOrder(currentSortedItems.map(i => i.id));
    setHasNewUpdates(false);
  }, [filters.category, filters.sortBy, filters.search, filters.minPrice, filters.maxPrice, filters.listingType]);

  // Check if live order has changed compared to display order
  useEffect(() => {
    if (displayOrder.length === 0 && currentSortedItems.length > 0) {
      setDisplayOrder(currentSortedItems.map(i => i.id));
      return;
    }

    const currentIds = currentSortedItems.map(i => i.id);
    const orderChanged = JSON.stringify(currentIds) !== JSON.stringify(displayOrder);
    
    if (orderChanged) {
      setHasNewUpdates(true);
    } else {
      setHasNewUpdates(false);
    }
  }, [currentSortedItems, displayOrder]);

  const handleRefresh = () => {
    setDisplayOrder(currentSortedItems.map(i => i.id));
    setHasNewUpdates(false);
  };

  // Final items to map over (Stable Order, Live Data)
  const itemsToDisplay = displayOrder
    .map(id => items.find(item => item.id === id))
    .filter(Boolean) as typeof items;

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
    <div id="marketplace-grid-root" className="px-4 pb-4 pt-0 md:px-4 md:pb-4 md:pt-0">
      <div className="mb-2 top-0 md:top-16 z-30 bg-white -mx-4 border-b border-slate-200/50 flex flex-col gap-0">
        <div className="flex flex-col gap-2 pt-0 pb-1">
          {/* Top Row: Search & View Toggles */}
          <div id="toolbar-top-row" className="flex items-center gap-2 px-4 py-2">
             <div id="search-input-wrapper" className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  id="search-input-field"
                  type="search" 
                  placeholder="Search items..." 
                  className="w-full pl-9 bg-white border-slate-200 h-10 shadow-sm focus-visible:ring-blue-500"
                  value={filters.search}
                  onChange={(e) => setFilter('search', e.target.value)}
                />
             </div>
             
             {/* Location Selection */}
             <div id="location-selector-wrapper" className="hidden sm:flex items-center gap-2">
                <LocationSelector align="end" />
             </div>

             {/* View Toggle Controls */}
             <div id="view-mode-toggles" className="flex items-center bg-white p-1 rounded-lg border border-slate-200 shadow-sm shrink-0">
                  <Button
                  id="view-mode-compact-btn"
                  variant={viewMode === 'compact' ? 'default' : 'ghost'}
                  size="icon"
                  className={`h-8 w-8 rounded-md ${viewMode === 'compact' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                  onClick={() => setViewMode('compact')}
                  title="Compact View"
                  >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  id="view-mode-comfortable-btn"
                  variant={viewMode === 'comfortable' ? 'default' : 'ghost'}
                  size="icon"
                  className={`h-8 w-8 rounded-md ${viewMode === 'comfortable' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                  onClick={() => setViewMode('comfortable')}
                  title="Comfortable View"
                  >
                  <Grid2x2 className="h-4 w-4" />
                </Button>
                <Button
                  id="view-mode-spacious-btn"
                  variant={viewMode === 'spacious' ? 'default' : 'ghost'}
                  size="icon"
                  className={`h-8 w-8 rounded-md ${viewMode === 'spacious' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                  onClick={() => setViewMode('spacious')}
                  title="Spacious View"
                  >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
            </div>
          </div>

          {/* Second Row: Smart Filters */}
          <div id="smart-filters-row" className="flex items-center gap-4 overflow-x-auto scrollbar-hide px-4">
            <SmartFilterBar />
          </div>
        </div>

        {/* Category Bar Row */}
        <div id="category-bar-row" className="hidden md:block px-4 pb-2">
           <CategoryBar />
        </div>

        {/* Floating Refresh Notification */}
        <AnimatePresence>
          {hasNewUpdates && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+8px)] z-40"
            >
              <Button 
                onClick={handleRefresh}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full px-5 py-2 h-9 text-xs font-bold gap-2"
              >
                <RefreshCw className="h-3 w-3" />
                New Updates Available
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
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
