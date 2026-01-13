"use client";

import { MapPin, Tag, CircleDollarSign, Compass } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/lib/store";

const categories = [
  "All Items",
  "Electronics",
  "Furniture",
  "Auto Parts",
  "Audio",
  "Cameras",
  "Vehicles",
  "Property",
  "Fashion",
  "Home Appliances",
];

export default function Sidebar() {
  const { filters, setFilter } = useApp();

  return (
    <aside className="w-64 border-r bg-white hidden lg:flex flex-col sticky top-16 h-[calc(100vh-64px)] overflow-hidden">
      <ScrollArea className="flex-1 px-4 py-6">
        <div className="space-y-6">
          
          {/* Location Radius */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-slate-900 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-500" />
              Location Radius
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Near Me</span>
                <span>Nationwide</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="50" 
                value={filters.radius}
                onChange={(e) => setFilter('radius', parseInt(e.target.value))}
                className="w-full h-1 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600" 
              />
              <div className="text-sm font-medium text-center text-blue-600">
                Within {filters.radius} KM
              </div>
            </div>
          </div>

          <Separator />

          {/* Price Range */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-slate-900 flex items-center gap-2">
              <CircleDollarSign className="h-4 w-4 text-blue-500" />
              Price Range
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <span className="absolute left-2 top-1.5 text-xs text-slate-400">Rs</span>
                <input 
                  type="number" 
                  placeholder="Min" 
                  value={filters.minPrice || ''}
                  onChange={(e) => setFilter('minPrice', e.target.value ? Number(e.target.value) : null)}
                  className="w-full pl-8 pr-2 py-1.5 text-sm border rounded-md bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-200 focus:border-blue-400 transition-all outline-none"
                />
              </div>
              <div className="relative">
                <span className="absolute left-2 top-1.5 text-xs text-slate-400">Rs</span>
                <input 
                  type="number" 
                  placeholder="Max" 
                  value={filters.maxPrice || ''}
                  onChange={(e) => setFilter('maxPrice', e.target.value ? Number(e.target.value) : null)}
                  className="w-full pl-8 pr-2 py-1.5 text-sm border rounded-md bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-200 focus:border-blue-400 transition-all outline-none"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Condition (Visual Only) */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Tag className="h-4 w-4 text-blue-500" />
              Condition
            </h3>
            <div className="space-y-2">
              {['Like New', 'Excellent', 'Good', 'Fair'].map((condition) => (
                <label key={condition} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-slate-900">
                  <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20" />
                  {condition}
                </label>
              ))}
            </div>
          </div>

          <Separator />

          {/* Buying Format (Visual Only) */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Compass className="h-4 w-4 text-blue-500" />
              Format
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-slate-900">
                <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20" />
                Public Bidding
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-slate-900">
                <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20" />
                Sealed Offers
              </label>
            </div>
          </div>

          <Separator />

          {/* Saved Searches (Personalization) */}
          <div>
             <h3 className="mb-3 text-sm font-semibold text-slate-900 flex items-center gap-2">
               {/* Use a simple bookmark icon equivalent if available or just Tag */}
               <Tag className="h-4 w-4 text-amber-500" /> 
               Saved Searches
             </h3>
             <div className="flex flex-wrap gap-2">
                {['iPhone 15 Pro', 'Gaming Laptop', 'Vintage Watch'].map((search) => (
                  <button 
                    key={search}
                    onClick={() => setFilter('search', search)}
                    className="px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 rounded-md border border-amber-100 hover:bg-amber-100 transition-colors"
                  >
                    {search}
                  </button>
                ))}
             </div>
          </div>

          <div className="pt-4 pb-8">
            <Badge 
              variant="secondary" 
              className="w-full py-2.5 justify-center bg-slate-100 text-slate-600 border-slate-200 cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all font-medium"
              onClick={() => {
                setFilter('category', null);
                setFilter('search', "");
                setFilter('radius', 15);
                setFilter('minPrice', null);
                setFilter('maxPrice', null);
              }}
            >
              Reset All Filters
            </Badge>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
