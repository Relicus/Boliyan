"use client";

import { memo, useMemo, useEffect } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTime } from "@/context/TimeContext";

interface TimerBadgeProps {
  expiryAt: string;
  variant?: "glass" | "outline" | "solid";
  className?: string;
  onUrgentChange?: (isUrgent: boolean) => void;
}

export const TimerBadge = memo(({ 
  expiryAt, 
  variant = "outline", 
  className = "",
  onUrgentChange
}: TimerBadgeProps) => {
  // Use global time heartbeat instead of local interval
  const { now } = useTime();

  const { text, isUrgent } = useMemo(() => {
    const diff = new Date(expiryAt).getTime() - now;
    const hoursLeft = Math.max(0, Math.floor(diff / 3600000));
    const minsLeft = Math.max(0, Math.floor((diff % 3600000) / 60000));
    const secsLeft = Math.max(0, Math.floor((diff % 60000) / 1000));

    const urgent = hoursLeft < 2;
    
    let timeString = "";
    if (hoursLeft >= 24) {
      timeString = `${Math.floor(hoursLeft / 24)}d ${hoursLeft % 24}h`;
    } else {
      timeString = `${hoursLeft}h ${minsLeft}m ${secsLeft}s`;
    }

    return { text: timeString, isUrgent: urgent };
  }, [expiryAt, now]);

  // Handle urgency callback
  useEffect(() => {
    onUrgentChange?.(isUrgent);
  }, [isUrgent, onUrgentChange]);

  const variants = {
    glass: isUrgent 
      ? "bg-red-500/80 backdrop-blur-md text-white border-white/20 shadow-lg" 
      : "bg-black/60 backdrop-blur-md text-white border-white/20 shadow-lg",
    outline: isUrgent
      ? "bg-red-50 text-red-600 border-red-200"
      : "bg-white text-slate-700 border-slate-200",
    solid: isUrgent
      ? "bg-red-600 text-white border-none"
      : "bg-slate-900 text-white border-none"
  };

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-1 rounded-md transition-all font-black font-outfit tabular-nums",
      variants[variant],
      isUrgent && "animate-pulse",
      className
    )}>
      <Clock className="h-[clamp(0.625rem,2.5cqi,0.875rem)] w-[clamp(0.625rem,2.5cqi,0.875rem)] shrink-0" />
      <span className="text-[clamp(0.5625rem,2.25cqi,0.75rem)] uppercase tracking-tight leading-none">
        {text}
      </span>
    </div>
  );
});

TimerBadge.displayName = "TimerBadge";
