"use client";

import { memo, useEffect, useCallback, useRef } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTime } from "@/context/TimeContext";

interface TimerBadgeProps {
  id?: string;
  expiryAt: string | Date | null | undefined;
  variant?: "glass" | "glass-light" | "outline" | "solid" | "inline";
  className?: string;
  iconClassName?: string;
  onExpire?: () => void;
}

export const TimerBadge = memo(({ 
  id,
  expiryAt, 
  variant = "glass", 
  className = "",
  iconClassName = "",
  onExpire
}: TimerBadgeProps) => {
  const { now } = useTime();
  const hasExpiredRef = useRef(false);

  // Calculate time remaining
  const getTimeRemaining = useCallback(() => {
    if (!expiryAt) return { label: "", isUrgent: false, isExpired: true };
    
    const expiry = new Date(expiryAt).getTime();
    const remaining = expiry - now;
    
    if (remaining <= 0) {
      return { label: "Expired", isUrgent: true, isExpired: true };
    }
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    // Determine urgency (less than 2 hours)
    const isUrgent = hours < 2;
    
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return { label: `${days}d left`, isUrgent: false, isExpired: false };
    } else if (hours > 0) {
      return { label: `${hours}h ${minutes}m`, isUrgent, isExpired: false };
    } else {
      return { label: `${minutes}m`, isUrgent: true, isExpired: false };
    }
  }, [expiryAt, now]);

  const { label, isUrgent, isExpired } = getTimeRemaining();

  // Handle expiration callback using ref to avoid lint error
  useEffect(() => {
    if (isExpired && !hasExpiredRef.current) {
      hasExpiredRef.current = true;
      onExpire?.();
    }
  }, [isExpired, onExpire]);

  // Don't render if no expiry data
  if (!expiryAt || !label) return null;

  const Icon = isUrgent ? AlertTriangle : Clock;
  
  const variants = {
    glass: "bg-black/75 text-white border-white/10 shadow-lg px-[var(--badge-pad-x,0.5rem)] py-[var(--badge-pad-y,0.25rem)] rounded-md",
    "glass-light": "bg-white/85 text-slate-800 border-black/5 shadow-lg px-[var(--badge-pad-x,0.5rem)] py-[var(--badge-pad-y,0.25rem)] rounded-md",
    outline: "bg-white text-slate-700 border-slate-200 border px-[var(--badge-pad-x,0.5rem)] py-[var(--badge-pad-y,0.25rem)] rounded-md",
    solid: "bg-slate-900 text-white border-none shadow-sm px-[var(--badge-pad-x,0.5rem)] py-[var(--badge-pad-y,0.25rem)] rounded-md",
    inline: "bg-transparent p-0 border-none shadow-none"
  };

  return (
    <div 
      id={id}
      className={cn(
        "inline-flex items-center gap-[var(--badge-gap,0.375rem)] transition-all",
        variants[variant],
        isUrgent && variant !== "inline" && "animate-pulse",
        className
      )}
    >
      <Icon className={cn(
        "h-[clamp(var(--badge-icon-min,0.625rem),var(--badge-icon-fluid,2.5cqi),var(--badge-icon-max,0.75rem))] w-[clamp(var(--badge-icon-min,0.625rem),var(--badge-icon-fluid,2.5cqi),var(--badge-icon-max,0.75rem))] shrink-0",
        isUrgent && "text-red-400",
        iconClassName
      )} />
      <span className={cn(
        "font-bold tracking-wide tabular-nums leading-none",
        variant !== "inline" ? "text-[clamp(var(--badge-text-min,0.625rem),var(--badge-text-fluid,2.5cqi),var(--badge-text-max,0.75rem))]" : "text-inherit",
        isExpired && "text-red-500"
      )}>
        {label}
      </span>
    </div>
  );
});

TimerBadge.displayName = "TimerBadge";
