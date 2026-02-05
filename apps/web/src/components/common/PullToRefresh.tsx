"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from "framer-motion";
import { Loader2, ArrowDown } from "lucide-react";
import { useHaptic } from "@/hooks/useHaptic";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number;
  className?: string;
  disabled?: boolean;
}

export function PullToRefresh({ 
  onRefresh, 
  children, 
  threshold = 120, // Distance to pull before trigger
  className,
  disabled = false
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [canPull, setCanPull] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const haptic = useHaptic();
  const controls = useAnimation();
  const y = useMotionValue(0);
  
  // Transform pull distance to rotation/scale for visual feedback
  const pullProgress = useTransform(y, [0, threshold], [0, 100]);
  const rotate = useTransform(y, [0, threshold], [0, 180]);
  const opacity = useTransform(y, [0, threshold / 2, threshold], [0, 0.5, 1]);
  
  // Check scroll position to only enable pull when at top
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      setCanPull(scrollTop <= 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleDragEnd = async (_: unknown, info: PanInfo) => {
    if (disabled || isRefreshing) {
      y.set(0);
      return;
    }

    const pullDistance = info.offset.y;
    
    if (pullDistance > threshold && canPull) {
      // Trigger refresh
      setIsRefreshing(true);
      haptic.medium(); // Haptic snap
      
      // Snap to loading indicator position
      await controls.start({ y: 60, transition: { type: "spring", stiffness: 300, damping: 30 } });
      
      try {
        await onRefresh();
        haptic.success();
      } finally {
        setIsRefreshing(false);
        controls.start({ y: 0, transition: { duration: 0.2 } });
        y.set(0);
      }
    } else {
      // Reset
      controls.start({ y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } });
    }
    
    setIsPulling(false);
  };

  const handleDragStart = () => {
    if (canPull && !disabled && !isRefreshing) {
      setIsPulling(true);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative min-h-[50vh]", className)}>
      {/* Refresh Indicator */}
      <motion.div
        className="absolute left-0 right-0 top-0 flex justify-center items-start pointer-events-none z-10"
        style={{ y: useTransform(y, (val) => val / 2) }} // Parallax effect
      >
        <motion.div 
          className="bg-white rounded-full p-2 shadow-md border border-slate-100 flex items-center justify-center mt-4"
          style={{ opacity, scale: opacity }}
        >
          {isRefreshing ? (
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          ) : (
            <motion.div style={{ rotate }}>
              <ArrowDown className="w-5 h-5 text-slate-500" />
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div
        drag={canPull && !disabled && !isRefreshing ? "y" : false}
        dragConstraints={{ top: 0, bottom: threshold * 1.5 }}
        dragElastic={0.2}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ y }}
        className="touch-pan-y" // Allow vertical scrolling when not pulling
      >
        {children}
      </motion.div>
    </div>
  );
}
