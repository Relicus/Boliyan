"use client";

import { MapPin, Tag, CircleDollarSign, Compass, RefreshCcw, Search, Sparkles, Globe, Lock, Layers } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import { LocationSelector } from "@/components/marketplace/LocationSelector";
import { cn } from "@/lib/utils";

import { usePathname } from "next/navigation";

export default function Sidebar() {
  const { filters, setFilter } = useApp();
  const pathname = usePathname();

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
            <Layers className="h-4 w-4 relative z-20" />
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
            <Globe className="h-4 w-4 relative z-20" />
            <span className="relative z-20">Public</span>
          </button>

          {/* Secret Toggle */}
          <button
            onClick={() => setFilter('listingType', 'sealed')}
            className={cn(
              "flex-1 relative flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-colors duration-200 z-10",
              filters.listingType === 'sealed' ? "text-amber-600" : "text-slate-500 hover:text-amber-600"
            )}
          >
            {filters.listingType === 'sealed' && (
              <motion.div
                layoutId="listing-type-pill"
                className="absolute inset-0 bg-white shadow-sm shadow-amber-100 ring-1 ring-amber-100 rounded-xl -z-10"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <Lock className="h-4 w-4 relative z-20" />
            <span className="relative z-20">Secret</span>
          </button>
        </div>
      </div>

      <ScrollArea id="sidebar-scroll-area-02" className="flex-1 px-4 min-h-0">
        <div className="space-y-6 py-4 pb-8">
          
          {/* Location (Standalone Dropdown) */}
          <div className="px-1">
            <LocationSelector variant="sidebar-compact" />
          </div>

          {/* Price Range */}
          <div className="bg-white/40 rounded-2xl p-4 border border-slate-200/50 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-900 font-outfit flex items-center gap-2.5">
               <div className="p-1 rounded-md bg-blue-100/50 text-blue-600">
                <CircleDollarSign className="h-3.5 w-3.5" />
              </div>
              Price Range
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative group">
                <input 
                  id="sidebar-min-price-input"
                  type="number" 
                  placeholder="Min" 
                  value={filters.minPrice || ''}
                  onChange={(e) => setFilter('minPrice', e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none placeholder:text-slate-300 font-medium text-slate-700 hover:border-slate-300"
                />
              </div>
              <div className="relative group">
                <input 
                  id="sidebar-max-price-input"
                  type="number" 
                  placeholder="Max" 
                  value={filters.maxPrice || ''}
                  onChange={(e) => setFilter('maxPrice', e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none placeholder:text-slate-300 font-medium text-slate-700 hover:border-slate-300"
                />
              </div>
            </div>
          </div>

          {/* Condition */}
          <div className="px-1">
            <h3 className="mb-3 text-sm font-semibold text-slate-900 font-outfit flex items-center gap-2.5">
               <div className="p-1 rounded-md bg-violet-100/50 text-violet-600">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              Condition
            </h3>
            <div className="space-y-0.5">
              {['Brand New', 'Like New', 'Excellent', 'Good', 'Fair'].map((condition) => (
                <label key={condition} id={`sidebar-condition-label-${condition.toLowerCase().replace(/\s+/g, '-')}`} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group">
                  <div className="relative flex items-center">
                    <input 
                      id={`sidebar-condition-checkbox-${condition.toLowerCase().replace(/\s+/g, '-')}`}
                      type="checkbox" 
                      className="peer h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500/20 cursor-pointer transition-all" 
                    />
                  </div>
                  <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">{condition}</span>
                </label>
              ))}
            </div>
          </div>



          <Separator className="bg-slate-100" />

          {/* Saved Searches */}
          <div className="px-1">
             <h3 className="mb-3 text-sm font-semibold text-slate-900 font-outfit flex items-center gap-2.5">
               <div className="p-1 rounded-md bg-rose-100/50 text-rose-600">
                 <Tag className="h-3.5 w-3.5" />
               </div>
               Saved Searches
             </h3>
             <div className="flex flex-wrap gap-2">
                {['iPhone 15 Pro', 'Gaming Laptop', 'Vintage Watch'].map((search) => (
                  <button 
                    key={search}
                    id={`sidebar-saved-search-${search.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => setFilter('search', search)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white text-slate-600 rounded-full border border-slate-200 shadow-sm hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50 transition-all group"
                  >
                    <Search className="h-3 w-3 text-slate-400 group-hover:text-rose-400" />
                    {search}
                  </button>
                ))}
             </div>
          </div>

          <Separator className="bg-slate-100" />

          {/* Reset Filters - Integrated */}
          <div className="px-1 pt-2">
            <button 
              id="sidebar-reset-filters-btn"
              onClick={() => {
                setFilter('category', null);
                setFilter('search', "");
                setFilter('radius', 15);
                setFilter('minPrice', null);
                setFilter('maxPrice', null);
                setFilter('listingType', 'all');
              }}
              className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all group border border-dashed border-slate-200 hover:border-rose-200"
            >
              <RefreshCcw className="h-3.5 w-3.5 group-hover:rotate-180 transition-transform duration-500" />
              Reset All Filters
            </button>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
