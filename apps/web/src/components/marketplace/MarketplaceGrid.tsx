"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { mockUsers } from "@/lib/mock-data";
import ItemCard from "./ItemCard";
import ItemCardSkeleton from "./ItemCardSkeleton";
import EmptyState from "@/components/ui/EmptyState";
import SmartFilterBar from "./SmartFilterBar";
import { LayoutGrid, Grid3x3, Grid2x2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ViewMode = 'compact' | 'comfortable' | 'spacious';

export default function MarketplaceGrid() {
  const { items, filters } = useApp();
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

  // Apply filters and sorting
  const filteredItems = items.filter(item => {
    if (filters.category && filters.category !== "All Items" && item.category !== filters.category) {
      return false;
    }
    if (filters.search) {
      const query = filters.search.toLowerCase();
      if (!item.title.toLowerCase().includes(query) && !item.description.toLowerCase().includes(query)) {
        return false;
      }
    }
    return true;
  }).sort((a, b) => {
    switch (filters.sortBy) {
        case 'nearest':
            return getDistance(a.id) - getDistance(b.id);
        case 'ending_soon':
            // Mock ending soon: assume items created earlier end sooner? 
            // Or just random for now since we don't have expiry in mock data clearly
            return a.id.localeCompare(b.id); 
        case 'luxury':
            return b.askPrice - a.askPrice;
        case 'newest':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'trending':
        default:
            return b.bidCount - a.bidCount;
    }
  });

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
    <div className="p-4">
      <div className="mb-4 flex flex-row items-center justify-between gap-4 sticky top-0 bg-slate-50/95 backdrop-blur z-30 py-2 -mx-4 px-4 border-b border-slate-200/50">
        <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide flex-1">
          <SmartFilterBar />
        </div>

        {/* View Toggle Controls */}
        <div className="flex items-center bg-white p-1 rounded-lg border border-slate-200 shadow-sm shrink-0">
                <Button
                variant={viewMode === 'compact' ? 'default' : 'ghost'}
                size="icon"
                className={`h-8 w-8 rounded-md ${viewMode === 'compact' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                onClick={() => setViewMode('compact')}
                title="Compact View"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'comfortable' ? 'default' : 'ghost'}
                size="icon"
                className={`h-8 w-8 rounded-md ${viewMode === 'comfortable' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                onClick={() => setViewMode('comfortable')}
                title="Comfortable View"
              >
                <Grid2x2 className="h-4 w-4" />
              </Button>
              <Button
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
      
      <motion.div 
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
            filteredItems.map((item) => {
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

      {!isLoading && filteredItems.length === 0 && (
        <EmptyState />
      )}
    </div>
  );
}
