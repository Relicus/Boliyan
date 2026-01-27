"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BOLIYAN_LOGOMARK_DOT, BOLIYAN_LOGOMARK_PATH } from "@/components/branding/BoliyanLogo";

interface BoliyanLogomarkLoaderProps {
  className?: string;
}

export const BoliyanLogomarkLoader = ({ className }: BoliyanLogomarkLoaderProps) => {
  const maskId = useId();
  const shouldReduceMotion = useReducedMotion();
  const fillHeight = 32;
  const fillY = 40 - fillHeight;

  return (
    <motion.svg
      viewBox="0 0 40 40"
      className={cn("h-6 w-6", className)}
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
