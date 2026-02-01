"use client";

import { memo } from "react";
import { getConditionLabel, cn } from "@/lib/utils";

interface ConditionBadgeProps {
  id?: string;
  condition: string;
  variant?: "glass" | "glass-light" | "outline" | "solid";
  className?: string;
  onClick?: () => void;
}

export const ConditionBadge = memo(({ 
  id,
  condition, 
  variant = "outline", 
  className = "",
  onClick
}: ConditionBadgeProps) => {
  const label = getConditionLabel(condition);

  const variants = {
    glass: "bg-black/80 text-white border-white/10 shadow-sm ring-1 ring-inset ring-white/10",
    "glass-light": "bg-white/90 text-slate-800 border-slate-200/50 shadow-sm ring-1 ring-inset ring-white/50",
    outline: "bg-white text-slate-700 border-slate-200 border shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]",
    solid: "bg-slate-800 text-white border-none shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_rgba(0,0,0,0.1)]"
  };

  const isClickable = !!onClick;

  const sharedClasses = cn(
    "inline-flex items-center px-[var(--badge-pad-x,0.5rem)] py-[var(--badge-pad-y,0.25rem)] rounded-md transition-all",
    variants[variant],
    isClickable && "cursor-pointer hover:scale-105 hover:shadow-md active:scale-95",
    className
  );

  const content = (
    <span className="text-[clamp(var(--badge-text-min,0.5625rem),var(--badge-text-fluid,2.25cqi),var(--badge-text-max,0.75rem))] font-black uppercase tracking-tighter leading-none whitespace-nowrap">
      {label}
    </span>
  );

  if (isClickable) {
    return (
      <button
        id={id}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={sharedClasses}
      >
        {content}
      </button>
    );
  }

  return (
    <div id={id} className={sharedClasses}>
      {content}
    </div>
  );
});

ConditionBadge.displayName = "ConditionBadge";

