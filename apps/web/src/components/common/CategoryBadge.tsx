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
    glass: "bg-black/60 backdrop-blur-md text-white border-white/20 shadow-lg",
    outline: "bg-white text-blue-700 border-blue-100 border",
    solid: "bg-blue-600 text-white border-none shadow-sm"
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

