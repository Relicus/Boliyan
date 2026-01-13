"use client";

import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const FILTERS = [
  { id: 'trending', label: 'Trending', icon: '1F525' },
  { id: 'nearest', label: 'Near Me', icon: '1F4CD' },
  { id: 'ending_soon', label: 'Ending Soon', icon: '23F3' },
  { id: 'luxury', label: 'High Value', icon: '1F48E' },
  { id: 'newest', label: 'New Arrivals', icon: '2728' },
];

export default function SmartFilterBar() {
  const { filters, setFilter } = useApp();

  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
      {FILTERS.map((f) => (
        <button
          key={f.id}
          onClick={() => setFilter('sortBy', f.id)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-bold transition-all whitespace-nowrap",
            filters.sortBy === f.id
              ? "bg-slate-900 border-slate-900 text-white shadow-sm"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
          )}
        >
          <img 
            src={`https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/svg/${f.icon}.svg`}
            alt={f.label}
            className="w-5 h-5"
          />
          <span>{f.label}</span>
        </button>
      ))}
    </div>
  );
}
