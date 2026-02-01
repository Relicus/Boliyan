"use client";

import { memo } from "react";
import { MapPin } from "lucide-react";
import { cn, getFuzzyLocationString } from "@/lib/utils";

interface LocationBadgeProps {
  address?: string;
  variant?: "glass" | "glass-light" | "outline" | "solid";
  className?: string;
}

export const LocationBadge = memo(({ 
  address, 
  variant = "glass", 
  className = "" 
}: LocationBadgeProps) => {
  const displayText = address ? getFuzzyLocationString(address) : 'Unknown Location';

  const variants = {
    glass: "bg-black/75 text-white border-white/10 shadow-lg",
    "glass-light": "bg-white/85 text-slate-800 border-black/5 shadow-lg",
    outline: "bg-white text-slate-700 border-slate-200 border",
    solid: "bg-slate-900 text-white border-none shadow-sm"
  };

  return (
    <div className={cn(
      "inline-flex items-center gap-[var(--badge-gap,0.375rem)] px-[var(--badge-pad-x,0.5rem)] py-[var(--badge-pad-y,0.25rem)] rounded-md transition-all",
      variants[variant],
      className
    )}>
      <MapPin className="h-[clamp(var(--badge-icon-min,0.625rem),var(--badge-icon-fluid,2.5cqi),var(--badge-icon-max,0.75rem))] w-[clamp(var(--badge-icon-min,0.625rem),var(--badge-icon-fluid,2.5cqi),var(--badge-icon-max,0.75rem))] shrink-0" />
      <span className="text-[clamp(var(--badge-text-min,0.625rem),var(--badge-text-fluid,2.5cqi),var(--badge-text-max,0.75rem))] font-black tracking-tight leading-none truncate max-w-[var(--badge-maxw,7.5rem)]">
        {displayText}
      </span>
    </div>
  );
});

LocationBadge.displayName = "LocationBadge";
