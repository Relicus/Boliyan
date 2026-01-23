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
// motion removed for static border optimization

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
  orange: 'border-amber-500 shadow-[0_0_0_1px_rgba(245,158,11,0.4)]',
  green: 'border-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.4)]',
  blue: 'border-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,0.4)]',
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
    <div className={`absolute inset-0 pointer-events-none z-0 rounded-[inherit] border-[3px] bg-transparent ${BASE_COLORS[theme]} ${className}`} />
  );
});


VictoryHalo.displayName = 'VictoryHalo';

