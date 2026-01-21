'use client';

import { useMarketplace } from '@/context/MarketplaceContext';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { CATEGORIES } from '@/lib/constants';

export default function CategoryNav() {
  const { filters, setFilter } = useMarketplace();

  const handleSelect = (categoryLabel: string | null) => {
    setFilter('category', categoryLabel);
  };

  return (
    <ScrollArea id="category-bar-root" className="w-full whitespace-nowrap pb-2">
      <div className="flex w-max space-x-2 p-1">
        <Button
          id="category-btn-all"
          variant={filters.category === null ? "default" : "outline"}
          size="sm"
          onClick={() => handleSelect(null)}
          className={cn(
            "rounded-full h-8 px-4 text-xs font-medium transition-all",
            filters.category === null 
             ? "bg-slate-900 text-white shadow-md"
             : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900" 
          )}
        >
          All
        </Button>
        {CATEGORIES.map((category) => {
          const isActive = filters.category === category.label;
          // Skip "All Items" as we have a dedicated All button
          if (category.label === 'All Items') return null;

          return (
            <Button
              id={`category-btn-${category.label.toLowerCase().replace(/\s+/g, '-')}`}
              key={category.label}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => handleSelect(category.label)}
              className={cn(
                "rounded-full h-8 px-3 text-xs font-medium gap-2 transition-all",
                isActive
                 ? "bg-blue-600 text-white shadow-blue-200 shadow-md border-blue-600"
                 : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <category.icon className={cn("h-3.5 w-3.5", isActive ? "text-white" : "text-slate-400")} />
              {category.label}
            </Button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" className="h-0" />
    </ScrollArea>
  );
}
