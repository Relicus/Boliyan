"use client";

import { memo, useMemo } from "react";
import { useMarketplace } from "@/context/MarketplaceContext";
import { useSearch } from "@/context/SearchContext";
import { motion, AnimatePresence } from "framer-motion";
import { FilterX } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClearFiltersButtonProps {
  className?: string;
  variant?: "inline" | "mobile";
}

/**
 * ClearFiltersButton - Shows when any non-default filter is active
 * 
 * Default state (no button shown):
 * - sortBy: 'trending'
 * - category: null (All Items)
 * - condition: 'all'
 * - listingType: 'all'
 * - minPrice: null
 * - maxPrice: null
 * - search query: empty
 */
function ClearFiltersButton({ className, variant = "inline" }: ClearFiltersButtonProps) {
  const { filters: mpFilters, setFilter: setMpFilter, updateFilters } = useMarketplace();
  const { filters: searchFilters, setFilters: setSearchFilters } = useSearch();

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    
    // Sort (non-default if not 'trending')
    if (mpFilters.sortBy !== 'trending') count++;
    
    // Category (non-default if set)
    if (mpFilters.category) count++;
    
    // Condition (non-default if not 'all')
    if (mpFilters.condition !== 'all') count++;
    
    // Listing type (non-default if not 'all')
    if (mpFilters.listingType !== 'all') count++;
    
    // Price range
    if (mpFilters.minPrice !== null) count++;
    if (mpFilters.maxPrice !== null) count++;
    
    // Search query
    if (searchFilters.query?.trim()) count++;
    
    return count;
  }, [mpFilters, searchFilters.query]);

  const hasActiveFilters = activeFilterCount > 0;

  const handleClear = () => {
    // Reset marketplace filters
    updateFilters({
      category: null,
      sortBy: 'trending',
      minPrice: null,
      maxPrice: null,
      condition: 'all',
      listingType: 'all',
    });
    
    // Clear search query
    if (searchFilters.query) {
      setSearchFilters({ ...searchFilters, query: '' });
    }
  };

  const isMobile = variant === "mobile";

  return (
    <AnimatePresence>
      {hasActiveFilters && (
        <motion.button
          id="clear-filters-btn"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={handleClear}
          className={cn(
            // Base styles
            "flex items-center gap-2 font-bold transition-all duration-200 active:scale-[0.98] shrink-0",
            
            // Mobile variant - full width horizontal bar
            isMobile && [
              "justify-center py-2.5 px-4 bg-red-50 border border-red-200 rounded-xl",
              "hover:bg-red-100 active:bg-red-200",
              "shadow-sm hover:shadow-md text-red-600"
            ],
            
            // Desktop inline variant
            !isMobile && [
              "px-3 py-1.5 rounded-full border",
              "bg-red-50 border-red-200 text-red-600",
              "hover:bg-red-100 hover:border-red-300",
              "shadow-sm hover:shadow-md"
            ],
            
            className
          )}
        >
          <FilterX className={cn(
            "text-red-500",
            isMobile ? "h-4 w-4" : "h-4 w-4"
          )} />
          
          <span className="text-sm">
            Clear Filters {activeFilterCount > 1 ? `(${activeFilterCount})` : ""}
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default memo(ClearFiltersButton);
