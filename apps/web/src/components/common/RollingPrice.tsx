"use client";

import { useEffect, useRef } from "react";
import { formatPrice, cn } from "@/lib/utils";

interface RollingPriceProps {
  price: number;
  className?: string;
}

export default function RollingPrice({ price, className }: RollingPriceProps) {
  const ref = useRef<HTMLSpanElement>(null);
  // Initialize to 0 so first mount triggers roll animation from $0 to actual price
  const currentDisplayedPrice = useRef(0);
  const isAnimating = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const prevPrice = currentDisplayedPrice.current;

    // If exact same value, just ensure display is correct
    if (prevPrice === price) {
      element.textContent = formatPrice(price);
      return;
    }

    // Cancel any existing animation frame
    if (isAnimating.current) {
      // Let the current animation finish naturally
    }

    const startValue = prevPrice;
    const endValue = price;
    const duration = 500; // Fast for snappy feel
    const startTime = performance.now();
    
    let animationFrameId: number;
    isAnimating.current = true;

    // Trigger CSS scale pop (GPU-accelerated)
    element.style.transform = 'scale(1.06)';
    
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Cubic Ease Out - fast start, smooth end
      const ease = 1 - Math.pow(1 - progress, 3);
      
      const current = startValue + (endValue - startValue) * ease;
      
      // Direct DOM manipulation - no React re-renders
      element.textContent = formatPrice(current);
      currentDisplayedPrice.current = current;

      // Scale ease back (50% through animation)
      if (progress > 0.3) {
        const scaleProgress = (progress - 0.3) / 0.7;
        const scaleEase = 1 - Math.pow(1 - scaleProgress, 2);
        element.style.transform = `scale(${1.06 - 0.06 * scaleEase})`;
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(tick);
      } else {
        // Ensure final state is clean
        element.textContent = formatPrice(endValue);
        element.style.transform = 'scale(1)';
        currentDisplayedPrice.current = endValue;
        isAnimating.current = false;
      }
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
      isAnimating.current = false;
    };
  }, [price]);

  return (
    <span 
      ref={ref} 
      className={cn(
        "tabular-nums inline-block origin-center will-change-transform transition-transform duration-100",
        className
      )}
      style={{ backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}
    >
      {formatPrice(price)}
    </span>
  );
}
