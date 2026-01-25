"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

interface ItemCardSkeletonProps {
  viewMode?: 'compact' | 'comfortable' | 'spacious';
}

/**
 * Performant skeleton card with single shimmer animation at card level.
 * Respects prefers-reduced-motion for accessibility.
 */
export default function ItemCardSkeleton({ viewMode = 'compact' }: ItemCardSkeletonProps) {
  const prefersReducedMotion = useReducedMotion();

  const getHeightClass = () => {
    switch (viewMode) {
      case 'spacious': return 'h-52';
      case 'comfortable': return 'h-40';
      default: return 'h-28';
    }
  };

  // Static block style (no individual shimmer)
  const block = "bg-slate-200 rounded-md";

  return (
    <Card 
      className={cn(
        "border-none shadow-sm bg-white rounded-lg overflow-hidden flex flex-col h-full",
        !prefersReducedMotion && "skeleton-shimmer"
      )}
      aria-hidden="true"
    >
      {/* Image Block */}
      <div className={cn(block, "rounded-none shrink-0", getHeightClass(), "w-full")} />

      <CardContent className="p-2 flex flex-col gap-2 flex-1">
        {/* Title Block */}
        <div className={cn(block, "h-4 w-3/4 mb-1")} />

        {/* Price Row */}
        <div className="flex justify-between items-end mt-1">
          <div className="flex flex-col gap-1">
            <div className={cn(block, "h-2 w-8")} />
            <div className={cn(block, "h-5 w-16")} />
          </div>
          <div className="flex flex-col gap-1 items-end">
            <div className={cn(block, "h-2 w-10")} />
            <div className={cn(block, "h-5 w-12")} />
          </div>
        </div>

        {/* Spacious Mode Details */}
        {viewMode === 'spacious' && (
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2">
              <div className={cn(block, "h-5 w-5 rounded-full")} />
              <div className={cn(block, "h-3 w-20")} />
            </div>
            <div className={cn(block, "h-3 w-full")} />
            <div className={cn(block, "h-3 w-2/3")} />
          </div>
        )}

        {/* Action Row */}
        <div className="mt-auto pt-1 flex flex-col gap-2">
          <div className={cn(block, "h-9 w-full")} />
          <div className={cn(block, "h-9 w-full")} />
        </div>

      </CardContent>
    </Card>
  );
}
