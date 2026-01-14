import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useState, useMemo, useEffect } from "react";
import { Item, User } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin, Lock, Globe, Clock, X, Ribbon } from "lucide-react";
import { useApp } from "@/lib/store";

interface ItemCardProps {
  item: Item;
  seller: User;
  viewMode?: 'compact' | 'comfortable' | 'spacious';
}

export default function ItemCard({ item, seller, viewMode = 'compact' }: ItemCardProps) {
  const { placeBid, user, bids, toggleWatch, watchedItemIds } = useApp();
  const isWatched = watchedItemIds.includes(item.id);

  // Helper for compact price display (e.g. 185.5k)
  // Helper for price display
  const formatDisplayPrice = (price: number) => {
    if (viewMode === 'spacious') {
      return Math.round(price).toLocaleString();
    }
    return (price / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  };

  // Smart Step Logic
  const getSmartStep = (price: number) => {
    if (price >= 100000) return 1000;
    if (price >= 10000) return 500;
    return 100;
  };

  // Initialize with Ask Price or Current High Bid
  const initialBid = item.isPublicBid && item.currentHighBid
    ? item.currentHighBid + getSmartStep(item.currentHighBid)
    : item.askPrice;

  const [bidAmount, setBidAmount] = useState<string>(initialBid.toLocaleString());
  const [error, setError] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isOutbidTrigger, setIsOutbidTrigger] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [animTrigger, setAnimTrigger] = useState(0); 
  const [lastDelta, setLastDelta] = useState<number | null>(null);
  const [showDelta, setShowDelta] = useState(false);

  // Watch for outbid events (only if user has an existing bid)
  useEffect(() => {
    const hasUserBid = bids.some(b => b.itemId === item.id && b.bidderId === user.id);
    if (hasUserBid && item.currentHighBid && item.currentHighBidderId !== user.id) {
       setIsOutbidTrigger(true);
       const timer = setTimeout(() => setIsOutbidTrigger(false), 800);
       return () => clearTimeout(timer);
    }
  }, [item.currentHighBid, item.currentHighBidderId, user.id, bids, item.id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Stable "random" distance based on item ID to prevent hydration mismatch
  const { distance, duration, timeLeft, statusColor, isUrgent } = useMemo(() => {
    const hash = item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const dist = ((hash % 80) / 10 + 1.2).toFixed(1);
    const dur = Math.round(Number(dist) * 2.5); // Approx 2.5 mins per km
    
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
      timeLeft: timeStr,
      listingType: type,
      statusColor,
      isUrgent
    };
  }, [item.id, item.expiryAt, item.createdAt, now]);

  const handleSmartAdjust = (e: React.MouseEvent, direction: 1 | -1) => {
    e.stopPropagation();
    const current = parseFloat(bidAmount.replace(/,/g, '')) || 0;
    const step = getSmartStep(current);
    const delta = step * direction;
    
    // We allow the price to drop into the 'error' zone so the user gets visual feedback
    const newValue = Math.max(0, current + delta);
    
    setBidAmount(newValue.toLocaleString());
    setLastDelta(delta);
    setShowDelta(true);
    setAnimTrigger(prev => prev + 1);
    
    // Auto-hide delta after animation
    setTimeout(() => setShowDelta(false), 800);
  };

  const handleBid = (e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevent dialog from opening when clicking bid button
    const amount = parseFloat(bidAmount.replace(/,/g, ''));
    
    // Minimum bid is 70% of asking price for sealed bids,
    // or currentHighBid for public bids (must be higher than current)
    let minBid = item.askPrice * 0.7;
    if (item.isPublicBid && item.currentHighBid) {
      minBid = item.currentHighBid + getSmartStep(item.currentHighBid);
    }

    if (isNaN(amount) || amount < minBid) {
      setError(true);
      setTimeout(() => setError(false), 2000);
      return;
    }

    // Optimistic UI Success
    placeBid(item.id, amount, item.isPublicBid ? 'public' : 'private');
    setIsSuccess(true);

    // Automatically increase the bid price in input box by 1 step for the "Next Bid"
    const nextAmount = amount + getSmartStep(amount);
    setBidAmount(nextAmount.toLocaleString());

    // Confetti Effect
    // If event exists, spawn from click position, otherwise center
    const x = e ? e.clientX / window.innerWidth : 0.5;
    const y = e ? e.clientY / window.innerHeight : 0.5;

    confetti({
      origin: { x, y },
      particleCount: 150,
      spread: 70,
      gravity: 1.2,
      scalar: 1,
      zIndex: 9999, // Ensure it pops over the modal
      colors: ['#fbbf24', '#f59e0b', '#d97706', '#ffffff'], // Gold/Amber celebration theme
    });

    // Close after delay
    setTimeout(() => {
      setIsDialogOpen(false);
      setIsSuccess(false);
    }, 1500); 
  };

  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent dialog from opening when clicking input
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent 'e', 'E', '+', '-'
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, '');
    if (raw === '') {
      setBidAmount('');
      setError(false);
      return;
    }
    if (/^\d+$/.test(raw)) {
      setBidAmount(parseInt(raw, 10).toLocaleString());
      setError(false);
    }
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
      case 'spacious': return 'text-lg';
      case 'comfortable': return 'text-base';
      default: return 'text-sm';
    }
  };

  const getPriceClass = () => {
    switch (viewMode) {
      case 'spacious': return 'text-xl';
      case 'comfortable': return 'text-lg';
      default: return 'text-base';
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

  const isHighBidder = item.isPublicBid && item.currentHighBidderId === user.id;
  const showHalo = isHighBidder || isWatched;
  const haloTheme = isHighBidder ? 'orange' : 'blue';

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
            x: isOutbidTrigger ? [0, -4, 4, -4, 4, 0] : 0,
          }}
          transition={{
            x: { duration: 0.4 },
            scale: { type: "spring", stiffness: 300, damping: 20 }
          }}
          className={`group relative border-none bg-slate-50 rounded-lg overflow-hidden flex flex-col will-change-transform cursor-pointer transition-[box-shadow,ring] duration-500
            ${showHalo ? 'p-[3.5px]' : 'p-0 shadow-sm hover:shadow-md'}
            ${isOutbidTrigger ? 'ring-2 ring-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : ''}
            ${isSuccess ? 'ring-2 ring-green-500 shadow-[0_0_30px_rgba(34,197,94,0.4)]' : ''}
          `}
          style={{ backfaceVisibility: 'hidden', transformZ: 0 }}
        >
            {/* Victory Halo - State Based Animated Border Background */}
            {showHalo && (
              <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-lg">
                {/* Base Layer: Solid Vibrant Color */}
                <div 
                   className={`absolute inset-0 ${haloTheme === 'orange' ? 'bg-[#fbbf24]' : 'bg-[#0ea5e9]'}`}
                />
                
                {/* Top Layer: The Racing Bar (with less transparency for a fuller look) */}
                <motion.div 
                   className={`absolute inset-[-150%] 
                     ${haloTheme === 'orange' 
                        ? 'bg-[conic-gradient(from_0deg,transparent_0%,rgba(245,158,11,0.2)_20%,#f59e0b_45%,#ffffff_50%,#f59e0b_55%,rgba(245,158,11,0.2)_80%,transparent_100%)]' 
                        : 'bg-[conic-gradient(from_0deg,transparent_0%,rgba(14,165,233,0.2)_20%,#38bdf8_45%,#ffffff_50%,#38bdf8_55%,rgba(14,165,233,0.2)_80%,transparent_100%)]'
                     }`}
                   animate={{ rotate: 360 }}
                   transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
              </div>
            )}

            <Card className="border-none shadow-none bg-white h-full flex flex-col relative z-10 overflow-hidden rounded-[calc(var(--radius)-3px)]">
            <div
              id={`item-card-${item.id}-image-wrapper`}
              className={`relative ${getHeightClass()} bg-slate-100 overflow-hidden shrink-0 z-0`}
            >
              <img
                id={`item-card-${item.id}-image`}
                src={item.images[0]}
                alt={item.title}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
              />

              {/* Top-Left Location Badge */}
              <div id={`item-card-${item.id}-location-badge-wrapper`} className="absolute top-2 left-2 z-20 flex flex-col items-start gap-1">
                <div className="bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-md flex items-center gap-1.5 shadow-lg border border-white/20">
                  <MapPin className="h-3 w-3" />
                  <span className="text-[10px] font-black tracking-tight leading-none truncate max-w-[120px]">
                    {seller.location.address}
                  </span>
                </div>
              </div>

              {/* Top-Right Timer Badge */}
              <div className="absolute top-2 right-2 z-20 flex flex-col items-end gap-1">
                <motion.div
                  initial={false}
                  animate={isUrgent ? { scale: [1, 1.05, 1] } : {}}
                  transition={isUrgent ? { repeat: Infinity, duration: 1.5 } : {}}
                  className={`${statusColor} backdrop-blur-md text-white px-2 py-1 rounded-md flex items-center gap-1.5 shadow-lg border border-white/20`}
                >
                  <Clock className={`h-3 w-3 ${isUrgent ? 'animate-pulse' : ''}`} />
                  <span className="text-[10px] font-black tracking-tight leading-none">{timeLeft}</span>
                </motion.div>
              </div>

              {/* High Contrast Bottom Bar on Image */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/80 px-2 py-1.5 flex justify-between items-center z-10 transition-all">
                <div className="flex items-center gap-3 overflow-hidden min-w-0">
                  <div className={`flex items-center gap-2 ${getLabelClass()} text-white font-bold tracking-wide shrink-0`}>
                    <div className="flex items-center gap-0.5">
                      <MapPin className="h-3 w-3 text-red-500" />
                      {distance}km
                    </div>
                    <div className="flex items-center gap-0.5">
                       <Clock className="h-3 w-3 text-blue-400" />
                       {duration}min
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isWatched && (
                    <motion.div
                      id={`item-card-${item.id}-watch-indicator`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-blue-600/90 text-white p-1 rounded-md border border-blue-400/50"
                    >
                      <Ribbon className="h-3 w-3 fill-current" />
                    </motion.div>
                  )}
                  {!item.isPublicBid && (
                    <div className="bg-amber-600/90 text-white p-1 rounded-md border border-amber-400/50" title="Secret Bidding">
                       <Lock className="h-3 w-3" />
                    </div>
                  )}
                </div>
              </div>
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

              {/* Price Row */}
              <div className="flex items-end justify-between transition-all">
                <div className="flex flex-col">
                  <span className={`${getLabelClass()} text-slate-500 font-bold uppercase tracking-wider transition-all`}>Asking</span>
                  <span id={`item-card-${item.id}-ask-price`} className={`${getPriceClass()} font-black text-slate-800 leading-none transition-all`}>
                    {formatDisplayPrice(item.askPrice)}
                  </span>
                </div>

                <div className="flex flex-col items-end transition-all">
                  <span className={`${getLabelClass()} text-slate-500 font-bold uppercase tracking-wider transition-all`}>
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
                            color: item.currentHighBidderId === user.id ? "#d97706" : "#2563eb" 
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
                          {formatDisplayPrice(item.currentHighBid)}
                        </motion.span>
                        {item.currentHighBidderId === user.id && (
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
                      <span className={`${getPriceClass()} font-black text-blue-600 leading-none`}>
                        {item.bidCount} {item.bidCount === 1 ? 'Bid' : 'Bids'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Spacious Mode Details */}
              {viewMode === 'spacious' && (
                <div className="mt-2 mb-1 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="h-5 w-5 rounded-full bg-slate-200 overflow-hidden shrink-0">
                      <img src={seller.avatar} alt={seller.name} className="h-full w-full object-cover" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 truncate">{seller.name}</span>
                    <div className="flex items-center gap-0.5 ml-auto text-[10px] text-slate-500">
                      <MapPin className="h-2.5 w-2.5 text-red-500" />
                      <span className="truncate max-w-[80px]">{seller.location.address}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              )}

              {/* Smart Stepper Input Row - Stacked Layout */}
              <div className="flex flex-col gap-2 mt-1">
                <div className="flex h-9 w-full">
                  <div className="flex flex-1 border border-slate-300 rounded-md shadow-sm overflow-hidden">
                    {/* Decrement Button - Large Touch Target */}
                    <button
                      id={`item-card-${item.id}-decrement-btn`}
                      onClick={(e) => handleSmartAdjust(e, -1)}
                      className="w-10 bg-slate-50 hover:bg-slate-100 border-r border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-600 transition-colors active:bg-slate-200"
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
                        animate={{ 
                          scale: [1, 1.05, 1],
                          x: (parseFloat(bidAmount.replace(/,/g, '')) < (item.isPublicBid && item.currentHighBid ? item.currentHighBid + getSmartStep(item.currentHighBid) : item.askPrice * 0.7)) ? [0, -2, 2, -2, 2, 0] : 0
                        }}
                        transition={{ duration: 0.2 }}
                        onClick={handleInputClick}
                        onKeyDown={handleKeyDown}
                        onChange={handleInputChange}
                        className={`w-full h-full text-center text-sm font-bold text-slate-900 focus:outline-none px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors duration-300
                                ${(parseFloat(bidAmount.replace(/,/g, '')) < (item.isPublicBid && item.currentHighBid ? item.currentHighBid + getSmartStep(item.currentHighBid) : item.askPrice * 0.7)) ? 'bg-red-50 text-red-900' : 'bg-white'}
                              `}
                      />
                    </div>

                    {/* Increment Button - Large Touch Target */}
                    <button
                      id={`item-card-${item.id}-increment-btn`}
                      onClick={(e) => handleSmartAdjust(e, 1)}
                      className="w-10 bg-slate-50 hover:bg-slate-100 border-l border-slate-200 flex items-center justify-center text-slate-500 hover:text-amber-600 transition-colors active:bg-slate-200"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v12m6-6H6" /></svg>
                    </button>
                  </div>
                </div>

                <button
                  id={`item-card-${item.id}-place-bid-btn`}
                  onClick={handleBid}
                  disabled={isSuccess}
                  className={`w-full h-9 rounded-md flex items-center justify-center shadow-sm transition-all duration-300 active:scale-95 font-bold text-sm tracking-wide
                    ${isSuccess 
                      ? 'bg-amber-600 text-white scale-105' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                >
                  {isSuccess ? (
                    <span id={`item-card-${item.id}-success-msg`} className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      Bid Placed!
                    </span>
                  ) : "Place Bid"}
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
          className="relative bg-white rounded-lg overflow-hidden w-full h-full max-h-[85vh] sm:max-h-full sm:h-auto flex flex-col"
        >
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
          
          <div className="relative h-60 sm:h-72 w-full bg-slate-100 shrink-0">
            {item.images.length > 1 ? (
              <div id={`item-card-${item.id}-gallery`} className="flex h-full w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide">
                {item.images.map((src, i) => (
                  <img
                    key={i}
                    id={`item-card-${item.id}-image-${i}`}
                    src={src}
                    alt={`${item.title} - ${i + 1}`}
                    className="object-cover w-full h-full snap-center shrink-0"
                  />
                ))}
                {/* Visual indicator for horizontal scroll */}
                <div className="absolute bottom-16 right-4 bg-black/80 px-2 py-1 rounded text-[10px] text-white font-bold pointer-events-none">
                  1 / {item.images.length}
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
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 pt-16">
              <div className="flex justify-between items-end">
                <DialogTitle className="text-xl font-bold text-white leading-tight">{item.title}</DialogTitle>
              <div className="flex flex-col gap-2 items-end">
                <div className="flex gap-2">
                  {!item.isPublicBid && (
                    <Badge variant="secondary" className="font-bold bg-amber-500 text-white hover:bg-amber-600 border-none shadow-sm h-7">
                      <Lock className="h-3.5 w-3.5 mr-1" />
                      Secret
                    </Badge>
                  )}
                </div>
              </div>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(85vh-200px)] sm:max-h-none overscroll-contain">
            {/* Price Info Grid & Timer */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 relative overflow-hidden">

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Price</span>
                <div className="text-lg font-black text-slate-800 leading-tight">{Math.round(item.askPrice).toLocaleString()}</div>
              </div>
              <div className="text-center border-x border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                  {item.isPublicBid ? "High Bid" : "Bids"}
                </span>
                <div className={`text-lg font-black leading-tight ${item.isPublicBid && item.currentHighBid && item.currentHighBidderId === user.id ? 'text-amber-600' : 'text-blue-600'}`}>
                  {item.isPublicBid && item.currentHighBid
                    ? Math.round(item.currentHighBid).toLocaleString()
                    : `${item.bidCount} ${item.bidCount === 1 ? 'Bid' : 'Bids'}`
                  }
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Ends In</span>
                <div className={`text-lg font-black leading-tight flex items-center justify-end gap-1 ${isUrgent ? 'text-red-600' : 'text-slate-800'}`}>
                  <Clock className={`h-3.5 w-3.5 ${isUrgent ? 'animate-pulse' : ''}`} />
                  {timeLeft}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">Description</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* Seller Info */}
            <div className="flex items-center gap-3 py-3 border-t border-b border-slate-100">
              <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden">
                <img src={seller.avatar} alt={seller.name} className="h-full w-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-bold text-slate-900 text-sm truncate">{seller.name}</div>
                  <Badge variant="outline" className="font-bold bg-yellow-50 text-yellow-700 border-yellow-200 py-0.5 px-1.5 text-[10px] shrink-0">
                    ⭐ <span className="ml-0.5">{seller.rating}</span>
                  </Badge>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 text-red-500" />
                  <span className="truncate">{seller.location.address}</span>
                </div>
                <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3 text-blue-500" />
                  {duration} min drive ({distance} km)
                </div>
              </div>
              <div className="ml-auto shrink-0">
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
                  <Ribbon className={`h-4 w-4 ${isWatched ? 'fill-current' : ''}`} />
                  {isWatched ? 'Watching' : 'Watch'}
                </button>
              </div>
            </div>

            {/* Smart Stepper Bidding Section in Modal */}
            <div className="space-y-3 pb-4 sm:pb-0">
              <label className="block text-sm font-bold text-slate-900 mb-2">Place Your Bid</label>

              <div className="flex h-12">
                <div className="flex flex-1 border border-slate-300 rounded-l-md shadow-sm overflow-hidden">
                  {/* Decrement Button - Extra Large for Modal */}
                  <button
                    onClick={(e) => handleSmartAdjust(e, -1)}
                    className="w-14 bg-slate-50 hover:bg-slate-100 border-r border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-600 transition-colors active:bg-slate-200"
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
                      type="text"
                      value={bidAmount}
                      key={`modal-input-${animTrigger}`}
                      initial={false}
                      animate={{ 
                        scale: [1, 1.05, 1],
                        x: (parseFloat(bidAmount.replace(/,/g, '')) < (item.isPublicBid && item.currentHighBid ? item.currentHighBid + getSmartStep(item.currentHighBid) : item.askPrice * 0.7)) ? [0, -3, 3, -3, 3, 0] : 0
                      }}
                      transition={{ duration: 0.2 }}
                      onKeyDown={handleKeyDown}
                      onChange={handleInputChange}
                      className={`w-full h-full text-center text-xl font-bold text-slate-900 focus:outline-none px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors duration-300
                            ${(parseFloat(bidAmount.replace(/,/g, '')) < (item.isPublicBid && item.currentHighBid ? item.currentHighBid + getSmartStep(item.currentHighBid) : item.askPrice * 0.7)) ? 'bg-red-50 text-red-900' : 'bg-white'}
                          `}
                    />
                  </div>

                  {/* Increment Button - Extra Large for Modal */}
                  <button
                    onClick={(e) => handleSmartAdjust(e, 1)}
                    className="w-14 bg-slate-50 hover:bg-slate-100 border-l border-slate-200 flex items-center justify-center text-slate-500 hover:text-amber-600 transition-colors active:bg-slate-200"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v12m6-6H6" /></svg>
                  </button>
                </div>

                {/* Submit Bid Button */}
                {/* Submit Bid Button */}
                <button
                  onClick={(e) => handleBid(e)}
                  disabled={isSuccess}
                  className={`px-6 rounded-r-md font-bold shadow-sm transition-all duration-300 active:scale-95 text-lg min-w-[120px] flex items-center justify-center
                    ${isSuccess 
                      ? 'bg-amber-600 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                >
                  {isSuccess ? (
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
                  ) : "Bid"}
                </button>
              </div>

              {error && (
                <p className="text-xs text-red-500 font-bold">
                  {item.isPublicBid && item.currentHighBid 
                    ? `Bid must be higher than current high bid: ${(item.currentHighBid + getSmartStep(item.currentHighBid)).toLocaleString()}`
                    : `Bid must be at least ${Math.round(item.askPrice * 0.7).toLocaleString()}`
                  }
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </DialogContent>

    </Dialog>
  );
}
