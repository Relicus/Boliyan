"use client";

import { memo, useState, useEffect, useRef } from "react";
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
  darkMode?: boolean; // For secret bidding dark theme
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
  itemId,
  darkMode = false
}: PriceDisplayProps) => {

  const [showUserBid, setShowUserBid] = useState(false);
  const prevUserBid = useRef(userCurrentBid);
  const lastBidTimestamp = useRef(0);

  // Rotation Logic
  // Wait for rolling animation (500ms) + display time (2000ms) before switching
  const ROLLING_ANIMATION_DURATION = 500;
  const DISPLAY_HOLD_DURATION = 2000;
  const TOTAL_ROTATION_INTERVAL = ROLLING_ANIMATION_DURATION + DISPLAY_HOLD_DURATION;

  // Force show "Your Bid" immediately when user places a new bid
  // Using queueMicrotask to avoid synchronous setState in effect (lint error)
  useEffect(() => {
    if (userCurrentBid !== undefined && userCurrentBid !== null && userCurrentBid !== prevUserBid.current) {
      // New bid detected - force show "Your Bid" on next microtask
      queueMicrotask(() => {
        setShowUserBid(true);
        lastBidTimestamp.current = Date.now();
      });
      prevUserBid.current = userCurrentBid;
    }
  }, [userCurrentBid]);

  // Auto-rotate between views
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
  }, [showUserBid, userCurrentBid, config.variant, config.isUserHighBidder, TOTAL_ROTATION_INTERVAL]);
  
  const safeShowUserBid = showUserBid && (userCurrentBid !== undefined && userCurrentBid !== null);
  
  // Determine Right-Side Content (Dynamic)
  let labelText = "";
  let LabelIcon = null;
  let labelColor = darkMode ? "text-slate-400" : "text-slate-500/80";
  let displayPrice: number | null = null;
  let displayText: string | null = null;
  let displayColor = darkMode ? "text-white" : "text-slate-800";
  
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

  if (safeShowUserBid && userCurrentBid) {
      labelText = "Your Bid";
      LabelIcon = UserIcon;
      labelColor = darkMode ? "text-purple-500" : "text-purple-700";
      displayPrice = userCurrentBid;
      displayColor = darkMode ? "text-purple-500" : "text-purple-700";
  } else {
      // Market View
      if (config.variant === 'public') {
          labelText = "Highest";
          LabelIcon = Trophy;
          if (config.showHighBid && config.currentHighBid) {
              displayPrice = config.currentHighBid;
              if (config.isUserHighBidder) {
                displayColor = darkMode ? "text-amber-400" : "text-amber-600";
              } else {
                displayColor = darkMode ? "text-blue-400" : "text-blue-600";
              }
          } else {
              // No bids or not showing high bid
              // Explicitly ensure displayPrice is null here
              displayPrice = null;
              displayText = bidCount === 0 ? 'Be first!' : `${bidCount} ${bidCount === 1 ? 'Bid' : 'Bids'}`;
              displayColor = darkMode ? "text-blue-400" : "text-blue-600";
          }
      } else {
          // Hidden
          labelText = "Hidden";
          LabelIcon = Lock;
          displayPrice = null;
          displayText = bidCount === 0 ? 'Be first!' : `${bidCount} ${bidCount === 1 ? 'Bid' : 'Bids'}`;
          displayColor = darkMode ? "text-amber-400" : "text-amber-600";
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

  
  const renderValue = () => (
    <AnimatePresence mode="wait">
      <motion.span 
        key={safeShowUserBid ? 'user-bid' : (displayPrice !== null ? 'market-price' : 'text')}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        transition={{ duration: 0.2 }}
        className={cn(getPriceClass(viewMode), "flex items-center gap-1 transition-colors duration-300", displayColor)}
        {...(displayPrice !== null ? highBidProps : bidCountProps)}
      >
          {/* Show Total Bids Count only when there are bids */}
          {(showTotalBids && config.variant === 'public' && bidCount > 0) ? (
               <span className="text-[0.8em] font-bold text-slate-400">({bidCount})</span>
          ) : null}
          {displayPrice !== null ? (
              <RollingPrice price={displayPrice} />
          ) : (
              displayText
          )}
      </motion.span>
    </AnimatePresence>
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

  // ROW ORIENTATION (Default) - Minimalist/Typography Driven
  return (
    <div className={`flex justify-between items-end w-full px-1 ${className}`}>
      {/* Asking Price - Left Aligned */}
      <div className="flex flex-col items-start">
        <span className={cn("text-[0.65rem] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1", darkMode ? "text-slate-400" : "text-slate-400")}>
          <Tag className="w-3 h-3" />
          Asking
        </span>
        <span className={cn(getPriceClass(viewMode), "leading-[0.9]", darkMode ? "text-white" : "text-slate-900")}>
          <RollingPrice price={askPrice} />
        </span>
      </div>

      {/* Attempt Dots (Removed per request - moved to button) */}
      <div className="flex flex-col items-center justify-end h-[2.5em] pb-1.5 opacity-60">
        {/* Dots moved to BiddingControls button */}
      </div>

      {/* Dynamic Right Side - Right Aligned */}
      <div 
        className="flex flex-col items-end h-[2.5em] relative"
      >
          {/* Label Container - Absolute to prevent layout jump during transition */}
          <div className="h-4 w-full relative mb-0.5">
             <AnimatePresence mode="wait">
                <motion.span 
                    key={labelText}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                        "text-[0.65rem] font-bold uppercase tracking-wider absolute right-0 bottom-0 whitespace-nowrap mb-0 flex items-center gap-1", 
                        // Mute the colors for the label to keep focus on the number
                        labelColor.replace('text-purple-600', 'text-purple-500').replace('text-amber-600', 'text-amber-500')
                    )}
                >
                    {LabelIcon && <LabelIcon className="w-3 h-3" />}
                    {labelText}
                </motion.span>
             </AnimatePresence>
          </div>

          {/* Value Container - Stable */}
          <span 
            className={cn(getPriceClass(viewMode), "flex items-center gap-1 transition-colors duration-300 leading-[0.9]", displayColor)}
            {...(displayPrice !== null ? highBidProps : bidCountProps)}
          >
              {/* Show Total Bids Count only when there are bids */}
              {(showTotalBids && config.variant === 'public' && bidCount > 0) ? (
                   <span className="text-[0.8em] font-bold text-slate-400">({bidCount})</span>
              ) : null}
              {displayPrice !== null ? (
                  <RollingPrice key="stable-price-display" price={displayPrice} />
              ) : (
                  displayText
              )}
          </span>
      </div>
    </div>
  );
});

PriceDisplay.displayName = 'PriceDisplay';
