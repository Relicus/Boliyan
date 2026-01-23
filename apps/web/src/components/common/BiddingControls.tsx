"use client";

import { memo, useMemo, useState, useRef, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
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
  
  // New derived sticky status
  derivedStatus?: { type: 'error', message: string } | null;

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

// Shared Label Component to ensure 1:1 pixel alignment
const BiddingButtonLabel = ({ content, className }: { content: React.ReactNode, className?: string }) => (
  <div className={cn("absolute inset-0 flex items-center justify-center font-black font-outfit gap-1.5 whitespace-nowrap", className)}>
    {content}
  </div>
);

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

// Separate portal component for floating deltas
const FloatingDeltaPortal = ({ 
  anchorRef, 
  lastDelta, 
  showDelta, 
  animTrigger, 
  viewMode 
}: { 
  anchorRef: React.RefObject<HTMLDivElement | null>;
  lastDelta: number | null;
  showDelta: boolean;
  animTrigger: number;
  viewMode: BiddingViewMode;
}) => {
  const [position, setPosition] = useState<{ top: number, left: number, width: number } | null>(null);

  useLayoutEffect(() => {
    if (showDelta && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [showDelta, animTrigger, anchorRef]);

  if (!showDelta || lastDelta === null || !position) return null;

  return createPortal(
    <div 
      className="absolute pointer-events-none z-[9999] flex items-center justify-center"
      style={{
        top: position.top - 48, // Start slightly above input
        left: position.left,
        width: position.width,
        height: 40
      }}
    >
      <AnimatePresence mode="popLayout">
        <motion.div
          key={animTrigger}
          initial={{ opacity: 0, y: 20, scale: 0.8, rotate: lastDelta > 0 ? -10 : 10 }}
          animate={{ 
            opacity: 1, 
            y: -5, 
            scale: 1, 
            rotate: 0,
            transition: {
              type: "spring",
              stiffness: 600,
              damping: 20,
              mass: 0.8
            }
          }}
          exit={{ 
            opacity: 0, 
            y: -40, 
            scale: 0.9,
            rotate: lastDelta > 0 ? 5 : -5,
            transition: { duration: 0.3, ease: "easeOut" }
          }}
          className={cn(
            "font-black font-outfit tracking-tight",
            lastDelta > 0 ? "text-emerald-600" : "text-rose-600",
            viewMode === 'modal' ? "text-xl" : "text-lg"
          )}
          style={{ willChange: "transform, opacity" }}
        >
          {lastDelta > 0 ? "+" : ""}{lastDelta.toLocaleString()}
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  );
};

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
  derivedStatus = null,
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
  const isQuotaReached = remainingAttempts === 0;
  
  // Disabled state logic
  const isDisabled = disabled || isOwner || isSubmitting;

  const isCoolingDown = cooldownRemaining > 0 && !isQuotaReached && !isSuccess;
  
  const inputContainerRef = useRef<HTMLDivElement>(null);

  // High-precision remaining seconds for the animation duration
  const { lastBidTimestamp, now } = useApp();
  const preciseRemaining = useMemo(() => {
    if (!lastBidTimestamp) return 0;
    return Math.max(0, (lastBidTimestamp + 15000 - now) / 1000);
  }, [lastBidTimestamp, now]);
  
  // Determine Button Styling based on state
  const btnConfig = useMemo(() => {
    // 1. Success State
    if (isSuccess) {
      return { 
        bgClass: 'bg-amber-600',
        textClass: 'text-white',
        content: (
          <span className="flex items-center gap-2">
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
        bgClass: 'bg-blue-600/80',
        textClass: 'text-white/80',
        content: <Loader2 className="w-6 h-6 animate-spin" />
      };
    }

    // 3. Critical Errors - SHOW INSIDE BUTTON NOW
    // Sticky Derived Status (Indefinite) has priority over general messages
    if (derivedStatus) {
      return {
        bgClass: 'bg-slate-100 cursor-not-allowed shadow-none border border-slate-200',
        textClass: 'text-slate-400 font-medium',
        content: (
          <span className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 opacity-70" />
            {derivedStatus.message}
          </span>
        )
      };
    }

    if (errorMessage) {
      // Mapping for specific error messages to ensure max 2-3 words
      const shortError = (() => {
        if (errorMessage === "Out of Bids" || isQuotaReached) return "Out of Bids";
        if (errorMessage === "Already Bid This Amount") return "Already Bid";
        if (errorMessage === "Already Offered") return "Already Offered";
        if (errorMessage === "Higher Bid Required") return "Bid Higher";
        if (errorMessage === "Minimum Bid Reached") return "Min Bid Reached";
        if (errorMessage === "Maximum Limit Reached") return "Max Reached";
        if (errorMessage === "Below Minimum") return "Below Min";
        if (errorMessage === "Above Maximum") return "Above Max";
        if (errorMessage.includes("Wait")) return "Cooldown Active";
        return errorMessage; // Fallback (assume mostly short)
      })();

      return {
        bgClass: 'bg-slate-100 cursor-not-allowed shadow-none border border-slate-200',
        textClass: 'text-slate-400 font-medium',
        content: (
          <span className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 opacity-70" />
            {shortError}
          </span>
        )
      };
    }

    // 4. Confirmation State
    if (pendingConfirmation) {
      return {
        bgClass: 'bg-red-600 hover:bg-red-500 hover:brightness-110',
        textClass: 'text-white',
        content: pendingConfirmation.message // "Confirm?" is already short
      };
    }
    
    // 5. Owner State
    if (isOwner) {
      return {
        bgClass: 'bg-slate-100',
        textClass: 'text-slate-900',
        content: "Your Listing"
      };
    }

    // 6. Standard States
    if (hasPriorBid) {
      return {
        bgClass: 'bg-orange-500 hover:bg-orange-600',
        textClass: 'text-white',
        content: (
          <>
            <Gavel className="w-5 h-5" />
            Update Bid
          </>
        )
      };
    }

    return {
      bgClass: 'bg-blue-600 hover:bg-blue-700',
      textClass: 'text-white',
      content: (
        <>
          <Gavel className="w-5 h-5" />
          Place Bid
        </>
      )
    };
  }, [isSuccess, isSubmitting, errorMessage, isQuotaReached, pendingConfirmation, isOwner, hasPriorBid]);

  // Hex color mapping for beautiful Framer Motion interpolation
  const getTargetHex = () => {
    if (isSuccess) return '#d97706'; // bg-amber-600
    if (derivedStatus || errorMessage) return '#f1f5f9'; // bg-slate-100 (Disabled/Error)
    if (pendingConfirmation) return '#dc2626'; // bg-red-600 (Confirm is action)
    if (isOwner) return '#f1f5f9'; // bg-slate-100
    if (hasPriorBid) return '#f97316'; // bg-orange-500
    return '#2563eb'; // bg-blue-600
  };

  return (
    <div id={buildId('bidding-controls')} className={cn("flex flex-col w-full relative", showStatus ? 'gap-1.5' : 'gap-1.5')}>
      
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
      <div className={`flex w-full ${getInputHeight(viewMode)} relative`} ref={inputContainerRef}>
        <FloatingDeltaPortal 
          anchorRef={inputContainerRef}
          lastDelta={lastDelta}
          showDelta={!!showDelta}
          animTrigger={animTrigger}
          viewMode={viewMode}
        />

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
              initial={false}
              disabled={isDisabled || isQuotaReached}
              animate={{ 
                x: (error || pendingConfirmation) ? [0, -4, 4, -4, 4, 0] : 0
              }}
              transition={{ 
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

      {/* Action Button Foundation (L0) */}
      <motion.button
        id={buildId('place-bid-btn')}
        onClick={onBid}
        disabled={isDisabled || isQuotaReached || isCoolingDown || isSuccess}
        initial={false}
        animate={{
          x: pendingConfirmation ? [0, -3, 3, -3, 3, 0] : 0,
          scale: !isCoolingDown && preciseRemaining <= 0.05 && preciseRemaining > -0.5 ? [1, 1.18, 1] : 1,
          backgroundColor: isCoolingDown ? '#FFFFFF' : getTargetHex(),
        }}
        transition={{ 
          x: { duration: 0.4 },
          scale: { duration: 0.4, ease: [0.175, 0.885, 0.32, 1.275] },
          backgroundColor: { duration: 0.2, ease: "easeInOut" }
        }}
        className={cn(
          getInputHeight(viewMode),
          "w-full rounded-xl font-bold font-outfit shadow-md active:scale-[0.98] text-[clamp(0.875rem,5cqi,1.125rem)] flex items-center justify-center relative overflow-hidden",
          isCoolingDown ? "shadow-none border border-slate-200" : ""
        )}
      >
        {/* Active State Label (Revealed after handoff) */}
        <BiddingButtonLabel 
          content={isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : btnConfig.content}
          className={cn(btnConfig.textClass, "transition-colors duration-200")}
        />

        {/* COOLDOWN LAYERS (Sliding Window Handoff) */}
        <AnimatePresence>
          {isCoolingDown && (
            <motion.div 
              key="cooldown-overlay-container"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.05 }}
              className="absolute inset-0 z-50 pointer-events-none"
            >
               {/* Under-Layer (White Base) */}
               <div className="absolute inset-0 bg-white">
                  <BiddingButtonLabel 
                    content={btnConfig.content} 
                    className="text-black" 
                  />
               </div>

               {/* Over-Layer (Black Fill Window - using clip-path to prevent distortion) */}
               <motion.div 
                  className="absolute inset-0 bg-black"
                  initial={{ clipPath: `inset(0 ${100 - (cooldownProgress * 100)}% 0 0)` }}
                  animate={{ clipPath: 'inset(0 0% 0 0)' }}
                  transition={{ duration: preciseRemaining, ease: "linear" }}
                >
                  <BiddingButtonLabel 
                    content={btnConfig.content} 
                    className="text-white" 
                  />
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
});

BiddingControls.displayName = "BiddingControls";
