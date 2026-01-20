"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number; // Current rating (0-5)
  maxRating?: number;
  count?: number; // Number of ratings/reviews
  showCount?: boolean; // Whether to show the count text
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: number; // Size in pixels, default 16
  className?: string;
}

export default function StarRating({
  rating,
  maxRating = 5,
  count,
  showCount = true,
  onRatingChange,
  readonly = false,
  size = 16,
  className,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);

  const displayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className={cn("flex items-center gap-1", className)} id="star-rating-component">
       <div className="flex items-center gap-0.5">
          {Array.from({ length: maxRating }).map((_, index) => {
            const starValue = index + 1;
            const isFilled = starValue <= displayRating;

            return (
              <button
                key={index}
                type="button"
                disabled={readonly}
                onClick={() => !readonly && onRatingChange?.(starValue)}
                onMouseEnter={() => !readonly && setHoverRating(starValue)}
                onMouseLeave={() => !readonly && setHoverRating(null)}
                className={cn(
                  "focus:outline-none transition-colors duration-200",
                  readonly ? "cursor-default" : "cursor-pointer"
                )}
                id={`star-rating-btn-${index + 1}`}
              >
                <Star
                  size={size}
                  className={cn(
                    "transition-all duration-200",
                    isFilled
                      ? "fill-amber-400 text-amber-400"
                      : "fill-transparent text-slate-300",
                    !readonly && "hover:scale-110"
                  )}
                />
              </button>
            );
          })}
      </div>
      {(count !== undefined && count > 0 && showCount) && (
        <span className="text-xs text-slate-500 font-bold ml-1">
          ({count})
        </span>
      )}
    </div>
  );
}
