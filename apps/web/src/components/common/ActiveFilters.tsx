"use client";

import { memo } from "react";
import { X, Tag, DollarSign, Sparkles, Globe, Lock } from "lucide-react";
import { useApp } from "@/lib/store";
import { cn, formatPrice } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";

interface ActiveFiltersProps {
  className?: string;
  variant?: "sidebar" | "mobile";
}

export const ActiveFilters = memo(({ className, variant = "sidebar" }: ActiveFiltersProps) => {
  const { filters, setFilter } = useApp();

  // Collect active filters
  const activeFilters: Array<{
    id: string;
    label: string;
    icon: React.ElementType;
    color: string;
    onRemove: () => void;
  }> = [];

  // Category filter
  if (filters.category) {
    const catConfig = CATEGORIES.find(c => c.label === filters.category);
    activeFilters.push({
      id: "category",
      label: filters.category,
      icon: catConfig?.icon || Tag,
      color: "bg-blue-50 text-blue-700 border-blue-100",
      onRemove: () => setFilter("category", null),
    });
  }

  // Price range filter
  if (filters.minPrice !== null || filters.maxPrice !== null) {
    const min = filters.minPrice;
    const max = filters.maxPrice;
    let priceLabel = "";
    if (min && max) {
      priceLabel = `${formatPrice(min)} - ${formatPrice(max)}`;
    } else if (min) {
      priceLabel = `${formatPrice(min)}+`;
    } else if (max) {
      priceLabel = `Up to ${formatPrice(max)}`;
    }
    activeFilters.push({
      id: "price",
      label: priceLabel,
      icon: DollarSign,
      color: "bg-slate-100 text-slate-700 border-slate-200",
      onRemove: () => {
        setFilter("minPrice", null);
        setFilter("maxPrice", null);
      },
    });
  }

  // Condition filter
  if (filters.condition && filters.condition !== "all") {
    const conditionLabels: Record<string, string> = {
      new: "🌟 New",
      like_new: "✨ Mint",
      used: "👌 Used",
      fair: "🔨 Fair",
    };
    activeFilters.push({
      id: "condition",
      label: conditionLabels[filters.condition] || filters.condition,
      icon: Sparkles,
      color: "bg-emerald-50 text-emerald-700 border-emerald-100",
      onRemove: () => setFilter("condition", "all"),
    });
  }

  // Listing type filter (only show if not 'all')
  if (filters.listingType && filters.listingType !== "all") {
    const isHidden = filters.listingType === "hidden";
    activeFilters.push({
      id: "listingType",
      label: isHidden ? "Hidden Bids" : "Public Bids",
      icon: isHidden ? Lock : Globe,
      color: isHidden 
        ? "bg-amber-50 text-amber-700 border-amber-100" 
        : "bg-blue-50 text-blue-700 border-blue-100",
      onRemove: () => setFilter("listingType", "all"),
    });
  }

  // Don't render if no active filters
  if (activeFilters.length === 0) {
    return null;
  }

  const isMobile = variant === "mobile";

  return (
    <div
      id="active-filters-root"
      className={cn(
        isMobile
          ? "flex items-center gap-2 overflow-x-auto scrollbar-hide py-2 px-4"
          : "flex flex-col gap-2 p-4",
        className
      )}
    >
      {!isMobile && (
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
          Active Filters
        </h3>
      )}
      <div className={cn(isMobile ? "flex items-center gap-2" : "flex flex-col gap-1.5")}>
        {activeFilters.map((filter) => {
          const Icon = filter.icon;
          return (
            <div
              key={filter.id}
              id={`active-filter-chip-${filter.id}`}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all",
                filter.color,
                isMobile ? "shrink-0" : "w-full justify-between"
              )}
            >
              <div className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-nowrap">{filter.label}</span>
              </div>
              <button
                id={"remove-filter-" + filter.id}
                type="button"
                onClick={filter.onRemove}
                className="p-0.5 rounded hover:bg-black/10 transition-colors"
                aria-label={`Remove ${filter.label} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
});

ActiveFilters.displayName = "ActiveFilters";
