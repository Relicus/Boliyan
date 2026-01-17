"use client";

/**
 * BiddingWidget - Single Source of Truth for Bidding UI
 * 
 * This component handles all bidding interactions consistently across:
 * - ItemCard (compact, comfortable, spacious views)
 * - ProductDetailsModal
 * - Product page
 * 
 * It uses the useBidding hook for state management and renders
 * the stepper, input, and button with proper variant styling.
 */

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gavel, TrendingUp, Lock, AlertTriangle } from "lucide-react";
import { Item, User } from "@/types";
import { BiddingConfig, BiddingViewMode, createBiddingConfig } from "@/types/bidding";
import { useBidding } from "@/hooks/useBidding";
import { useApp } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// ============================================
// PROPS
// ============================================

interface BiddingWidgetProps {
  item: Item;
  seller: User;
  viewMode?: BiddingViewMode;
  onBidSuccess?: () => void;
  disabled?: boolean;
  className?: string;
}

// ============================================
// SIZE HELPERS
// ============================================

function getInputHeight(viewMode: BiddingViewMode): string {
  switch (viewMode) {
    case 'modal': return 'h-12';
    case 'spacious': return 'h-10';
    default: return 'h-9';
  }
}

function getButtonWidth(viewMode: BiddingViewMode): string {
  switch (viewMode) {
    case 'modal': return 'w-14';
    case 'spacious': return 'w-12';
    default: return 'w-10';
  }
}

function getTextSize(viewMode: BiddingViewMode): string {
  switch (viewMode) {
    case 'modal': return 'text-base';
    case 'spacious': return 'text-sm';
    default: return 'text-sm';
  }
}

function getDeltaSize(viewMode: BiddingViewMode): string {
  switch (viewMode) {
    case 'modal': return 'text-lg';
    case 'spacious': return 'text-base';
    default: return 'text-sm';
  }
}

function getDeltaOffset(viewMode: BiddingViewMode): number {
  switch (viewMode) {
    case 'modal': return -50;
    case 'spacious': return -45;
    default: return -40;
  }
}

// ============================================
// COMPONENT
// ============================================

const BiddingWidget = memo(({ 
  item, 
  seller, 
  viewMode = 'compact',
  onBidSuccess,
  disabled = false,
  className = ''
}: BiddingWidgetProps) => {
  const { user, bids } = useApp();
  
  // Derive bidding config from item
  const config: BiddingConfig = createBiddingConfig(item, user, bids);
  
  // Use centralized bidding hook
  const {
    bidAmount,
    error,
    isSuccess,
    animTrigger,
    lastDelta,
    showDelta,
    handleSmartAdjust,
    handleBid,
    confirmBid,
    clearWarning,
    warning,
    handleKeyDown,
    handleInputChange,
    getSmartStep
  } = useBidding(item, seller, onBidSuccess);

  // Check if user is the seller (can't bid on own item)
  const isOwnListing = user?.id === seller?.id;
  const isDisabled = disabled || isOwnListing;
  
  // Determine button state and styling
  const getButtonState = () => {
    if (isSuccess) {
      return { 
        bgClass: 'bg-amber-600 text-white scale-105', 
        label: 'Bid Placed!',
        icon: null
      };
    }
    if (isOwnListing) {
      return { 
        bgClass: 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none', 
        label: 'Your Listing',
        icon: null
      };
    }
    
    if (config.variant === 'public') {
      if (config.isUserHighBidder) {
        return { 
          bgClass: 'bg-orange-500 hover:bg-orange-600 text-white', 
          label: 'Raise Bid',
          icon: <TrendingUp className="w-4 h-4" />
        };
      }
      if (config.hasUserBid) {
        return { 
          bgClass: 'bg-green-600 hover:bg-green-700 text-white', 
          label: 'Bid Again',
          icon: <Gavel className="w-4 h-4" />
        };
      }
    } else {
      // Secret variant
      if (config.hasUserBid) {
        return { 
          bgClass: 'bg-amber-600 hover:bg-amber-700 text-white', 
          label: 'Update Bid',
          icon: <Lock className="w-4 h-4" />
        };
      }
    }
    
    return { 
      bgClass: 'bg-blue-600 hover:bg-blue-700 text-white', 
      label: 'Place Bid',
      icon: <Gavel className="w-4 h-4" />
    };
  };

  const buttonState = getButtonState();
  
  // Calculate if current input is below minimum bid
  const currentNumericBid = parseFloat(bidAmount.replace(/,/g, '')) || 0;
  const isBelowMinimum = currentNumericBid < config.minBid;

  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      <div className={`flex flex-col gap-2 ${className}`}>
        {/* Stepper Input Row */}
        <div className={`flex w-full ${getInputHeight(viewMode)}`}>
          <div className={`flex flex-1 border border-slate-300 rounded-md shadow-sm overflow-hidden ${isDisabled ? 'opacity-50 bg-slate-100 grayscale' : ''}`}>
            {/* Decrement Button */}
            <button
              id={`bidding-widget-${item.id}-decrement-btn`}
              onClick={(e) => handleSmartAdjust(e, -1)}
              disabled={isDisabled}
              className={`${getButtonWidth(viewMode)} bg-slate-50 hover:bg-slate-100 border-r border-slate-200 flex items-center justify-center text-slate-600 hover:text-red-600 transition-colors active:bg-slate-200 disabled:cursor-not-allowed disabled:active:bg-slate-50`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M18 12H6" />
              </svg>
            </button>

            {/* Input */}
            <div className="relative flex-1">
              <AnimatePresence>
                {showDelta && lastDelta !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.5 }}
                    animate={{ opacity: 1, y: getDeltaOffset(viewMode), scale: viewMode === 'modal' ? 1.4 : 1.2 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`absolute left-1/2 -translate-x-1/2 font-black ${getDeltaSize(viewMode)} z-50 pointer-events-none drop-shadow-md
                      ${lastDelta > 0 ? 'text-amber-600' : 'text-red-600'}`}
                  >
                    {lastDelta > 0 ? `+${lastDelta.toLocaleString()}` : lastDelta.toLocaleString()}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.input
                id={`bidding-widget-${item.id}-bid-input`}
                type="text"
                value={bidAmount}
                key={`input-${animTrigger}`}
                initial={false}
                disabled={isDisabled}
                animate={{  
                  scale: [1, 1.05, 1],
                  x: isBelowMinimum ? [0, -2, 2, -2, 2, 0] : 0
                }}
                transition={{ duration: 0.2 }}
                onClick={handleInputClick}
                onKeyDown={handleKeyDown}
                onChange={handleInputChange}
                className={`w-full h-full text-center ${getTextSize(viewMode)} font-bold text-slate-900 focus:outline-none px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors duration-300 disabled:bg-transparent disabled:text-slate-500 disabled:cursor-not-allowed
                  ${isBelowMinimum ? 'bg-red-50 text-red-900' : 'bg-white'}`}
              />
            </div>

            {/* Increment Button */}
            <button
              id={`bidding-widget-${item.id}-increment-btn`}
              onClick={(e) => handleSmartAdjust(e, 1)}
              disabled={isDisabled}
              className={`${getButtonWidth(viewMode)} bg-slate-50 hover:bg-slate-100 border-l border-slate-200 flex items-center justify-center text-slate-600 hover:text-amber-600 transition-colors active:bg-slate-200 disabled:cursor-not-allowed disabled:active:bg-slate-50`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v12m6-6H6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Bid Button */}
        <button
          id={`bidding-widget-${item.id}-place-bid-btn`}
          onClick={handleBid}
          disabled={isSuccess || isDisabled}
          className={`w-full ${getInputHeight(viewMode)} rounded-md flex items-center justify-center shadow-sm transition-all duration-300 active:scale-95 font-bold ${getTextSize(viewMode)} tracking-wide
            ${buttonState.bgClass}
            ${isDisabled ? 'active:scale-100' : ''}`}
        >
          {isSuccess ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              Bid Placed!
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              {buttonState.icon}
              {buttonState.label}
            </span>
          )}
        </button>
      </div>

      {/* Warning Dialog */}
      <Dialog open={!!warning} onOpenChange={(open: boolean) => !open && clearWarning()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Confirm Your Bid
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              {warning?.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" onClick={clearWarning}>Cancel</Button>
            </DialogClose>
            <Button 
              onClick={confirmBid}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Yes, Place Bid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

BiddingWidget.displayName = 'BiddingWidget';

export default BiddingWidget;
