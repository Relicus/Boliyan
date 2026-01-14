"use client";

import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useState, useMemo, useEffect } from "react";
import { Item, User } from "@/types";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin, Lock, Clock, X, Bookmark, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { useApp } from "@/lib/store";

interface ProductDetailsModalProps {
  item: Item;
  seller: User;
  isOpen: boolean;
  onClose: (open: boolean) => void;
}

export default function ProductDetailsModal({ item, seller, isOpen, onClose }: ProductDetailsModalProps) {
  const { placeBid, user, bids, toggleWatch, watchedItemIds } = useApp();
  const isWatched = watchedItemIds.includes(item.id);

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
  const [now, setNow] = useState(Date.now());
  const [animTrigger, setAnimTrigger] = useState(0); 
  const [lastDelta, setLastDelta] = useState<number | null>(null);
  const [showDelta, setShowDelta] = useState(false);
  const [currentImg, setCurrentImg] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const isHighBidder = item.isPublicBid && item.currentHighBidderId === user.id;
  const showHalo = isHighBidder || isWatched;
  const haloTheme = isHighBidder ? 'orange' : 'blue';

  useEffect(() => {
    if (isOpen) {
        // Reset state when opening
        setBidAmount(initialBid.toLocaleString());
        setIsSuccess(false);
        setError(false);
    }
  }, [isOpen, initialBid]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Stable "random" distance based on item ID
  const { distance, duration, timeLeft, isUrgent } = useMemo(() => {
    const hash = item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const dist = ((hash % 80) / 10 + 1.2).toFixed(1);
    const dur = Math.round(Number(dist) * 2.5); // Approx 2.5 mins per km
    
    // Time Left calculation
    const diff = new Date(item.expiryAt).getTime() - now;
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

    return { 
      distance: dist, 
      duration: dur, 
      timeLeft: timeStr,
      isUrgent
    };
  }, [item.id, item.expiryAt, now]);

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
    e?.stopPropagation();
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
    const x = e ? e.clientX / window.innerWidth : 0.5;
    const y = e ? e.clientY / window.innerHeight : 0.5;

    confetti({
      origin: { x, y },
      particleCount: 150,
      spread: 70,
      gravity: 1.2,
      scalar: 1,
      zIndex: 9999,
      colors: ['#fbbf24', '#f59e0b', '#d97706', '#ffffff'],
    });

    // Close after delay
    setTimeout(() => {
      onClose(false);
      setIsSuccess(false);
    }, 1500); 
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="sm:max-w-[500px] p-0 overflow-visible !bg-transparent !border-none !shadow-none rounded-none sm:block gap-0">
        <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.8 }}
            onDragEnd={(_, info) => {
            if (info.offset.y > 150) {
                onClose(false);
            }
            }}
            className={`relative rounded-lg overflow-hidden w-full h-full max-h-[85vh] sm:max-h-full sm:h-auto flex flex-col cursor-auto
            ${showHalo ? 'p-[3.5px] bg-[#0ea5e9]' : 'p-0 bg-white'}
            ${showHalo && haloTheme === 'orange' ? 'bg-[#fbbf24]' : ''}
          `}
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

            <div className="relative bg-white w-full h-full rounded-[calc(0.5rem-2px)] overflow-hidden flex flex-col z-10">
            {/* Custom Close Button */}
            <DialogClose asChild>
                <motion.button
                id={`close-listing-btn-${item.id}`}
                className="absolute top-4 right-4 z-[60] p-2.5 bg-white rounded-full shadow-xl text-slate-600 hover:text-red-500 focus:ring-0 focus:outline-none group"
                initial={{ opacity: 0, scale: 0.2, rotate: -45 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: "spring", damping: 15 }}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onClose(false)}
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
                <div 
                  id={`modal-gallery-${item.id}`} 
                  className="flex h-full w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth"
                  onScroll={(e) => {
                    const el = e.currentTarget;
                    const index = Math.round(el.scrollLeft / el.clientWidth);
                    if (index !== currentImg) setCurrentImg(index);
                  }}
                >
                  {item.images.map((src, i) => (
                    <div 
                      key={i} 
                      className="relative h-full w-full shrink-0 snap-center flex items-center justify-center overflow-hidden"
                    >
                      <img
                        src={src}
                        alt={`${item.title} - ${i + 1}`}
                        className="object-cover w-full h-full"
                      />
                      {/* Clickable regions for shifting - Desktop Only */}
                      <div className="absolute inset-0 hidden sm:flex">
                        <div 
                          className="w-1/2 h-full cursor-[w-resize]" 
                          onClick={(e) => {
                            e.stopPropagation();
                            const el = document.getElementById(`modal-gallery-${item.id}`);
                            if (el) el.scrollBy({ left: -el.clientWidth, behavior: 'smooth' });
                          }}
                        />
                        <div 
                          className="w-1/2 h-full cursor-[e-resize]" 
                          onClick={(e) => {
                            e.stopPropagation();
                            const el = document.getElementById(`modal-gallery-${item.id}`);
                            if (el) el.scrollBy({ left: el.clientWidth, behavior: 'smooth' });
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Left/Right Overlays (Chevrons) - Desktop Hover Only */}
                {currentImg > 0 && (
                  <button
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-30 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-xl border border-white/10 shadow-lg transition-all active:scale-95"
                    onClick={(e) => {
                      e.stopPropagation();
                      const el = document.getElementById(`modal-gallery-${item.id}`);
                      if (el) el.scrollBy({ left: -el.clientWidth, behavior: 'smooth' });
                    }}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                {currentImg < item.images.length - 1 && (
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-30 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-xl border border-white/10 shadow-lg transition-all active:scale-95"
                    onClick={(e) => {
                      e.stopPropagation();
                      const el = document.getElementById(`modal-gallery-${item.id}`);
                      if (el) el.scrollBy({ left: el.clientWidth, behavior: 'smooth' });
                    }}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                )}



                {/* Dots Indicator */}
                <div className="absolute bottom-16 left-0 right-0 flex justify-center gap-1.5 z-30">
                  {item.images.map((_, i) => (
                    <button 
                      key={i} 
                      onClick={(e) => {
                        e.stopPropagation();
                        const el = document.getElementById(`modal-gallery-${item.id}`);
                        if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
                      }}
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === currentImg ? 'w-6 bg-white shadow-sm' : 'w-1.5 bg-white/40 hover:bg-white/60'}`}
                    />
                  ))}
                </div>
              </div>
            ) : (
                <img
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

            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(85vh-200px)] sm:max-h-none overscroll-contain relative z-10 shadow-[0_-8px_20px_-10px_rgba(0,0,0,0.15)] border-t border-slate-100">
                {/* Header Content Area */}
                <div className="flex justify-between items-start gap-4">
                   <DialogTitle className="text-2xl font-black text-slate-900 leading-tight">{item.title}</DialogTitle>
                   <div className="flex gap-2 shrink-0">
                      {!item.isPublicBid && (
                        <Badge variant="secondary" className="font-bold bg-amber-500 text-white hover:bg-amber-600 border-none shadow-sm h-7">
                          <Lock className="h-3.5 w-3.5 mr-1" />
                          Secret
                        </Badge>
                      )}
                   </div>
                </div>
            {/* Price Info Grid & Timer */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 relative overflow-hidden">

                <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Price</span>
                <div className="text-xl font-black text-slate-800 leading-tight">{Math.round(item.askPrice).toLocaleString()}</div>
                </div>
                <div className="flex flex-col justify-center text-center border-x border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                    {item.isPublicBid ? "High Bid" : "Bids"}
                </span>
                <div className={`text-xl font-black leading-tight ${item.isPublicBid && item.currentHighBid && item.currentHighBidderId === user.id ? 'text-amber-600' : 'text-blue-600'}`}>
                    {item.isPublicBid && item.currentHighBid
                    ? Math.round(item.currentHighBid).toLocaleString()
                    : `${item.bidCount} ${item.bidCount === 1 ? 'Bid' : 'Bids'}`
                    }
                </div>
                </div>
                <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Ends In</span>
                <div className={`text-xl font-black leading-tight text-right tabular-nums ${isUrgent ? 'text-red-600' : 'text-slate-800'}`}>
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
                <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5 tabular-nums">
                  {duration} min drive ({distance} km)
                </div>
                </div>
                <div className="ml-auto shrink-0">
                <button
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

            {/* Smart Stepper Bidding Section in Modal */}
            <div className="space-y-3 pb-4 sm:pb-0">
                {user.id === seller.id ? (
                 <div className="w-full h-12 bg-slate-100 text-slate-400 font-bold text-base rounded-md flex items-center justify-center border border-slate-200 cursor-not-allowed select-none">
                    You own this listing
                 </div>
                ) : (
                <div className="flex h-12">
                <div className="flex flex-1 border border-slate-300 rounded-l-md shadow-sm overflow-hidden">
                    {/* Decrement Button */}
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

                    {/* Increment Button */}
                    <button
                    onClick={(e) => handleSmartAdjust(e, 1)}
                    className="w-14 bg-slate-50 hover:bg-slate-100 border-l border-slate-200 flex items-center justify-center text-slate-500 hover:text-amber-600 transition-colors active:bg-slate-200"
                    >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v12m6-6H6" /></svg>
                    </button>
                </div>

                {/* Submit Bid Button */}
                <button
                    onClick={(e) => handleBid(e)}
                    disabled={isSuccess}
                    className={`px-6 rounded-r-md font-bold shadow-sm transition-all duration-300 active:scale-95 text-lg min-w-[120px] flex items-center justify-center
                    ${isSuccess 
                        ? 'bg-amber-600 text-white scale-105' 
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
                    ) : "Bid"}
                </button>
                </div>
                )}
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
    </Dialog>
  );
}
