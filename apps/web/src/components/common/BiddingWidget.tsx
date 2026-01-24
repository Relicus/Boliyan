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
import { AlertTriangle } from "lucide-react";
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
import { BiddingControls } from "@/components/common/BiddingControls";

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



// ============================================
// COMPONENT
// ============================================

export const BiddingWidget = memo(({ 
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
    handleSmartAdjust,
    handleBid,
    pendingConfirmation,
    clearPendingConfirmation,
    handleKeyDown,
    handleInputChange,
    handleInputBlur
  } = useBidding(item, seller, onBidSuccess);

  // Adapter for Legacy Dialog Logic (if we still want the dialog)
  // The hook now supports "Double Tap" logic internally, but if we show a Dialog,
  // clicking "Yes" in the dialog calls handleBid again, which executes the bid.
  const warning = pendingConfirmation;
  const clearWarning = clearPendingConfirmation;
  const confirmBid = handleBid;

  // Check if user is the seller (can't bid on own item)
  const isOwnListing = user?.id === seller?.id;
  


  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      <div className={className}>
        <BiddingControls
          bidAmount={bidAmount}
          isSuccess={isSuccess}
          isOwner={isOwnListing}
          hasPriorBid={config.hasUserBid}
          error={!!error}
          viewMode={viewMode}
          disabled={disabled}
          idPrefix={`bidding-widget-${item.id}`}
          onSmartAdjust={handleSmartAdjust}
          onBid={handleBid}
          onKeyDown={handleKeyDown}
          onInputChange={handleInputChange}
          onInputBlur={handleInputBlur}
          onInputClick={handleInputClick}
        />
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
