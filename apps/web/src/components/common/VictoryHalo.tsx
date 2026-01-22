"use client";

/**
 * VictoryHalo - Animated Border Effect for Cards
 * 
 * Shows a racing conic gradient based on bidding state:
 * - Orange: User is winning (high bidder)
 * - Green: User has bid but not winning
 * - Blue: User is watching
 */

import { memo } from "react";
import { motion } from "framer-motion";

// ============================================
// PROPS
// ============================================

export type HaloTheme = 'orange' | 'green' | 'blue' | 'none';

interface VictoryHaloProps {
  theme: HaloTheme;
  className?: string;
}

// ============================================
// COLOR MAPS
// ============================================

const BASE_COLORS: Record<Exclude<HaloTheme, 'none'>, string> = {
  orange: 'bg-[#fbbf24]',
  green: 'bg-[#16a34a]',
  blue: 'bg-[#0ea5e9]',
};

const GRADIENT_CLASSES: Record<Exclude<HaloTheme, 'none'>, string> = {
  orange: 'bg-[conic-gradient(from_0deg,transparent_0%,rgba(245,158,11,0.2)_20%,#f59e0b_45%,#ffffff_50%,#f59e0b_55%,rgba(245,158,11,0.2)_80%,transparent_100%)]',
  green: 'bg-[conic-gradient(from_0deg,transparent_0%,rgba(22,163,74,0.2)_20%,#4ade80_45%,#ffffff_50%,#4ade80_55%,rgba(22,163,74,0.2)_80%,transparent_100%)]',
  blue: 'bg-[conic-gradient(from_0deg,transparent_0%,rgba(14,165,233,0.2)_20%,#38bdf8_45%,#ffffff_50%,#38bdf8_55%,rgba(14,165,233,0.2)_80%,transparent_100%)]',
};

// ============================================
// HELPER TO DERIVE THEME FROM CONFIG
// ============================================

import { BiddingConfig } from "@/types/bidding";

export function getHaloTheme(
  config: BiddingConfig, 
  isWatched: boolean = false
): HaloTheme {
  // Only show victory halo for public bids
  if (config.variant === 'public' && config.showVictoryHalo) {
    return 'orange';
  }
  
  // Show green halo if user has placed a bid (not winning though)
  if (config.hasUserBid && !config.isUserHighBidder) {
    return 'green';
  }
  
  // Show blue halo if user is watching
  if (isWatched) {
    return 'blue';
  }
  
  return 'none';
}

// ============================================
// COMPONENT
// ============================================

export const VictoryHalo = memo(({ theme, className = '' }: VictoryHaloProps) => {

  if (theme === 'none') return null;
  
  return (
    <div className={`absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-[inherit] ${className}`}>
      {/* Base Layer: Solid Vibrant Color */}
      <div className={`absolute inset-0 ${BASE_COLORS[theme]}`} />
      
      {/* Top Layer: Racing Bar Animation */}
      <motion.div 
        className={`absolute inset-[-200%] ${GRADIENT_CLASSES[theme]}`}
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
});


VictoryHalo.displayName = 'VictoryHalo';

