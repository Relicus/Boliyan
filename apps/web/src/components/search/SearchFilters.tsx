'use client';

import { useSearch } from '@/context/SearchContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import type { SearchFilters as SearchFiltersType } from '@/types';

interface SearchFiltersProps {
    isOpen: boolean;
    onClose: () => void;
    isMobile?: boolean; // For modal mode on mobile
}

export default function SearchFilters({ isOpen, onClose, isMobile }: SearchFiltersProps) {
  const { filters, updateFilter, clearFilters, executeSearch } = useSearch();

  type SearchSort = NonNullable<SearchFiltersType['sortBy']>;
  type SearchCondition = NonNullable<SearchFiltersType['condition']>;

  if (!isOpen) return null;

  const content = (
      <div className="flex flex-col gap-6 p-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="font-semibold text-lg text-slate-900">Filters</h3>
            <div className="flex gap-2">
                <Button id="sidebar-reset-filters-btn" variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 hover:text-red-500 h-8 px-2 text-xs">
                    <RotateCcw className="h-3 w-3 mr-1" /> Reset
                </Button>
                {isMobile && (
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>

        {/* Sort By */}
        <div className="space-y-3">
             <Label className="text-sm font-medium text-slate-700">Sort By</Label>
             <Select 
                value={filters.sortBy} 
                onValueChange={(val: SearchSort) => updateFilter('sortBy', val)}
             >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sort order" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                    <SelectItem value="ending_soon">Ending Soon</SelectItem>
                    <SelectItem value="nearest">Nearest Location</SelectItem>
                </SelectContent>
             </Select>
        </div>

        {/* Price Range */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-slate-700">Price Range</Label>
                <span className="text-xs text-slate-500">
                    {filters.minPrice || 0} - {filters.maxPrice || 'Any'}
                </span>
            </div>
            <Slider
                defaultValue={[filters.minPrice || 0, filters.maxPrice || 100000]}
                max={100000}
                step={500}
                onValueChange={(vals) => {
                    updateFilter('minPrice', vals[0]);
                    updateFilter('maxPrice', vals[1]);
                }}
                className="w-full"
            />
            <div className="flex gap-4">
                <div className="border rounded-lg px-3 py-2 bg-slate-50 flex-1">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Min</span>
                    <input 
                        id="sidebar-min-price-input"
                        type="number" 
                        className="bg-transparent w-full text-sm font-semibold outline-none text-slate-900"
                        value={filters.minPrice || ''}
                        onChange={e => updateFilter('minPrice', Number(e.target.value))}
                        placeholder="0"
                    />
                </div>
                <div className="border rounded-lg px-3 py-2 bg-slate-50 flex-1">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Max</span>
                    <input 
                        id="sidebar-max-price-input"
                        type="number" 
                        className="bg-transparent w-full text-sm font-semibold outline-none text-slate-900"
                        value={filters.maxPrice || ''}
                        onChange={e => updateFilter('maxPrice', Number(e.target.value))}
                        placeholder="Any"
                    />
                </div>
            </div>
        </div>

        {/* Condition Filter */}
        <div className="space-y-3">
             <Label className="text-sm font-medium text-slate-700">Condition</Label>
              <Select 
                 value={filters.condition || 'all'} 
                 onValueChange={(val: SearchCondition) => updateFilter('condition', val)}
              >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Any Condition" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Any Condition</SelectItem>
                    <SelectItem value="new">🌟 Brand New</SelectItem>
                    <SelectItem value="like_new">✨ Like New / Mint</SelectItem>
                    <SelectItem value="used">👌 Gently Used</SelectItem>
                    <SelectItem value="fair">🔨 Heavily Used (Fair)</SelectItem>
                </SelectContent>
             </Select>
        </div>

        {/* Apply Button (mainly for Mobile/Explicit action updates) */}
        <Button id="filter-apply-btn" onClick={() => { executeSearch(); onClose(); }} className="mt-4 w-full bg-slate-900 text-white hover:bg-slate-800">
            Show Results
        </Button>
      </div>
  );

  if (isMobile) {
      // Mobile Modal / Sheet behavior handled by parent or here if we used Dialog
      // For now, returning simple container, assumming parent wraps in Sheet or Modal
      return <div className="bg-white h-full">{content}</div>;
  }

  // Desktop Sidebar
  return (
    <motion.div 
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 320, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        className="h-full border-r border-slate-200 bg-white overflow-hidden shadow-sm"
    >
        <div className="w-80">
            {content}
        </div>
    </motion.div>
  );
}
