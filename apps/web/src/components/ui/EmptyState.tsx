"use client";

import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { SearchX } from "lucide-react";

export default function EmptyState() {
  const { setFilter } = useApp();

  const handleReset = () => {
    setFilter('category', null);
    setFilter('search', "");
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in zoom-in duration-300">
      <div className="bg-slate-50 p-4 rounded-full mb-4">
        <SearchX className="h-16 w-16 text-slate-300" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">No results found</h3>
      <p className="text-slate-500 max-w-sm mb-6 text-sm">
        We couldn't find any items matching your current filters. Try adjusting your search terms or category.
      </p>
      <Button 
        onClick={handleReset}
        variant="outline" 
        className="font-bold border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
      >
        Reset Filters
      </Button>
    </div>
  );
}
