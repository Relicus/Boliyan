"use client";

import { memo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, User as UserIcon, Tag, Trophy } from "lucide-react";
import { BiddingConfig, BiddingViewMode } from "@/types/bidding";
import { cn } from "@/lib/utils";
import { MAX_BID_ATTEMPTS } from "@/lib/bidding";
import RollingPrice from "./RollingPrice";

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
  showTotalBids?: boolean;
  orientation?: 'row' | 'stacked';
  itemId?: string; // For Realtime DOM targeting
}


// ============================================
// SIZE HELPERS
// ============================================

function getLabelClass(): string {
  return 'text-[clamp(0.5625rem,2.25cqi,0.75rem)] font-black uppercase tracking-[0.08em] text-slate-500/80 mb-1';
}

function getPriceClass(viewMode: BiddingViewMode): string {
  const base = 'font-outfit font-black leading-none transition-all';
  switch (viewMode) {
    case 'modal': return `${base} text-xl`;
    default: return `${base} text-[clamp(1rem,6cqi,1.5rem)]`;
  }
}

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
  userCurrentBid,
  showTotalBids = false,
  orientation = 'row',
  itemId
}: PriceDisplayProps) => {

  const [showUserBid, setShowUserBid] = useState(false);

  // Rotation Logic
  // Wait for rolling animation (800ms) + display time (2000ms) before switching
  const ROLLING_ANIMATION_DURATION = 800;
  const DISPLAY_HOLD_DURATION = 2000;
  const TOTAL_ROTATION_INTERVAL = ROLLING_ANIMATION_DURATION + DISPLAY_HOLD_DURATION;

  useEffect(() => {
    // Stop if no user bid
    if (userCurrentBid === undefined || userCurrentBid === null) {
      return;
    }

    // Start rotation after animation completes + hold time
    const timer = setTimeout(() => {
      setShowUserBid(prev => !prev);
    }, TOTAL_ROTATION_INTERVAL);

    return () => clearTimeout(timer);
  }, [showUserBid, userCurrentBid, config.variant, config.isUserHighBidder]);
  
  const safeShowUserBid = showUserBid && (userCurrentBid !== undefined && userCurrentBid !== null);
  
  // Determine Right-Side Content (Dynamic)
  let labelText = "";
  let LabelIcon = null;
  let labelColor = "text-slate-500/80";
  let displayPrice: number | null = null;
  let displayText: string | null = null;
  let displayColor = "text-slate-800";
  
  // Realtime targeting props
  const highBidProps = itemId && !safeShowUserBid && config.variant === 'public' && config.showHighBid 
    ? {
        'data-rt-item-id': itemId,
        'data-rt-high-bid': 'true',
        'data-rt-high-bid-value': config.currentHighBid || 0
      }
    : {};
    
  const bidCountProps = itemId && !safeShowUserBid && (!config.showHighBid || config.variant !== 'public')
    ? {
        'data-rt-item-id': itemId,
        'data-rt-bid-count': 'true'
      }
    : {};

  if (safeShowUserBid) {
      labelText = "Your Bid";
      LabelIcon = UserIcon;
      labelColor = "text-purple-600/80";
      displayPrice = userCurrentBid || 0;
      displayColor = "text-purple-700";
  } else {
      // Market View
      if (config.variant === 'public') {
          labelText = "Highest";
          LabelIcon = Trophy;
          if (config.showHighBid && config.currentHighBid) {
              displayPrice = config.currentHighBid;
              displayColor = config.isUserHighBidder ? "text-amber-600" : "text-blue-600";
          } else {
              // No bids or not showing high bid
              displayText = `${bidCount} ${bidCount === 1 ? 'Bid' : 'Bids'}`;
              displayColor = "text-blue-600";
          }
      } else {
          // Secret
          labelText = "Secret";
          LabelIcon = Lock;
          displayText = `${bidCount} ${bidCount === 1 ? 'Bid' : 'Bids'}`;
          displayColor = "text-amber-600";
      }
  }

  // Common Label Component
  const renderLabel = () => (
    <AnimatePresence mode="wait">
        <motion.span 
            key={labelText}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className={cn(getLabelClass(), "flex items-center gap-1.5 justify-center mb-0.5 whitespace-nowrap absolute right-0 bottom-0", labelColor)}
        >
            {LabelIcon && <LabelIcon className="w-3 h-3" />}
            {labelText}
        </motion.span>
    </AnimatePresence>
  );

  // Common Value Component
  // Use a unique key based on the price SOURCE (not value) to maintain separate animation states
  // This prevents animation glitches when rotating between "Your Bid" and "Highest"
  const priceKey = safeShowUserBid ? 'user-bid' : 'high-bid';
  
  const renderValue = () => (
      <div className={cn(getPriceClass(viewMode), "flex items-center gap-1.5 transition-colors duration-300", displayColor)}>
          {displayPrice !== null ? (
              <span {...highBidProps}>
                <RollingPrice key={priceKey} price={displayPrice} />
              </span>
          ) : (
              <span {...bidCountProps}>{displayText}</span>
          )}
          {/* Show Total Bids Count if in Public mode + High Bid is shown + NOT user view */}
          {!safeShowUserBid && showTotalBids && config.variant === 'public' && config.currentHighBid && (
               <span className="text-[clamp(0.75rem,3cqi,1rem)] font-bold text-slate-400 ml-1">({bidCount})</span>
          )}
      </div>
  );

  // STACKED ORIENTATION
  if (orientation === 'stacked') {
      return (
        <div className={cn("grid grid-cols-2 gap-4 w-full", className)}>
             {/* Ask Price Block */}
             <div className="flex flex-col items-center justify-center p-3 pl-5 bg-slate-50 border-2 border-slate-100 rounded-2xl shadow-sm h-20 min-w-0">
                <span className={cn(getLabelClass(), "flex items-center gap-1.5 justify-center mb-0.5")}>
                    <Tag className="w-3 h-3 text-slate-400" />
                    Asking
                </span>
                <span className={cn(getPriceClass(viewMode), "text-slate-800")}>
                    <RollingPrice price={askPrice} />
                </span>
             </div>

             {/* Highest/User Bid Block */}
             <div className="flex flex-col items-center justify-center p-3 pl-5 bg-slate-50 border-2 border-slate-100 rounded-2xl shadow-sm h-20 min-w-0 relative overflow-hidden">
                 {/* Label Container - Fixed Height */}
                 <div className="h-4 w-full relative flex justify-center mb-1">
                     <AnimatePresence mode="wait">
                        <motion.span 
                            key={labelText}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.2 }}
                            className={cn(getLabelClass(), "flex items-center gap-1.5 justify-center absolute inset-x-0", labelColor)}
                        >
                            {LabelIcon && <LabelIcon className="w-3 h-3" />}
                            {labelText}
                        </motion.span>
                    </AnimatePresence>
                 </div>
                 
                 {/* Value Container */}
                 {renderValue()}
             </div>
        </div>
      );
  }

  // ROW ORIENTATION (Default)
  return (
    <div className={`grid grid-cols-[1fr_auto_1fr] items-end ${className}`}>
      {/* Asking Price */}
      <div className="flex flex-col justify-self-start">
        <span className={cn(getLabelClass(), "flex items-center gap-1")}>
          <Tag className="w-2.5 h-2.5" />
          Asking
        </span>
        <span className={`${getPriceClass(viewMode)} text-slate-800`}>
          <RollingPrice price={askPrice} />
        </span>
      </div>

      {/* Attempt Dots (Centered) */}
      <div className="flex flex-col items-center justify-end pb-1.5 px-2 w-[56px]">
        {showAttempts && (
           <div className="flex flex-col items-center gap-1 w-full">
            <div className="flex gap-1.5 justify-center w-full">
              {Array.from({ length: Math.max(0, remainingAttempts) }).map((_, i) => (
                <div 
                  key={i} 
                  className="h-1.5 w-1.5 rounded-full bg-slate-300 transition-all duration-300 shrink-0"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Right Side */}
      <div 
        className="flex flex-col items-end justify-self-end justify-end h-[2.5em] relative"
      >
          {/* Label Container - Absolute to prevent layout jump during transition */}
          <div className="h-4 w-full relative mb-1">
             <AnimatePresence mode="wait">
                <motion.span 
                    key={labelText}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className={cn(getLabelClass(), "flex items-center gap-1 absolute right-0 bottom-0 whitespace-nowrap", labelColor)}
                >
                    {LabelIcon && <LabelIcon className="w-2.5 h-2.5" />}
                    {labelText}
                </motion.span>
             </AnimatePresence>
          </div>

          {/* Value Container - Stable */}
          {renderValue()}
      </div>
    </div>
  );
});

PriceDisplay.displayName = 'PriceDisplay';
