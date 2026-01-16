"use client";

import { useApp } from "@/lib/store";
import { CATEGORIES } from "@/lib/constants";
import { FILTERS } from "./SmartFilterBar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { X, Check } from "lucide-react";

export default function FilterSheetContent({ onClose }: { onClose?: () => void }) {
  const { filters, setFilter } = useApp();

  const resetFilters = () => {
    setFilter('category', null);
    setFilter('sortBy', 'trending');
    setFilter('minPrice', null);
    setFilter('maxPrice', null);
    setFilter('listingType', 'all');
    if (onClose) onClose();
  };

  return (
    <div id="filter-sheet-root" className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-4 py-4 border-b">
        <h2 className="text-xl font-black font-outfit text-slate-900">Filters</h2>
        <Button variant="ghost" size="sm" onClick={resetFilters} className="text-blue-600 font-bold hover:bg-blue-50">
          Reset All
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 flex flex-col gap-8 pb-24">
          {/* Sorting Section */}
          <section id="filter-section-sort">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 block">Sort By</Label>
            <div className="grid grid-cols-2 gap-2">
              {FILTERS.map((f) => {
                const Icon = f.icon;
                const isActive = filters.sortBy === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFilter('sortBy', f.id)}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-xl border transition-all duration-200",
                      isActive 
                        ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-200" 
                        : "bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", isActive ? "text-white" : f.color)} />
                    <span className="text-sm font-bold">{f.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <Separator className="bg-slate-100" />

          {/* Categories Section */}
          <section id="filter-section-categories">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 block">Categories</Label>
            <div className="grid grid-cols-1 gap-1.5">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = (filters.category === cat.label) || (!filters.category && cat.label === "All Items");
                return (
                  <button
                    key={cat.label}
                    onClick={() => setFilter('category', cat.label === "All Items" ? null : cat.label)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl transition-all duration-200",
                      isSelected ? "bg-blue-50/50 text-blue-600 ring-1 ring-blue-100" : "text-slate-600 hove:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg transition-colors",
                        isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-sm">{cat.label}</span>
                    </div>
                    {isSelected && <Check className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
          </section>

          <Separator className="bg-slate-100" />

          {/* Price Range Section */}
          <section id="filter-section-price">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 block">Price Range</Label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice || ''}
                  onChange={(e) => setFilter('minPrice', e.target.value ? Number(e.target.value) : null)}
                  className="rounded-xl border-slate-200 focus:ring-blue-100"
                />
              </div>
              <div className="w-4 h-px bg-slate-200" />
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice || ''}
                  onChange={(e) => setFilter('maxPrice', e.target.value ? Number(e.target.value) : null)}
                  className="rounded-xl border-slate-200 focus:ring-blue-100"
                />
              </div>
            </div>
          </section>

          <Separator className="bg-slate-100" />

          {/* Listing Type Section */}
          <section id="filter-section-type">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 block">Listing Type</Label>
            <div className="flex p-1 bg-slate-100 rounded-xl">
              {(['all', 'public', 'sealed'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter('listingType', type)}
                  className={cn(
                    "flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all",
                    filters.listingType === type 
                      ? "bg-white text-blue-600 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </section>
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-white mt-auto">
        <Button 
          id="filter-apply-btn"
          className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-100"
          onClick={onClose}
        >
          View Results
        </Button>
      </div>
    </div>
  );
}
