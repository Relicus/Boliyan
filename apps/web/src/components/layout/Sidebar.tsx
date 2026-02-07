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
import { Separator } from "@/components/ui/separator";
import { useApp } from "@/lib/store";
import { CONDITION_OPTIONS } from "@/lib/constants";
import { motion } from "framer-motion";
import { LocationSelector } from "@/components/marketplace/LocationSelector";
import BannerAd from "@/components/ads/BannerAd";

import { cn } from "@/lib/utils";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useState, useRef, useEffect, useMemo } from "react";
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

const SIDEBAR_AD_VISIBILITY_LIMIT = 3;
const SIDEBAR_AD_SESSION_LOAD_LIMIT = 5;
const SIDEBAR_AD_SESSION_STORAGE_KEY = "boliyan_sidebar_ad_loads";

export default function Sidebar() {
  const { filters, setFilter, resetFilters } = useApp();
  const pathname = usePathname();

  const [visibleAdSlots, setVisibleAdSlots] = useState(0);
  const [sessionAdLoads, setSessionAdLoads] = useState<number | null>(null);
  const previousVisibleAdSlotsRef = useRef(0);
  const secondAdTriggerRef = useRef<HTMLDivElement>(null);
  const thirdAdTriggerRef = useRef<HTMLDivElement>(null);

  const secondAdTriggerEntry = useIntersectionObserver(secondAdTriggerRef, {
    threshold: 0.15,
    rootMargin: "120px",
    freezeOnceVisible: true,
  });

  const thirdAdTriggerEntry = useIntersectionObserver(thirdAdTriggerRef, {
    threshold: 0.15,
    rootMargin: "120px",
    freezeOnceVisible: true,
  });

  const maxVisibleAdsForSession = useMemo(() => {
    if (sessionAdLoads === null) return 0;
    const remainingLoads = Math.max(0, SIDEBAR_AD_SESSION_LOAD_LIMIT - sessionAdLoads);
    return Math.min(SIDEBAR_AD_VISIBILITY_LIMIT, remainingLoads);
  }, [sessionAdLoads]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedValue = Number(window.sessionStorage.getItem(SIDEBAR_AD_SESSION_STORAGE_KEY) ?? 0);
    const safeStoredValue = Number.isFinite(storedValue) ? Math.max(0, storedValue) : 0;
    const remainingLoads = Math.max(0, SIDEBAR_AD_SESSION_LOAD_LIMIT - safeStoredValue);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessionAdLoads(safeStoredValue);
    setVisibleAdSlots(remainingLoads > 0 ? 1 : 0);
  }, []);

  useEffect(() => {
    if (!secondAdTriggerEntry?.isIntersecting) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibleAdSlots((previous) => Math.min(maxVisibleAdsForSession, Math.max(previous, 2)));
  }, [maxVisibleAdsForSession, secondAdTriggerEntry?.isIntersecting]);

  useEffect(() => {
    if (!thirdAdTriggerEntry?.isIntersecting) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibleAdSlots((previous) => Math.min(maxVisibleAdsForSession, Math.max(previous, 3)));
  }, [maxVisibleAdsForSession, thirdAdTriggerEntry?.isIntersecting]);

  useEffect(() => {
    if (sessionAdLoads === null || typeof window === "undefined") return;
    const previousVisibleSlots = previousVisibleAdSlotsRef.current;

    if (visibleAdSlots <= previousVisibleSlots) {
      previousVisibleAdSlotsRef.current = visibleAdSlots;
      return;
    }

    const newlyLoadedSlots = visibleAdSlots - previousVisibleSlots;
    const nextSessionLoads = Math.min(SIDEBAR_AD_SESSION_LOAD_LIMIT, sessionAdLoads + newlyLoadedSlots);
    previousVisibleAdSlotsRef.current = visibleAdSlots;

    if (nextSessionLoads === sessionAdLoads) return;

    setSessionAdLoads(nextSessionLoads);
    window.sessionStorage.setItem(SIDEBAR_AD_SESSION_STORAGE_KEY, String(nextSessionLoads));
  }, [sessionAdLoads, visibleAdSlots]);

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


      <ScrollArea id="sidebar-scroll-area-02" className="flex-1 px-4 min-h-0">
        <div className="space-y-6 py-4 pb-8">
          
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
              variant="ghost"
              onClick={resetFilters}
              className="w-full justify-center gap-2 text-xs font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
            >
              <RefreshCcw className="h-3.5 w-3.5 group-hover:rotate-180 transition-transform duration-500" />
              Clear Filters
            </Button>
          </div>

          <Separator className="bg-slate-100" />

          {visibleAdSlots > 0 && (
            <>
              {/* Sidebar Ad Slot 1 */}
              <div className="px-1 pt-1 pb-1">
                <BannerAd variant="sidebar" index={1} />
              </div>

              <div id="sidebar-ad-trigger-2" ref={secondAdTriggerRef} className="h-2 w-full" />
            </>
          )}

          {visibleAdSlots > 1 && (
            <>
              <Separator className="bg-slate-100" />

              {/* Sidebar Ad Slot 2 */}
              <div className="px-1 pt-1 pb-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <BannerAd variant="sidebar" index={2} />
              </div>

              <div id="sidebar-ad-trigger-3" ref={thirdAdTriggerRef} className="h-2 w-full" />
            </>
          )}

          {visibleAdSlots > 2 && (
            <>
              <Separator className="bg-slate-100" />

              {/* Sidebar Ad Slot 3 */}
              <div className="px-1 pt-1 pb-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <BannerAd variant="sidebar" index={3} />
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
