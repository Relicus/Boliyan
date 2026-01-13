"use client";

import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Flame, MapPin, Timer, Gem, Sparkles } from "lucide-react";

const FILTERS = [
  { id: 'trending', label: 'Trending', icon: Flame },
  { id: 'nearest', label: 'Near Me', icon: MapPin },
  { id: 'ending_soon', label: 'Ending Soon', icon: Timer },
  { id: 'luxury', label: 'High Value', icon: Gem },
  { id: 'newest', label: 'New Arrivals', icon: Sparkles },
];

export default function SmartFilterBar() {
  const { filters, setFilter } = useApp();

  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-1">
      {FILTERS.map((f) => {
        const Icon = f.icon;
        const isActive = filters.sortBy === f.id;
        
        return (
          <button
            key={f.id}
            onClick={() => setFilter('sortBy', f.id)}
            className={cn(
              // Base / Mobile Styles (Vertical, Borderless)
              "flex flex-col md:flex-row items-center justify-center md:gap-1.5 min-w-[60px] md:min-w-0 px-2 py-1 md:py-1.5 md:px-3 rounded-md md:rounded-full transition-all duration-200 md:border",
              
              // Conditional Active States
              isActive 
                ? "text-blue-600 scale-105 md:scale-100 md:bg-slate-900 md:border-slate-900 md:text-white md:shadow-sm" 
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 md:bg-white md:border-slate-200 md:text-slate-600 md:hover:bg-slate-50 md:hover:border-slate-300"
            )}
          >
            <Icon 
              className={cn(
                "h-6 w-6 mb-0.5 md:mb-0 md:h-4 md:w-4 transition-all duration-200",
                isActive && "stroke-[2.5px] md:stroke-2"
              )} 
              strokeWidth={2}
              fill={isActive ? "currentColor" : "none"}
            />
            <span className={cn(
              "text-[10px] leading-none tracking-wide whitespace-nowrap md:text-sm md:font-bold",
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
