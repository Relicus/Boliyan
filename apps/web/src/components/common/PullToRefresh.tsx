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
  mode?: "drag" | "touch";
  /** Fraction of viewport height from top where pull gesture is recognised (default 0.3 = top 30%) */
  pullZone?: number;
}

export function PullToRefresh({ 
  onRefresh, 
  children, 
  threshold = 120, // Distance to pull before trigger
  className,
  disabled = false,
  mode = "drag",
  pullZone = 0.3
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [canPull, setCanPull] = useState(true);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const pullDistanceRef = useRef(0);
  const startYRef = useRef<number | null>(null);
  const isTouchingRef = useRef(false);
  
  const haptic = useHaptic();
  const controls = useAnimation();
  const y = useMotionValue(0);
  const isTouchMode = mode === "touch";
  const indicatorY = useTransform(y, (val) => val / 2);
  
  // Transform pull distance to rotation/scale for visual feedback
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

  useEffect(() => {
    if (!isTouchMode) return;

    const handleTouchStart = (event: TouchEvent) => {
      if (disabled || isRefreshing) return;
      if (window.scrollY > 0) return;

      // Only recognise pulls that start in the upper zone of the viewport
      const startY = event.touches[0]?.clientY ?? 0;
      const zoneLimit = window.innerHeight * pullZone;
      if (startY > zoneLimit) return;

      isTouchingRef.current = true;
      startYRef.current = startY;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!isTouchingRef.current || startYRef.current === null) return;
      const currentY = event.touches[0]?.clientY ?? startYRef.current;
      const delta = currentY - startYRef.current;
      if (delta <= 0) {
        isTouchingRef.current = false;
        startYRef.current = null;
        pullDistanceRef.current = 0;
        if (pullDistance !== 0) {
          setPullDistance(0);
        }
        return;
      }

      const capped = Math.min(delta, threshold * 1.5);
      pullDistanceRef.current = capped;
      setIsPulling(true);
      setPullDistance(capped);
    };

    const handleTouchEnd = async () => {
      if (!isTouchingRef.current) return;
      isTouchingRef.current = false;
      startYRef.current = null;
      if (isPulling) {
        setIsPulling(false);
      }

      const shouldRefresh =
        !disabled &&
        !isRefreshing &&
        canPull &&
        pullDistanceRef.current > threshold;

      pullDistanceRef.current = 0;
      if (pullDistance !== 0) {
        setPullDistance(0);
      }

      if (!shouldRefresh) return;

      setIsRefreshing(true);
      haptic.medium();

      try {
        await onRefresh();
        haptic.success();
      } finally {
        setIsRefreshing(false);
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [canPull, disabled, haptic, isPulling, isRefreshing, isTouchMode, onRefresh, pullDistance, pullZone, threshold]);

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
        style={{
          y: isTouchMode
            ? Math.min(pullDistance / 2, 60)
            : indicatorY
        }}
      >
        <motion.div 
          className="bg-white rounded-full p-2 shadow-md border border-slate-100 flex items-center justify-center mt-4"
          style={{
            opacity: isTouchMode ? Math.min(pullDistance / threshold, 1) : opacity,
            scale: isTouchMode ? Math.min(pullDistance / threshold, 1) : opacity
          }}
        >
          {isRefreshing ? (
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          ) : (
            <motion.div style={isTouchMode ? undefined : { rotate }}>
              <ArrowDown className="w-5 h-5 text-slate-500" />
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* Content */}
      {isTouchMode ? (
        <div className="touch-pan-y">
          {children}
        </div>
      ) : (
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
      )}
    </div>
  );
}
