"use client";

import { RefreshCcw, Lock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import { LocationSelector } from "@/components/marketplace/LocationSelector";
import BannerAd from "@/components/ads/BannerAd";
import { ActiveFilters } from "@/components/common/ActiveFilters";
import { cn } from "@/lib/utils";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useState, useRef, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { usePathname } from "next/navigation";

export default function Sidebar() {
  const { filters, setFilter } = useApp();
  const pathname = usePathname();
  
  // Infinite Scroll Ads State
  const [adCount, setAdCount] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // We need to know if there are more items to load in the main feed.
  // Ideally, the parent should pass this down or we access it from store.
  // For now, we'll access the marketplace state to check loading status or item count.
  const { items, isMarketplaceLoading } = useApp();

  const entry = useIntersectionObserver(loadMoreRef, {
    threshold: 0.1,
    rootMargin: '100px',
  });
  
  // Logic: Only add ad if we intersect AND we likely have enough content to justify scrolling.
  // If marketplace is loading or has very few items (end of list), we stop adding ads.
  // A simple heuristic: if we have fewer than (adCount * 5) items, we might be over-spamming.
  useEffect(() => {
    if (entry?.isIntersecting && !isMarketplaceLoading && items.length > (adCount * 4)) {
      const timer = setTimeout(() => {
        setAdCount(prev => prev + 1);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [entry?.isIntersecting, adCount, isMarketplaceLoading, items.length]);

  // Only show sidebar on home page
  if (pathname !== "/") {
    return null;
  }

  return (
    <aside id="sidebar-01" className="w-72 border-r border-slate-200/60 bg-white hidden lg:flex flex-col h-fit min-h-[calc(100vh-64px)] overflow-hidden shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.02)]">
      <div className="p-4 pb-0">
        <div className="flex bg-slate-100/80 p-1.5 rounded-2xl isolate">
          {/* All Toggle */}
          <button
            onClick={() => setFilter('listingType', 'all')}
            className={cn(
              "flex-1 relative flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-colors duration-200 z-10",
              filters.listingType === 'all' ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
            )}
          >
            {filters.listingType === 'all' && (
              <motion.div
                layoutId="listing-type-pill"
                className="absolute inset-0 bg-white shadow-sm shadow-slate-200/50 ring-1 ring-black/5 rounded-xl -z-10"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-20">All</span>
          </button>

          {/* Public Toggle */}
          <button
            onClick={() => setFilter('listingType', 'public')}
            className={cn(
              "flex-1 relative flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-colors duration-200 z-10",
              filters.listingType === 'public' ? "text-blue-600" : "text-slate-500 hover:text-blue-600"
            )}
          >
            {filters.listingType === 'public' && (
              <motion.div
                layoutId="listing-type-pill"
                className="absolute inset-0 bg-white shadow-sm shadow-blue-100 ring-1 ring-blue-100 rounded-xl -z-10"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-20">Public</span>
          </button>

          {/* Hidden Toggle */}
          <button
            onClick={() => setFilter('listingType', 'hidden')}
            className={cn(
              "flex-1 relative flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-colors duration-200 z-10",
              filters.listingType === 'hidden' ? "text-amber-600" : "text-slate-500 hover:text-amber-600"
            )}
          >
            {filters.listingType === 'hidden' && (
              <motion.div
                layoutId="listing-type-pill"
                className="absolute inset-0 bg-white shadow-sm shadow-amber-100 ring-1 ring-amber-100 rounded-xl -z-10"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-20">Hidden</span>
          </button>
        </div>
      </div>

      {/* Active Filters Section */}
      <ActiveFilters variant="sidebar" className="border-b border-slate-100" />

      <ScrollArea id="sidebar-scroll-area-02" className="flex-1 px-4 min-h-0">
        <div className="space-y-6 py-4 pb-8">
          
          {/* Location (Standalone Dropdown) */}
          <div className="px-1">
            <h3 className="mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">LIST LOCATION</h3>
            <LocationSelector variant="sidebar-compact" className="shadow-none border-slate-200" />
          </div>

          {/* Price Range */}
          <div className="px-1">
            <h3 className="mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Price Range</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">₨</span>
                 <Input 
                  id="sidebar-min-price-input"
                  type="number" 
                  placeholder="Min" 
                  value={filters.minPrice || ''}
                  onChange={(e) => setFilter('minPrice', e.target.value ? Number(e.target.value) : null)}
                  className="pl-7 bg-white border-slate-200 focus-visible:ring-blue-500/20"
                />
              </div>
              <div className="relative">
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">₨</span>
                 <Input 
                  id="sidebar-max-price-input"
                  type="number" 
                  placeholder="Max" 
                  value={filters.maxPrice || ''}
                  onChange={(e) => setFilter('maxPrice', e.target.value ? Number(e.target.value) : null)}
                  className="pl-7 bg-white border-slate-200 focus-visible:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          {/* Condition */}
          <div className="px-1">
            <h3 className="mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Condition</h3>
            <Select 
              value={filters.condition || 'all'} 
              onValueChange={(val) => setFilter('condition', val)}
            >
              <SelectTrigger id="sidebar-condition-select" className="w-full bg-white border-slate-200 focus:ring-blue-500/20">
                <SelectValue placeholder="Any Condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Condition</SelectItem>
                <SelectItem value="new">Brand New</SelectItem>
                <SelectItem value="like_new">Like New</SelectItem>
                <SelectItem value="used">Used (Good)</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
              </SelectContent>
            </Select>
          </div>



          {/* Reset Filters - Integrated */}
          <div className="px-1 pt-2">
            <Button 
              id="sidebar-reset-filters-btn"
              variant="ghost"
              onClick={() => {
                setFilter('category', null);
                setFilter('search', "");
                setFilter('radius', 15);
                setFilter('minPrice', null);
                setFilter('maxPrice', null);
                setFilter('listingType', 'all');
              }}
              className="w-full justify-center gap-2 text-xs font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
            >
              <RefreshCcw className="h-3.5 w-3.5 group-hover:rotate-180 transition-transform duration-500" />
              Reset All Filters
            </Button>
          </div>

          <Separator className="bg-slate-100" />

          {/* Banner Ad */}
          <div className="px-1 pt-1 pb-1">
             <BannerAd variant="sidebar" />
          </div>

          <Separator className="bg-slate-100" />

          {/* Infinite Scroll Ads */}
          {Array.from({ length: adCount }).map((_, i) => (
             <div key={`infinite-ad-${i}`} className="px-1 pt-1 pb-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <BannerAd variant="sidebar" index={i + 1} />
             </div>
          ))}

          {/* Load More Trigger */}
          <div ref={loadMoreRef} className="h-4 w-full" />
        </div>
      </ScrollArea>
    </aside>
  );
}
