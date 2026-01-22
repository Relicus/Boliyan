"use client";

import { memo } from "react";
import { CATEGORIES } from "@/lib/constants";
import { LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  category: string;
  variant?: "glass" | "outline" | "solid";
  className?: string;
  showIcon?: boolean;
}

export const CategoryBadge = memo(({ 
  category, 
  variant = "outline", 
  className = "",
  showIcon = true
}: CategoryBadgeProps) => {
  // Find category config from constants
  const categoryConfig = CATEGORIES.find(c => c.label === category) || {
    label: category,
    icon: LayoutGrid
  };

  const Icon = categoryConfig.icon;

  const variants = {
    glass: "bg-white/90 backdrop-blur-md text-slate-900 border border-slate-200 shadow-lg",
    outline: "bg-white text-blue-700 border-blue-100 border",
    solid: "bg-blue-600 text-white border-none shadow-sm"
  };

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-1 rounded-md transition-all",
      variants[variant],
      className
    )}>
      {showIcon && <Icon className="h-[clamp(0.625rem,2.5cqi,0.875rem)] w-[clamp(0.625rem,2.5cqi,0.875rem)] shrink-0" />}
      <span className="text-[clamp(0.5625rem,2.25cqi,0.75rem)] font-black uppercase tracking-tight leading-none whitespace-nowrap">
        {category}
      </span>
    </div>
  );
});

CategoryBadge.displayName = "CategoryBadge";
