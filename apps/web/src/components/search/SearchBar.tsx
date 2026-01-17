'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/context/SearchContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Clock, Tag, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SearchBar() {
  const { filters, setFilters, suggestions, fetchSuggestions } = useSearch();
  const [inputValue, setInputValue] = useState(filters.query || '');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Sync external filter changes
    setInputValue(prev => filters.query !== prev ? filters.query || '' : prev);
  }, [filters.query]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(inputValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue, fetchSuggestions]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (query: string) => {
    setFilters({ ...filters, query });
    setIsOpen(false);
    // Optionally navigate to home if not already there
    // router.push('/'); 
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(inputValue);
    }
  };

  const clearSearch = () => {
    setInputValue('');
    handleSearch('');
  };

  return (
     <div ref={wrapperRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search items, categories..."
          className="pl-9 pr-9 h-10 w-full bg-slate-50 border-slate-200 focus:bg-white transition-colors rounded-xl"
        />
        {inputValue && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-slate-400 hover:text-slate-600 rounded-full"
            onClick={clearSearch}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (suggestions.length > 0 || inputValue.length > 1) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 p-2"
          >
            {suggestions.length === 0 && inputValue.length > 2 ? (
                <div className="p-4 text-center text-sm text-slate-500">
                    No suggestions found
                </div>
            ) : (
                <div className="flex flex-col gap-1">
                {suggestions.map((item, index) => (
                    <button
                        key={`${item.type}-${item.text}-${index}`}
                        onClick={() => handleSearch(item.category || item.text)}
                        className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-3 transition-colors group"
                    >
                    <div className="h-8 w-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:border-blue-100 transition-colors">
                        {item.type === 'recent' && <Clock className="h-3.5 w-3.5 text-slate-400" />}
                        {item.type === 'category' && <Tag className="h-3.5 w-3.5 text-blue-400" />}
                        {item.type === 'popular' && <TrendingUp className="h-3.5 w-3.5 text-orange-400" />}
                        {item.type === 'item' && <Search className="h-3.5 w-3.5 text-slate-500" />}
                    </div>
                    <span className="truncate">{item.text}</span>
                    {item.type === 'category' && (
                        <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Category</span>
                    )}
                    </button>
                ))}
                </div>
            )}
            
            {/* Quick Actions Footer */}
            {(suggestions.length > 0) && (
             <div className="mt-2 pt-2 border-t border-slate-50 flex justify-between px-2">
                 <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Suggestions</span>
             </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
