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
          isHighBidder={config.isUserHighBidder}
          hasPriorBid={config.hasUserBid}
          error={error}
          minBid={config.minBid}
          animTrigger={animTrigger}
          viewMode={viewMode}
          disabled={disabled}
          onSmartAdjust={handleSmartAdjust}
          onBid={handleBid}
          onKeyDown={handleKeyDown}
          onInputChange={handleInputChange}
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

export default BiddingWidget;
