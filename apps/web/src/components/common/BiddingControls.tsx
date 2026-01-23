"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
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
  cooldownProgress?: number;
  
  // Delta Animation
  showDelta?: boolean;
  lastDelta?: number | null;
  
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
  cooldownProgress = 0,
  showDelta = false,
  lastDelta = null,
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
    // 1. Success State
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

    // 2. Submission Loader
    if (isSubmitting) {
      return {
        bgClass: 'bg-blue-600/80 text-white shadow-none cursor-wait',
        content: <Loader2 className="w-6 h-6 animate-spin text-white/80" />
      };
    }

    // 3. Critical Errors
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

    // 4. Confirmation State
    if (pendingConfirmation) {
      return {
        bgClass: 'bg-red-600 hover:bg-red-500 hover:brightness-110 text-white shadow-red-200 hover:shadow-red-300',
        content: pendingConfirmation.message
      };
    }
    
    // 5. Owner State
    if (isOwner) {
      return {
        bgClass: 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none active:scale-100',
        content: "Your Listing"
      };
    }

    // 6. Standard States (Used even during cooldown)
    if (hasPriorBid) {
      return {
        bgClass: 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200 hover:shadow-orange-300',
        content: (
          <span className="flex items-center gap-1.5">
            <Gavel className="w-5 h-5" />
            Update Bid
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
  const isCoolingDown = cooldownRemaining > 0;

  return (
    <div id={buildId('bidding-controls')} className={`flex flex-col ${showStatus ? 'gap-1.5' : 'gap-2'} w-full relative`}>
      
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
            <AnimatePresence mode="popLayout">
              {showDelta && lastDelta !== null && (
                <motion.div
                  initial={{ opacity: 0, y: lastDelta > 0 ? 10 : -10, scale: 0.8 }}
                  animate={{ opacity: 1, y: lastDelta > 0 ? -25 : 25, scale: 1.1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  className={cn(
                    "absolute left-0 right-0 text-center font-black font-outfit pointer-events-none z-50",
                    lastDelta > 0 ? "text-emerald-500" : "text-rose-500",
                    viewMode === 'modal' ? "text-xl" : "text-base"
                  )}
                >
                  {lastDelta > 0 ? "+" : ""}{lastDelta.toLocaleString()}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.input
              id={buildId('bid-input')}
              type="text"
              value={bidAmount}
              key={`input-${animTrigger}`}
              initial={false}
              disabled={isDisabled || isQuotaReached}
              animate={{ 
                scale: [1, 1.05, 1],
                x: (error || pendingConfirmation) ? [0, -4, 4, -4, 4, 0] : 0
              }}
              transition={{ 
                scale: { duration: 0.2, ease: "easeOut" },
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
        disabled={isSuccess || isDisabled || isQuotaReached || errorMessage === "Already Bid This Amount" || isCoolingDown}
        initial={false}
        animate={{
          x: pendingConfirmation ? [0, -3, 3, -3, 3, 0] : 0,
          scale: !isCoolingDown && cooldownRemaining === 0 ? [1, 1.05, 1] : 1
        }}
        transition={{ 
          x: { duration: 0.4 },
          scale: { duration: 0.4, ease: "easeOut" }
        }}
        className={`${getInputHeight(viewMode)} w-full rounded-xl font-bold font-outfit shadow-md transition-all duration-300 active:scale-[0.98] text-[clamp(0.875rem,5cqi,1.125rem)] flex items-center justify-center relative overflow-hidden
          ${isCoolingDown ? 'bg-slate-100 shadow-none' : btnConfig.bgClass}
        `}
      >
        {/* Aero Liquid Filling Layer */}
        {isCoolingDown && (
          <motion.div
            className={cn(
              "absolute inset-0 origin-left opacity-100",
              btnConfig.bgClass.split(' ').find(c => c.startsWith('bg-')) || 'bg-blue-600'
            )}
            initial={{ scaleX: cooldownProgress }}
            animate={{ scaleX: 1 }}
            transition={{ 
              duration: cooldownRemaining, 
              ease: "linear"
            }}
          />
        )}

        <span className={cn(
          "relative z-20 transition-colors duration-300",
          isCoolingDown && "text-slate-600 drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]"
        )}>
          {isSubmitting ? (
             <Loader2 className="w-6 h-6 animate-spin text-white/80" />
          ) : (
            btnConfig.content
          )}
        </span>
      </motion.button>
    </div>
  );
});

BiddingControls.displayName = "BiddingControls";
