"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, animate, useTransform } from "framer-motion";
import { formatPrice, cn } from "@/lib/utils";

interface RollingPriceProps {
  price: number;
  className?: string;
}

export default function RollingPrice({ price, className }: RollingPriceProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(price);
  
  useEffect(() => {
    const controls = animate(motionValue, price, {
      duration: 0.8,
      ease: [0.76, 0, 0.24, 1], // Custom slow-fast-slow (similar to easeInOutQuart)
      onUpdate: (latest) => {
        if (ref.current) {
          ref.current.textContent = formatPrice(latest);
        }
      }
    });

    return () => controls.stop();
  }, [price, motionValue]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {formatPrice(price)}
    </span>
  );
}
