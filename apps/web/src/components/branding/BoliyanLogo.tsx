import React from 'react';
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export const BOLIYAN_LOGOMARK_PATH = "M32,10 C32,20 28,26 16,26 C12,26 8,24 8,24";
export const BOLIYAN_LOGOMARK_DOT = { cx: 18, cy: 36, r: 4 } as const;

export const BoliyanLogomark = ({ className }: LogoProps) => (
  <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Ba Curve */}
    <path
      d={BOLIYAN_LOGOMARK_PATH}
      stroke="currentColor"
      strokeWidth="7"
      fill="none"
      strokeLinecap="round"
    />
    {/* Dot at bottom */}
    <circle
      cx={BOLIYAN_LOGOMARK_DOT.cx}
      cy={BOLIYAN_LOGOMARK_DOT.cy}
      r={BOLIYAN_LOGOMARK_DOT.r}
      fill="currentColor"
    />
  </svg>
);

export const BoliyanUrduMark = ({ className }: LogoProps) => (
  <span className={cn("font-black font-[family-name:var(--font-noto-urdu)] leading-none pb-1", className)}>
    بولیاں
  </span>
);
