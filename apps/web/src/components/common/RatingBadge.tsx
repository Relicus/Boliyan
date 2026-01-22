"use client";

import { memo } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingBadgeProps {
  rating: number;
  count?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  showCount?: boolean;
}

export const RatingBadge = memo(({ 
  rating, 
  count, 
  size = "md", 
  className = "",
  showCount = true
}: RatingBadgeProps) => {
  
  const sizes = {
    sm: {
      container: "h-4.5 px-1.5 gap-1",
      star: "w-2.5 h-2.5",
      text: "text-[clamp(0.625rem,2.5cqi,0.75rem)]"
    },
    md: {
      container: "h-5.5 px-2 gap-1.5",
      star: "w-3 h-3",
      text: "text-[clamp(0.6875rem,2.75cqi,0.8125rem)]"
    },
    lg: {
      container: "h-7 px-2.5 gap-2",
      star: "w-3.5 h-3.5",
      text: "text-sm"
    }
  };

  const currentSize = sizes[size];

  return (
    <div className={cn(
      "inline-flex items-center rounded-md font-outfit transition-all duration-300",
      "bg-white/80 backdrop-blur-sm",
      "border border-amber-200/50 shadow-[0_2px_8px_-2px_rgba(217,119,6,0.15),inset_0_1px_0_white]",
      "text-amber-700",
      currentSize.container,
      className
    )}>
      <Star 
        className={cn(
          currentSize.star, 
          "fill-amber-400 text-amber-400 drop-shadow-[0_1px_1px_rgba(217,119,6,0.2)]"
        )} 
      />
      <div className="flex items-center leading-none tracking-tight">
        <span className={cn(currentSize.text, "font-black leading-none")}>{rating.toFixed(1)}</span>
        {showCount && count !== undefined && (
          <span className={cn(
            "ml-1 font-bold text-amber-600/60 leading-none",
            size === "sm" ? "text-[8px]" : "text-[10px]"
          )}>
            ({count})
          </span>
        )}
      </div>
    </div>
  );
});

RatingBadge.displayName = "RatingBadge";
