"use client";

import { motion } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import { Item, User } from "@/types";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";

import { toast } from "sonner";
import { useApp } from "@/lib/store";
import { useBidding } from "@/hooks/useBidding";
import { calculatePrivacySafeDistance } from "@/lib/utils";

import { ProductGallery } from "./product-modal/ProductGallery";
import { ProductInfo } from "./product-modal/ProductInfo";
import { BiddingDashboard } from "./product-modal/BiddingDashboard";
import { FullscreenGallery } from "./product-modal/FullscreenGallery";

interface ProductDetailsModalProps {
  item: Item;
  seller: User;
  isOpen: boolean;
  onClose: (open: boolean) => void;
}

export default function ProductDetailsModal({ item, seller, isOpen, onClose }: ProductDetailsModalProps) {
  const { user, bids, toggleWatch, watchedItemIds } = useApp();
  const isWatched = watchedItemIds.includes(item.id);


  // Hook for encapsulated bidding logic
  const {
    bidAmount,
    setBidAmount,
    error,
    errorMessage,
    isSuccess,
    pendingConfirmation,
    // isSubmitting removed as it is not returned by useBidding
    animTrigger,
    handleSmartAdjust,
    handleBid,
    handleKeyDown,
    handleInputChange,
    getSmartStep,
    remainingAttempts,
    userBid,
    initialBid,
    isSubmitting,
    cooldownRemaining
  } = useBidding(item, seller); // Removed auto-close callback

  const [currentImg, setCurrentImg] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const isHighBidder = item.isPublicBid && item.currentHighBidderId === user?.id;
  const hasPriorBid = user && bids.some(b => b.itemId === item.id && b.bidderId === user.id);

  // Sync bid amount when modal opens or initialBid changes (Smart Anchor)
  useEffect(() => {
    if (isOpen && initialBid) {
        setBidAmount(initialBid.toLocaleString());
    }
  }, [isOpen, initialBid, setBidAmount]);

  // Toast Notification on Success
  useEffect(() => {
    if (isSuccess) {
      toast.success("Bid placed successfully!", {
        description: (
          <span className="block mt-1">
            You placed a bid of <span className="font-bold text-emerald-600">{bidAmount}</span> on <span className="font-semibold text-blue-600">{item.title}</span>
          </span>
        )
      });
    }
  }, [isSuccess, bidAmount, item.title]);

  // Safe Privacy-Preserving Distance Calculation
  const { distance, duration, isOutside } = useMemo(() => {
    // Distance Logic - Needs User
    if (!user) {
        return { 
            distance: 0, 
            duration: 0, 
            isOutside: false
        };
    }

    const { distance: dist, duration: dur, isOutside: outside } = calculatePrivacySafeDistance(user.location, seller.location);

    return { 
      distance: dist, 
      duration: dur, 
      isOutside: outside
    };
  }, [user, seller.location]);


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="w-[94vw] max-w-[94vw] max-h-[92vh] overflow-y-auto md:w-[920px] md:max-w-[920px] lg:w-[1000px] lg:max-w-[1000px] md:h-[88vh] md:max-h-[88vh] p-0 pr-0 bg-white border-none shadow-2xl rounded-2xl">
        <DialogTitle className="sr-only">{item.title}</DialogTitle>
        <DialogClose 
          id={`close-listing-btn-${item.id}`}

          className="absolute right-4 top-4 z-[50] p-2 bg-white/85 hover:bg-white text-slate-700 hover:text-red-500 rounded-full shadow-lg transition-all active:scale-90"
        >
          <X className="h-5 w-5" />
        </DialogClose>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col h-auto min-h-full md:h-full md:overflow-hidden"
        >
          {/* Top Section: Dynamic Gallery */}
          <ProductGallery 
            item={item}
            currentImg={currentImg}
            setCurrentImg={setCurrentImg}
            setShowFullscreen={setShowFullscreen}
            isWatched={isWatched}
            onToggleWatch={toggleWatch}
          />


          {/* Bottom Section: Product Details & Bidding */}
          <div id={`product-details-body-${item.id}`} className="flex-none md:flex-1 flex flex-col p-4 sm:p-6 pb-6 sm:pb-8 bg-white relative z-10 md:overflow-y-auto">
            <div id={`product-details-grid-${item.id}`} className="grid gap-4 sm:gap-5 md:gap-6 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] w-full">
              
              {/* Left Column: Info */}
              <ProductInfo 
                item={item}
                seller={seller}
                isOutside={isOutside}
                duration={duration}
                distance={distance}
              />

              {/* Right Column: Dashboard */}
              <div id={`product-details-right-${item.id}`} className="h-full min-w-0">
                  <BiddingDashboard 
                    item={item}
                    user={user}
                    seller={seller}
                    bidAmount={bidAmount}
                    userCurrentBid={userBid?.amount}
                    isHighBidder={isHighBidder}
                    hasPriorBid={!!hasPriorBid}
                    isSuccess={isSuccess}
                    isSubmitting={isSubmitting}
                    cooldownRemaining={cooldownRemaining}
                    error={error}
                    errorMessage={errorMessage}
                    remainingAttempts={remainingAttempts}
                    pendingConfirmation={pendingConfirmation}
                    animTrigger={animTrigger}
                    isWatched={isWatched}
                    onToggleWatch={toggleWatch}
                    onSmartAdjust={handleSmartAdjust}
                    onBid={handleBid}
                    onKeyDown={handleKeyDown}
                    onInputChange={handleInputChange}
                    getSmartStep={getSmartStep}
                  />
              </div>

            </div>
          </div>
        </motion.div>
      </DialogContent>

      <FullscreenGallery 
        isOpen={showFullscreen}
        onOpenChange={setShowFullscreen}
        item={item}
        currentImg={currentImg}
        setCurrentImg={setCurrentImg}
      />
    </Dialog>
  );
}
