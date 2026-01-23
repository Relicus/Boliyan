"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PriceSelector() {
  const { filters, setFilter } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  
  // Local state for inputs to allow typing before applying
  const [localMin, setLocalMin] = useState<string>(filters.minPrice?.toString() || "");
  const [localMax, setLocalMax] = useState<string>(filters.maxPrice?.toString() || "");

  const handleApply = () => {
    setFilter("minPrice", localMin ? Number(localMin) : null);
    setFilter("maxPrice", localMax ? Number(localMax) : null);
    setIsOpen(false);
  };

  const handleClear = () => {
    setLocalMin("");
    setLocalMax("");
    setFilter("minPrice", null);
    setFilter("maxPrice", null);
    setIsOpen(false);
  };

  const hasActivePriceFilter = filters.minPrice !== null || filters.maxPrice !== null;

  return (
    <Popover open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (open) {
        // Sync local state with store when opening
        setLocalMin(filters.minPrice?.toString() || "");
        setLocalMax(filters.maxPrice?.toString() || "");
      }
    }}>
      <PopoverTrigger asChild>
        <Button
          id="price-selector-trigger"
          variant="outline"
          className={cn(
            "h-auto w-full flex flex-col items-center justify-center gap-1 p-2 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 active:scale-y-95 transition-all duration-200 ease-in-out shadow-sm hover:shadow-md",
            hasActivePriceFilter && "bg-blue-50 border-blue-200 ring-1 ring-blue-100"
          )}
        >
          <div className="relative">
            <Coins className={cn("h-5 w-5", hasActivePriceFilter ? "text-blue-600" : "text-slate-500")} />
            {hasActivePriceFilter && (
               <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-blue-600 ring-2 ring-white" />
            )}
          </div>
          <span className={cn(
            "text-[10px] font-medium leading-none truncate w-full text-center",
            hasActivePriceFilter ? "text-blue-700 font-bold" : "text-slate-600"
          )}>
            {hasActivePriceFilter ? "Price Set" : "Price"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-4 rounded-xl shadow-xl border-slate-200" align="center" sideOffset={8}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
             <h4 className="text-sm font-black uppercase tracking-wider text-slate-800">Price Range</h4>
             {hasActivePriceFilter && (
               <button onClick={handleClear} className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-wide">
                 Reset
               </button>
             )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="space-y-1 flex-1">
              <Label className="text-[10px] font-bold text-slate-400 uppercase">Min</Label>
              <Input 
                type="number" 
                placeholder="0" 
                value={localMin}
                onChange={(e) => setLocalMin(e.target.value)}
                className="h-9 text-sm rounded-lg"
              />
            </div>
            <div className="h-px w-4 bg-slate-300 mt-5 shrink-0" />
            <div className="space-y-1 flex-1">
              <Label className="text-[10px] font-bold text-slate-400 uppercase">Max</Label>
              <Input 
                type="number" 
                placeholder="Any" 
                value={localMax}
                onChange={(e) => setLocalMax(e.target.value)}
                className="h-9 text-sm rounded-lg"
              />
            </div>
          </div>

          <Button onClick={handleApply} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-10 rounded-lg">
            Apply Filter
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
