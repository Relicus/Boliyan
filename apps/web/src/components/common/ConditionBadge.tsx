"use client";

import { memo } from "react";
import { getConditionLabel, cn } from "@/lib/utils";

interface ConditionBadgeProps {
  condition: string;
  variant?: "glass" | "glass-light" | "outline" | "solid";
  className?: string;
}

export const ConditionBadge = memo(({ 
  condition, 
  variant = "outline", 
  className = "" 
}: ConditionBadgeProps) => {
  const label = getConditionLabel(condition);

  const variants = {
    glass: "bg-black/80 text-white border-white/10 shadow-sm ring-1 ring-inset ring-white/10",
    "glass-light": "bg-white/90 text-slate-800 border-slate-200/50 shadow-sm ring-1 ring-inset ring-white/50",
    outline: "bg-white text-slate-700 border-slate-200 border shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]",
    solid: "bg-slate-800 text-white border-none shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_rgba(0,0,0,0.1)]"
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
