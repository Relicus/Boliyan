"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BOLIYAN_LOGOMARK_DOT, BOLIYAN_LOGOMARK_PATH } from "@/components/branding/BoliyanLogo";

/**
 * Size presets for the loader:
 *  - xs:  14px — inline text / tiny indicators
 *  - sm:  18px — buttons, badges, tight rows
 *  - md:  24px — default, general purpose
 *  - lg:  32px — section / card-level loaders
 *  - xl:  48px — full-page loading states
 */
const SIZE_MAP: Record<string, string> = {
  xs: "h-3.5 w-3.5 min-h-3.5 min-w-3.5",
  sm: "h-[18px] w-[18px] min-h-[18px] min-w-[18px]",
  md: "h-6 w-6 min-h-6 min-w-6",
  lg: "h-8 w-8 min-h-8 min-w-8",
  xl: "h-12 w-12 min-h-12 min-w-12",
};

interface BoliyanLogomarkLoaderProps {
  className?: string;
  /** Preset size: xs | sm | md | lg | xl (default: md) */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

export const BoliyanLogomarkLoader = ({ className, size = "md" }: BoliyanLogomarkLoaderProps) => {
  const maskId = useId();
  const shouldReduceMotion = useReducedMotion();
  const fillHeight = 32;
  const fillY = 40 - fillHeight;

  return (
    <motion.svg
      viewBox="0 0 40 40"
      className={cn(SIZE_MAP[size], className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Loading"
      role="img"
      animate={shouldReduceMotion ? undefined : { rotate: [-6, 6, -6] }}
      transition={
        shouldReduceMotion
          ? undefined
          : { duration: 1.4, ease: "easeInOut", repeat: Infinity }
      }
      style={{ transformOrigin: "50% 100%" }}
    >
      <path
        d={BOLIYAN_LOGOMARK_PATH}
        stroke="currentColor"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
        opacity="0.25"
      />
      <circle
        cx={BOLIYAN_LOGOMARK_DOT.cx}
        cy={BOLIYAN_LOGOMARK_DOT.cy}
        r={BOLIYAN_LOGOMARK_DOT.r}
        fill="currentColor"
        opacity="0.25"
      />
      <mask id={maskId} maskUnits="userSpaceOnUse">
        <rect width="40" height="40" fill="black" />
        <motion.rect
          x="0"
          width="40"
          fill="white"
          initial={shouldReduceMotion ? { y: fillY, height: fillHeight } : { y: 40, height: 0 }}
          animate={
            shouldReduceMotion
              ? { y: fillY, height: fillHeight }
              : { y: 0, height: 40 }
          }
          transition={
            shouldReduceMotion
              ? undefined
              : { duration: 1.15, ease: "easeInOut", repeat: Infinity }
          }
        />
      </mask>
      <g mask={`url(#${maskId})`}>
        <path
          d={BOLIYAN_LOGOMARK_PATH}
          stroke="currentColor"
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
        />
        <circle
          cx={BOLIYAN_LOGOMARK_DOT.cx}
          cy={BOLIYAN_LOGOMARK_DOT.cy}
          r={BOLIYAN_LOGOMARK_DOT.r}
          fill="currentColor"
        />
      </g>
    </motion.svg>
  );
};

export default BoliyanLogomarkLoader;
