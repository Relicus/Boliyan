"use client";

import { useEffect, useRef } from "react";
import { formatPrice, cn } from "@/lib/utils";

interface RollingPriceProps {
  price: number;
  className?: string;
}

export default function RollingPrice({ price, className }: RollingPriceProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const currentDisplayedPrice = useRef(price);
  
  // Track if this is the first render to avoid animation on hydration/initial load
  // strictly matching RelicusRoad behavior
  const isFirstRender = useRef(true);

  useEffect(() => {
    // If exact same value, do nothing
    if (currentDisplayedPrice.current === price) {
      if (ref.current) ref.current.textContent = formatPrice(price);
      return;
    }

    // On first render, just set immediately without animation
    if (isFirstRender.current) {
      isFirstRender.current = false;
      currentDisplayedPrice.current = price;
      if (ref.current) ref.current.textContent = formatPrice(price);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const startValue = currentDisplayedPrice.current;
    const endValue = price;
    const duration = 800;
    const startTime = performance.now();

    // Cancel any existing animation frame if we had a ref to it
    // (Simpler: just let the new loop overwrite the text content)
    
    let animationFrameId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // RelicusRoad Ease: 1 - Math.pow(1 - progress, 3) (Cubic Ease Out)
      const ease = 1 - Math.pow(1 - progress, 3);
      
      const current = startValue + (endValue - startValue) * ease;
      
      element.textContent = formatPrice(current);
      currentDisplayedPrice.current = current;

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(tick);
      } else {
        // Ensure final value is clean
        element.textContent = formatPrice(endValue);
        currentDisplayedPrice.current = endValue;
      }
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [price]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {formatPrice(price)}
    </span>
  );
}
