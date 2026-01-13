"use client";

import { useApp } from "@/lib/store";
import { mockUsers } from "@/lib/mock-data";
import ItemCard from "./ItemCard";

export default function MarketplaceGrid() {
  const { items, filters } = useApp();

  // Apply filters
  const filteredItems = items.filter(item => {
    if (filters.category && filters.category !== "All Items" && item.category !== filters.category) {
      return false;
    }
    if (filters.search) {
      const query = filters.search.toLowerCase();
      if (!item.title.toLowerCase().includes(query) && !item.description.toLowerCase().includes(query)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 leading-tight">
            {filters.category && filters.category !== "All Items" ? filters.category : "Trending"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {filteredItems.length} items
          </p>
        </div>
      </div>
      
      {/* 
        Increased density:
        - sm: 2 cols
        - md: 3 cols
        - lg: 5 cols
        - xl: 6 cols
      */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {filteredItems.map((item) => {
          const seller = mockUsers.find(u => u.id === item.sellerId) || mockUsers[0];
          return (
            <ItemCard key={item.id} item={item} seller={seller} />
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400">
           <p className="text-sm font-semibold">No items found</p>
        </div>
      )}
    </div>
  );
}
