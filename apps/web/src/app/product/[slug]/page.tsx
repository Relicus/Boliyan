"use client";

import { use, useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, MapPin, Lock, Clock, Bookmark, Maximize2, Share2, Zap, ArrowLeft } from "lucide-react";
import { useApp } from "@/lib/store";
import { useBidding } from "@/hooks/useBidding";
import { getFuzzyLocationString, calculatePrivacySafeDistance } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { VerifiedBadge } from "@/components/common/VerifiedBadge";
import { GamificationBadge } from "@/components/common/GamificationBadge";
import { toast } from "sonner";
import { Item, User } from "@/types";
import { supabase } from "@/lib/supabase";
import { transformListingToItem, ListingWithSeller } from "@/lib/transform";

function ProductContent({ item, seller }: { item: Item; seller: User }) {
  const router = useRouter();
  const { user, toggleWatch, watchedItemIds } = useApp();
  const isWatched = watchedItemIds.includes(item.id);

  const {
    bidAmount,
    error,
    isSuccess,
    animTrigger,
    lastDelta,
    showDelta,
    handleSmartAdjust,
    handleBid,
    handleKeyDown,
    handleInputChange,
    getSmartStep
  } = useBidding(item, seller, () => {});

  const [now, setNow] = useState(() => Date.now());
  const [currentImg, setCurrentImg] = useState(0);

  useEffect(() => {
    if (isSuccess) {
      toast.success("Bid placed successfully!", {
        description: `You placed a bid of Rs. ${bidAmount} on ${item?.title}`
      });
    }
  }, [isSuccess, bidAmount, item?.title]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { duration, timeLeft, isUrgent } = useMemo(() => {
    const { duration: dur } = user ? calculatePrivacySafeDistance(user.location, seller.location) : { duration: 0 };
    const diff = new Date(item.expiryAt).getTime() - now;
    const hoursLeft = Math.max(0, Math.floor(diff / 3600000));
    const minsLeft = Math.max(0, Math.floor((diff % 3600000) / 60000));
    const secsLeft = Math.max(0, Math.floor((diff % 60000) / 1000));
    
    const timeStr = hoursLeft >= 24 
      ? `${Math.floor(hoursLeft / 24)}d ${hoursLeft % 24}h`
      : `${hoursLeft}h ${minsLeft}m ${secsLeft}s`;

    return { 
      duration: dur, 
      timeLeft: timeStr,
      isUrgent: hoursLeft < 2
    };
  }, [item, seller, now, user]);

  const isHighBidder = user && item.isPublicBid && item.currentHighBidderId === user.id;
  const isSeller = user?.id === seller.id;

  return (
    <div id={`product-page-${item.slug || item.id}`} className="min-h-screen bg-slate-50/50 pb-20">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <Button 
          id="back-to-marketplace-btn"
          variant="ghost" 
          onClick={() => router.push("/")}
          className="rounded-full hover:bg-slate-100 group"
        >
          <ArrowLeft className="h-5 w-5 mr-2 transition-transform group-hover:-translate-x-1" />
          <span className="font-bold">Marketplace</span>
        </Button>

        <div className="flex gap-2">
          <Button 
            id={`share-btn-${item.id}`}
            variant="outline" 
            size="icon" 
            className="rounded-full h-10 w-10"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: item.title, url: window.location.href });
              }
            }}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button 
            id={`watch-btn-${item.id}`}
            variant={isWatched ? "secondary" : "outline"} 
            size="icon" 
            className={`rounded-full h-10 w-10 transition-colors ${isWatched ? 'bg-blue-50 text-blue-600 border-blue-200' : ''}`}
            onClick={() => toggleWatch(item.id)}
          >
            <Bookmark className={`h-4 w-4 ${isWatched ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl mt-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Gallery */}
          <div className="lg:col-span-7 space-y-6">
            <div className="relative aspect-square sm:aspect-[4/3] rounded-3xl overflow-hidden bg-white shadow-xl border border-slate-100 group">
              <AnimatePresence mode="wait">
                <motion.img
                  id={`main-product-image`}
                  key={currentImg}
                  src={item.images[currentImg]}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </AnimatePresence>

              {/* Badges Overlay */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                 <div className="bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg border border-white/20">
                   <MapPin className="h-3.5 w-3.5 text-red-500" />
                   <span className="text-xs font-black tracking-tight">{getFuzzyLocationString(seller.location.address)}</span>
                 </div>
              </div>

              {/* Navigation Arrows */}
              {item.images.length > 1 && (
                <>
                  <button 
                    onClick={() => setCurrentImg(prev => (prev > 0 ? prev - 1 : item.images.length - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 hover:bg-white text-slate-800 rounded-full shadow-lg transition-all active:scale-90 border border-slate-100 backdrop-blur-sm opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button 
                    onClick={() => setCurrentImg(prev => (prev < item.images.length - 1 ? prev + 1 : 0))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 hover:bg-white text-slate-800 rounded-full shadow-lg transition-all active:scale-90 border border-slate-100 backdrop-blur-sm opacity-0 group-hover:opacity-100"
                  >
                    <Maximize2 className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {item.images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {item.images.map((src, i) => (
                  <button
                    id={`thumb-${i}`}
                    key={i}
                    onClick={() => setCurrentImg(i)}
                    className={`relative h-24 w-24 shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${currentImg === i ? 'border-blue-600 shadow-md ring-4 ring-blue-50' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={src} alt={`${item.title} thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Detailed Description */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Description</h2>
              <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap">
                {item.description}
              </p>
            </div>
          </div>

          {/* Right Column: Bidding & Info */}
          <div className="lg:col-span-5 space-y-6">
            <div 
              className={`bg-white rounded-3xl p-8 shadow-lg border border-slate-100 space-y-8 sticky top-24 transition-all
                ${isHighBidder ? 'ring-4 ring-amber-400' : ''}
              `}
            >
              {isHighBidder && (
                <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-center font-bold text-sm mb-4 animate-pulse flex items-center justify-center gap-2">
                  <Zap className="h-4 w-4 fill-current" />
                  You are the high bidder!
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 font-bold px-3 py-1">
                    {item.category}
                  </Badge>
                  <Badge variant="outline" className="bg-white text-slate-700 border-slate-200 font-bold px-3 py-1 uppercase tracking-wider text-xs">
                    {item.condition === 'new' && '🌟 New'}
                    {item.condition === 'like_new' && '✨ Mint'}
                    {item.condition === 'used' && '👌 Used'}
                    {item.condition === 'fair' && '🔨 Fair'}
                  </Badge>
                  {!item.isPublicBid && (
                    <Badge variant="secondary" className="bg-amber-500 text-white font-bold px-3 py-1 flex items-center gap-1.5 border-none">
                      <Lock className="h-3.5 w-3.5" />
                      Secret Bids
                    </Badge>
                  )}
                </div>
                <h1 className="text-fluid-h1 font-black text-slate-900 leading-tight">
                  {item.title}
                </h1>
              </div>

              {/* Price Grid */}
              <div className="grid grid-cols-3 gap-6 py-6 border-y border-slate-50">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ask Price</span>
                  <div className="text-fluid-h2 font-black text-slate-800">Rs. {Math.round(item.askPrice).toLocaleString()}</div>
                </div>
                <div className="space-y-1 text-center border-x border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    {item.isPublicBid ? "High Bid" : "Bids"}
                  </span>
                  <div className={`text-2xl font-black ${item.isPublicBid && item.currentHighBid ? 'text-blue-600' : 'text-slate-500'}`}>
                    {item.isPublicBid && item.currentHighBid
                      ? `Rs. ${Math.round(item.currentHighBid).toLocaleString()}`
                      : `${item.bidCount} Bids`
                    }
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ends In</span>
                  <div className={`text-2xl font-black tabular-nums ${isUrgent ? 'text-red-500 animate-pulse' : 'text-slate-800'}`}>
                    {timeLeft}
                  </div>
                </div>
              </div>

              {/* Bidding Section */}
              <div className="space-y-4 pt-4">
                <div className="flex flex-col gap-4">
                  <div className="flex h-16 w-full">
                    <div className={`flex flex-1 border-2 border-slate-200 rounded-l-2xl shadow-sm overflow-hidden transition-colors focus-within:border-blue-500 ${isSeller ? 'opacity-50 grayscale bg-slate-100' : 'bg-slate-50'}`}>
                      <button
                        id="decrement-bid-btn"
                        onClick={(e) => handleSmartAdjust(e, -1)}
                        disabled={isSeller}
                        className="w-16 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-red-600 transition-colors active:bg-slate-300"
                      >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M18 12H6" /></svg>
                      </button>

                      <div className="relative flex-1 bg-white">
                        <AnimatePresence>
                          {showDelta && lastDelta !== null && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.5 }}
                              animate={{ opacity: 1, y: -60, scale: 1.5 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className={`absolute left-1/2 -translate-x-1/2 font-black text-xl z-50 pointer-events-none drop-shadow-xl
                                ${lastDelta > 0 ? 'text-amber-600' : 'text-red-600'}`}
                            >
                              {lastDelta > 0 ? `+${lastDelta.toLocaleString()}` : lastDelta.toLocaleString()}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <motion.input
                          id="bid-input"
                          type="text"
                          value={bidAmount}
                          key={`input-${animTrigger}`}
                          initial={false}
                          disabled={isSeller}
                          animate={{ 
                            scale: [1, 1.02, 1],
                            x: (parseFloat(bidAmount.replace(/,/g, '')) < (item.isPublicBid && item.currentHighBid ? item.currentHighBid + getSmartStep(item.currentHighBid) : item.askPrice * 0.7)) ? [0, -4, 4, -4, 4, 0] : 0
                          }}
                          transition={{ duration: 0.2 }}
                          onKeyDown={handleKeyDown}
                          onChange={handleInputChange}
                          className="w-full h-full text-center text-2xl font-black text-slate-900 focus:outline-none px-4 bg-transparent"
                        />
                      </div>

                      <button
                        id="increment-bid-btn"
                        onClick={(e) => handleSmartAdjust(e, 1)}
                        disabled={isSeller}
                        className="w-16 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-amber-600 transition-colors active:bg-slate-300"
                      >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M12 6v12m6-6H6" /></svg>
                      </button>
                    </div>

                    <Button
                      id="place-bid-btn"
                      onClick={handleBid}
                      disabled={isSuccess || isSeller}
                      className={`h-16 px-10 rounded-l-none rounded-r-2xl font-black text-xl shadow-lg transition-all active:scale-95 min-w-[160px]
                        ${isSuccess 
                          ? 'bg-amber-600 text-white hover:bg-amber-700' 
                          : isSeller
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                      {isSuccess ? "Placed!" : isSeller ? "Your Item" : "Place Bid"}
                    </Button>
                  </div>
                  {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}
                </div>
              </div>

              {/* Seller Card */}
              <div className="bg-slate-50 rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-white p-0.5 shadow-sm overflow-hidden shrink-0 border border-slate-200">
                    <img src={seller.avatar} alt={seller.name} className="h-full w-full object-cover rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                       <h3 className="font-bold text-slate-900 text-lg truncate">{seller.name}</h3>
                       {seller.isVerified && <VerifiedBadge size="md" />}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 font-bold px-2 py-0.5 text-xs">
                        ⭐ {seller.rating}
                      </Badge>
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-tight">({seller.reviewCount} Reviews)</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                   <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                      <MapPin className="h-4 w-4 text-red-500" />
                      <span className="truncate">{getFuzzyLocationString(seller.location.address)}</span>
                   </div>
                   <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span>{duration} min drive</span>
                   </div>
                </div>

                <div className="flex gap-2 pt-2">
                   {seller.badges?.slice(0, 2).map((badge, idx) => (
                      <GamificationBadge key={idx} badge={badge} size="md" className="flex-1" />
                   ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  // In Next.js App Router dynamic segments, the key matches the folder name [slug]
  // BUT: The params object passed might still be using the old key if we only renamed the folder 
  // and didn't restart the dev server or if Next.js caches the route param names.
  // However, `params` is typed as { id: string } in the prop definition above which might be wrong now.
  // Let's type it loosely to inspect what we get, or safely assume it maps to [slug] -> params.slug
  
  // Actually, wait. The prop definition `params: Promise<{ id: string }>` was from the old code.
  // Since I renamed the folder to `[slug]`, the param key will be `slug`.
  // I need to update the type definition and usage.
  
  const resolvedParams = use(params) as unknown as { slug?: string; id?: string };
  const slugOrId = resolvedParams.slug || resolvedParams.id || '';
  
  const router = useRouter();
  const { items, getUser } = useApp();
  
  // 1. Determine if param is UUID (Legacy ID) or Slug
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
  
  // 2. Try Global Store first (fastest)
  const storeItem = items.find((i) => 
    isUUID ? i.id === slugOrId : i.slug === slugOrId
  );
  
  // 3. Local State for direct fetch fallback
  const [fetchedItem, setFetchedItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(!storeItem);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (storeItem) {
      setIsLoading(false);
      return;
    }

    const fetchItem = async () => {
      setIsLoading(true);
      try {
        let query = supabase.from('marketplace_listings').select('*');
        
        if (isUUID) {
            query = query.eq('id', slugOrId);
        } else {
            query = query.eq('slug', slugOrId);
        }

        const { data, error } = await query.single();

        if (error || !data) {
          console.error("Error fetching item:", error);
          setFetchError(true);
        } else {
          // Transform using the same logic as the grid
          const newItem = transformListingToItem(data as unknown as ListingWithSeller);
          setFetchedItem(newItem);
        }
      } catch (err) {
        console.error("Exception fetching item:", err);
        setFetchError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [slugOrId, storeItem, isUUID]);

  // Combined Item
  const item = storeItem || fetchedItem;
  // Seller is embedded in the item by transformListingToItem, or we try getUser if it's missing (legacy)
  const seller = item?.seller || (item ? getUser(item.sellerId) : null);

  if (isLoading) {
    return (
       <div className="flex flex-col items-center justify-center min-h-screen gap-4">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
         <p className="text-slate-500 font-medium">Loading details...</p>
       </div>
    );
  }

  if (fetchError || !item || !seller) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Item not found</h1>
        <Button onClick={() => router.push("/")} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Marketplace
        </Button>
      </div>
    );
  }

  return <ProductContent item={item} seller={seller} />;
}
