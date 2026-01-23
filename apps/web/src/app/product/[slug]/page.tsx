"use client";

import { use, useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, MapPin, Clock, Bookmark, Maximize2, Share2, Zap, ArrowLeft, BadgeCheck } from "lucide-react";
import { useApp } from "@/lib/store";
import { useBidding } from "@/hooks/useBidding";
import { getFuzzyLocationString, calculatePrivacySafeDistance } from "@/lib/utils";
import { CategoryBadge } from "@/components/common/CategoryBadge";
import { ConditionBadge } from "@/components/common/ConditionBadge";
import { RatingBadge } from "@/components/common/RatingBadge";
import { TimerBadge } from "@/components/common/TimerBadge";
import { BiddingControls } from "@/components/common/BiddingControls";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { VerifiedBadge } from "@/components/common/VerifiedBadge";
import { toast } from "sonner";
import { Item, User } from "@/types";
import { supabase } from "@/lib/supabase";
import { transformListingToItem, ListingWithSeller } from "@/lib/transform";
import { FullscreenGallery } from "@/components/marketplace/product-modal/FullscreenGallery";
import { ListingBadges } from "@/components/marketplace/ListingBadges";

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
    pendingConfirmation,
    remainingAttempts,
    userBid
  } = useBidding(item, seller, () => {});

  const [currentImg, setCurrentImg] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);

  useEffect(() => {
    if (isSuccess) {
      toast.success("Bid placed successfully!", {
        description: (
          <span className="block mt-1">
            You placed a bid of <span className="font-bold text-emerald-600">{bidAmount}</span> on <span className="font-semibold text-blue-600">{item?.title}</span>
          </span>
        )
      });
    }
  }, [isSuccess, bidAmount, item?.title]);

  const { duration } = useMemo(() => {
    const { duration: dur } = user ? calculatePrivacySafeDistance(user.location, seller.location) : { duration: 0 };
    return { 
      duration: dur
    };
  }, [seller, user]);

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

              {/* Badges Overlay - Symmetric Stack */}
              <div id="product-page-left-stack" className="absolute top-6 left-6 flex flex-col gap-2">
                {/* 1. Location */}
                <div className="bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-md flex items-center gap-2 shadow-lg border border-white/20">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm font-black tracking-tight leading-none truncate max-w-[150px]">
                    {seller?.location ? getFuzzyLocationString(seller.location.address) : 'Unknown Location'}
                  </span>
                </div>
                {/* 2. Category */}
                <CategoryBadge 
                  category={item.category} 
                  variant="glass" 
                  className="px-3 py-1.5"
                />
              </div>

              <div id="product-page-right-stack" className="absolute top-6 right-6 flex flex-col items-end gap-2">
                {/* 1. Timer */}
                <TimerBadge 
                  expiryAt={item.expiryAt} 
                  variant="glass" 
                  className="px-3 py-1.5"
                />
                {/* 2. Condition */}
                <ConditionBadge 
                  condition={item.condition} 
                  variant="glass"
                  className="px-3 py-1.5"
                />
              </div>

              {/* Navigation Arrows */}
              {item.images.length > 1 && (
                <>
                  <button 
                    id="prev-image-btn"
                    onClick={() => setCurrentImg(prev => (prev > 0 ? prev - 1 : item.images.length - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 hover:bg-white text-slate-800 rounded-full shadow-lg transition-all active:scale-90 border border-slate-100 backdrop-blur-sm opacity-0 group-hover:opacity-100 z-20"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button 
                    id="next-image-btn"
                    onClick={() => setCurrentImg(prev => (prev < item.images.length - 1 ? prev + 1 : 0))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 hover:bg-white text-slate-800 rounded-full shadow-lg transition-all active:scale-90 border border-slate-100 backdrop-blur-sm opacity-0 group-hover:opacity-100 z-20"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}

              {/* Zoom Button - Always visible on hover */}
              <button
                id="zoom-image-btn"
                onClick={() => setShowFullscreen(true)}
                className="absolute bottom-4 right-4 p-3 bg-white/90 hover:bg-white text-slate-800 rounded-full shadow-lg transition-all active:scale-90 border border-slate-100 backdrop-blur-sm opacity-0 group-hover:opacity-100 z-20"
                title="Zoom image"
              >
                <Maximize2 className="h-6 w-6" />
              </button>
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

            {/* Seller Card - Ticket Style (Moved to Left Column) */}
            <div id={`seller-card-${item.id}`} className="bg-white rounded-2xl border-2 border-slate-100 shadow-sm group hover:border-blue-100 transition-colors overflow-hidden">
              {/* Top: Identity */}
              <div className="p-4 flex items-center gap-3">
                <div className="relative shrink-0">
                  <img src={seller.avatar} className="h-12 w-12 rounded-full object-cover bg-slate-100 ring-2 ring-slate-50" alt={seller.name} />
                  {seller.isVerified && (
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                        <VerifiedBadge size="sm" showTooltip={false} />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-700 truncate text-lg leading-tight">
                    {seller.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mt-1">
                    <RatingBadge rating={seller.rating} count={seller.reviewCount} size="md" />
                    {seller.isVerified && (
                      <>
                        <span className="text-slate-300">•</span>
                        <div className="flex items-center gap-1 text-blue-600 font-bold">
                          <BadgeCheck className="h-3 w-3 fill-current stroke-white" />
                          <span>Verified</span>
                        </div>
                      </>
                    )}
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

          {/* Block 2: Bidding (Right Col) */}
          <div className="lg:col-span-5 space-y-6 lg:row-span-2">
              <div 
                className={`bg-white rounded-3xl p-6 shadow-lg border border-slate-100 space-y-4 sticky top-24 transition-all
                  ${isHighBidder ? 'ring-4 ring-amber-400' : ''}
                `}
              >
                <div className="space-y-2">
                  <ListingBadges item={item} seller={seller} showTimer={false} />
                  <h1 className="text-[clamp(1.5rem,4cqi,2.2rem)] font-black text-slate-900 leading-tight">
                    {item.title}
                  </h1>
                </div>

                {/* Unified Bidding Section - Stacked Layout */}
                <div className="flex flex-col gap-3 py-3 border-y border-slate-50">
                  {/* Row 1: Price */}
                  <div className="flex flex-col items-start justify-center p-3 pl-5 bg-slate-50 border-2 border-slate-100 rounded-2xl shadow-sm h-20">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Ask Price</span>
                    <div className="text-[clamp(1.25rem,5cqi,2rem)] font-black text-slate-800 leading-none">
                      Rs. {Math.round(item.askPrice).toLocaleString()}
                    </div>
                  </div>

                  {/* Row 2: Highest Bid */}
                    <div className="flex flex-col items-start justify-center p-3 pl-5 bg-slate-50 border-2 border-slate-100 rounded-2xl shadow-sm h-20">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                        {item.isPublicBid ? "Highest Bid" : "Bids"}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className={`text-[clamp(1.25rem,5cqi,2rem)] font-black leading-none ${item.isPublicBid && item.currentHighBid ? 'text-blue-600' : 'text-slate-500'}`}>
                            {item.isPublicBid && item.currentHighBid
                              ? `Rs. ${Math.round(item.currentHighBid).toLocaleString()}`
                              : `${item.bidCount}`
                            }
                        </div>
                        {isHighBidder && (
                          <motion.div
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="bg-amber-100 text-amber-600 rounded-full flex items-center justify-center w-8 h-8 p-1.5 shrink-0 shadow-sm border border-amber-200"
                            title="You are the high bidder!"
                          >
                            <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M18 2H6v2H2v7c0 2.21 1.79 4 4 4h1.09c.45 1.76 1.83 3.14 3.58 3.59V20H8v2h8v-2h-2.67v-1.41c1.75-.45 3.13-1.83 3.58-3.59H18c2.21 0 4-1.79 4-4V4h-4V2zM6 13c-1.1 0-2-.9-2-2V6h2v7zm14-2c0 1.1-.9 2-2 2h-2V6h2v5z"/>
                            </svg>
                          </motion.div>
                        )}
                      </div>
                    </div>


                  {/* Row 3: Bidding Controls Component */}
                  <div className="mt-1 space-y-2">
                    <BiddingControls
                      bidAmount={bidAmount}
                      isSuccess={isSuccess}
                      isOwner={isSeller}
                      isHighBidder={!!isHighBidder}
                      hasPriorBid={!!hasPriorBid}
                      isSubmitting={false}
                      error={error}
                      minBid={minNextBid}
                      remainingAttempts={remainingAttempts}
                      userCurrentBid={userBid?.amount}
                      pendingConfirmation={pendingConfirmation}
                      animTrigger={animTrigger}
                      viewMode="modal"
                      idPrefix={`product-page-${item.id}`}
                      onSmartAdjust={handleSmartAdjust}
                      onBid={handleBid}
                      onKeyDown={handleKeyDown}
                      onInputChange={handleInputChange}
                      showAttemptsDots={false}
                      showStatus={true}
                    />

                    {isHighBidder && !isSuccess && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-amber-50 text-amber-800 px-4 py-2.5 rounded-xl text-center font-bold text-sm flex items-center justify-center gap-2 border border-amber-200/60 shadow-sm"
                      >
                        <Zap className="h-4 w-4 fill-current text-amber-500" />
                        You are the high bidder!
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Error Message */}
                {error && <p className="text-red-500 text-sm font-bold text-center mt-2 mb-4">{error}</p>}
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

      <FullscreenGallery 
        isOpen={showFullscreen}
        onOpenChange={setShowFullscreen}
        item={item}
        currentImg={currentImg}
        setCurrentImg={setCurrentImg}
      />
    </div>
  );
}

export default function ProductPage({ params }: { params: Promise<{ id?: string; slug?: string }> }) {
  const resolvedParams = use(params);
  const slugOrId = resolvedParams.slug || resolvedParams.id || '';
  
  const router = useRouter();
  const { items, getUser } = useApp();
  
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
  const storeItem = items.find((i) => isUUID ? i.id === slugOrId : i.slug === slugOrId);
  
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

  const item = storeItem || fetchedItem;
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
