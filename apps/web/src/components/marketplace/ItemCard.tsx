import { motion } from "framer-motion";
import React, { useState, useMemo, useEffect, memo } from "react";
import { Item, User } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Lock, Bookmark, AlertTriangle, ShieldAlert } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi
} from "@/components/ui/carousel";
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
  // Removed local 'now' state and useEffect timer
  const [currentImg, setCurrentImg] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!carouselApi) return

    carouselApi.on("select", () => {
      setCurrentImg(carouselApi.selectedScrollSnap())
    })
  }, [carouselApi])


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
  const showHalo = isHighBidder || hasPriorBid || isWatched;
  
  // Halo Theme Priority: Winning > Participating > Watching
  const haloTheme = isHighBidder 
    ? 'orange' 
    : hasPriorBid 
      ? 'green' 
      : 'blue';

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
            className={`@container group relative border-none bg-slate-50 rounded-lg overflow-hidden flex flex-col will-change-transform cursor-pointer transition-[box-shadow,ring] duration-500
              ${showHalo ? 'p-[3.5px]' : 'p-0 shadow-sm hover:shadow-md'}
              ${isOutbidTrigger && item.isPublicBid ? 'ring-2 ring-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : ''}

            `}
            style={{ backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}
          >
              {/* Victory Halo - State Based Animated Border Background */}
              {showHalo && (
                <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-lg">
                  {/* Base Layer: Solid Vibrant Color */}
                  <div 
                     className={`absolute inset-0 
                       ${haloTheme === 'orange' ? 'bg-[#fbbf24]' : 
                         haloTheme === 'green' ? 'bg-[#16a34a]' : 
                         'bg-[#0ea5e9]'}`}
                  />
                  
                  {/* Top Layer: The Racing Bar (with less transparency for a fuller look) */}
                  {item.isPublicBid && (
                    <motion.div 
                      className={`absolute inset-[-150%] 
                        ${haloTheme === 'orange' 
                            ? 'bg-[conic-gradient(from_0deg,transparent_0%,rgba(245,158,11,0.2)_20%,#f59e0b_45%,#ffffff_50%,#f59e0b_55%,rgba(245,158,11,0.2)_80%,transparent_100%)]' 
                            : haloTheme === 'green'
                              ? 'bg-[conic-gradient(from_0deg,transparent_0%,rgba(22,163,74,0.2)_20%,#4ade80_45%,#ffffff_50%,#4ade80_55%,rgba(22,163,74,0.2)_80%,transparent_100%)]'
                              : 'bg-[conic-gradient(from_0deg,transparent_0%,rgba(14,165,233,0.2)_20%,#38bdf8_45%,#ffffff_50%,#38bdf8_55%,rgba(14,165,233,0.2)_80%,transparent_100%)]'
                        }`}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                </div>
              )}

            <Card className="border-none shadow-none bg-white h-full flex flex-col relative z-10 overflow-hidden rounded-[calc(var(--radius)-3px)]">
            <div
              id={`item-card-${item.id}-image-wrapper`}
              className={`relative ${getHeightClass()} bg-slate-100 overflow-hidden shrink-0 z-0 group/gallery`}
            >
              <Carousel
                setApi={setCarouselApi}
                className="w-full h-full"
              >
                <CarouselContent className="-ml-0 h-full">
                  {item.images.map((src, i) => (
                    <CarouselItem key={i} className="pl-0 h-full">
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img
                          id={`item-card-${item.id}-image-${i}`}
                          src={src}
                          alt={`${item.title} - ${i + 1}`}
                          className="object-cover w-full h-full object-center"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {item.images.length > 1 && (
                  <>
                    <div className="absolute inset-0 flex items-center justify-between p-2 opacity-0 group-hover/gallery:opacity-100 transition-opacity pointer-events-none">
                      <CarouselPrevious 
                        className="pointer-events-auto h-8 w-8 bg-black/50 text-white border-none hover:bg-black/70 translate-y-0 static" 
                        variant="ghost"
                      />
                      <CarouselNext 
                        className="pointer-events-auto h-8 w-8 bg-black/50 text-white border-none hover:bg-black/70 translate-y-0 static" 
                        variant="ghost"
                      />
                    </div>
                    <div className="absolute bottom-16 left-0 right-0 flex justify-center gap-1.5 z-30 pointer-events-none">
                      {item.images.map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 rounded-full transition-all duration-300 ${i === currentImg ? 'w-6 bg-white shadow-sm' : 'w-1.5 bg-white/40'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </Carousel>

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

                  {viewMode === 'spacious' && (
                    <div className="flex items-center gap-0.5 ml-auto text-[10px] text-slate-500">
                      <MapPin className="h-2.5 w-2.5 text-red-500" />
                      <span className="truncate max-w-[80px] leading-none">{seller?.location ? getFuzzyLocationString(seller.location.address) : 'Unknown'}</span>
                    </div>
                  )}
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
                    animTrigger={animTrigger}
                    viewMode={viewMode === 'compact' ? 'compact' : 'spacious'}
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
        
      {/* WARNING/CONFIRMATION DIALOG */}
      <Dialog open={!!warning} onOpenChange={(open) => !open && clearWarning()}>
        <DialogContent className="sm:max-w-[400px] bg-white border-none shadow-2xl p-6 rounded-2xl z-[150]">
           <div className="flex flex-col items-center text-center gap-4">
              <div className={`p-4 rounded-full ${warning?.type === 'double_bid' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                 {warning?.type === 'double_bid' ? (
                   <ShieldAlert className="h-8 w-8" /> 
                 ) : (
                   <AlertTriangle className="h-8 w-8" />
                 )}
              </div>
              
              <div className="space-y-2">
                 <DialogTitle className="text-xl font-black text-slate-900">
                    {warning?.type === 'double_bid' ? 'Already Winning' : 'High Bid Warning'}
                 </DialogTitle>
                 <DialogDescription className="text-slate-600 font-medium text-base">
                    {warning?.message}
                 </DialogDescription>
              </div>

              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={clearWarning}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => confirmBid(e)}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-white shadow-lg shadow-red-200 transition-all active:scale-95
                    ${warning?.type === 'double_bid' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  Confirm Bid
                </button>
              </div>
           </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

ItemCard.displayName = "ItemCard";
export default ItemCard;
