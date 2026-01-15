"use client";

import { MapPin, Tag, CircleDollarSign, Compass, RefreshCcw, Search, Sparkles, Globe, Lock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useApp } from "@/lib/store";
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
    <aside id="sidebar-01" className="w-72 border-r border-slate-200/60 bg-white hidden lg:flex flex-col sticky top-16 h-[calc(100vh-64px)] overflow-hidden shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.02)]">
      <div className="p-4 pb-0">
        <div className="flex gap-2 mb-2">
          {/* Public Button */}
          <button
            id="sidebar-listing-type-public-btn"
            onClick={() => {
              const newValue = filters.listingType === 'public' ? 'all' : 'public';
              setFilter('listingType', newValue);
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border transition-all duration-200 group relative overflow-hidden",
              filters.listingType === 'public'
                ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200"
                : "bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50/50"
            )}
          >
            <Globe className={cn(
              "h-4 w-4 transition-transform duration-300",
              filters.listingType === 'public' ? "scale-110" : "group-hover:scale-110"
            )} />
            <span className="text-sm font-bold tracking-wide">Public</span>
          </button>

          {/* Sealed Button */}
          <button
            id="sidebar-listing-type-sealed-btn"
            onClick={() => {
              const newValue = filters.listingType === 'sealed' ? 'all' : 'sealed';
              setFilter('listingType', newValue);
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border transition-all duration-200 group relative overflow-hidden",
              filters.listingType === 'sealed'
                ? "bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-200"
                : "bg-white border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-amber-50/50"
            )}
          >
            <Lock className={cn(
              "h-4 w-4 transition-transform duration-300",
              filters.listingType === 'sealed' ? "scale-110" : "group-hover:scale-110"
            )} />
            <span className="text-sm font-bold tracking-wide">Secret</span>
          </button>
        </div>
      </div>

      <ScrollArea id="sidebar-scroll-area-02" className="flex-1 px-4 min-h-0">
        <div className="space-y-7 py-2 pb-8">
          
          {/* Location Radius */}
          <div className="bg-white/40 rounded-2xl p-4 border border-slate-200/50 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-900 font-outfit flex items-center gap-2.5">
              <div className="p-1 rounded-md bg-emerald-100/50 text-emerald-600">
                <MapPin className="h-3.5 w-3.5" />
              </div>
              Search Distance
            </h3>
            <div className="space-y-5">
              <div className="relative pt-2 pb-1">
                <input 
                  id="sidebar-radius-slider"
                  type="range" 
                  min="1" 
                  max="100" 
                  value={filters.radius}
                  onChange={(e) => setFilter('radius', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all" 
                />
                <div className="flex justify-between mt-2.5 text-[11px] font-medium text-slate-400">
                  <span>1 km</span>
                  <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/50">
                    {filters.radius} km
                  </span>
                  <span>100 km</span>
                </div>
              </div>
            </div>
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
                <span className="absolute left-3 top-2.5 text-xs font-medium text-slate-400 group-focus-within:text-blue-500 transition-colors">PKR</span>
                <input 
                  id="sidebar-min-price-input"
                  type="number" 
                  placeholder="Min" 
                  value={filters.minPrice || ''}
                  onChange={(e) => setFilter('minPrice', e.target.value ? Number(e.target.value) : null)}
                  className="w-full pl-10 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none placeholder:text-slate-300 font-medium text-slate-700 hover:border-slate-300"
                />
              </div>
              <div className="relative group">
                <span className="absolute left-3 top-2.5 text-xs font-medium text-slate-400 group-focus-within:text-blue-500 transition-colors">PKR</span>
                <input 
                  id="sidebar-max-price-input"
                  type="number" 
                  placeholder="Max" 
                  value={filters.maxPrice || ''}
                  onChange={(e) => setFilter('maxPrice', e.target.value ? Number(e.target.value) : null)}
                  className="w-full pl-10 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none placeholder:text-slate-300 font-medium text-slate-700 hover:border-slate-300"
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
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-slate-100 bg-white">
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
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all group"
        >
          <RefreshCcw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
          Reset All Filters
        </button>
      </div>
    </aside>
  );
}
