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
import { getFuzzyLocationString, calculatePrivacySafeDistance, formatPrice } from "@/lib/utils";
import ProductDetailsModal from "./ProductDetailsModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
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

  useEffect(() => {
    console.log(`[ItemCard] MOUNTED id=${item.id}`);
    return () => console.log(`[ItemCard] UNMOUNTED id=${item.id}`);
  }, [item.id]);

  // Price formatting logic handled by centralized utility
  const displayPrice = (price: number) => formatPrice(price, viewMode);

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
    getSmartStep,
    animTrigger
  } = useBidding(item, seller!, () => setIsDialogOpen(false)); // Assert non-null for hook but UI will be safe

  const minBid = item.isPublicBid && item.currentHighBid ? item.currentHighBid + getSmartStep(item.currentHighBid) : item.askPrice * 0.7;

  // Check if user has bid on this item before
  const hasPriorBid = user && bids.some(b => b.itemId === item.id && b.bidderId === user.id);
  
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
  const { distance, duration, isOutside, timeLeft, statusColor, isUrgent } = useMemo(() => {
    // 1. Time Logic - Independent of User
    // Default values if 'now' is missing (SSR)
    let timeStr = "--:--:--";
    let statusColor = "bg-black/60";
    let isUrgent = false;
    let type = "72h";

    if (now !== null) {
      // Time Left calculation
      const diff = new Date(item.expiryAt).getTime() - now;
      const hoursLeft = Math.max(0, Math.floor(diff / 3600000));
      const minsLeft = Math.max(0, Math.floor((diff % 3600000) / 60000));
      const secsLeft = Math.max(0, Math.floor((diff % 60000) / 1000));
      
      // Determine listing type (24, 48, 72)
      const totalDiff = new Date(item.expiryAt).getTime() - new Date(item.createdAt).getTime();
      const totalHours = Math.round(totalDiff / 3600000);
      
      if (totalHours <= 24) type = "24h";
      else if (totalHours <= 48) type = "48h";

      timeStr = hoursLeft >= 24 
        ? `${Math.floor(hoursLeft / 24)}d ${hoursLeft % 24}h`
        : `${hoursLeft}h ${minsLeft}m ${secsLeft}s`;

      // Ending soon logic
      if (hoursLeft < 2) {
        statusColor = "bg-red-600";
        isUrgent = true;
      } else if (hoursLeft < 6) {
        statusColor = "bg-orange-600";
      } else if (hoursLeft < 12) {
        statusColor = "bg-amber-600";
      }
    }

    // 2. Distance Logic - Dependent on User
    // If user is missing, we default to 0/hidden. This is an unavoidable "pop-in" 
    // when location becomes available, but better than blocking the whole card state.
    const { distance: dist, duration: dur, isOutside: outside } = (user?.location && seller?.location)
      ? calculatePrivacySafeDistance(user.location, seller.location) 
      : { distance: 0, duration: 0, isOutside: true }; // Default to 'outside' to hide badge if unknown

    return { 
      distance: dist, 
      duration: dur, 
      isOutside: outside,
      timeLeft: timeStr,
      listingType: type,
      statusColor,
      isUrgent
    };
  }, [item, now, user, seller]); // Added safe navigation for seller

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

  const getPriceClass = () => {
    return 'font-outfit text-[clamp(1rem,6cqi,1.5rem)]';
  };

  const getLabelClass = () => {
    return 'text-[clamp(0.625rem,2.5cqi,0.75rem)]';
  };

  const getTrophySizeClass = () => {
    return 'w-[clamp(1.25rem,6cqi,1.75rem)] h-[clamp(1.25rem,6cqi,1.75rem)] p-[clamp(0.25rem,1cqi,0.375rem)]';
  };

  const isHighBidder = item.isPublicBid && item.currentHighBidderId === user?.id;

  // Calculate real-time status for input styling

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
            className={`@container group relative border-none bg-slate-50 rounded-lg overflow-hidden flex flex-col will-change-transform cursor-pointer transition-[box-shadow,ring] duration-500 p-0 shadow-sm hover:shadow-md
              ${isOutbidTrigger && item.isPublicBid ? 'ring-2 ring-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : ''}

            `}
            style={{ backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}
          >
            <Card className="border-none shadow-none bg-white h-full flex flex-col relative z-10 overflow-hidden rounded-[calc(var(--radius)-3px)]">
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

              {/* Top-Left Location Badge */}
              <div id={`item-card-${item.id}-location-badge-wrapper`} className="absolute top-2 left-2 z-20 flex flex-col items-start gap-1">
                <div className="bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-md flex items-center gap-1.5 shadow-lg border border-white/20">
                  <MapPin className="h-3 w-3" />
                  <span className="text-[clamp(0.625rem,2.5cqi,0.75rem)] font-black tracking-tight leading-none truncate max-w-[120px]">
                    {seller?.location ? getFuzzyLocationString(seller.location.address) : 'Unknown Location'}
                  </span>
                </div>
              </div>

              {/* Top-Right Timer Badge */}
              <div className="absolute top-2 right-2 z-20 flex flex-col items-end gap-1">
                <motion.div
                  initial={false}
                  animate={isUrgent ? { scale: [1, 1.05] } : {}}
                  transition={isUrgent ? { repeat: Infinity, duration: 0.75, repeatType: "reverse" } : {}}
                  className={`${statusColor} backdrop-blur-md text-white px-2 py-1 rounded-md flex items-center gap-1.5 shadow-lg border border-white/20`}
                >
                  <span className="text-[clamp(0.625rem,2.5cqi,0.75rem)] font-black tracking-tight leading-none tabular-nums">{timeLeft}</span>
                </motion.div>
                
                {/* Condition Badge */}
                <div className="bg-white/90 backdrop-blur-md text-slate-900 px-2 py-1 rounded-md flex items-center shadow-lg border border-slate-200 mt-1">
                  <span className="text-[clamp(0.5625rem,2.25cqi,0.6875rem)] font-black uppercase tracking-tighter leading-none">
                    {item.condition === 'new' && '🌟 New'}
                    {item.condition === 'like_new' && '✨ Mint'}
                    {item.condition === 'used' && '👌 Used'}
                    {item.condition === 'fair' && '🔨 Fair'}
                  </span>
                </div>
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
                    <TooltipProvider>
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
                    </TooltipProvider>
                  )}
                  {!item.isPublicBid && (
                    <TooltipProvider>
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
                    </TooltipProvider>
                  )}
                </div>
              )}

              {item.images.length > 1 && viewMode === 'spacious' && thumbnailImages.length > 0 && (
                <div
                  id={`item-card-${item.id}-thumb-strip`}
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2 py-1.5 rounded-2xl bg-black/30 backdrop-blur-md border border-white/20 shadow-[0_10px_22px_rgba(0,0,0,0.35)] pointer-events-none"
                >
                  {thumbnailImages.map((src, i) => (
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
                <div className={`flex items-center gap-2 mb-0.5 animate-in fade-in duration-300 ${viewMode === 'comfortable' ? 'mt-0' : 'mt-0.5'}`}>
                  {viewMode === 'spacious' && seller?.avatar && (
                    <div className="h-5 w-5 rounded-full bg-slate-200 overflow-hidden shrink-0">
                      <img src={seller.avatar} alt={seller.name} className="h-full w-full object-cover" />
                    </div>
                  )}
                  
                  <span className={`text-[clamp(0.625rem,2.5cqi,0.75rem)] font-bold text-slate-700 truncate leading-none ${viewMode === 'comfortable' ? 'text-slate-500 max-w-[80px]' : ''}`}>
                    {seller?.name || 'Unknown Seller'}
                  </span>
                  {seller?.isVerified && <VerifiedBadge size="sm" />}

                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="font-bold bg-yellow-50 text-yellow-700 border-yellow-200 py-0 px-1 text-[clamp(0.5625rem,2.25cqi,0.6875rem)] shrink-0 h-3.5 flex items-center leading-none">
                      ⭐ <span className="ml-0.5 leading-none">{seller?.rating || 0}</span>
                      <span className="ml-0.5 text-yellow-600/80 font-normal leading-none">({seller?.reviewCount || 0})</span>
                    </Badge>
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

              {/* Price Row - Minimum height to accommodate Trophy icon */}
              <div className="flex items-end justify-between transition-all min-h-[2.25rem]">
                <div className="flex flex-col">
                  <span className={`${getLabelClass()} text-slate-600 font-bold uppercase tracking-wider transition-all`}>Asking</span>
                  <span id={`item-card-${item.id}-ask-price`} className={`${getPriceClass()} font-black text-slate-800 leading-none transition-all truncate max-w-[100px]`}>
                    {displayPrice(item.askPrice)}
                  </span>
                </div>

                <div className="flex flex-col items-end transition-all">
                  <span className={`${getLabelClass()} text-slate-600 font-bold uppercase tracking-wider transition-all`}>
                    {item.isPublicBid ? "High Bid" : "Secret"}
                  </span>
                  <div className="flex items-center gap-1.5 transition-all h-6">
                      {item.isPublicBid && item.currentHighBid ? (
                        <div className="flex items-center gap-1.5">
                          <motion.span 
                            key={item.currentHighBid}
                            initial={{ scale: 1.4, color: "#3b82f6" }}
                            animate={{ 
                              scale: 1, 
                            color: item.currentHighBidderId === user?.id ? "#d97706" : "#2563eb" 
                            }}
                            transition={{ 
                              type: "spring", 
                              stiffness: 260, 
                              damping: 20,
                              duration: 0.6
                            }}
                            id={`item-card-${item.id}-high-bid`} 
                            className={`${getPriceClass()} font-black leading-none inline-block truncate max-w-[100px] font-outfit`}
                          >
                            {displayPrice(item.currentHighBid)}
                          </motion.span>
                        {item.currentHighBidderId === user?.id && (
                          <motion.div
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className={`bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0 ${getTrophySizeClass()}`}
                            title="You are the high bidder!"
                          >
                            <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M18 2H6v2H2v7c0 2.21 1.79 4 4 4h1.09c.45 1.76 1.83 3.14 3.58 3.59V20H8v2h8v-2h-2.67v-1.41c1.75-.45 3.13-1.83 3.58-3.59H18c2.21 0 4-1.79 4-4V4h-4V2zM6 13c-1.1 0-2-.9-2-2V6h2v7zm14-2c0 1.1-.9 2-2 2h-2V6h2v5z"/>
                            </svg>
                          </motion.div>
                        )}
                      </div>
                    ) : (
                      <span id={`item-card-${item.id}-bid-count`} className={`${getPriceClass()} font-black text-blue-600 leading-none truncate font-outfit`}>
                        {item.bidCount} {item.bidCount === 1 ? 'Bid' : 'Bids'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

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
                    isHighBidder={isHighBidder}
                    hasPriorBid={!!hasPriorBid}
                    error={!!error}
                    minBid={minBid}
                    pendingConfirmation={pendingConfirmation}
                    animTrigger={animTrigger}
                    viewMode={viewMode === 'compact' ? 'compact' : 'spacious'}
                    idPrefix={`item-card-${item.id}`}
                    onSmartAdjust={handleSmartAdjust}
                    onBid={handleBid}
                    onKeyDown={handleKeyDown}
                    onInputChange={handleInputChange}
                    onInputClick={handleInputClick}
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
