"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gavel, TrendingUp, Loader2, AlertTriangle } from "lucide-react";

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
  minBid?: number;
  
  // Dual-tap confirmation state
  pendingConfirmation?: { type: 'double_bid' | 'high_bid', message: string } | null;
  
  // Animation
  animTrigger: number;
  
  // Configuration
  viewMode?: BiddingViewMode;
  disabled?: boolean;
  
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
  minBid = 0,
  pendingConfirmation = null,
  animTrigger,
  viewMode = 'compact',
  disabled = false,
  onSmartAdjust,
  onBid,
  onKeyDown,
  onInputChange,
  onInputClick
}: BiddingControlsProps) => {

  // Calculate if current input is below minimum bid
  const currentNumericBid = parseFloat(bidAmount.replace(/,/g, '')) || 0;
  const isBelowMinimum = currentNumericBid < minBid;
  const isErrorState = isBelowMinimum || error;
  
  // Disabled state logic
  const isDisabled = disabled || isOwner || isSubmitting;
  
  // Determine Button Styling based on state
  const getButtonConfig = () => {
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

    // DUAL-TAP CONFIRMATION STATE - Pulsing button
    if (pendingConfirmation) {
      const isHighBidWarning = pendingConfirmation.type === 'high_bid';
      return {
        bgClass: isHighBidWarning 
          ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-200 animate-pulse'
          : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200 animate-pulse',
        content: (
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-bold">{pendingConfirmation.message}</span>
          </span>
        )
      };
    }
    
    if (isOwner) {
      return {
        bgClass: 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none active:scale-100',
        content: "Your Listing"
      };
    }

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

    if (hasPriorBid) {
      return {
        bgClass: 'bg-green-600 hover:bg-green-700 text-white shadow-green-200 hover:shadow-green-300',
        content: (
          <span className="flex items-center gap-1.5">
            <Gavel className="w-5 h-5" />
            Bid Again
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
    <div className={`flex flex-col gap-2 w-full`}>
      {/* Stepper Input Row */}
      <div className={`flex w-full ${getInputHeight(viewMode)}`}>
        <div className={`flex flex-1 border border-slate-300 rounded-xl shadow-sm overflow-hidden bg-white ${isOwner ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
          
          {/* Decrement Button */}
          <button
            onClick={(e) => onSmartAdjust(e, -1)}
            disabled={isDisabled}
            className={`${getButtonWidth(viewMode)} bg-slate-50 hover:bg-slate-100 border-r border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-600 transition-colors active:bg-slate-200 group disabled:cursor-not-allowed`}
          >
            <svg className="h-5 w-5 transition-transform group-active:scale-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 12H6" />
            </svg>
          </button>

          {/* Input */}
          <div className="relative flex-1">
            <motion.input
              type="text"
              value={bidAmount}
              key={`input-${animTrigger}`}
              initial={false}
              disabled={isDisabled}
              animate={{ 
                scale: [1, 1.15, 1],
                x: isErrorState ? [0, -4, 4, -4, 4, 0] : 0
              }}
              transition={{ 
                scale: { duration: 0.2 },
                x: { duration: 0.2 } // Shake duration
              }}
              onKeyDown={onKeyDown}
              onChange={onInputChange}
              onClick={onInputClick}
              className={`w-full h-full text-center ${getTextSize(viewMode)} font-black font-outfit text-slate-900 focus:outline-none px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors duration-300
                ${isErrorState ? 'bg-red-50 text-red-900' : 'bg-transparent'}
              `}
            />
          </div>

          {/* Increment Button */}
          <button
            onClick={(e) => onSmartAdjust(e, 1)}
            disabled={isDisabled}
            className={`${getButtonWidth(viewMode)} bg-slate-50 hover:bg-slate-100 border-l border-slate-200 flex items-center justify-center text-slate-500 hover:text-amber-600 transition-colors active:bg-slate-200 group disabled:cursor-not-allowed`}
          >
            <svg className="h-5 w-5 transition-transform group-active:scale-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v12m6-6H6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={onBid}
        disabled={isSuccess || isDisabled}
        className={`${getInputHeight(viewMode)} w-full rounded-xl font-bold font-outfit shadow-md transition-all duration-300 active:scale-[0.98] text-[clamp(0.875rem,5cqi,1.125rem)] flex items-center justify-center
          ${btnConfig.bgClass}
        `}
      >
        {isSubmitting ? (
           <Loader2 className="w-6 h-6 animate-spin text-white/80" />
        ) : (
          btnConfig.content
        )}
      </button>
    </div>
  );
});

BiddingControls.displayName = "BiddingControls";
