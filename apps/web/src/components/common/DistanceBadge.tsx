"use client";

import { memo } from "react";
import { MapPin, Compass } from "lucide-react";
import { cn, getDistanceDisplayInfo } from "@/lib/utils";

interface DistanceBadgeProps {
  distance: number;
  duration: number;
  variant?: "glass" | "glass-light" | "outline" | "solid" | "inline";
  className?: string;
  iconClassName?: string;
}

export const DistanceBadge = memo(({ 
  distance, 
  duration,
  variant = "glass", 
  className = "",
  iconClassName = ""
}: DistanceBadgeProps) => {
  const { isFar, label } = getDistanceDisplayInfo(distance, duration);
  const Icon = isFar ? Compass : MapPin;
  
  const variants = {
    glass: "bg-black/75 text-white border-white/10 shadow-lg px-[var(--badge-pad-x,0.5rem)] py-[var(--badge-pad-y,0.25rem)] rounded-md",
    "glass-light": "bg-white/85 text-slate-800 border-black/5 shadow-lg px-[var(--badge-pad-x,0.5rem)] py-[var(--badge-pad-y,0.25rem)] rounded-md",
    outline: "bg-white text-slate-700 border-slate-200 border px-[var(--badge-pad-x,0.5rem)] py-[var(--badge-pad-y,0.25rem)] rounded-md",
    solid: "bg-slate-900 text-white border-none shadow-sm px-[var(--badge-pad-x,0.5rem)] py-[var(--badge-pad-y,0.25rem)] rounded-md",
    inline: "bg-transparent p-0 border-none shadow-none"
  };

  return (
    <div className={cn(
      "inline-flex items-center gap-[var(--badge-gap,0.375rem)] transition-all",
      variants[variant],
      className
    )}>
      <Icon className={cn("h-[clamp(var(--badge-icon-min,0.625rem),var(--badge-icon-fluid,2.5cqi),var(--badge-icon-max,0.75rem))] w-[clamp(var(--badge-icon-min,0.625rem),var(--badge-icon-fluid,2.5cqi),var(--badge-icon-max,0.75rem))] shrink-0", !isFar && variant !== "inline" && "text-red-500", iconClassName)} />
      <span className={cn(
        "font-bold tracking-wide tabular-nums leading-none",
        variant !== "inline" ? "text-[clamp(var(--badge-text-min,0.625rem),var(--badge-text-fluid,2.5cqi),var(--badge-text-max,0.75rem))]" : "text-inherit"
      )}>
        {label}
      </span>
    </div>
  );
});

DistanceBadge.displayName = "DistanceBadge";
