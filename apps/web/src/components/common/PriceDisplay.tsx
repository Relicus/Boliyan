"use client";

/**
 * PriceDisplay - Consistent Price Rendering for Cards
 * 
 * Displays asking price and high bid/secret status consistently.
 * Adapts styling based on bidding variant (public vs secret).
 */

import { memo } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { BiddingConfig, BiddingViewMode } from "@/types/bidding";
import { formatPrice } from "@/lib/utils";
import { MAX_BID_ATTEMPTS } from "@/lib/bidding";

// ============================================
// PROPS
// ============================================

interface PriceDisplayProps {
  config: BiddingConfig;
  askPrice: number;
  bidCount: number;
  viewMode?: BiddingViewMode;
  className?: string;
  remainingAttempts?: number;
  showAttempts?: boolean;
  userCurrentBid?: number;
}


// ============================================
// SIZE HELPERS
// ============================================

function getLabelClass(viewMode: BiddingViewMode): string {
  // Unified fluid metadata label style
  return 'text-[clamp(0.5625rem,2.25cqi,0.75rem)] font-black uppercase tracking-[0.08em] text-slate-500/80 mb-1';
}


function getPriceClass(viewMode: BiddingViewMode): string {
  const base = 'font-outfit font-black leading-none transition-all';
  switch (viewMode) {
    case 'modal': return `${base} text-xl`;
    default: return `${base} text-[clamp(1rem,6cqi,1.5rem)]`;
  }
}

function getTrophySizeClass(viewMode: BiddingViewMode): string {
  switch (viewMode) {
    case 'modal': return 'w-8 h-8 p-1.5';
    default: return 'w-[clamp(1.25rem,6cqi,1.75rem)] h-[clamp(1.25rem,6cqi,1.75rem)] p-[clamp(0.25rem,1cqi,0.375rem)]';
  }
}


// Price formatting logic handled by centralized utility

// ============================================
// COMPONENT
// ============================================

export const PriceDisplay = memo(({ 
  config, 
  askPrice, 
  bidCount,
  viewMode = 'compact',
  className = '',
  remainingAttempts = MAX_BID_ATTEMPTS,
  showAttempts = false,
  userCurrentBid
}: PriceDisplayProps) => {
  
  return (
    <div className={`grid grid-cols-[1fr_auto_1fr] items-end ${className}`}>
      {/* Asking Price */}
      <div className="flex flex-col justify-self-start">
        <span className={getLabelClass(viewMode)}>
          Asking
        </span>
        <span className={`${getPriceClass(viewMode)} text-slate-800`}>
          {formatPrice(askPrice, viewMode)}
        </span>
      </div>

      {/* Attempt Dots (Centered) */}
      <div className="flex flex-col items-center justify-end pb-1.5 px-2 w-[56px]">
        {showAttempts && (
           <div className="flex flex-col items-center gap-1 w-full">
            {/* Dots */}
            <div className="flex gap-1.5 justify-center w-full">
              {Array.from({ length: Math.max(0, remainingAttempts) }).map((_, i) => (
                <div 
                  key={i} 
                  className="h-1.5 w-1.5 rounded-full bg-slate-300 transition-all duration-300 shrink-0"
                />
              ))}
            </div>
            
            {/* User Bid - Only if exists */}
            {userCurrentBid !== undefined && userCurrentBid !== null && (
                <span className="text-[10px] font-black font-outfit text-slate-700 leading-none animate-in fade-in zoom-in duration-300">
                    {formatPrice(userCurrentBid)}
                </span>
            )}
          </div>
        )}
      </div>

      {/* Highest Bid / Secret Status */}
      <div className="flex flex-col items-end justify-self-end transition-all">
        <span className={getLabelClass(viewMode)}>
          {config.variant === 'public' ? "Highest Bid" : "Secret"}
        </span>

        
        <div className="flex items-center gap-1.5 transition-all">
          {config.variant === 'public' && config.showHighBid && config.currentHighBid ? (
            // Public: Show current high bid with animation
            <div className="flex items-center gap-1.5">
              <motion.span 
                key={config.currentHighBid}
                initial={{ scale: 1.4, color: "#3b82f6" }}
                animate={{ 
                  scale: 1, 
                  color: config.isUserHighBidder ? "#d97706" : "#2563eb" 
                }}
                transition={{ 
                  type: "spring", 
                  stiffness: 260, 
                  damping: 20,
                  duration: 0.6
                }}
                className={`${getPriceClass(viewMode)} inline-block`}
              >
                {formatPrice(config.currentHighBid, viewMode)}
              </motion.span>
            </div>
          ) : config.variant === 'secret' ? (
            // Secret: Show bid count with lock
            <div className="flex items-center gap-1.5">
              <span className={`${getPriceClass(viewMode)} text-amber-600`}>
                {bidCount} {bidCount === 1 ? 'Bid' : 'Bids'}
              </span>
              <div className="bg-amber-100 text-amber-600 p-1 rounded" title="Secret Bidding">
                <Lock className="h-3.5 w-3.5" />
              </div>
            </div>
          ) : (
            // Public with no bids yet
            <span className={`${getPriceClass(viewMode)} text-blue-600`}>
              {bidCount} {bidCount === 1 ? 'Bid' : 'Bids'}
            </span>
          )}

        </div>
      </div>
    </div>
  );
});

PriceDisplay.displayName = 'PriceDisplay';

