import { motion } from "framer-motion";
import React, { useState, useMemo, useEffect, memo } from "react";
import { Item, User } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Lock, Bookmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/lib/store";
import { useTime } from "@/context/TimeContext";
import { useBidding } from "@/hooks/useBidding";
import { GamificationBadge } from "@/components/common/GamificationBadge";
import { VerifiedBadge } from "@/components/common/VerifiedBadge";
import { BiddingControls } from "@/components/common/BiddingControls";
import { getFuzzyLocationString, calculatePrivacySafeDistance, formatPrice, getConditionLabel } from "@/lib/utils";
import { PriceDisplay } from "@/components/common/PriceDisplay";
import { VictoryHalo, getHaloTheme } from "@/components/common";
import { createBiddingConfig } from "@/types/bidding";
import ProductDetailsModal from "./ProductDetailsModal";
import { CategoryBadge } from "@/components/common/CategoryBadge";
import { ConditionBadge } from "@/components/common/ConditionBadge";
import { RatingBadge } from "@/components/common/RatingBadge";
import { TimerBadge } from "@/components/common/TimerBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ItemCardProps {
  item: Item;
  seller: User;
  viewMode?: 'compact' | 'comfortable' | 'spacious';
}

const ItemCard = memo(({ item, seller, viewMode = 'compact' }: ItemCardProps) => {
  const { user, bids, watchedItemIds } = useApp();
  const { now } = useTime(); // Use global heartbeat
  const isWatched = watchedItemIds.includes(item.id);

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
    animTrigger,
    remainingAttempts,
    errorMessage,
    userBid,
    isSubmitting,
    cooldownRemaining
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

  // Calculate halo theme
  const haloTheme = getHaloTheme(biddingConfig, isWatched);

  return (
    <>
      <motion.div
        id={`item-card-${item.id}`}
        onClick={() => setIsDialogOpen(true)}
        initial={false}
            animate={{
              scale: isSuccess ? 1.05 : 1,
              x: (isOutbidTrigger && item.isPublicBid) || isSuccess ? [0, -4, 4, -4, 4, 0] : 0,
            }}
            transition={{
              x: { duration: 0.4 },
              scale: { type: "spring", stiffness: 300, damping: 20 },
            }}
            className={`@container group relative border-none bg-slate-50 rounded-xl overflow-hidden flex flex-col will-change-transform cursor-pointer transition-[box-shadow,ring,padding] duration-500 shadow-sm hover:shadow-md
              ${haloTheme !== 'none' ? 'p-[3px]' : 'p-0'}
              ${isOutbidTrigger && item.isPublicBid ? 'ring-2 ring-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : ''}
            `}
            style={{ backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}
          >
            <VictoryHalo theme={haloTheme} />
            <Card className="border-none shadow-none bg-white h-full flex flex-col relative z-10 overflow-hidden rounded-[calc(0.75rem-3px)]">



            <div
              id={`item-card-${item.id}-image-wrapper`}
              className={`relative ${getHeightClass()} bg-slate-100 overflow-hidden shrink-0 z-0`}
            >
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  id={`item-card-${item.id}-image-main`}
                  src={mainImage}
                  alt={`${item.title} main image`}
                  className="object-cover w-full h-full object-center"
                />
              </div>

              {/* Top-Left Stack: Geography & Identity */}
              <div id={`item-card-${item.id}-left-stack`} className="absolute top-2 left-2 z-20 flex flex-col items-start gap-1">
                {/* 1. Location (Geography First) */}
                <div className="bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-md flex items-center gap-1.5 shadow-lg border border-white/20">
                  <MapPin className="h-3 w-3" />
                  <span className="text-[clamp(0.625rem,2.5cqi,0.75rem)] font-black tracking-tight leading-none truncate max-w-[120px]">
                    {seller?.location ? getFuzzyLocationString(seller.location.address) : 'Unknown Location'}
                  </span>
                </div>
                {/* 2. Category Identity */}
                <CategoryBadge 
                  category={item.category} 
                  variant="glass" 
                  className="mt-0.5"
                />
              </div>

              {/* Top-Right Stack: Urgency & State */}
              <div className="absolute top-2 right-2 z-20 flex flex-col items-end gap-1">
                {/* 1. Timer (Urgency First) */}
                <TimerBadge 
                  expiryAt={item.expiryAt} 
                  variant="glass" 
                />
                
                {/* 2. Condition State */}
                <ConditionBadge 
                  condition={item.condition} 
                  variant="glass"
                  className="mt-0.5"
                />
              </div>


              {/* Bottom Floating Badges - Replaces old full-width bar */}
              
              {/* Bottom Left: Distance/Duration */}
              {!isOutside && (
                <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1">
                  <div className="bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-md flex items-center gap-1.5 shadow-lg border border-white/20">
                    <MapPin className="h-3 w-3 text-red-500" />
                    <span className="text-[clamp(0.625rem,2.5cqi,0.75rem)] font-bold tracking-wide tabular-nums leading-none">
                      {distance}km • {duration}min
                    </span>
                  </div>
                </div>
              )}

              {/* Bottom Right: Watchlist & Secret Indicators */}
              {(isWatched || !item.isPublicBid) && (
                <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1.5">
                  {isWatched && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <motion.div
                            id={`item-card-${item.id}-watch-indicator`}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            whileHover={{ scale: 1.1 }}
                            className="bg-blue-600/90 backdrop-blur-md text-white p-1.5 rounded-md border border-blue-400/50 shadow-lg cursor-help"
                          >
                            <Bookmark className="h-3 w-3 fill-current" />
                          </motion.div>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p>You are watching this item</p>
                        </TooltipContent>
                      </Tooltip>
                  )}
                  {!item.isPublicBid && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <motion.div 
                            animate={isSuccess ? { scale: [1, 1.4, 1] } : {}}
                            transition={{ duration: 0.5 }}
                            className="bg-amber-600/90 backdrop-blur-md text-white p-1.5 rounded-md border border-amber-400/50 shadow-lg cursor-help"
                          >
                             <Lock className="h-3 w-3" />
                          </motion.div>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p>Secret Bidding</p>
                        </TooltipContent>
                      </Tooltip>
                  )}
                </div>
              )}


              {item.images.length > 1 && viewMode === 'spacious' && thumbnailImages.length > 0 && (
                <div
                  id={`item-card-${item.id}-thumb-strip`}
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2 py-1.5 rounded-2xl bg-black/30 backdrop-blur-md border border-white/20 shadow-[0_10px_22px_rgba(0,0,0,0.35)] pointer-events-none"
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
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/35 backdrop-blur-md border border-white/20 shadow-[0_8px_18px_rgba(0,0,0,0.3)] pointer-events-none"
                >
                  {Array.from({ length: Math.min(item.images.length, 5) }).map((_, i) => (
                    <span
                      key={`dot-${i}`}
                      className={`rounded-full transition-all ${i === 0 ? 'h-1.5 w-5 bg-white' : 'h-1.5 w-1.5 bg-white/50'}`}
                    />
                  ))}
                  {item.images.length > 5 && (
                    <span className="text-[9px] font-bold text-white/80">+{item.images.length - 5}</span>
                  )}
                </div>
              )}
            </div>

            {/* 
              Content Section:
              - Removed mt-auto from input row to eliminate variable gap
              - Reduced gap-2 to gap-1.5 for tighter fit
              - Removed pt-1
            */}
            <CardContent className="p-1.5 flex flex-col gap-1 flex-1 z-10 transition-all">
              {/* Title - Natural height with clamping */}
              <div className="flex items-start">
                <h3 id={`item-card-${item.id}-title`} className={`font-bold ${getTitleClass()} text-slate-900 leading-tight line-clamp-2 transition-all w-full`} title={item.title}>
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
                  
                  <span className={`text-[clamp(0.8125rem,3.5cqi,0.9375rem)] ${viewMode === 'comfortable' ? 'font-medium text-slate-500' : 'font-semibold text-slate-600'} truncate leading-none ${viewMode === 'comfortable' ? 'max-w-[120px]' : ''}`}>
                    {seller?.name || 'Unknown Seller'}
                  </span>

                  {seller?.isVerified && <VerifiedBadge size="sm" />}

                  <div className="flex items-center gap-1 ml-0.5">
                    <RatingBadge 
                      rating={seller?.rating || 0} 
                      count={seller?.reviewCount || 0}
                      size={viewMode === 'spacious' ? 'md' : 'sm'}
                    />
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
              />

              {/* Spacious Mode Description */}
              {viewMode === 'spacious' && (
                <div className="mt-2 mb-1 animate-in fade-in duration-300">
                  <p className="text-[clamp(0.75rem,3cqi,0.875rem)] text-slate-600 line-clamp-3 leading-relaxed font-medium">
                    {item.description}
                  </p>
                </div>
              )}

                <div className="flex flex-col gap-1.5 mt-0.5">
                  <BiddingControls
                    bidAmount={bidAmount}
                    isSuccess={isSuccess}
                    isOwner={user?.id === seller?.id}
                    isHighBidder={biddingConfig.isUserHighBidder}
                    hasPriorBid={biddingConfig.hasUserBid}
                    error={!!error}
                    errorMessage={errorMessage}
                    remainingAttempts={remainingAttempts}
                    isSubmitting={isSubmitting}
                    cooldownRemaining={cooldownRemaining}
                    minBid={biddingConfig.minBid}
                    pendingConfirmation={pendingConfirmation}
                    animTrigger={animTrigger}
                    viewMode={viewMode}
                    idPrefix={`item-card-${item.id}`}
                    onSmartAdjust={handleSmartAdjust}
                    onBid={handleBid}
                    onKeyDown={handleKeyDown}
                    onInputChange={handleInputChange}
                    onInputClick={handleInputClick}
                    showAttemptsDots={false}
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
