"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, Package, ShoppingBag, ArrowRight, Clock } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useApp } from "@/lib/store";
import { useRouter, usePathname } from "next/navigation";
import { Item, Bid } from "@/types";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function SearchDropdown() {
  const { items, filters, setFilter } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal state with global filter ONLY on mount or when filter is cleared
  useEffect(() => {
     if (filters.search !== inputValue && !open) {
        setInputValue(filters.search);
     }
  }, [filters.search]);

  const handleInputChange = (val: string) => {
    setInputValue(val);
    if (val.length > 0) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const commitSearch = (val: string) => {
    setFilter("search", val);
    setOpen(false);
    if (pathname !== "/") {
      router.push("/");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      commitSearch(inputValue);
    }
  };

  // SCALABILITY OPTIMIZATION: Extract unique keywords and categories
  // In a real app with 100k+ listings, this would be a debounced API call
  // For now, we simulate this by processing the local items sparingly
  const searchResults = useMemo(() => {
    if (!inputValue || inputValue.length < 1) return { keywords: [], categories: [] };
    
    const query = inputValue.toLowerCase();
    
    // 1. Categories
    const categories = Array.from(new Set(items.map(i => i.category)))
      .filter(cat => cat.toLowerCase().includes(query))
      .slice(0, 3);

    // 2. Keywords (Unique Titles that match)
    const keywords = Array.from(new Set(items.map(i => i.title)))
      .filter(title => title.toLowerCase().includes(query))
      .slice(0, 5);

    return { keywords, categories };
  }, [items, inputValue]);

  return (
    <div ref={containerRef} className="relative w-full max-w-md lg:max-w-xl mx-auto px-4">
      <Popover open={open && inputValue.length > 0} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <Input
              id="navbar-search-input"
              placeholder="Search items or categories..."
              className="w-full pl-10 pr-4 h-11 bg-slate-50 border-transparent focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50/50 rounded-2xl transition-all font-medium"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => inputValue.length > 0 && setOpen(true)}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent 
          className="p-0 border-slate-100 shadow-2xl rounded-2xl overflow-hidden bg-white" 
          align="start"
          sideOffset={8}
          style={{ width: containerRef.current?.offsetWidth }}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command className="border-none">
            <CommandList className="max-h-[min(80vh,500px)]">
              <CommandEmpty className="py-12 flex flex-col items-center justify-center text-slate-500">
                <Search className="h-10 w-10 mb-4 opacity-20" />
                <p className="font-bold text-slate-900">No suggestions</p>
                <p className="text-sm">Press Enter to search for "{inputValue}"</p>
              </CommandEmpty>

              {searchResults.categories.length > 0 && (
                <CommandGroup heading={<span className="px-2 text-[11px] font-black uppercase tracking-widest text-slate-400">Categories</span>}>
                  {searchResults.categories.map((cat) => (
                    <CommandItem
                      key={`cat-${cat}`}
                      onSelect={() => {
                        setFilter("category", cat);
                        setFilter("search", ""); // Clear search if searching by category
                        setOpen(false);
                        if (pathname !== "/") router.push("/");
                      }}
                      className="px-4 py-3 cursor-pointer hover:bg-slate-50 aria-selected:bg-slate-50 rounded-none transition-colors"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100 shrink-0">
                           <Package className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 truncate">{cat}</p>
                          <p className="text-[11px] text-slate-500 font-medium font-outfit uppercase tracking-tighter">View category</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-300" />
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {searchResults.keywords.length > 0 && (
                <CommandGroup heading={<span className="px-2 text-[11px] font-black uppercase tracking-widest text-slate-400">Suggestions</span>}>
                  {searchResults.keywords.map((keyword) => (
                    <CommandItem
                      key={`kw-${keyword}`}
                      onSelect={() => commitSearch(keyword)}
                      className="px-4 py-2.5 cursor-pointer hover:bg-slate-50 aria-selected:bg-slate-50 rounded-none transition-colors"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Search className="h-3.5 w-3.5 text-slate-400" />
                        <p className="font-medium text-slate-700 truncate">{keyword}</p>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              <div className="p-2 bg-slate-50 border-t border-slate-100">
                <button 
                  onClick={() => commitSearch(inputValue)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-[12px] font-bold text-slate-600 hover:bg-blue-100/50 hover:text-blue-600 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Search className="h-3.5 w-3.5" />
                    <span>Search for "{inputValue}"</span>
                  </div>
                  <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-white px-1.5 font-sans text-[10px] font-medium text-slate-400 opacity-100">
                    <span className="text-xs">↵</span>
                  </kbd>
                </button>
              </div>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
