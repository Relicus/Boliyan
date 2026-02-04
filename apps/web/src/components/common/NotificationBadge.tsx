"use client";

import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  count: number;
  /** "dot" shows pulsing indicator only, "count" shows the number */
  variant?: "dot" | "count";
  /** Size preset */
  size?: "sm" | "md";
  className?: string;
}

/**
 * Unified notification badge component - red bubble style
 * Use for all notification/alert indicators across the app
 */
export function NotificationBadge({ 
  count, 
  variant = "count",
  size = "md",
  className 
}: NotificationBadgeProps) {
  if (count <= 0) return null;

  // Dot variant - pulsing indicator without number
  if (variant === "dot") {
    const dotSize = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";
    return (
      <span className={cn("flex", dotSize, className)}>
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span className={cn("relative inline-flex rounded-full bg-red-500 ring-2 ring-white", dotSize)} />
      </span>
    );
  }

  // Count variant - shows the number
  const sizeClasses = size === "sm" 
    ? "h-4 min-w-4 text-[9px] px-1" 
    : "h-5 min-w-5 text-[10px] px-1.5";

  return (
    <span 
      className={cn(
        "flex items-center justify-center rounded-full",
        "bg-red-500 text-white font-bold",
        "ring-2 ring-white",
        sizeClasses,
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
