"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { mockUsers } from "@/lib/mock-data";
import ItemCard from "./ItemCard";
import { LayoutGrid, Grid3x3, Grid2x2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ViewMode = 'compact' | 'comfortable' | 'spacious';

export default function MarketplaceGrid() {
  const { items, filters } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>('compact');

  // Apply filters
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
        // Original: grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6
        return "grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6";
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 leading-tight">
            {filters.category && filters.category !== "All Items" ? filters.category : "Trending"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {filteredItems.length} items
          </p>
        </div>

        {/* View Toggle Controls */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                <Button
                variant={viewMode === 'compact' ? 'default' : 'ghost'}
                size="icon"
                className={`h-8 w-8 rounded-md ${viewMode === 'compact' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'}`}
                onClick={() => setViewMode('compact')}
                title="Compact View"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'comfortable' ? 'default' : 'ghost'}
                size="icon"
                className={`h-8 w-8 rounded-md ${viewMode === 'comfortable' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'}`}
                onClick={() => setViewMode('comfortable')}
                title="Comfortable View"
              >
                <Grid2x2 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'spacious' ? 'default' : 'ghost'}
                size="icon"
                className={`h-8 w-8 rounded-md ${viewMode === 'spacious' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'}`}
                onClick={() => setViewMode('spacious')}
                title="Spacious View"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
        </div>
      </div>
      
      <motion.div 
        className={`grid gap-3 ${getGridClasses()}`}
      >
        <AnimatePresence>
        {filteredItems.map((item) => {
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
        })}
        </AnimatePresence>
      </motion.div>

      {filteredItems.length === 0 && (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400">
           <p className="text-sm font-semibold">No items found</p>
        </div>
      )}
    </div>
  );
}
