import { motion } from "framer-motion";
import React, { useState, useMemo, useEffect, memo } from "react";
import { Item, User } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Bookmark } from "lucide-react";
import { useApp } from "@/lib/store";
import { useBidding } from "@/hooks/useBidding";
import { GamificationBadge } from "@/components/common/GamificationBadge";
import { VerifiedBadge } from "@/components/common/VerifiedBadge";
import { BiddingControls } from "@/components/common/BiddingControls";
import { calculatePrivacySafeDistance } from "@/lib/utils";
import { PriceDisplay } from "@/components/common/PriceDisplay";
import { createBiddingConfig } from "@/types/bidding";
import ProductDetailsModal from "./ProductDetailsModal";
import { CategoryBadge } from "@/components/common/CategoryBadge";
import { ConditionBadge } from "@/components/common/ConditionBadge";
import { RatingBadge } from "@/components/common/RatingBadge";
import { TimerBadge } from "@/components/common/TimerBadge";
import { LocationBadge } from "@/components/common/LocationBadge";
import { DistanceBadge } from "@/components/common/DistanceBadge";
import { useTrackVisibility } from "@/hooks/useTrackVisibility";
import {
  Tooltip,

  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { cn } from "@/lib/utils";

interface ItemCardProps {
  item: Item;
  seller: User;
  viewMode?: 'compact' | 'comfortable' | 'spacious';
}

const ItemCard = memo(({ item, seller, viewMode = 'compact' }: ItemCardProps) => {
  const { user, bids, watchedItemIds, toggleWatch, setFilter } = useApp();
  const isWatched = watchedItemIds.includes(item.id);
  const visibilityRef = useTrackVisibility(item.id);

  // Unified Bidding Configuration

  const biddingConfig = useMemo(() => 
    createBiddingConfig(item, user, bids),
    [item, user, bids]
  );

  const [isOutbidTrigger, setIsOutbidTrigger] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const mainImage = item.images[0];
  const thumbnailImages = item.images.slice(1, 4);


  // Hook for encapsulated bidding logic
  const {
    bidAmount,
    error,
    isSuccess,
    pendingConfirmation,
    handleKeyDown,
    handleSmartAdjust,
    handleBid,
    handleInputChange, 
    handleInputBlur,
    remainingAttempts,
    errorMessage,
    userBid,
    isSubmitting,
    cooldownRemaining,
    derivedStatus
  } = useBidding(item, seller!, () => setIsDialogOpen(false)); // Assert non-null for hook but UI will be safe

  
  // Watch for outbid events (only if user has an existing bid)
  // Logic: Only trigger if the high bid CHANGED to something higher than before
  const prevHighBid = React.useRef(item.currentHighBid);

  useEffect(() => {
    if (!user || !item.isPublicBid) return;
    
    const hasUserBid = bids.some(b => b.itemId === item.id && b.bidderId === user.id);
    
    // Check if someone else just bid higher than the previous known high bid
    const someoneElseBidHigher = 
      item.currentHighBid && 
      prevHighBid.current && 
      item.currentHighBid > prevHighBid.current && 
      item.currentHighBidderId !== user.id;

    if (hasUserBid && someoneElseBidHigher) {
       const triggerTimer = setTimeout(() => setIsOutbidTrigger(true), 0);
       const resetTimer = setTimeout(() => setIsOutbidTrigger(false), 800);
       prevHighBid.current = item.currentHighBid; // Update the ref
       return () => {
         clearTimeout(triggerTimer);
         clearTimeout(resetTimer);
       };
    }

    // Always keep ref in sync with latest value to detect future changes
    prevHighBid.current = item.currentHighBid;
  }, [item, user, bids]);

  // Safe Privacy-Preserving Distance Calculation
  const { distance, duration, isOutside } = useMemo(() => {
    // 1. Distance Logic - Dependent on User
    // If user is missing, we default to 0/hidden. This is an unavoidable "pop-in" 
    // when location becomes available, but better than blocking the whole card state.
    const { distance: dist, duration: dur, isOutside: outside } = (user?.location && seller?.location)
      ? calculatePrivacySafeDistance(user.location, seller.location) 
      : { distance: 0, duration: 0, isOutside: true }; // Default to 'outside' to hide badge if unknown

    return { 
      distance: dist, 
      duration: dur, 
      isOutside: outside
    };
  }, [user, seller]); // Added safe navigation for seller


  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent dialog from opening when clicking input
  };

  const getHeightClass = () => {
    switch (viewMode) {
      case 'spacious': return 'h-[17rem]';
      case 'comfortable': return 'h-52';
      default: return 'h-36';
    }
  };

  const getTitleClass = () => {
    return 'text-[clamp(0.875rem,5cqi,1.25rem)]';
  };


  // Calculate real-time status for input styling

  return (
    <>
      <motion.div
        ref={visibilityRef}
        id={`item-card-${item.id}`}

        initial={false}
            animate={{
              scale: isSuccess ? 1.05 : 1,
              x: (isOutbidTrigger && item.isPublicBid) || isSuccess ? [0, -4, 4, -4, 4, 0] : 0,
            }}
            transition={{
              x: { duration: 0.4 },
              scale: { type: "spring", stiffness: 300, damping: 20 },
            }}
            className={cn(
              "@container group relative border-none rounded-xl flex flex-col will-change-transform transition-[box-shadow,ring,padding] duration-500",
              item.isPublicBid 
                ? "bg-slate-50 shadow-sm" 
                : "bg-slate-50 shadow-sm",
              isOutbidTrigger && item.isPublicBid && "ring-2 ring-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
            )}
            style={{ backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}
          >
            <Card className={cn(
              "border-none shadow-none h-full flex flex-col relative z-10 rounded-[calc(0.75rem-3px)]",
              // Hidden Bidding: Full dark theme
              !item.isPublicBid && "bg-slate-900",
              // Leading Public Bid: Warm orange tint
              item.isPublicBid && item.currentHighBidderId === user?.id && "bg-orange-50/80",
              // Default: White background
              item.isPublicBid && item.currentHighBidderId !== user?.id && "bg-white"
            )}>

            <div
              id={`item-card-${item.id}-image-wrapper`}
              onClick={() => setIsDialogOpen(true)}
              className={`relative ${getHeightClass()} bg-slate-100 overflow-hidden shrink-0 z-0 rounded-t-[inherit] cursor-pointer`}
            >
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  id={`item-card-${item.id}-image-main`}
                  src={mainImage}
                  alt={`${item.title} main image`}
                  loading="lazy"
                  decoding="async"
                  className="object-cover w-full h-full object-center"
                />
              </div>

              {/* Top-Left Stack: Geography & Identity */}
              <div id={`item-card-${item.id}-left-stack`} className="absolute top-2 left-2 z-20 flex flex-col items-start gap-1">
                {/* 1. Location (Geography First) */}
                <LocationBadge 
                  address={seller?.location?.address}
                  variant={item.isPublicBid ? "glass-light" : "glass"}
                />
                {/* 2. Category Identity */}
                <CategoryBadge 
                  category={item.category} 
                  variant={item.isPublicBid ? "glass-light" : "glass"} 
                  className="mt-0.5"
                  onClick={() => setFilter('category', item.category)}
                />
              </div>

              {/* Top-Right Stack: Urgency & State */}
              <div className="absolute top-2 right-2 z-20 flex flex-col items-end gap-1">
                {/* 1. Timer (Urgency First) */}
                <TimerBadge 
                  expiryAt={item.expiryAt} 
                  variant={item.isPublicBid ? "glass-light" : "glass"} 
                />
                
                {/* 2. Condition State */}
                <ConditionBadge 
                  condition={item.condition} 
                  variant={item.isPublicBid ? "glass-light" : "glass"}
                  className="mt-0.5"
                />
              </div>


              {/* Bottom Floating Badges - Replaces old full-width bar */}
              
              {/* Bottom Left: Distance/Duration */}
              {!isOutside && (
                <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1">
                  <DistanceBadge 
                    distance={distance}
                    duration={duration}
                    variant={item.isPublicBid ? "glass-light" : "glass"}
                  />
                </div>
              )}

              {/* Bottom Right: Watchlist & Hidden Indicators */}
              <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      id={`item-card-${item.id}-watch-btn`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWatch(item.id);
                      }}
                      initial={false}
                      animate={{ 
                        scale: isWatched ? 1.1 : 1,
                        backgroundColor: isWatched ? "rgba(37, 99, 235, 0.9)" : "rgba(0, 0, 0, 0.4)"
                      }}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "text-white p-1.5 rounded-md border shadow-lg transition-colors cursor-pointer",
                        isWatched ? "border-blue-400/50" : "border-white/10"
                      )}
                    >
                      <Bookmark className={cn("h-3 w-3", isWatched && "fill-current")} />
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>{isWatched ? 'Remove from watchlist' : 'Add to watchlist'}</p>
                  </TooltipContent>
                </Tooltip>

                {!item.isPublicBid && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div 
                          animate={isSuccess ? { scale: [1, 1.4, 1] } : {}}
                          transition={{ duration: 0.5 }}
                          className="bg-amber-600/90 text-white p-1.5 rounded-md border border-amber-400/50 shadow-lg cursor-help"
                        >
                           <Lock className="h-3 w-3" />
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>Hidden Bidding</p>
                      </TooltipContent>
                    </Tooltip>
                )}
              </div>


              {item.images.length > 1 && viewMode === 'spacious' && thumbnailImages.length > 0 && (
                <div
                  id={`item-card-${item.id}-thumb-strip`}
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2 py-1.5 rounded-2xl bg-white/85 border border-black/5 shadow-[0_10px_22px_rgba(0,0,0,0.15)] pointer-events-none"
                >
                  {thumbnailImages.map((src) => (
                    <div
                      key={src}
                      className="h-8 w-8 rounded-md overflow-hidden border border-white/30"
                    >
                      <img
                        src={src}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                  {item.images.length > 4 && (
                    <div className="h-8 min-w-[2rem] rounded-md bg-white/10 border border-white/20 flex items-center justify-center text-[10px] font-bold text-white/80">
                      +{item.images.length - 4}
                    </div>
                  )}
                </div>
              )}

              {item.images.length > 1 && viewMode !== 'spacious' && (
                <div
                  id={`item-card-${item.id}-image-dots`}
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/85 border border-black/5 shadow-[0_8px_18px_rgba(0,0,0,0.12)] pointer-events-none"
                >
                  {Array.from({ length: Math.min(item.images.length, 5) }).map((_, i) => (
                    <span
                      key={`dot-${i}`}
                      className={`rounded-full transition-all ${i === 0 ? 'h-1.5 w-5 bg-slate-800' : 'h-1.5 w-1.5 bg-slate-800/40'}`}
                    />
                  ))}
                  {item.images.length > 5 && (
                    <span className="text-[9px] font-bold text-slate-700">+{item.images.length - 5}</span>
                  )}
                </div>
              )}
            </div>

            {/* 
              Content Section:
              - Removed mt-auto from input row to eliminate variable gap
              - Reduced gap-2 to gap-1.5 for tighter fit
              - Removed pt-1
              - Added conditional pb-3 to compensate for halo visual overlap
            */}
            <CardContent className={cn(
              "p-1.5 flex flex-col gap-1 flex-1 z-10 transition-all pb-2",
            )}>
              {/* Title - Natural height with clamping */}
              <div className="flex items-start">
                <h3 
                  id={`item-card-${item.id}-title`} 
                  onClick={() => setIsDialogOpen(true)}
                  className={cn(
                    `font-bold ${getTitleClass()} leading-tight line-clamp-2 transition-all w-full cursor-pointer`,
                    !item.isPublicBid ? "text-white hover:text-blue-300" : "text-slate-900 hover:text-blue-600"
                  )} 
                  title={item.title}
                >
                  {item.title}
                </h3>
              </div>

              {/* Seller Info - Between Title and Price */}
              {(viewMode === 'spacious' || viewMode === 'comfortable') && (
                <div className={`flex items-center gap-2 mb-1 animate-in fade-in duration-300 ${viewMode === 'comfortable' ? 'mt-0.5' : 'mt-1'}`}>
                  {seller?.avatar && (
                    <div className={`${viewMode === 'comfortable' ? 'h-5 w-5' : 'h-6 w-6'} rounded-full bg-slate-200 overflow-hidden shrink-0 shadow-sm border border-white`}>
                      <img src={seller.avatar} alt={seller.name} className="h-full w-full object-cover" />
                    </div>
                  )}
                  
                  <span className={cn(
                    `text-[clamp(0.8125rem,3.5cqi,0.9375rem)] truncate leading-none`,
                    viewMode === 'comfortable' ? 'font-medium max-w-[120px]' : 'font-semibold',
                    !item.isPublicBid ? "text-slate-300" : (viewMode === 'comfortable' ? 'text-slate-500' : 'text-slate-600')
                  )}>
                    {seller?.name || 'Unknown Seller'}
                  </span>

                  {seller?.isVerified && <VerifiedBadge size="sm" />}

                  <div className="flex items-center gap-1 ml-0.5">
                    <RatingBadge 
                      rating={seller?.rating || 0} 
                      count={seller?.reviewCount || 0}
                      size={viewMode === 'spacious' ? 'md' : 'sm'}
                      darkMode={!item.isPublicBid}
                    />
                    {seller?.sellerSuccessRate !== undefined && (
                      <div className={cn(
                        "flex items-center gap-0.5 px-1.5 py-0.5 rounded-md border shadow-sm",
                        !item.isPublicBid ? "bg-slate-700 border-slate-600" : "bg-slate-100 border-slate-200"
                      )}>
                         <span className={cn(
                           "text-[10px] font-black tracking-tight tabular-nums",
                           seller.sellerSuccessRate >= 95 ? "text-emerald-500" : 
                           seller.sellerSuccessRate >= 80 ? "text-amber-500" : (!item.isPublicBid ? "text-slate-300" : "text-slate-600")
                         )}>
                           {seller.sellerSuccessRate}%
                         </span>
                         <span className={cn("text-[9px] font-bold uppercase tracking-tighter", !item.isPublicBid ? "text-slate-400" : "text-slate-400")}>Success</span>
                      </div>
                    )}
                    {seller?.badges && seller.badges.some(b => b.category === 'seller') && (

                      <GamificationBadge 
                        badge={seller.badges.filter(b => b.category === 'seller').sort((a,b) => {
                          const tiers: Record<string, number> = { diamond: 3, gold: 2, silver: 1, bronze: 0 };
                          return (tiers[b.tier] || 0) - (tiers[a.tier] || 0);
                        })[0]} 
                        size="sm" 
                        showTooltip={viewMode === 'spacious'}
                        className="h-3.5 px-1 text-[9px] gap-1 border-none bg-transparent hover:bg-transparent"
                      />
                    )}
                  </div>


                </div>
              )}

              {/* Price Row */}
              <PriceDisplay 
                config={biddingConfig}
                askPrice={item.askPrice}
                bidCount={item.bidCount}
                viewMode={viewMode}
                className="min-h-[2.25rem]"
                remainingAttempts={remainingAttempts}
                showAttempts={user?.id !== seller.id}
                userCurrentBid={userBid?.amount}
                showTotalBids={true}
                itemId={item.id}
                darkMode={!item.isPublicBid}
              />

              {/* Spacious Mode Description */}
              {viewMode === 'spacious' && (
                <div className="mt-2 mb-1 animate-in fade-in duration-300">
                  <p className={cn(
                    "text-[clamp(0.75rem,3cqi,0.875rem)] line-clamp-3 leading-relaxed font-medium",
                    !item.isPublicBid ? "text-slate-400" : "text-slate-600"
                  )}>
                    {item.description}
                  </p>
                </div>
              )}

                <div className="flex flex-col gap-1.5 mt-0.5">
                  <BiddingControls
                    bidAmount={bidAmount}
                    isSuccess={isSuccess}
                    isOwner={user?.id === seller?.id}
                    hasPriorBid={biddingConfig.hasUserBid}
                    error={!!error}
                    errorMessage={errorMessage}
                    remainingAttempts={remainingAttempts}
                    isSubmitting={isSubmitting}
                    cooldownRemaining={cooldownRemaining}
                    derivedStatus={derivedStatus}
                    pendingConfirmation={pendingConfirmation}
                    viewMode={viewMode}
                    idPrefix={`item-card-${item.id}`}
                    onSmartAdjust={handleSmartAdjust}
                    onBid={handleBid}
                    onKeyDown={handleKeyDown}
                    onInputChange={handleInputChange}
                    onInputBlur={handleInputBlur}
                    onInputClick={handleInputClick}
                    showAttemptsDots={false}
                    itemId={item.id}
                    darkMode={!item.isPublicBid}
                  />
              </div>

            </CardContent>
          </Card>
        </motion.div>

      <ProductDetailsModal 
        item={item} 
        seller={seller} 
        isOpen={isDialogOpen} 
        onClose={setIsDialogOpen} 
      />
    </>
  );
});

ItemCard.displayName = "ItemCard";
export default ItemCard;
