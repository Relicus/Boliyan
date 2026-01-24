"use client";

/**
 * PriceDisplay - Consistent Price Rendering for Cards
 * 
 * Displays asking price and high bid/secret status consistently.
 * Adapts styling based on bidding variant (public vs secret).
 */

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
}


// ============================================
// SIZE HELPERS
// ============================================

function getLabelClass(): string {
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
  userCurrentBid,
  showTotalBids = false,
  orientation = 'row' // 'row' | 'stacked'
}: PriceDisplayProps & { showTotalBids?: boolean; orientation?: 'row' | 'stacked' }) => {

  const [showUserBid, setShowUserBid] = useState(false);

  // Rotation Logic
  useEffect(() => {
    // Stop if no user bid
    if (userCurrentBid === undefined || userCurrentBid === null) {
      return;
    }

    // Start rotation
    let timer: NodeJS.Timeout;

    const runRotation = () => {
        // Show each state for 2 seconds (2000ms)
        const nextDuration = 2000;
        
        timer = setTimeout(() => {
            setShowUserBid(prev => !prev);
        }, nextDuration);
    };

    runRotation();

    return () => clearTimeout(timer);
  }, [showUserBid, userCurrentBid, config.variant, config.isUserHighBidder]);
  
  const safeShowUserBid = showUserBid && (userCurrentBid !== undefined && userCurrentBid !== null);
  
  // Layout Logic:
  // 'row': Standard card layout (Ask - Dots - Bid)
  // 'stacked': For modal/page where Ask and Bid are separate blocks
  
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

             {/* Highest Bid Block (Rotating) */}
             <div className="relative flex flex-col items-center justify-center p-3 pl-5 bg-slate-50 border-2 border-slate-100 rounded-2xl shadow-sm h-20 min-w-0">
                <AnimatePresence mode="wait">
                    {safeShowUserBid ? (
                        <motion.div
                            key="user-bid-stacked"
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 800, damping: 35 }}
                            className="absolute inset-0 flex flex-col items-center justify-center"
                        >
                            <span className={cn(getLabelClass(), "text-purple-600/80 flex items-center gap-1.5 justify-center mb-0.5")}>
                                <UserIcon className="w-3 h-3" />
                                Your Bid
                            </span>
                            <span className={cn(getPriceClass(viewMode), "text-purple-700")}>
                                <RollingPrice price={userCurrentBid || 0} />
                            </span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="market-bid-stacked"
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 800, damping: 35 }}
                            className="absolute inset-0 flex flex-col items-center justify-center"
                        >
                             <span className={cn(getLabelClass(), "flex items-center gap-1.5 justify-center mb-0.5")}>
                                {config.variant === 'public' ? <Trophy className="w-3 h-3 text-slate-400" /> : <Lock className="w-3 h-3 text-slate-400" />}
                                {config.variant === 'public' ? "Highest" : "Bids"}
                             </span>
                             <div className="flex items-center gap-1.5">
                                <span className={cn(getPriceClass(viewMode), config.isUserHighBidder ? "text-amber-600" : "text-blue-600")}>
                                    {config.variant === 'public' && config.currentHighBid ? (
                                        <RollingPrice price={config.currentHighBid} />
                                    ) : (
                                        <span>{bidCount} {bidCount === 1 ? 'Bid' : 'Bids'}</span>
                                    )}
                                </span>
                                {showTotalBids && config.variant === 'public' && (
                                    <span className="text-[clamp(0.75rem,3cqi,1rem)] font-bold text-slate-400 ml-1">({bidCount})</span>
                                )}
                             </div>
                        </motion.div>
                    )}
                </AnimatePresence>
             </div>
        </div>
      );
  }

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
            {/* Dots */}
            <div className="flex gap-1.5 justify-center w-full">
              {Array.from({ length: Math.max(0, remainingAttempts) }).map((_, i) => (
                <div 
                  key={i} 
                  className="h-1.5 w-1.5 rounded-full bg-slate-300 transition-all duration-300 shrink-0"
                />
              ))}
            </div>
            {/* User Bid removed from here - moved to rotation */}
          </div>
        )}
      </div>

      {/* Highest Bid / Secret Status / Your Bid (Rotating) */}
      <div 
        className="flex flex-col items-end justify-self-end transition-all relative h-[2.5em] justify-end cursor-default"
      >
          <AnimatePresence mode="wait">
            {safeShowUserBid ? (
              <motion.div
                key="user-bid"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                transition={{ 
                  type: "spring",
                  stiffness: 800,
                  damping: 35
                }}
                className="flex flex-col items-end absolute bottom-0 right-0 w-max"
              >
                <span className={cn(getLabelClass(), "text-purple-600/80 flex items-center gap-1")}>
                  <UserIcon className="w-2.5 h-2.5" />
                  Your Bid
                </span>
                <span className={`${getPriceClass(viewMode)} text-purple-700 flex items-center gap-1`}>
                   <RollingPrice price={userCurrentBid || 0} />
                </span>
             </motion.div>
            ) : (
              <motion.div
                key="market-bid"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                transition={{ 
                  type: "spring",
                  stiffness: 800,
                  damping: 35
                }}
                className="flex flex-col items-end absolute bottom-0 right-0 w-max"
              >
                <span className={cn(getLabelClass(), "flex items-center gap-1")}>
                  {config.variant === 'public' ? (
                    <Trophy className="w-2.5 h-2.5" />
                  ) : (
                    <Lock className="w-2.5 h-2.5" />
                  )}
                  {config.variant === 'public' ? "Highest" : "Secret"}
                </span>

                <div className="flex items-center gap-1.5 transition-all">
                  {config.variant === 'public' && config.showHighBid && config.currentHighBid ? (
                    // Public: Show current high bid with animation
                    <div className="flex items-center gap-1.5">
                      <motion.span 
                        animate={{ 
                          scale: 1, 
                          color: config.isUserHighBidder ? "#d97706" : "#2563eb" 
                        }}
                        className={`${getPriceClass(viewMode)} inline-block`}
                      >
                        <RollingPrice price={config.currentHighBid} />
                      </motion.span>
                    </div>
                  ) : config.variant === 'secret' ? (
                    // Secret: Show bid count
                    <div className="flex items-center gap-1.5">
                      <span className={`${getPriceClass(viewMode)} text-amber-600`}>
                        {bidCount} {bidCount === 1 ? 'Bid' : 'Bids'}
                      </span>
                    </div>
                  ) : (
                    // Public with no bids yet
                    <span className={`${getPriceClass(viewMode)} text-blue-600`}>
                      {bidCount} {bidCount === 1 ? 'Bid' : 'Bids'}
                    </span>
                  )}
                </div>
                {showTotalBids && config.variant === 'public' && config.currentHighBid && (
                    <div className="absolute top-0 -right-6 text-[10px] font-bold text-slate-400">
                        ({bidCount})
                    </div>
                )}
             </motion.div>
           )}
        </AnimatePresence>
      </div>
    </div>
  );
});

PriceDisplay.displayName = 'PriceDisplay';

