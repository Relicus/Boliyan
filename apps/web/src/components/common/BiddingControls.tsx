"use client";

import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Gavel, TrendingUp, Loader2, AlertCircle, Timer } from "lucide-react";
import { MAX_BID_ATTEMPTS } from "@/lib/bidding";
import { formatPrice } from "@/lib/utils";

export type BiddingViewMode = 'compact' | 'comfortable' | 'spacious' | 'modal';

interface BiddingControlsProps {
  // Data
  bidAmount: string;
  isSuccess: boolean;
  isOwner: boolean;
  isHighBidder: boolean;
  hasPriorBid: boolean;
  isSubmitting?: boolean;
  error?: boolean;
  errorMessage?: string | null;
  minBid?: number;
  remainingAttempts?: number;
  userCurrentBid?: number;
  cooldownRemaining?: number;
  
  // Dual-tap confirmation state
  pendingConfirmation?: { type: 'double_bid' | 'high_bid' | 'out_of_bids' | 'confirm_bid', message: string } | null;
  
  // Animation
  animTrigger: number;
  
  // Configuration
  viewMode?: BiddingViewMode;
  disabled?: boolean;
  idPrefix: string;
  showAttemptsDots?: boolean;
  showStatus?: boolean;
  
  // Handlers
  onSmartAdjust: (e: React.MouseEvent, direction: -1 | 1) => void;
  onBid: (e: React.MouseEvent) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onInputClick?: (e: React.MouseEvent) => void;
}

// Size Helpers
function getInputHeight(viewMode: BiddingViewMode): string {
  switch (viewMode) {
    case 'modal': return 'h-12 sm:h-14';
    case 'spacious': return 'h-10';
    default: return 'h-8 sm:h-9';
  }
}

function getButtonWidth(viewMode: BiddingViewMode): string {
  switch (viewMode) {
    case 'modal': return 'w-12 sm:w-14';
    case 'spacious': return 'w-12';
    default: return 'w-10';
  }
}

function getTextSize(viewMode: BiddingViewMode): string {
  switch (viewMode) {
    case 'modal': return 'text-lg sm:text-xl';
    case 'spacious': return 'text-[clamp(0.875rem,5cqi,1.125rem)]';
    default: return 'text-[clamp(0.875rem,5cqi,1.125rem)]';
  }
}

export const BiddingControls = memo(({
  bidAmount,
  isSuccess,
  isOwner,
  isHighBidder,
  hasPriorBid,
  isSubmitting = false,
  error = false,
  errorMessage = null,
  minBid = 0,
  remainingAttempts = MAX_BID_ATTEMPTS,
  userCurrentBid,
  cooldownRemaining = 0,
  pendingConfirmation = null,
  animTrigger,
  viewMode = 'compact',
  disabled = false,
  idPrefix,
  showAttemptsDots = true,
  showStatus = false,
  onSmartAdjust,
  onBid,
  onKeyDown,
  onInputChange,
  onInputClick
}: BiddingControlsProps) => {

  const buildId = (suffix: string) => `${idPrefix}-${suffix}`;
  const isBelowMinimum = parseFloat(bidAmount.replace(/,/g, '')) < minBid;
  const isQuotaReached = remainingAttempts === 0;
  
  // Disabled state logic
  const isDisabled = disabled || isOwner || isSubmitting;
  
  // Determine Button Styling based on state
  const getButtonConfig = () => {
    // 1. Cooldown State (Highest Priority)
    if (cooldownRemaining && cooldownRemaining > 0) {
      return {
        bgClass: 'bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed shadow-none',
        content: `Wait ${cooldownRemaining}s`
      };
    }

    // 2. Critical Errors
    if (errorMessage === "Out of Bids" || isQuotaReached) {
      return {
        bgClass: 'bg-red-50 text-red-600 border border-red-200 cursor-not-allowed shadow-none',
        content: "Out of Bids"
      };
    }

    if (errorMessage === "Already Bid This Amount") {
      return {
        bgClass: 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none',
        content: "Already Offered"
      };
    }

    // 3. Success State
    if (isSuccess) {
      return { 
        bgClass: 'bg-amber-600 text-white scale-100 ring-4 ring-amber-100',
        content: (
          <span className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
             <motion.svg 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-5 h-5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </motion.svg>
            <span>Bid Placed!</span>
          </span>
        )
      };
    }

    // 4. Submission Loader
    if (isSubmitting) {
      return {
        bgClass: 'bg-blue-600/80 text-white shadow-none cursor-wait',
        content: <Loader2 className="w-6 h-6 animate-spin text-white/80" />
      };
    }

    // 5. Confirmation State
    if (pendingConfirmation) {
      return {
        bgClass: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200',
        content: pendingConfirmation.message
      };
    }
    
    // 6. Owner State
    if (isOwner) {
      return {
        bgClass: 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none active:scale-100',
        content: "Your Listing"
      };
    }

    // 7. Standard States
    if (hasPriorBid) {
      // If they have bids left, encourage update
      if (isHighBidder) {
        return {
          bgClass: 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200 hover:shadow-orange-300',
          content: (
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-5 h-5" />
              Raise Bid
            </span>
          )
        };
      }
      
      return {
        bgClass: 'bg-green-600 hover:bg-green-700 text-white shadow-green-200 hover:shadow-green-300',
        content: (
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-5 h-5" />
            Update Offer
          </span>
        )
      };
    }

    return {
      bgClass: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 hover:shadow-blue-300',
      content: (
        <span className="flex items-center gap-1.5">
          <Gavel className="w-5 h-5" />
          Place Bid
        </span>
      )
    };
  };

  const btnConfig = getButtonConfig();

  return (
    <div id={buildId('bidding-controls')} className={`flex flex-col ${showStatus ? 'gap-1.5' : 'gap-2'} w-full relative`}>
      
      {/* Sticky Cooldown Timer */}
      <AnimatePresence>
        {cooldownRemaining > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: -20, scale: 1 }}
            exit={{ opacity: 0, y: 0, scale: 0.9 }}
            className="absolute left-1/2 -translate-x-1/2 -top-4 z-30 bg-indigo-600 text-white px-3 py-1 rounded-full shadow-lg border border-indigo-400 flex items-center gap-2 pointer-events-none"
          >
            <Timer className="h-3 w-3 animate-pulse" />
            <span className="text-[10px] font-black font-outfit uppercase tracking-wider whitespace-nowrap">
              Cooldown: {cooldownRemaining}s
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Row (Modal/Product Page) */}
      {showStatus && !isOwner && (
        <div className="relative flex items-center justify-center px-1 min-h-[0.75rem]">
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: Math.max(0, remainingAttempts ?? 0) }).map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-slate-300 transition-all duration-300 shrink-0"
                />
              ))}
            </div>
            {userCurrentBid !== undefined && userCurrentBid !== null && (
              <span className="text-[11px] font-black font-outfit text-slate-700 leading-none">
                {formatPrice(userCurrentBid)}
              </span>
            )}
          </div>
          {errorMessage && (
            <div className="absolute right-1 top-1/2 -translate-y-1/2">
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide animate-pulse">
                {errorMessage}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error Message Indicator (Top Right - for ItemCard only) */}
      {!showStatus && !isOwner && !isSuccess && errorMessage && (
        <div className="flex justify-end px-1 mb-0.5">
             <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide animate-pulse">
               {errorMessage}
             </span>
        </div>
      )}

      {/* Attempts Dots (Optional - for ItemCard) */}
      {showAttemptsDots && !isOwner && !isSuccess && (
        <div className="flex justify-center mb-1">
           <div className="flex gap-1.5">
            {Array.from({ length: Math.max(0, remainingAttempts ?? 0) }).map((_, i) => (
              <div 
                key={i} 
                className="h-1.5 w-1.5 rounded-full bg-slate-300 transition-all duration-300 shrink-0"
              />
            ))}
          </div>
        </div>
      )}

      {/* Stepper Input Row */}
      <div className={`flex w-full ${getInputHeight(viewMode)}`}>
        <div className={`flex flex-1 border border-slate-300 rounded-xl shadow-sm overflow-hidden bg-white ${isOwner || isQuotaReached ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
          
          {/* Decrement Button */}
          <button
            id={buildId('decrement-btn')}
            onClick={(e) => onSmartAdjust(e, -1)}
            disabled={isDisabled || isQuotaReached}
            className={`${getButtonWidth(viewMode)} bg-slate-50 hover:bg-slate-100 border-r border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-600 transition-colors active:bg-slate-200 group disabled:cursor-not-allowed`}
          >
            <svg className="h-5 w-5 transition-transform group-active:scale-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 12H6" />
            </svg>
          </button>

          {/* Input */}
          <div className="relative flex-1">
            <motion.input
              id={buildId('bid-input')}
              type="text"
              value={bidAmount}
              key={`input-${animTrigger}`}
              initial={false}
              disabled={isDisabled || isQuotaReached}
              animate={{ 
                scale: [1, 1.1, 1],
                y: [0, -2, 0],
                x: (error || pendingConfirmation) ? [0, -4, 4, -4, 4, 0] : 0
              }}
              transition={{ 
                scale: { duration: 0.2, ease: "easeOut" },
                y: { duration: 0.15, ease: "easeOut" },
                x: { duration: 0.2 } // Shake duration
              }}
              onKeyDown={onKeyDown}
              onChange={onInputChange}
              onClick={onInputClick}
              className={`w-full h-full text-center ${getTextSize(viewMode)} font-black font-outfit text-slate-900 focus:outline-none px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors duration-300
                ${error ? 'bg-red-50 text-red-900' : 'bg-transparent'}
              `}
            />
          </div>

          {/* Increment Button */}
          <button
            id={buildId('increment-btn')}
            onClick={(e) => onSmartAdjust(e, 1)}
            disabled={isDisabled || isQuotaReached}
            className={`${getButtonWidth(viewMode)} bg-slate-50 hover:bg-slate-100 border-l border-slate-200 flex items-center justify-center text-slate-500 hover:text-amber-600 transition-colors active:bg-slate-200 group disabled:cursor-not-allowed`}
          >
            <svg className="h-5 w-5 transition-transform group-active:scale-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v12m6-6H6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Action Button */}
      <motion.button
        id={buildId('place-bid-btn')}
        onClick={onBid}
        disabled={isSuccess || isDisabled || isQuotaReached || errorMessage === "Already Bid This Amount"}
        initial={false}
        animate={pendingConfirmation ? { x: [0, -3, 3, -3, 3, 0] } : {}}
        transition={{ duration: 0.4 }}
        className={`${getInputHeight(viewMode)} w-full rounded-xl font-bold font-outfit shadow-md transition-all duration-300 active:scale-[0.98] text-[clamp(0.875rem,5cqi,1.125rem)] flex items-center justify-center
          ${btnConfig.bgClass}
        `}
      >
        {isSubmitting ? (
           <Loader2 className="w-6 h-6 animate-spin text-white/80" />
        ) : (
          btnConfig.content
        )}
      </motion.button>
    </div>
  );
});

BiddingControls.displayName = "BiddingControls";
