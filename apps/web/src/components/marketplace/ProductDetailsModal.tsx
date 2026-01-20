"use client";

import { motion } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import { Item, User } from "@/types";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
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
  const { user, bids, toggleWatch, watchedItemIds, now } = useApp();
  const isWatched = watchedItemIds.includes(item.id);

  // Hook for encapsulated bidding logic
  const {
    bidAmount,
    setBidAmount,
    error,
    isSuccess,
    // isSubmitting removed as it is not returned by useBidding
    animTrigger,
    lastDelta,
    showDelta,
    handleSmartAdjust,
    handleBid,
    handleKeyDown,
    handleInputChange,
    getSmartStep
  } = useBidding(item, seller, () => onClose(false));

  const [currentImg, setCurrentImg] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const isHighBidder = item.isPublicBid && item.currentHighBidderId === user?.id;
  const hasPriorBid = user && bids.some(b => b.itemId === item.id && b.bidderId === user.id);
  
  // Halo Logic
  const showHalo = isHighBidder || hasPriorBid || isWatched;
  const haloTheme = isHighBidder 
    ? 'orange' 
    : hasPriorBid 
      ? 'green' 
      : 'blue';

  useEffect(() => {
    if (isOpen) {
        // Reset state when opening
        const initialBidValue = item.isPublicBid && item.currentHighBid
          ? item.currentHighBid + getSmartStep(item.currentHighBid)
          : item.askPrice;
        setBidAmount(Math.round(initialBidValue).toLocaleString());
    }
  }, [isOpen, item.askPrice, item.isPublicBid, item.currentHighBid, getSmartStep, setBidAmount]);

  // Toast Notification on Success
  useEffect(() => {
    if (isSuccess) {
      toast.success("Bid placed successfully!", {
        description: `You placed a bid of Rs. ${bidAmount} on ${item.title}`
      });
    }
  }, [isSuccess, bidAmount, item.title]);

  // Safe Privacy-Preserving Distance Calculation
  const { distance, duration, isOutside, timeLeft, isUrgent } = useMemo(() => {
    // Timer Logic - Independent of User
    const currentTime = now || Date.now();
    const diff = new Date(item.expiryAt).getTime() - currentTime;
    const hoursLeft = Math.max(0, Math.floor(diff / 3600000));
    const minsLeft = Math.max(0, Math.floor((diff % 3600000) / 60000));
    const secsLeft = Math.max(0, Math.floor((diff % 60000) / 1000));
    
    const timeStr = hoursLeft >= 24 
      ? `${Math.floor(hoursLeft / 24)}d ${hoursLeft % 24}h`
      : `${hoursLeft}h ${minsLeft}m ${secsLeft}s`;

    let isUrgent = false;
    if (hoursLeft < 2) {
      isUrgent = true;
    }

    // Distance Logic - Needs User
    if (!user) {
        return { 
            distance: 0, 
            duration: 0, 
            isOutside: false, 
            timeLeft: timeStr, 
            isUrgent 
        };
    }

    const { distance: dist, duration: dur, isOutside: outside } = calculatePrivacySafeDistance(user.location, seller.location);

    return { 
      distance: dist, 
      duration: dur, 
      isOutside: outside,
      timeLeft: timeStr,
      isUrgent
    };
  }, [item.expiryAt, now, user, seller.location]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="w-[94vw] max-w-[94vw] max-h-[92vh] overflow-hidden md:w-[920px] md:max-w-[920px] lg:w-[1000px] lg:max-w-[1000px] md:h-[88vh] md:max-h-[88vh] p-0 pr-0 bg-white border-none shadow-2xl rounded-2xl">
        <DialogClose 
          id={`close-listing-btn-${item.id}`}
          className="absolute right-4 top-4 z-[50] p-2 bg-white/85 hover:bg-white text-slate-700 hover:text-red-500 rounded-full shadow-lg transition-all active:scale-90"
        >
          <X className="h-5 w-5" />
        </DialogClose>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col h-full"
        >
          {/* Top Section: Dynamic Gallery */}
          <ProductGallery 
            item={item}
            currentImg={currentImg}
            setCurrentImg={setCurrentImg}
            setShowFullscreen={setShowFullscreen}
            showHalo={showHalo}
            haloTheme={haloTheme}
          />

          {/* Bottom Section: Product Details & Bidding */}
          <div id={`product-details-body-${item.id}`} className="flex-1 flex flex-col p-4 sm:p-6 md:flex-[0_0_40%] md:min-h-0 bg-white relative z-10">
            <div id={`product-details-grid-${item.id}`} className="grid gap-4 sm:gap-5 md:gap-6 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] h-full min-w-0 w-full">
              
              {/* Left Column: Info */}
              <ProductInfo 
                item={item}
                seller={seller}
                isOutside={isOutside}
                duration={duration}
                distance={distance}
                isWatched={isWatched}
                onToggleWatch={toggleWatch}
              />

              {/* Right Column: Dashboard */}
              <div id={`product-details-right-${item.id}`} className="h-full min-w-0">
                <BiddingDashboard 
                  item={item}
                  user={user}
                  seller={seller}
                  bidAmount={bidAmount}
                  timeLeft={timeLeft}
                  isUrgent={isUrgent}
                  isHighBidder={isHighBidder}
                  hasPriorBid={!!hasPriorBid}
                  isSuccess={isSuccess}
                  error={error}
                  lastDelta={lastDelta}
                  showDelta={showDelta}
                  animTrigger={animTrigger}
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
