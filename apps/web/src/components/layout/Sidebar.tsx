"use client";

import { 
  RefreshCcw, 
  LayoutGrid, 
  Globe, 
  Lock, 
  MapPin, 
  Banknote, 
  Sparkles,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApp } from "@/lib/store";
import { CONDITION_OPTIONS } from "@/lib/constants";
import { motion } from "framer-motion";
import { LocationSelector } from "@/components/marketplace/LocationSelector";
import SidebarAdDock from "@/components/layout/SidebarAdDock";

import { cn } from "@/lib/utils";
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
  const { filters, setFilter, resetFilters } = useApp();
  const pathname = usePathname();

  // Only show sidebar on home page
  if (pathname !== "/") {
    return null;
  }

  return (
    <div id="sidebar-rail-01" className="w-72 border-r border-slate-200/60 bg-white hidden lg:flex flex-col shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.02)]">
      <aside id="sidebar-01" className="flex flex-col">
        <div className="p-4 pb-0">
        <div className="flex bg-slate-100/80 p-1.5 rounded-2xl isolate">
          {/* All Toggle */}
          <button
            id="sidebar-toggle-all"
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
            <span className="relative z-20 flex items-center gap-1.5">
              <LayoutGrid className="h-3.5 w-3.5" />
              Feed
            </span>
          </button>

          {/* Public Toggle */}
          <button
            id="sidebar-toggle-public"
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
            <span className="relative z-20 flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Public
            </span>
          </button>

          {/* Hidden Toggle */}
          <button
            id="sidebar-toggle-hidden"
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
            <span className="relative z-20 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              Hidden
            </span>
          </button>
        </div>
        </div>


        <ScrollArea id="sidebar-scroll-area-02" className="px-4">
          <div className="space-y-6 py-4 pb-4">
          
          {/* Location (Standalone Dropdown) */}
          <div className="px-1">
            <h3 className="mb-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              List Location
            </h3>
            <LocationSelector variant="sidebar-compact" className="shadow-none border-slate-200" mode="filter" />
          </div>

          {/* Price Range */}
          <div className="px-1">
            <h3 className="mb-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1 flex items-center gap-2">
              <Banknote className="h-3.5 w-3.5 text-slate-400" />
              Price Range
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative group">
                 <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <ArrowDownWideNarrow className="h-3 w-3 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                    <span className="text-slate-400 text-[10px] font-bold">₨</span>
                 </div>
                 <Input 
                  id="sidebar-min-price-input"
                  type="number" 
                  placeholder="Min" 
                  value={filters.minPrice || ''}
                  onChange={(e) => setFilter('minPrice', e.target.value ? Number(e.target.value) : null)}
                  className="pl-12 bg-white border-slate-200 focus-visible:ring-blue-500/20 rounded-xl text-xs font-bold"
                />
              </div>
              <div className="relative group">
                 <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <ArrowUpNarrowWide className="h-3 w-3 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                    <span className="text-slate-400 text-[10px] font-bold">₨</span>
                 </div>
                 <Input 
                  id="sidebar-max-price-input"
                  type="number" 
                  placeholder="Max" 
                  value={filters.maxPrice || ''}
                  onChange={(e) => setFilter('maxPrice', e.target.value ? Number(e.target.value) : null)}
                  className="pl-12 bg-white border-slate-200 focus-visible:ring-blue-500/20 rounded-xl text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* Condition */}
          <div className="px-1">
            <h3 className="mb-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-slate-400" />
              Condition
            </h3>
            <Select 
              value={filters.condition || 'all'} 
              onValueChange={(val) => setFilter('condition', val)}
            >
              <SelectTrigger id="sidebar-condition-select" className="w-full bg-white border-slate-200 focus:ring-blue-500/20 rounded-xl">
                <SelectValue placeholder="Any Condition" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                <SelectItem value="all" className="rounded-lg">
                  <span className="font-medium">Any Condition</span>
                </SelectItem>
                {CONDITION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id} className="rounded-lg">
                    <span>{opt.badgeLabel}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>



          {/* Reset Filters - Integrated */}
          <div className="px-1 pt-2">
            <Button 
              id="sidebar-reset-filters-btn"
              variant="outline"
              onClick={resetFilters}
              className="group h-10 w-full justify-center gap-2 rounded-xl border-slate-200 bg-white text-xs font-bold text-slate-600 shadow-sm shadow-slate-200/60 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-rose-600 hover:shadow-md active:translate-y-0"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-slate-500 transition-colors group-hover:bg-rose-100 group-hover:text-rose-600">
                <RefreshCcw className="h-3.5 w-3.5 transition-transform duration-500 group-hover:rotate-180" />
              </span>
              Clear Filters
            </Button>
          </div>

          </div>
        </ScrollArea>
      </aside>
      <SidebarAdDock />
    </div>
  );
}
