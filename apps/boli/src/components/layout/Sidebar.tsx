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
    <aside className="w-64 border-r bg-white hidden lg:flex flex-col sticky top-16 h-[calc(100vh-64px)]">
      <ScrollArea className="flex-1 px-4 py-6">
        <div className="space-y-6">
          <div>
            <h3 className="mb-4 text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Compass className="h-4 w-4 text-blue-500" />
              Location Radius
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Near Me</span>
                <span>50km+</span>
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

          <div>
            <h3 className="mb-4 text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Tag className="h-4 w-4 text-blue-500" />
              Categories
            </h3>
            <div className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter('category', cat)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors 
                    ${filters.category === cat 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-4 text-sm font-semibold text-slate-900 flex items-center gap-2">
              <CircleDollarSign className="h-4 w-4 text-blue-500" />
              Price Range
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="number" 
                placeholder="Min" 
                className="w-full px-2 py-1 text-xs border rounded bg-slate-50"
              />
              <input 
                type="number" 
                placeholder="Max" 
                className="w-full px-2 py-1 text-xs border rounded bg-slate-50"
              />
            </div>
          </div>

          <div className="pt-4">
            <Badge 
              variant="secondary" 
              className="w-full py-2 justify-center bg-blue-50 text-blue-700 border-blue-100 cursor-pointer hover:bg-blue-100"
              onClick={() => {
                setFilter('category', null);
                setFilter('search', "");
                setFilter('radius', 15);
              }}
            >
              Clear All Filters
            </Badge>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
