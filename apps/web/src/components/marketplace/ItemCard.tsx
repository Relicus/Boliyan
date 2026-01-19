import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import React, { useState, useMemo, useEffect, memo } from "react";
import { Item, User } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Lock, Globe, Clock, X, Bookmark, ChevronLeft, ChevronRight, Maximize2, ExternalLink, Gavel, Banknote, AlertTriangle, ShieldAlert, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/lib/store";
import { useTime } from "@/context/TimeContext";
import { useBidding } from "@/hooks/useBidding";
import { GamificationBadge } from "@/components/common/GamificationBadge";
import { VerifiedBadge } from "@/components/common/VerifiedBadge";
import { getFuzzyLocationString, calculatePrivacySafeDistance, formatPrice } from "@/lib/utils";
import Link from "next/link";
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
  const { placeBid, user, bids, toggleWatch, watchedItemIds } = useApp();
  const { now } = useTime(); // Use global heartbeat
  const isWatched = watchedItemIds.includes(item.id);

  // Price formatting logic handled by centralized utility
  const displayPrice = (price: number) => formatPrice(price, viewMode);

  const [isOutbidTrigger, setIsOutbidTrigger] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  // Removed local 'now' state and useEffect timer
  const [currentImg, setCurrentImg] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [showFullscreen, setShowFullscreen] = useState(false);

  useEffect(() => {
    if (!carouselApi) return

    carouselApi.on("select", () => {
      setCurrentImg(carouselApi.selectedScrollSnap())
    })
  }, [carouselApi])


  // Hook for encapsulated bidding logic
  const {
    bidAmount,
    setBidAmount,
    error,
    isSuccess,
    warning, 
    confirmBid, 
    clearWarning, 
    handleKeyDown,
    handleSmartAdjust,
    handleBid,
    handleInputChange, 
    getSmartStep,
    animTrigger,
    lastDelta,
    showDelta
  } = useBidding(item, seller!, () => setIsDialogOpen(false)); // Assert non-null for hook but UI will be safe

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
       setIsOutbidTrigger(true);
       const timer = setTimeout(() => setIsOutbidTrigger(false), 800);
       prevHighBid.current = item.currentHighBid; // Update the ref
       return () => clearTimeout(timer);
    }

    // Always keep ref in sync with latest value to detect future changes
    prevHighBid.current = item.currentHighBid;
  }, [item.currentHighBid, item.currentHighBidderId, user?.id, bids, item.id, item.isPublicBid]);

  // Safe Privacy-Preserving Distance Calculation
  const { distance, duration, isOutside, timeLeft, statusColor, isUrgent } = useMemo(() => {
    // Return placeholder during SSR/initial hydration if now is null or user is missing
    if (now === null || !user) {
      return {
        distance: 0,
        duration: 0,
        isOutside: false,
        timeLeft: "--:--:--",
        listingType: "72h", // Default
        statusColor: "bg-black/60",
        isUrgent: false
      };
    }

    // Distance Calculation (Privacy Safe)
    const { distance: dist, duration: dur, isOutside: outside } = seller?.location 
      ? calculatePrivacySafeDistance(user.location, seller.location) 
      : { distance: 0, duration: 0, isOutside: false };

    // Time Left calculation
    const diff = new Date(item.expiryAt).getTime() - now;
    const hoursLeft = Math.max(0, Math.floor(diff / 3600000));
    const minsLeft = Math.max(0, Math.floor((diff % 3600000) / 60000));
    const secsLeft = Math.max(0, Math.floor((diff % 60000) / 1000));
    
    // Determine listing type (24, 48, 72)
    const totalDiff = new Date(item.expiryAt).getTime() - new Date(item.createdAt).getTime();
    const totalHours = Math.round(totalDiff / 3600000);
    let type = "72h";
    if (totalHours <= 24) type = "24h";
    else if (totalHours <= 48) type = "48h";

    const timeStr = hoursLeft >= 24 
      ? `${Math.floor(hoursLeft / 24)}d ${hoursLeft % 24}h`
      : `${hoursLeft}h ${minsLeft}m ${secsLeft}s`;

    // Ending soon logic
    let statusColor = "bg-black/60";
    let isUrgent = false;
    if (hoursLeft < 2) {
      statusColor = "bg-red-600";
      isUrgent = true;
    } else if (hoursLeft < 6) {
      statusColor = "bg-orange-600";
    } else if (hoursLeft < 12) {
      statusColor = "bg-amber-600";
    }

    return { 
      distance: dist, 
      duration: dur, 
      isOutside: outside,
      timeLeft: timeStr,
      listingType: type,
      statusColor,
      isUrgent
    };
  }, [item.id, item.expiryAt, item.createdAt, now, user?.location, seller?.location]); // Added safe navigation for seller

  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent dialog from opening when clicking input
  };

  const getHeightClass = () => {
    switch (viewMode) {
      case 'spacious': return 'h-52';
      case 'comfortable': return 'h-40';
      default: return 'h-28';
    }
  };

  const getTitleClass = () => {
    switch (viewMode) {
      case 'spacious': return 'text-fluid-h3';
      case 'comfortable': return 'text-fluid-body';
      default: return 'text-sm';
    }
  };

  const getPriceClass = () => {
    switch (viewMode) {
      case 'spacious': return 'text-fluid-price-lg';
      case 'comfortable': return 'text-fluid-h3';
      default: return 'text-fluid-price-sm';
    }
  };

  const getLabelClass = () => {
    switch (viewMode) {
      case 'spacious': return 'text-xs';
      case 'comfortable': return 'text-[10px]';
      default: return 'text-[9px]';
    }
  };

  const getTrophySizeClass = () => {
    switch (viewMode) {
      case 'spacious': return 'w-7 h-7 p-1.5';
      case 'comfortable': return 'w-6 h-6 p-1';
      default: return 'w-5 h-5 p-1';
    }
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
  const currentNumericBid = parseFloat(bidAmount.replace(/,/g, '')) || 0;
  const isWinningAmount = item.isPublicBid 
    ? (item.currentHighBid 
        ? currentNumericBid > item.currentHighBid 
        : currentNumericBid >= item.askPrice)
    : false;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
          <motion.div
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
            className={`group relative border-none bg-slate-50 rounded-lg overflow-hidden flex flex-col will-change-transform cursor-pointer transition-[box-shadow,ring] duration-500
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
                      <div className="relative w-full h-full">
                        <img
                          id={`item-card-${item.id}-image-${i}`}
                          src={src}
                          alt={`${item.title} - ${i + 1}`}
                          className="object-cover w-full h-full"
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
                  <span className="text-[10px] font-black tracking-tight leading-none truncate max-w-[120px]">
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
                  <span className="text-[10px] font-black tracking-tight leading-none tabular-nums">{timeLeft}</span>
                </motion.div>
                
                {/* Condition Badge */}
                <div className="bg-white/90 backdrop-blur-md text-slate-900 px-2 py-1 rounded-md flex items-center shadow-lg border border-slate-200 mt-1">
                  <span className="text-[9px] font-black uppercase tracking-tighter leading-none">
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
                    <span className="text-[10px] font-bold tracking-wide tabular-nums leading-none">
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
            <CardContent className="p-2 flex flex-col gap-1.5 flex-1 z-10 transition-all">
              {/* Title */}
              <h3 id={`item-card-${item.id}-title`} className={`font-bold ${getTitleClass()} text-slate-900 leading-tight ${viewMode === 'compact' ? 'line-clamp-1' : 'line-clamp-2'} transition-all`} title={item.title}>
                {item.title}
              </h3>

              {/* Seller Info - Between Title and Price */}
              {(viewMode === 'spacious' || viewMode === 'comfortable') && (
                <div className={`flex items-center gap-2 mb-2 animate-in fade-in duration-300 ${viewMode === 'comfortable' ? 'mt-0.5' : 'mt-1'}`}>
                  {viewMode === 'spacious' && seller?.avatar && (
                    <div className="h-5 w-5 rounded-full bg-slate-200 overflow-hidden shrink-0">
                      <img src={seller.avatar} alt={seller.name} className="h-full w-full object-cover" />
                    </div>
                  )}
                  
                  <span className={`text-[10px] font-bold text-slate-700 truncate leading-none ${viewMode === 'comfortable' ? 'text-slate-500 max-w-[80px]' : ''}`}>
                    {seller?.name || 'Unknown Seller'}
                  </span>
                  {seller?.isVerified && <VerifiedBadge size="sm" />}

                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="font-bold bg-yellow-50 text-yellow-700 border-yellow-200 py-0 px-1 text-[9px] shrink-0 h-3.5 flex items-center leading-none">
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

              {/* Price Row */}
              <div className="flex items-end justify-between transition-all">
                <div className="flex flex-col">
                  <span className={`${getLabelClass()} text-slate-600 font-bold uppercase tracking-wider transition-all`}>Asking</span>
                  <span id={`item-card-${item.id}-ask-price`} className={`${getPriceClass()} font-black text-slate-800 leading-none transition-all`}>
                    {displayPrice(item.askPrice)}
                  </span>
                </div>

                <div className="flex flex-col items-end transition-all">
                  <span className={`${getLabelClass()} text-slate-600 font-bold uppercase tracking-wider transition-all`}>
                    {item.isPublicBid ? "High Bid" : "Secret"}
                  </span>
                  <div className="flex items-center gap-1.5 transition-all">
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
                          className={`${getPriceClass()} font-black leading-none inline-block`}
                        >
                          {displayPrice(item.currentHighBid)}
                        </motion.span>
                        {item.currentHighBidderId === user?.id && (
                          <motion.div
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className={`bg-amber-100 text-amber-600 rounded-full flex items-center justify-center ${getTrophySizeClass()}`}
                            title="You are the high bidder!"
                          >
                            <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M18 2H6v2H2v7c0 2.21 1.79 4 4 4h1.09c.45 1.76 1.83 3.14 3.58 3.59V20H8v2h8v-2h-2.67v-1.41c1.75-.45 3.13-1.83 3.58-3.59H18c2.21 0 4-1.79 4-4V4h-4V2zM6 13c-1.1 0-2-.9-2-2V6h2v7zm14-2c0 1.1-.9 2-2 2h-2V6h2v5z"/>
                            </svg>
                          </motion.div>
                        )}
                      </div>
                    ) : (
                      <span id={`item-card-${item.id}-bid-count`} className={`${getPriceClass()} font-black text-blue-600 leading-none`}>
                        {item.bidCount} {item.bidCount === 1 ? 'Bid' : 'Bids'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Spacious Mode Description */}
              {viewMode === 'spacious' && (
                <div className="mt-2 mb-1 animate-in fade-in duration-300">
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-medium">
                    {item.description}
                  </p>
                </div>
              )}

              {/* Smart Stepper Input Row - Stacked Layout */}
              <div className="flex flex-col gap-2 mt-1">
                <div className="flex h-9 w-full">
                  <div className={`flex flex-1 border border-slate-300 rounded-md shadow-sm overflow-hidden ${user?.id === seller?.id ? 'opacity-50 bg-slate-100 grayscale' : ''}`}>
                    {/* Decrement Button - Large Touch Target */}
                    <button
                      id={`item-card-${item.id}-decrement-btn`}
                      onClick={(e) => handleSmartAdjust(e, -1)}
                      disabled={user?.id === seller?.id}
                      className="w-10 bg-slate-50 hover:bg-slate-100 border-r border-slate-200 flex items-center justify-center text-slate-600 hover:text-red-600 transition-colors active:bg-slate-200 disabled:cursor-not-allowed disabled:active:bg-slate-50"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M18 12H6" /></svg>
                    </button>

                    {/* Input */}
                    <div className="relative flex-1">
                      <AnimatePresence>
                        {showDelta && lastDelta !== null && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.5 }}
                            animate={{ opacity: 1, y: -40, scale: 1.2 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className={`absolute left-1/2 -translate-x-1/2 font-black text-sm z-50 pointer-events-none drop-shadow-md
                              ${lastDelta > 0 ? 'text-amber-600' : 'text-red-600'}`}
                          >
                            {lastDelta > 0 ? `+${lastDelta.toLocaleString()}` : lastDelta.toLocaleString()}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <motion.input
                        id={`item-card-${item.id}-bid-input`}
                        type="text"
                        value={bidAmount}
                        key={`input-${animTrigger}`}
                        initial={false}
                        disabled={user?.id === seller?.id}
                        animate={{  
                          scale: [1, 1.05],
                          x: (parseFloat(bidAmount.replace(/,/g, '')) < (item.isPublicBid && item.currentHighBid ? item.currentHighBid + getSmartStep(item.currentHighBid) : item.askPrice * 0.7)) ? [0, -5, 5, -5, 5, 0] : 0
                        }}
                        transition={{ 
                          scale: { duration: 0.2, repeat: 1, repeatType: "reverse" },
                          x: { duration: 0.2, type: "spring", stiffness: 500, damping: 20 }
                        }}
                        onClick={handleInputClick}
                        onKeyDown={handleKeyDown}
                        onChange={handleInputChange}
                        className={`w-full h-full text-center text-sm font-bold text-slate-900 focus:outline-none px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors duration-300 disabled:bg-transparent disabled:text-slate-500 disabled:cursor-not-allowed
                                ${(parseFloat(bidAmount.replace(/,/g, '')) < (item.isPublicBid && item.currentHighBid ? item.currentHighBid + getSmartStep(item.currentHighBid) : item.askPrice * 0.7)) ? 'bg-red-50 text-red-900' : 'bg-white'}
                              `}
                      />
                    </div>

                    {/* Increment Button - Large Touch Target */}
                    <button
                      id={`item-card-${item.id}-increment-btn`}
                      onClick={(e) => handleSmartAdjust(e, 1)}
                      disabled={user?.id === seller?.id}
                      className="w-10 bg-slate-50 hover:bg-slate-100 border-l border-slate-200 flex items-center justify-center text-slate-600 hover:text-amber-600 transition-colors active:bg-slate-200 disabled:cursor-not-allowed disabled:active:bg-slate-50"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v12m6-6H6" /></svg>
                    </button>
                  </div>
                </div>

                <button
                  id={`item-card-${item.id}-place-bid-btn`}
                  onClick={handleBid}
                  disabled={isSuccess || user?.id === seller?.id}
                  className={`w-full h-9 rounded-md flex items-center justify-center shadow-sm transition-all duration-300 active:scale-95 font-bold text-sm tracking-wide
                    ${isSuccess 
                      ? 'bg-amber-600 text-white scale-105' 
                      : user?.id === seller?.id
                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none active:scale-100'
                        : isHighBidder 
                          ? 'bg-orange-500 hover:bg-orange-600 text-white'
                          : hasPriorBid
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                >
                  {isSuccess ? (
                    <span id={`item-card-${item.id}-success-msg`} className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      Bid Placed!
                    </span>
                  ) : user?.id === seller?.id ? (
                    "Your Listing"
                  ) : isHighBidder ? (
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4" />
                      Raise Bid
                    </span>
                  ) : hasPriorBid ? (
                    <span className="flex items-center gap-1.5">
                      <Gavel className="w-4 h-4" />
                      Bid Again
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Gavel className="w-4 h-4" />
                      Place Bid
                    </span>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="sm:max-w-[500px] p-0 overflow-visible !bg-transparent !border-none !shadow-none rounded-none sm:block gap-0">
        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.8 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 150) {
              setIsDialogOpen(false);
            }
          }}
          className={`relative rounded-lg overflow-hidden w-full h-full max-h-[92dvh] sm:max-h-[85vh] flex flex-col cursor-auto
            ${showHalo ? 'p-[3.5px] bg-[#0ea5e9]' : 'p-0 bg-white'}
            ${showHalo && haloTheme === 'orange' ? 'bg-[#fbbf24]' : ''}
            ${showHalo && haloTheme === 'green' ? 'bg-[#16a34a]' : ''}
          `}
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
              </div>
            )}

            <div className="relative bg-white w-full h-full rounded-[calc(0.5rem-2px)] overflow-hidden flex flex-col z-10">
          {/* Custom Close Button - Premium Sticky Style */}
          <DialogClose asChild>
              <motion.button
                id={`close-listing-btn-${item.id}`}
                className="absolute top-4 right-4 z-[60] p-2.5 bg-white rounded-full shadow-xl text-slate-600 hover:text-red-500 focus:ring-0 focus:outline-none group"
              initial={{ opacity: 0, scale: 0.2, rotate: -45 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: "spring", damping: 15 }}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="h-4.5 w-4.5" />
              <span className="sr-only">Close</span>
            </motion.button>
          </DialogClose>

          {/* Mobile Drag Handle */}
          <div className="h-1.5 w-12 bg-slate-300 rounded-full mx-auto my-2 absolute top-1 left-1/2 -translate-x-1/2 z-20 sm:hidden" />
          
          <div 
            className="relative h-60 sm:h-72 w-full bg-slate-100 shrink-0 cursor-pointer"
            onClick={() => setShowFullscreen(true)}
          >
            {item.images.length > 1 ? (
              <div className="relative h-60 sm:h-72 w-full group/gallery">
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
                            className="object-cover w-full h-full"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                   <div className="absolute inset-0 flex items-center justify-between p-2 pointer-events-none opacity-0 group-hover/gallery:opacity-100 transition-opacity">
                      <CarouselPrevious 
                        className="pointer-events-auto h-8 w-8 bg-black/50 text-white border-none hover:bg-black/70 translate-y-0 static" 
                        variant="ghost"
                      />
                      <CarouselNext 
                        className="pointer-events-auto h-8 w-8 bg-black/50 text-white border-none hover:bg-black/70 translate-y-0 static" 
                        variant="ghost"
                      />
                    </div>
                </Carousel>

                  <div className="absolute bottom-16 left-0 right-0 flex justify-center gap-1.5 z-30 pointer-events-none">
                    {item.images.map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-1.5 rounded-full transition-all duration-300 ${i === currentImg ? 'w-6 bg-white shadow-sm' : 'w-1.5 bg-white/40'}`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <img
                  id={`item-card-${item.id}-image-single`}
                  src={item.images[0]}
                  alt={item.title}
                  className="object-cover w-full h-full"
                />
              )}

            {/* Expand Button - Always Visible, Repositioned to Bottom-Right */}
            <button
               className="absolute bottom-4 right-4 z-40 p-2.5 bg-white/90 hover:bg-white text-slate-800 rounded-full shadow-lg transition-all active:scale-90 border border-slate-200 backdrop-blur-sm"
               title="Expand to Fullscreen"
               onClick={(e) => {
                 e.stopPropagation();
                 setShowFullscreen(true);
               }}
            >
               <Maximize2 className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Main Scrollable Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain relative z-10 shadow-[0_-8px_20px_-10px_rgba(0,0,0,0.15)] border-t border-slate-100 p-4 space-y-4">
            {/* Header Content Area */}
            <div className="flex justify-between items-start gap-4">
               <DialogTitle className="text-2xl font-black text-slate-900 leading-tight">{item.title}</DialogTitle>
               <div className="flex gap-2 shrink-0">
                      {!item.isPublicBid && (
                        <Badge variant="secondary" className="font-bold bg-amber-500 text-white hover:bg-amber-600 border-none shadow-sm h-7">
                          <motion.div
                            animate={isSuccess ? { scale: [1, 1.4, 1] } : {}}
                            transition={{ duration: 0.5 }}
                            className="flex items-center"
                          >
                            <Lock className="h-3.5 w-3.5 mr-1" />
                          </motion.div>
                          Secret
                        </Badge>
                      )}
               </div>
            </div>

            {/* Price Info Grid & Timer - Expanded & Reduced Padding */}
            <div className="grid grid-cols-3 gap-0 bg-slate-50 rounded-xl border border-slate-100 relative overflow-hidden divide-x divide-slate-200">
              <div className="flex flex-col items-center justify-center py-2 px-1 text-center">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-0.5">Price</div>
                <div className="flex items-baseline gap-0.5 whitespace-nowrap">
                  <span className="text-xs font-bold text-slate-400">Rs.</span>
                  <span className="text-xl font-black text-slate-900 leading-none">{Math.round(item.askPrice).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center py-2 px-1 text-center">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-0.5">
                    {item.isPublicBid ? "High Bid" : "Bids"}
                </div>
                <div className={`flex items-baseline justify-center gap-0.5 whitespace-nowrap ${user && item.isPublicBid && item.currentHighBid && item.currentHighBidderId === user.id ? 'text-amber-600' : 'text-blue-600'}`}>
                  {item.isPublicBid && item.currentHighBid ? (
                    <>
                       <span className={`text-xs font-bold ${item.currentHighBidderId === user?.id ? 'text-amber-600/70' : 'text-blue-600/70'}`}>Rs.</span>
                       <span className="text-xl font-black leading-none">{Math.round(item.currentHighBid).toLocaleString()}</span>
                    </>
                  ) : (
                     <span className="text-xl font-black leading-none">
                        {item.bidCount} <span className="text-sm font-bold opacity-70 hidden sm:inline">{item.bidCount === 1 ? 'Bid' : 'Bids'}</span>
                     </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center justify-center py-2 px-1 text-center">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-0.5">Ends In</div>
                <div className={`text-xl font-black leading-none tabular-nums whitespace-nowrap ${isUrgent ? 'text-red-600' : 'text-slate-800'}`}>
                  {timeLeft}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <div className="flex justify-between items-baseline">
                <h4 className="text-sm font-bold text-slate-900">Description</h4>
                <button 
                  onClick={() => setShowFullDescription(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Expand
                </button>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed line-clamp-6">
                {item.description}
              </p>
            </div>

            <Dialog open={showFullDescription} onOpenChange={setShowFullDescription}>
              <DialogContent className="max-w-xl w-[90vw] max-h-[80vh] flex flex-col p-0 bg-white rounded-lg shadow-2xl border-none overflow-hidden sm:rounded-xl">
                 <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 backdrop-blur-sm sticky top-0 z-10">
                    <DialogTitle className="text-lg font-bold text-slate-900">Product Description</DialogTitle>
                    <DialogClose className="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                       <X className="h-5 w-5" />
                       <span className="sr-only">Close</span>
                    </DialogClose>
                 </div>
                 <div className="p-6 overflow-y-auto">
                    <p className="text-base text-slate-700 leading-loose whitespace-pre-wrap font-medium">
                      {item.description}
                    </p>
                 </div>
              </DialogContent>
            </Dialog>

            {/* Seller Info */}
            <div className="flex items-center gap-3 py-3 border-t border-b border-slate-100">
              <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden">
                {seller?.avatar && <img src={seller.avatar} alt={seller.name} className="h-full w-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-bold text-slate-900 text-sm truncate">{seller?.name || 'Unknown Seller'}</div>
                  {seller?.isVerified && <VerifiedBadge size="sm" />}
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="font-bold bg-yellow-50 text-yellow-700 border-yellow-200 py-0.5 px-1.5 text-[10px] shrink-0">
                      ⭐ <span className="ml-0.5">{seller?.rating || 0}</span>
                    </Badge>
                    {seller?.badges && seller.badges.some(b => b.category === 'seller') && (
                      <GamificationBadge 
                        badge={seller.badges.filter(b => b.category === 'seller').sort((a,b) => {
                          const tiers: Record<string, number> = { diamond: 3, gold: 2, silver: 1, bronze: 0 };
                          return (tiers[b.tier] || 0) - (tiers[a.tier] || 0);
                        })[0]} 
                        size="sm" 
                        showTooltip={true}
                        className="h-5 px-1.5 text-[10px]"
                      />
                    )}
                  </div>
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-1 mt-0.5 font-medium">
                  <MapPin className="h-3 w-3 text-red-500" />
                  <span className="truncate">{seller?.location ? getFuzzyLocationString(seller.location.address) : 'Unknown'}</span>
                </div>
                {!isOutside && (
                  <div className="text-xs text-slate-600 font-black flex items-center gap-1 mt-0.5 tabular-nums uppercase tracking-tighter">
                    {duration} min drive ({distance} km)
                  </div>
                )}
              </div>
              <div className="ml-auto shrink-0 flex flex-col gap-2">
                <Link
                  id={`item-card-view-details-btn-${item.id}`}
                  href={`/product/${item.id}`}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 font-bold text-xs"
                >
                  <ExternalLink className="h-4 w-4" />
                  Full Details
                </Link>
                <button
                  id={`toggle-watch-btn-${item.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWatch(item.id);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all duration-300 font-bold text-xs
                    ${isWatched 
                      ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                >
                  <Bookmark className={`h-4 w-4 ${isWatched ? 'fill-current' : ''}`} />
                  {isWatched ? 'Watching' : 'Watch'}
                </button>
              </div>
            </div>

            {/* Close Scrolling Content */}
               </div>


            {/* Sticky/Fixed Bidding Footer */}
            <div className="p-4 bg-white border-t border-slate-100 z-20 shrink-0 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
                <div className="flex flex-col gap-3">
                  <div className={`flex h-12 w-full border border-slate-300 rounded-lg shadow-sm overflow-hidden ${user?.id === seller?.id ? 'opacity-50 bg-slate-100 grayscale' : ''}`}>
                    {/* Decrement Button - Extra Large for Modal */}
                    <button
                      id={`modal-item-card-${item.id}-decrement-btn`}
                      onClick={(e) => handleSmartAdjust(e, -1)}
                      disabled={user?.id === seller?.id}
                      className="w-14 bg-slate-50 hover:bg-slate-100 border-r border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-600 transition-colors active:bg-slate-200 disabled:cursor-not-allowed disabled:active:bg-slate-50"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M18 12H6" /></svg>
                    </button>

                    {/* Input */}
                    <div className="relative flex-1">
                      <AnimatePresence>
                        {showDelta && lastDelta !== null && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.5 }}
                            animate={{ opacity: 1, y: -50, scale: 1.4 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className={`absolute left-1/2 -translate-x-1/2 font-black text-lg z-50 pointer-events-none drop-shadow-lg
                              ${lastDelta > 0 ? 'text-amber-600' : 'text-red-600'}`}
                          >
                            {lastDelta > 0 ? `+${lastDelta.toLocaleString()}` : lastDelta.toLocaleString()}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <motion.input
                        id={`modal-item-card-${item.id}-bid-input`}
                        type="text"
                        value={bidAmount}
                        key={`modal-input-${animTrigger}`}
                        initial={false}
                        disabled={user?.id === seller?.id}
                        animate={{ 
                          scale: [1, 1.05],
                          x: (parseFloat(bidAmount.replace(/,/g, '')) < (item.isPublicBid && item.currentHighBid ? item.currentHighBid + getSmartStep(item.currentHighBid) : item.askPrice * 0.7)) ? [0, -3, 3, -3, 3, 0] : 0
                        }}
                        transition={{ 
                          scale: { duration: 0.2, repeat: 1, repeatType: "reverse" },
                          x: { duration: 0.2 }
                        }}
                        onKeyDown={handleKeyDown}
                        onChange={handleInputChange}
                        className={`w-full h-full text-center text-xl font-bold text-slate-900 focus:outline-none px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors duration-300 disabled:bg-transparent disabled:text-slate-500 disabled:cursor-not-allowed
                              ${(parseFloat(bidAmount.replace(/,/g, '')) < (item.isPublicBid && item.currentHighBid ? item.currentHighBid + getSmartStep(item.currentHighBid) : item.askPrice * 0.7)) ? 'bg-red-50 text-red-900' : 'bg-white'}
                            `}
                      />
                    </div>

                    {/* Increment Button - Extra Large for Modal */}
                    <button
                      id={`modal-item-card-${item.id}-increment-btn`}
                      onClick={(e) => handleSmartAdjust(e, 1)}
                      disabled={user?.id === seller?.id}
                      className="w-14 bg-slate-50 hover:bg-slate-100 border-l border-slate-200 flex items-center justify-center text-slate-500 hover:text-amber-600 transition-colors active:bg-slate-200 disabled:cursor-not-allowed disabled:active:bg-slate-50"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v12m6-6H6" /></svg>
                    </button>
                  </div>

                  {/* Submit Bid Button */}
                  <button
                    id={`modal-item-card-${item.id}-place-bid-btn`}
                    onClick={(e) => handleBid(e)}
                    disabled={isSuccess || user?.id === seller?.id}
                    className={`h-12 w-full rounded-lg font-bold shadow-sm transition-all duration-300 active:scale-95 text-lg flex items-center justify-center
                      ${isSuccess 
                        ? 'bg-amber-600 text-white scale-105' 
                        : user?.id === seller?.id
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none active:scale-100'
                          : isHighBidder
                            ? 'bg-orange-500 hover:bg-orange-600 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                  >
                    {isSuccess ? (
                      <span className="flex items-center gap-2">
                         <motion.svg 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-6 h-6" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </motion.svg>
                        <span className="text-base">Placed!</span>
                      </span>
                    ) : user?.id === seller?.id ? (
                      "Your Listing"
                    ) : isHighBidder ? (
                      <span className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Raise Bid
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Gavel className="w-5 h-5" />
                        Place Bid
                      </span>
                    )}
                  </button>
                </div>
            </div>
          </div>
        </motion.div>
      </DialogContent>

      {/* Fullscreen Gallery View */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent 
          showCloseButton={false} 
          className="fixed inset-0 z-[100] w-screen h-screen m-0 p-0 bg-black/95 border-none shadow-none top-0 left-0 translate-x-0 translate-y-0 rounded-none flex items-center justify-center overflow-hidden max-w-none sm:max-w-none"
        >
            <DialogTitle className="sr-only">Full Screen Product Gallery</DialogTitle>
            <DialogClose className="absolute top-6 right-6 z-[110] p-3 text-white/60 hover:text-white bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all active:scale-90 border border-white/10 shadow-2xl">
              <X className="h-8 w-8" />
              <span className="sr-only">Close</span>
            </DialogClose>
            
            <div className="relative w-full h-full flex items-center justify-center p-0">
               <AnimatePresence mode="wait">
                 <motion.img 
                    key={currentImg}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    src={item.images[currentImg]} 
                    className="max-w-full max-h-full w-auto h-auto object-contain pointer-events-none select-none"
                 />
               </AnimatePresence>

               {/* Fullscreen Navigation */}
               {item.images.length > 1 && (
                 <>
                  {currentImg > 0 && (
                    <button 
                      className="absolute left-4 sm:left-10 p-4 bg-white/5 hover:bg-white/10 text-white rounded-full backdrop-blur-xl border border-white/10 transition-all active:scale-90 z-[110]"
                      onClick={() => setCurrentImg(prev => prev - 1)}
                    >
                      <ChevronLeft className="h-10 w-10" />
                    </button>
                  )}
                  {currentImg < item.images.length - 1 && (
                    <button 
                      className="absolute right-4 sm:right-10 p-4 bg-white/5 hover:bg-white/10 text-white rounded-full backdrop-blur-xl border border-white/10 transition-all active:scale-90 z-[110]"
                      onClick={() => setCurrentImg(prev => prev + 1)}
                    >
                      <ChevronRight className="h-10 w-10" />
                    </button>
                  )}
                  <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-3 z-[110]">
                    {item.images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImg(i)}
                        className={`h-2 rounded-full transition-all duration-300 ${i === currentImg ? 'w-10 bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'w-2 bg-white/30 hover:bg-white/50'}`}
                      />
                    ))}
                  </div>
                 </>
               )}
            </div>
        </DialogContent>
      </Dialog>

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
    </Dialog>
  );
});

ItemCard.displayName = "ItemCard";
export default ItemCard;
