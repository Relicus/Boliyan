"use client";

import { memo } from "react";
import { CATEGORIES } from "@/lib/constants";
import { LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  category: string;
  variant?: "glass" | "glass-light" | "outline" | "solid";
  className?: string;
  showIcon?: boolean;
  onClick?: () => void;
}

export const CategoryBadge = memo(({ 
  category, 
  variant = "outline", 
  className = "",
  showIcon = true,
  onClick
}: CategoryBadgeProps) => {
  // Find category config from constants
  const categoryConfig = CATEGORIES.find(c => c.label === category) || {
    label: category,
    icon: LayoutGrid
  };

  const Icon = categoryConfig.icon;

  const variants = {
    glass: "bg-black/80 text-white border-white/10 shadow-sm ring-1 ring-inset ring-white/10",
    "glass-light": "bg-white/90 text-slate-800 border-slate-200/50 shadow-sm ring-1 ring-inset ring-white/50",
    outline: "bg-white text-blue-700 border-blue-100 border shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]",
    solid: "bg-blue-600 text-white border-none shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_1px_2px_rgba(0,0,0,0.1)]"
  };

  const isClickable = !!onClick;

  const content = (
    <>
      {showIcon && <Icon className="h-[clamp(0.625rem,2.5cqi,0.875rem)] w-[clamp(0.625rem,2.5cqi,0.875rem)] shrink-0" />}
      <span className="text-[clamp(0.5625rem,2.25cqi,0.75rem)] font-black uppercase tracking-tight leading-none whitespace-nowrap">
        {category}
      </span>
    </>
  );

  const sharedClasses = cn(
    "inline-flex items-center gap-1.5 px-2 py-1 rounded-md transition-all",
    variants[variant],
    isClickable && "cursor-pointer hover:scale-105 hover:shadow-md active:scale-95",
    className
  );

  if (isClickable) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={sharedClasses}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={sharedClasses}>
      {content}
    </div>
  );
});

CategoryBadge.displayName = "CategoryBadge";

