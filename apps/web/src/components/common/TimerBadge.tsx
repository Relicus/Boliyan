"use client";

import { memo, useMemo, useEffect } from "react";
import { Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTime } from "@/context/TimeContext";

interface TimerBadgeProps {
  expiryAt: string;
  variant?: "glass" | "glass-light" | "outline" | "solid";
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
      ? "bg-red-500/95 text-white border-white/20 shadow-sm ring-1 ring-inset ring-white/10" 
      : "bg-black/80 text-white border-white/10 shadow-sm ring-1 ring-inset ring-white/5",
    "glass-light": isUrgent
      ? "bg-red-100/90 text-red-700 border-red-200/50 shadow-sm ring-1 ring-inset ring-red-200/20"
      : "bg-white/90 text-slate-800 border-slate-200/50 shadow-sm ring-1 ring-inset ring-white/50",
    outline: isUrgent
      ? "bg-red-50 text-red-600 border-red-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)]"
      : "bg-white text-slate-700 border-slate-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]",
    solid: isUrgent
      ? "bg-red-600 text-white border-none shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_1px_2px_rgba(0,0,0,0.1)]"
      : "bg-slate-900 text-white border-none shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_rgba(0,0,0,0.1)]"
  };

  return (
    <motion.div 
      initial={false}
      animate={isUrgent ? {
        scale: [1, 1.06, 1, 1.06, 1],
        transition: {
          duration: 2,
          repeat: Infinity,
          times: [0, 0.1, 0.2, 0.3, 1],
          ease: "easeInOut"
        }
      } : { scale: 1 }}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-md transition-all font-black font-outfit tabular-nums",
        variants[variant],
        className
      )}
    >
      <Clock className={cn(
        "h-[clamp(0.625rem,2.5cqi,0.875rem)] w-[clamp(0.625rem,2.5cqi,0.875rem)] shrink-0",
        isUrgent && "animate-[spin_4s_linear_infinite]"
      )} />
      <span className="text-[clamp(0.5625rem,2.25cqi,0.75rem)] uppercase tracking-tight leading-none">
        {text}
      </span>
    </motion.div>
  );
});

TimerBadge.displayName = "TimerBadge";
