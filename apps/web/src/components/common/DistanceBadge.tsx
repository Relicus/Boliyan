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
    glass: "bg-black/75 text-white border-white/10 shadow-lg px-2 py-1 rounded-md",
    "glass-light": "bg-white/85 text-slate-800 border-black/5 shadow-lg px-2 py-1 rounded-md",
    outline: "bg-white text-slate-700 border-slate-200 border px-2 py-1 rounded-md",
    solid: "bg-slate-900 text-white border-none shadow-sm px-2 py-1 rounded-md",
    inline: "bg-transparent p-0 border-none shadow-none"
  };

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 transition-all",
      variants[variant],
      className
    )}>
      <Icon className={cn("h-[clamp(0.625rem,2.5cqi,0.75rem)] w-[clamp(0.625rem,2.5cqi,0.75rem)] shrink-0", !isFar && variant !== "inline" && "text-red-500", iconClassName)} />
      <span className={cn(
        "font-bold tracking-wide tabular-nums leading-none",
        variant !== "inline" ? "text-[clamp(0.625rem,2.5cqi,0.75rem)]" : "text-inherit"
      )}>
        {label}
      </span>
    </div>
  );
});

DistanceBadge.displayName = "DistanceBadge";
