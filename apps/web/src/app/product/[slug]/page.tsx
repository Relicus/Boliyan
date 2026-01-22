"use client";

import { use, useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, MapPin, Lock, Clock, Bookmark, Maximize2, Share2, Zap, ArrowLeft, Star } from "lucide-react";
import { useApp } from "@/lib/store";
import { useBidding } from "@/hooks/useBidding";
import { getFuzzyLocationString, calculatePrivacySafeDistance } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { BiddingControls } from "@/components/common/BiddingControls";
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
  const { user, toggleWatch, watchedItemIds, bids } = useApp();
  const isWatched = watchedItemIds.includes(item.id);

  const {
    bidAmount,
    error,
    isSuccess,
    animTrigger,
    handleSmartAdjust,
    handleBid,
    handleKeyDown,
    handleInputChange,
    getSmartStep,
    pendingConfirmation
  } = useBidding(item, seller, () => {});

  const [now, setNow] = useState(() => Date.now());
  const [currentImg, setCurrentImg] = useState(0);

  useEffect(() => {
    if (isSuccess) {
      toast.success("Bid placed successfully!", {
        description: (
          <span className="block mt-1">
            You placed a bid of <span className="font-bold text-emerald-600">Rs. {bidAmount}</span> on <span className="font-semibold text-blue-600">{item?.title}</span>
          </span>
        )
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
  const hasPriorBid = user && bids.some(b => b.itemId === item.id && b.bidderId === user.id);

  // Calculate min bid for component
  const minNextBid = item.isPublicBid && item.currentHighBid 
    ? item.currentHighBid + getSmartStep(item.currentHighBid)
    : item.askPrice * 0.7;

  return (
    <div id={`product-page-${item.id}`} className="min-h-screen bg-slate-50/50 pb-20">
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

      <main className="container mx-auto max-w-7xl mt-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Block 1: Gallery (Left Col Top) */}
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
          </div>

          {/* Block 2: Bidding (Right Col) */}
          <div className="lg:col-span-5 space-y-6 lg:row-span-2">
              <div 
                className={`bg-white rounded-3xl p-6 shadow-lg border border-slate-100 space-y-4 sticky top-24 transition-all
                  ${isHighBidder ? 'ring-4 ring-amber-400' : ''}
                `}
              >
                {isHighBidder && (
                  <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-center font-bold text-sm mb-2 animate-pulse flex items-center justify-center gap-2">
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
                  <h1 className="text-[clamp(1.5rem,4cqi,2.2rem)] font-black text-slate-900 leading-tight">
                    {item.title}
                  </h1>
                </div>

                {/* Unified Bidding Section - Stacked Layout */}
                <div className="flex flex-col gap-4 py-4 border-y border-slate-50">
                  {/* Row 1: Price & High Bid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-start justify-center p-3 pl-5 bg-slate-50 border-2 border-slate-100 rounded-2xl shadow-sm h-28">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Ask Price</span>
                      <div className="text-[clamp(1.25rem,5cqi,2rem)] font-black text-slate-800 leading-none">
                        Rs. {Math.round(item.askPrice).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex flex-col items-start justify-center p-3 pl-5 bg-slate-50 border-2 border-slate-100 rounded-2xl shadow-sm h-28">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                        {item.isPublicBid ? "High Bid" : "Bids"}
                      </span>
                      <div className={`text-[clamp(1.25rem,5cqi,2rem)] font-black leading-none ${item.isPublicBid && item.currentHighBid ? 'text-blue-600' : 'text-slate-500'}`}>
                         {item.isPublicBid && item.currentHighBid
                           ? `Rs. ${Math.round(item.currentHighBid).toLocaleString()}`
                           : `${item.bidCount}`
                         }
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Timer (Centered) */}
                  <div className="flex flex-col items-center justify-center p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl shadow-sm">
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Ends In</span>
                     <div className={`text-[clamp(1.25rem,4cqi,2rem)] font-black tabular-nums ${isUrgent ? 'text-red-500 animate-pulse' : 'text-slate-800'}`}>
                       {timeLeft}
                     </div>
                  </div>

                {/* Row 3 & 4: Bidding Controls Component */}
                <div className="mt-2">
                  <BiddingControls
                    bidAmount={bidAmount}
                    isSuccess={isSuccess}
                    isOwner={isSeller}
                    isHighBidder={!!isHighBidder}
                    hasPriorBid={!!hasPriorBid}
                    isSubmitting={false}
                    error={error}
                    minBid={minNextBid}
                    pendingConfirmation={pendingConfirmation}
                    animTrigger={animTrigger}
                    viewMode="modal"
                    idPrefix={`product-page-${item.id}`}
                    onSmartAdjust={handleSmartAdjust}
                    onBid={handleBid}
                    onKeyDown={handleKeyDown}
                    onInputChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && <p className="text-red-500 text-sm font-bold text-center mt-2 mb-4">{error}</p>}

              {/* Seller Card - Ticket Style */}
              <div className="bg-white rounded-2xl border-2 border-slate-100 shadow-sm mt-6 group hover:border-blue-100 transition-colors overflow-hidden">
                {/* Top: Identity */}
                <div className="p-4 flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img src={seller.avatar} className="h-12 w-12 rounded-full object-cover bg-slate-100 ring-2 ring-slate-50" />
                    {seller.isVerified && (
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                         <VerifiedBadge size="sm" showTooltip={false} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 truncate text-base leading-tight">
                      {seller.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mt-1">
                      <span className="flex items-center gap-0.5 text-amber-500 font-bold bg-amber-50 px-1.5 py-0.5 rounded-md">
                         <Star className="w-3 h-3 fill-current" /> {seller.rating}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="truncate">{seller.reviewCount} Reviews</span>
                    </div>
                  </div>
                </div>

                {/* Ticket Tear Line (Dashed) */}
                <div className="relative h-px w-full bg-slate-50">
                   <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-slate-100 rounded-full border border-slate-200" /> {/* Notch L */}
                   <div className="border-t-2 border-dashed border-slate-200 w-full h-full opacity-50" />
                   <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-slate-100 rounded-full border border-slate-200" /> {/* Notch R */}
                </div>

                {/* Bottom: Logistics */}
                <div className="p-3 bg-slate-50/50 flex items-center justify-between text-xs font-bold text-slate-600">
                   <div className="flex items-center gap-1.5 truncate pr-2">
                     <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                     <span className="truncate">{getFuzzyLocationString(seller.location.address)}</span>
                   </div>
                   <div className="flex items-center gap-1.5 text-blue-600 shrink-0 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                     <Clock className="w-3 h-3" />
                     {duration} min
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Block 3: Description (Left Col Bottom) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Description</h2>
              <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap">
                {item.description}
              </p>
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
