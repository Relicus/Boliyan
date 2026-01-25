"use client";

import { memo } from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface DistanceBadgeProps {
  distance: number;
  duration: number;
  variant?: "glass" | "glass-light" | "outline" | "solid";
  className?: string;
}

export const DistanceBadge = memo(({ 
  distance, 
  duration,
  variant = "glass", 
  className = "" 
}: DistanceBadgeProps) => {
  const variants = {
    glass: "bg-black/75 text-white border-white/10 shadow-lg",
    "glass-light": "bg-white/85 text-slate-800 border-black/5 shadow-lg",
    outline: "bg-white text-slate-700 border-slate-200 border",
    solid: "bg-slate-900 text-white border-none shadow-sm"
  };

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-1 rounded-md transition-all",
      variants[variant],
      className
    )}>
      <MapPin className="h-3 w-3 text-red-500 shrink-0" />
      <span className="text-[clamp(0.625rem,2.5cqi,0.75rem)] font-bold tracking-wide tabular-nums leading-none">
        {distance}km • {duration}min
      </span>
    </div>
  );
});

DistanceBadge.displayName = "DistanceBadge";
