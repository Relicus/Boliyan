"use client";

import { memo, useMemo, useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Gavel, HatGlasses, AlertCircle, Edit } from "lucide-react";
import { MAX_BID_ATTEMPTS } from "@/lib/bidding";
import RollingPrice from "./RollingPrice";
import { BoliyanUrduMark } from "@/components/branding/BoliyanLogo";
import { BoliyanLogomarkLoader } from "@/components/branding/BoliyanLogomarkLoader";

export type BiddingViewMode = 'compact' | 'comfortable' | 'spacious' | 'modal';

interface BiddingControlsProps {
  // Data
  bidAmount: string;
  isSuccess: boolean;
  isOwner: boolean;
  hasPriorBid: boolean;
  isSubmitting?: boolean;
  error?: boolean;
  errorMessage?: string | null;
  remainingAttempts?: number;
  userCurrentBid?: number;
  cooldownRemaining?: number;
  
  // New derived sticky status
  derivedStatus?: { type: 'error', message: string } | null;

  // Dual-tap confirmation state
  pendingConfirmation?: { type: 'double_bid' | 'high_bid' | 'out_of_bids' | 'confirm_bid', message: string } | null;
  
  // Configuration
  viewMode?: BiddingViewMode;
  disabled?: boolean;
  idPrefix: string;
  showAttemptsDots?: boolean;
  showStatus?: boolean;
  itemId?: string; // Need Item ID for edit navigation
  darkMode?: boolean; // For hidden bidding dark theme
  isSecretBid?: boolean;
  
  // Handlers
  onSmartAdjust: (e: React.MouseEvent, direction: -1 | 1) => void;
  onBid: (e: React.MouseEvent) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onInputBlur?: () => void;
  onInputClick?: (e: React.MouseEvent) => void;
}

// Centralized Theme Configuration
type ButtonTheme = 'active' | 'success' | 'inactive' | 'danger' | 'warning' | 'neutral';

const BUTTON_THEMES: Record<ButtonTheme, { classes: string; bgHex: string; hoverHex?: string; textClass: string }> = {
  active: {
    classes: 'text-white', // Removed hover:bg class to use Framer Motion gesture
    bgHex: '#2563eb', // bg-blue-600
    hoverHex: '#1d4ed8', // bg-blue-700
    textClass: 'text-white'
  },
  success: {
    classes: 'text-white',
    bgHex: '#d97706', // bg-amber-600
    hoverHex: '#b45309', // bg-amber-700
    textClass: 'text-white'
  },
  inactive: {
    classes: 'bg-slate-100 cursor-not-allowed shadow-none border border-slate-200 text-slate-400 font-medium',
    bgHex: '#f1f5f9', // bg-slate-100
    textClass: 'text-slate-400 font-medium'
  },
  danger: {
    classes: 'text-white',
    bgHex: '#dc2626', // bg-red-600
    hoverHex: '#b91c1c', // bg-red-700
    textClass: 'text-white'
  },
  warning: {
    classes: 'text-white',
    bgHex: '#f97316', // bg-orange-500
    hoverHex: '#ea580c', // bg-orange-600
    textClass: 'text-white'
  },
  neutral: {
    classes: 'bg-slate-100 text-slate-900',
    bgHex: '#f1f5f9', // bg-slate-100
    textClass: 'text-slate-900'
  }
};

// Reusable Content Component
const BiddingButtonContent = ({ 
  icon: Icon, 
  text, 
  className 
}: { 
  icon?: React.ElementType; 
  text: React.ReactNode; 
  className?: string 
}) => (
  <span className={cn("flex items-center gap-1.5", className)}>
    {Icon && <Icon className={cn("w-4 h-4 md:w-5 md:h-5", className?.includes('opacity') ? "" : "shrink-0")} />}
    {text}
  </span>
);

// Re-add Label Component that was accidentally removed but is still used
const BiddingButtonLabel = ({ content, className }: { content: React.ReactNode, className?: string }) => (
  <div className={cn("absolute inset-0 flex items-center justify-center font-black font-outfit gap-1.5 whitespace-nowrap", className)}>
    {content}
  </div>
);

// Pyramid Beads Component - displays remaining attempts in a pyramid (2 top, 3 bottom)
const PyramidBeads = ({ remaining, darkMode = false }: { remaining: number; darkMode?: boolean }) => {
  // Pyramid layout: [0,1] top row, [2,3,4] bottom row
  // Depletion order: Top-Right (1) -> Top-Left (0) -> Bot-Right (4) -> Bot-Mid (3) -> Bot-Left (2)
  const beadActive = (index: number) => {
    const used = 5 - remaining;
    // Lower priority means it depletes sooner
    const priorityMap: Record<number, number> = {
      1: 0, // Top Right (Dies 1st)
      0: 1, // Top Left (Dies 2nd)
      4: 2, // Bot Right (Dies 3rd)
      3: 3, // Bot Mid   (Dies 4th)
      2: 4  // Bot Left  (Dies 5th)
    };
    // Alive if priority >= used count
    return priorityMap[index] >= used;
  };
  
  const beadClass = (active: boolean) => cn(
    "h-1.5 w-1.5 rounded-full transition-all duration-300 shrink-0",
    active 
      ? (darkMode ? "bg-white/70" : "bg-white/80")
      : (darkMode ? "bg-white/20" : "bg-white/30")
  );
  
  return (
    <div className="flex flex-col items-center gap-0.5 ml-2">
      {/* Top row: 2 beads */}
      <div className="flex gap-1">
        <div className={beadClass(beadActive(0))} />
        <div className={beadClass(beadActive(1))} />
      </div>
      {/* Bottom row: 3 beads */}
      <div className="flex gap-1">
        <div className={beadClass(beadActive(2))} />
        <div className={beadClass(beadActive(3))} />
        <div className={beadClass(beadActive(4))} />
      </div>
    </div>
  );
};

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

// Gap between stepper and button (viewMode-aware)
function getGapClass(viewMode: BiddingViewMode): string {
  switch (viewMode) {
    case 'modal': return 'gap-3';     // More breathing room
    case 'spacious': return 'gap-2.5';
    default: return 'gap-1.5';        // Compact for ItemCards
  }
}

export const BiddingControls = memo(({
  bidAmount,
  isSuccess,
  isOwner,
  hasPriorBid,
  isSubmitting = false,
  error = false,
  errorMessage = null,
  remainingAttempts = MAX_BID_ATTEMPTS,
  cooldownRemaining = 0,
  derivedStatus = null,
  pendingConfirmation = null,
  viewMode = 'compact',
  disabled = false,
  idPrefix,
  onSmartAdjust,
  onBid,
  onKeyDown,
  onInputChange,
  onInputBlur,
  onInputClick,
  itemId,
  darkMode = false,
  isSecretBid = false
}: BiddingControlsProps) => {

  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);
  const numericBid = parseFloat(bidAmount.replace(/[^0-9.-]+/g, '')) || 0;
  const buildId = useCallback((suffix: string) => `${idPrefix}-${suffix}`, [idPrefix]);
  const isQuotaReached = remainingAttempts === 0;
  
  // Disabled state logic
  const isDisabled = disabled || (isOwner && !itemId) || isSubmitting;

  const isCoolingDown = cooldownRemaining > 0 && !isQuotaReached && !isSuccess;
  
  // Long Press Logic
  const longPressRef = useRef<{ timeout: NodeJS.Timeout | null, interval: NodeJS.Timeout | null }>({ timeout: null, interval: null });

  const handleStartLongPress = (e: React.PointerEvent | React.MouseEvent, direction: -1 | 1) => {
    // Prevent default context menu and other gestures
    // e.preventDefault(); 
    
    // Clear any existing timers just in case
    handleStopLongPress();

    // Trigger immediate action
    onSmartAdjust(e as React.MouseEvent, direction);

    // Start delay timer for auto-repeat
    longPressRef.current.timeout = setTimeout(() => {
      longPressRef.current.interval = setInterval(() => {
        // Pass a dummy event since onSmartAdjust requires one but only uses stopPropagation
        onSmartAdjust({ stopPropagation: () => {} } as React.MouseEvent, direction);
      }, 100); // Speed: 100ms interval
    }, 500); // Delay: 500ms before repeat starts
  };

  const handleStopLongPress = () => {
    if (longPressRef.current.timeout) clearTimeout(longPressRef.current.timeout);
    if (longPressRef.current.interval) clearInterval(longPressRef.current.interval);
    longPressRef.current = { timeout: null, interval: null };
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (itemId) {
      router.push(`/list?id=${itemId}`);
    }
  };

  const inputContainerRef = useRef<HTMLDivElement>(null);

  // Remove high-precision heartbeat dependency for performance
  const [justFinishedCooldown, setJustFinishedCooldown] = useState(false);

  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setTimeout(() => {
        setJustFinishedCooldown(true);
        setTimeout(() => setJustFinishedCooldown(false), 800);
      }, cooldownRemaining * 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownRemaining]);
  
  const { theme, content } = useMemo(() => {
    const actionIcon = isSecretBid ? HatGlasses : Gavel;
    // 1. Success State
    if (isSuccess) {
      return { 
        theme: 'success' as ButtonTheme,
        content: (
          <span id={buildId('success-msg')} className="flex items-center gap-2">
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
        theme: 'active' as ButtonTheme, // Blue base
        content: <BoliyanLogomarkLoader className="text-white" />
      };
    }

    // 3. Critical Errors (Sticky Derived Status)
    if (derivedStatus) {
      return {
        theme: 'inactive' as ButtonTheme,
        content: <BiddingButtonContent icon={AlertCircle} text={derivedStatus.message} className="opacity-70" />
      };
    }

    // 4. Standard Errors
    if (errorMessage) {
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
        return errorMessage; 
      })();

      return {
        theme: 'inactive' as ButtonTheme,
        content: <BiddingButtonContent icon={AlertCircle} text={shortError} className="opacity-70" />
      };
    }

    // 5. Confirmation State
    if (pendingConfirmation) {
      return {
        theme: 'danger' as ButtonTheme,
        content: pendingConfirmation.message
      };
    }
    
    // 6. Owner State
    if (isOwner) {
      return {
        theme: 'neutral' as ButtonTheme,
        content: <BiddingButtonContent icon={Edit} text="Edit Listing" />
      };
    }

    // 7. Standard States
    if (hasPriorBid) {
      return {
        theme: 'warning' as ButtonTheme,
        content: <BiddingButtonContent icon={actionIcon} text="Update Bid" />
      };
    }

    return {
      theme: 'active' as ButtonTheme,
      content: <BiddingButtonContent icon={actionIcon} text="Place Bid" />
    };
  }, [isSuccess, isSubmitting, errorMessage, isQuotaReached, derivedStatus, pendingConfirmation, isOwner, hasPriorBid, isSecretBid, buildId]);

  // Derived styles from centralized config
  const activeTheme = BUTTON_THEMES[theme];

  return (
    <div id={buildId('bidding-controls')} className={cn("flex flex-col w-full relative", getGapClass(viewMode))}>
      
      {/* Beads now integrated into the button - see PyramidBeads component */}

      {/* Stepper Input Row */}
      <div className={`flex w-full ${getInputHeight(viewMode)} relative`} ref={inputContainerRef}>
        <div className={cn(
          "flex flex-1 rounded-xl shadow-sm overflow-hidden transition-colors duration-300",
          (error || derivedStatus?.type === 'error') 
            ? (darkMode ? "border-red-500 bg-red-900/20" : "border-red-400 bg-red-50")
            : (darkMode ? "border-slate-600 bg-slate-800" : "border-slate-300 bg-white"),
          (isOwner || isQuotaReached) && 'opacity-50 grayscale pointer-events-none'
        )}>
          
          {/* Decrement Button */}
          <button
            id={buildId('decrement-btn')}
            onPointerDown={(e) => handleStartLongPress(e, -1)}
            onPointerUp={handleStopLongPress}
            onPointerLeave={handleStopLongPress}
            onContextMenu={(e) => e.preventDefault()}
            disabled={isDisabled || isQuotaReached}
            className={cn(
              getButtonWidth(viewMode),
              "flex items-center justify-center transition-colors group disabled:cursor-not-allowed",
              darkMode 
                ? "bg-slate-700 hover:bg-slate-600 border-r border-slate-600 text-slate-300 hover:text-red-400 active:bg-slate-500" 
                : "bg-slate-50 hover:bg-slate-100 border-r border-slate-200 text-slate-500 hover:text-red-600 active:bg-slate-200"
            )}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setIsFocused(false);
                if (onInputBlur) onInputBlur();
              }}
              onKeyDown={onKeyDown}
              onChange={onInputChange}
              onClick={onInputClick}
              className={cn(
                `w-full h-full text-center ${getTextSize(viewMode)} font-black font-outfit focus:outline-none px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors duration-300`,
                darkMode ? "text-white" : "text-slate-900",
                (error || derivedStatus?.type === 'error') ? (darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-50 text-red-900') : 'bg-transparent',
                isFocused ? 'opacity-100' : 'opacity-0'
              )}
            />
             {!isFocused && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <RollingPrice price={numericBid} className={cn(getTextSize(viewMode), "font-black font-outfit", darkMode ? "text-white" : "text-slate-900")} />
              </div>
            )}
          </div>

          {/* Increment Button */}
          <button
            id={buildId('increment-btn')}
            onPointerDown={(e) => handleStartLongPress(e, 1)}
            onPointerUp={handleStopLongPress}
            onPointerLeave={handleStopLongPress}
            onContextMenu={(e) => e.preventDefault()}
            disabled={isDisabled || isQuotaReached}
            className={cn(
              getButtonWidth(viewMode),
              "flex items-center justify-center transition-colors group disabled:cursor-not-allowed",
              darkMode 
                ? "bg-slate-700 hover:bg-slate-600 border-l border-slate-600 text-slate-300 hover:text-amber-400 active:bg-slate-500" 
                : "bg-slate-50 hover:bg-slate-100 border-l border-slate-200 text-slate-500 hover:text-amber-600 active:bg-slate-200"
            )}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v12m6-6H6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Action Button Foundation (L0) */}
      <motion.button
        id={buildId('place-bid-btn')}
        onClick={isOwner ? handleEditClick : onBid}
        disabled={isDisabled || isQuotaReached || isCoolingDown || isSuccess}
        initial={false}
        animate={{
          x: pendingConfirmation ? [0, -3, 3, -3, 3, 0] : 0,
          scale: justFinishedCooldown ? [1, 1.18, 1] : 1,
          backgroundColor: isCoolingDown ? '#f8fafc' : activeTheme.bgHex, // Use slate-50 when cooling down
        }}
        whileHover={(!isDisabled && !isQuotaReached && !isCoolingDown && !isSuccess && activeTheme.hoverHex) ? {
          backgroundColor: activeTheme.hoverHex,
          transition: { duration: 0.2 }
        } : {}}
        whileTap={(!isDisabled && !isQuotaReached && !isCoolingDown && !isSuccess) ? { 
          scaleY: 0.96,
          transition: { duration: 0.1 }
        } : {}}
        transition={{ 
          x: { duration: 0.4 },
          scale: { duration: 0.4, ease: [0.175, 0.885, 0.32, 1.275] },
          backgroundColor: { duration: 0.2, ease: "easeInOut" }
        }}
        className={cn(
          getInputHeight(viewMode),
          "w-full rounded-xl font-bold font-outfit shadow-md text-[clamp(0.875rem,5cqi,1.125rem)] flex items-center justify-center relative transition-colors duration-200 z-20",
          activeTheme.classes,
          isCoolingDown ? "shadow-none border border-slate-200 cursor-not-allowed" : ""
        )}
      >
        {isCoolingDown ? (
          <div className="flex items-center justify-center opacity-60">
             <BoliyanUrduMark className="text-xl text-slate-400" />
          </div>
        ) : (
          <BiddingButtonLabel 
            content={
              <>
                {content}
                {!isOwner && !isSuccess && !isQuotaReached && (
                  <PyramidBeads remaining={remainingAttempts} darkMode={darkMode} />
                )}
              </>
            }
            className={cn(activeTheme.textClass, "transition-colors duration-200")}
          />
        )}
      </motion.button>
    </div>
  );
});

BiddingControls.displayName = "BiddingControls";
