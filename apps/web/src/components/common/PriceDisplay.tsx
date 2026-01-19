"use client";

/**
 * PriceDisplay - Consistent Price Rendering for Cards
 * 
 * Displays asking price and high bid/secret status consistently.
 * Adapts styling based on bidding variant (public vs secret).
 */

import { memo } from "react";
import { motion } from "framer-motion";
import { Trophy, Lock } from "lucide-react";
import { BiddingConfig, BiddingViewMode } from "@/types/bidding";
import { formatPrice } from "@/lib/utils";

// ============================================
// PROPS
// ============================================

interface PriceDisplayProps {
  config: BiddingConfig;
  askPrice: number;
  bidCount: number;
  viewMode?: BiddingViewMode;
  className?: string;
}

// ============================================
// SIZE HELPERS
// ============================================

function getLabelClass(viewMode: BiddingViewMode): string {
  switch (viewMode) {
    case 'modal': return 'text-xs';
    case 'spacious': return 'text-xs';
    case 'comfortable': return 'text-[10px]';
    default: return 'text-[9px]';
  }
}

function getPriceClass(viewMode: BiddingViewMode): string {
  switch (viewMode) {
    case 'modal': return 'text-xl';
    case 'spacious': return 'text-fluid-price-lg';
    case 'comfortable': return 'text-fluid-h3';
    default: return 'text-fluid-price-sm';
  }
}

function getTrophySizeClass(viewMode: BiddingViewMode): string {
  switch (viewMode) {
    case 'modal': return 'w-8 h-8 p-1.5';
    case 'spacious': return 'w-7 h-7 p-1.5';
    case 'comfortable': return 'w-6 h-6 p-1';
    default: return 'w-5 h-5 p-1';
  }
}

// Price formatting logic handled by centralized utility

// ============================================
// COMPONENT
// ============================================

const PriceDisplay = memo(({ 
  config, 
  askPrice, 
  bidCount,
  viewMode = 'compact',
  className = ''
}: PriceDisplayProps) => {
  
  return (
    <div className={`flex items-end justify-between transition-all ${className}`}>
      {/* Asking Price */}
      <div className="flex flex-col">
        <span className={`${getLabelClass(viewMode)} text-slate-600 font-bold uppercase tracking-wider transition-all`}>
          Asking
        </span>
        <span className={`${getPriceClass(viewMode)} font-black text-slate-800 leading-none transition-all`}>
          {formatPrice(askPrice, viewMode)}
        </span>
      </div>

      {/* High Bid / Secret Status */}
      <div className="flex flex-col items-end transition-all">
        <span className={`${getLabelClass(viewMode)} text-slate-600 font-bold uppercase tracking-wider transition-all`}>
          {config.variant === 'public' ? "High Bid" : "Secret"}
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
                className={`${getPriceClass(viewMode)} font-black leading-none inline-block`}
              >
                {formatPrice(config.currentHighBid, viewMode)}
              </motion.span>
              
              {/* Trophy for high bidder */}
              {config.isUserHighBidder && (
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className={`bg-amber-100 text-amber-600 rounded-full flex items-center justify-center ${getTrophySizeClass(viewMode)}`}
                  title="You are the high bidder!"
                >
                  <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 2H6v2H2v7c0 2.21 1.79 4 4 4h1.09c.45 1.76 1.83 3.14 3.58 3.59V20H8v2h8v-2h-2.67v-1.41c1.75-.45 3.13-1.83 3.58-3.59H18c2.21 0 4-1.79 4-4V4h-4V2zM6 13c-1.1 0-2-.9-2-2V6h2v7zm14-2c0 1.1-.9 2-2 2h-2V6h2v5z"/>
                  </svg>
                </motion.div>
              )}
            </div>
          ) : config.variant === 'secret' ? (
            // Secret: Show bid count with lock
            <div className="flex items-center gap-1.5">
              <span className={`${getPriceClass(viewMode)} font-black text-amber-600 leading-none`}>
                {bidCount} {bidCount === 1 ? 'Bid' : 'Bids'}
              </span>
              <div className="bg-amber-100 text-amber-600 p-1 rounded" title="Secret Bidding">
                <Lock className="h-3.5 w-3.5" />
              </div>
            </div>
          ) : (
            // Public with no bids yet
            <span className={`${getPriceClass(viewMode)} font-black text-blue-600 leading-none`}>
              {bidCount} {bidCount === 1 ? 'Bid' : 'Bids'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

PriceDisplay.displayName = 'PriceDisplay';

export default PriceDisplay;
