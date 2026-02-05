'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearch } from '@/context/SearchContext';
import { Input } from '@/components/ui/input';
import { Search, X, Clock, Tag, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SearchBar() {
  const { filters, setFilters, suggestions, fetchSuggestions } = useSearch();
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const effectiveValue = isOpen ? inputValue : (filters.query || '');

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(effectiveValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [effectiveValue, fetchSuggestions]);

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
    // Aggressively blur to dismiss mobile keyboard
    inputRef.current?.blur();
    (document.activeElement as HTMLElement)?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(effectiveValue);
    }
  };

  const clearSearch = () => {
    setInputValue('');
    handleSearch('');
  };

  return (
     <div ref={wrapperRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          ref={inputRef}
          id="navbar-search-input"
          value={effectiveValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setInputValue(filters.query || '');
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search items, categories..."
          className="pl-9 pr-9 h-10 w-full bg-slate-50 border-slate-200 focus:bg-white transition-colors rounded-xl"
        />
        {inputValue && (
          <button
            id="search-clear-btn"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            onClick={clearSearch}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed md:absolute top-16 md:top-full left-0 right-0 md:left-0 md:right-0 md:mt-2 mx-4 md:mx-0 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 p-2"
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
                         id={"search-suggestion-" + index}
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

            {/* Saved Searches (Migrated from Sidebar) */}
            {inputValue.length === 0 && (
                <div className="mt-2 mb-2 px-2">
                    <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Saved Searches</h4>
                     <div className="flex flex-wrap gap-2">
                         {['iPhone 15 Pro', 'Gaming Laptop', 'Vintage Watch', 'Sony WH-1000XM5', 'MacBook Air M2'].map((search, index) => (
                             <button
                                 key={search}
                                 id={"saved-search-" + index}
                                 onClick={() => handleSearch(search)}
                                 className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-slate-50 text-slate-600 rounded-md border border-slate-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-colors"
                             >
                                <span className="truncate max-w-[120px]">{search}</span>
                                <div className="h-1 w-1 rounded-full bg-slate-300" />
                            </button>
                        ))}
                    </div>
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
