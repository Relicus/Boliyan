"use client";

import { memo } from "react";
import { getConditionLabel, cn } from "@/lib/utils";

interface ConditionBadgeProps {
  condition: string;
  variant?: "glass" | "outline" | "solid";
  className?: string;
}

export const ConditionBadge = memo(({ 
  condition, 
  variant = "outline", 
  className = "" 
}: ConditionBadgeProps) => {
  const label = getConditionLabel(condition);

  const variants = {
    glass: "bg-black/60 backdrop-blur-md text-white border-white/20 shadow-lg",
    outline: "bg-white text-slate-700 border-slate-200 border",
    solid: "bg-slate-800 text-white border-none shadow-sm"
  };

  return (
    <div className={cn(
      "inline-flex items-center px-2 py-1 rounded-md transition-all",
      variants[variant],
      className
    )}>
      <span className="text-[clamp(0.5625rem,2.25cqi,0.75rem)] font-black uppercase tracking-tighter leading-none whitespace-nowrap">
        {label}
      </span>
    </div>
  );
});

ConditionBadge.displayName = "ConditionBadge";
