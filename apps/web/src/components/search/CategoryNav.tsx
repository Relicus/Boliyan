'use client';

import { useSearch } from '@/context/SearchContext';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export default function CategoryNav() {
  const { categories, filters, setFilters } = useSearch();

  const handleSelect = (categoryId: string | undefined) => {
    setFilters({ ...filters, category: categoryId });
  };

  return (
    <ScrollArea className="w-full whitespace-nowrap pb-2">
      <div className="flex w-max space-x-2 p-1">
        <Button
          variant={filters.category === undefined ? "default" : "outline"}
          size="sm"
          onClick={() => handleSelect(undefined)}
          className={cn(
            "rounded-full h-8 px-4 text-xs font-medium transition-all",
            filters.category === undefined 
             ? "bg-slate-900 text-white shadow-md"
             : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900" 
          )}
        >
          All
        </Button>
        {categories.map((category) => {
          // Dynamic Icon Rendering
             const IconComponent = (Icons as unknown as Record<string, LucideIcon>)[category.icon] || Icons.HelpCircle;
            const isActive = filters.category === category.id;

          return (
            <Button
              key={category.id}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => handleSelect(category.id)}
              className={cn(
                "rounded-full h-8 px-3 text-xs font-medium gap-2 transition-all",
                isActive
                 ? "bg-blue-600 text-white shadow-blue-200 shadow-md border-blue-600"
                 : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <IconComponent className={cn("h-3.5 w-3.5", isActive ? "text-white" : "text-slate-400")} />
              {category.name}
              {category.count !== undefined && category.count > 0 && (
                <span className={cn(
                    "ml-1 px-1.5 py-0.5 rounded-full text-[10px]",
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                )}>
                  {category.count}
                </span>
              )}
            </Button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" className="h-0" />
    </ScrollArea>
  );
}
