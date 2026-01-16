"use client";

import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Flame, MapPin, Timer, Gem, Sparkles, Bookmark } from "lucide-react";

export const FILTERS = [
  { id: 'trending', label: 'Trending', icon: Flame, color: "text-orange-500", fill: "fill-orange-500/10" },
  { id: 'nearest', label: 'Near Me', icon: MapPin, color: "text-blue-500", fill: "fill-blue-500/10" },
  { id: 'ending_soon', label: 'Ending Soon', icon: Timer, color: "text-rose-500", fill: "fill-rose-500/10" },
  { id: 'luxury', label: 'High Value', icon: Gem, color: "text-purple-500", fill: "fill-purple-500/10" },
  { id: 'newest', label: 'Just Listed', icon: Sparkles, color: "text-emerald-500", fill: "fill-emerald-500/10" },
  { id: 'watchlist', label: 'Watchlist', icon: Bookmark, color: "text-amber-500", fill: "fill-amber-500/10" },
] as const;

export default function SmartFilterBar() {
  const { filters, setFilter } = useApp();

  return (
    <div id="smart-filter-bar-root" className="w-full flex items-center justify-between md:justify-start gap-4 overflow-x-auto scrollbar-hide px-4 py-1">
      {FILTERS.map((f) => {
        const Icon = f.icon;
        const isActive = filters.sortBy === f.id;
        
        return (
          <button
            key={f.id}
            id={`smart-filter-btn-${f.id}`}
            onClick={() => setFilter('sortBy', f.id)}
            className={cn(
              // Base / Mobile Styles (Vertical, Borderless)
              "flex flex-col md:flex-row items-center justify-center md:gap-1.5 min-w-[60px] md:min-w-0 px-2 py-1 md:py-1.5 md:px-3 rounded-md md:rounded-full transition-all duration-200 md:border",
              
              // Conditional Active States
              isActive 
                ? "text-blue-600 scale-105 md:scale-100 md:bg-slate-900 md:border-slate-900 md:text-white md:shadow-sm" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 md:bg-white md:border-slate-200 md:text-slate-700 md:hover:bg-slate-50 md:hover:border-slate-300"
            )}
          >
            <Icon 
              id={`smart-filter-icon-${f.id}`}
              className={cn(
                "h-6 w-6 mb-0.5 md:mb-0 md:h-4 md:w-4 transition-all duration-200",
                isActive 
                  ? "stroke-[2.5px] md:stroke-2 text-blue-600 fill-blue-600/20 md:text-white md:fill-white/20" 
                  : cn(f.color, f.fill)
              )} 
              strokeWidth={2}
            />
            <span 
              id={`smart-filter-label-${f.id}`}
              className={cn(
              "text-[10px] leading-none tracking-wide whitespace-nowrap md:text-fluid-body md:font-bold",
              isActive ? "font-bold" : "font-medium"
            )}>
              {f.label}
            </span>
          </button>
        )
      })}
    </div>
  );
}
