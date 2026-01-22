"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, ChevronLeft, ChevronRight, Bookmark, ExternalLink, MapPin } from "lucide-react";
import Link from "next/link";
import { Item, User } from "@/types";
import Skeleton from "@/components/ui/Skeleton";
import { CategoryBadge } from "@/components/common/CategoryBadge";
import { ConditionBadge } from "@/components/common/ConditionBadge";
import { TimerBadge } from "@/components/common/TimerBadge";
import { getFuzzyLocationString } from "@/lib/utils";

interface ProductGalleryProps {
  item: Item;
  seller: User;
  currentImg: number;
  setCurrentImg: React.Dispatch<React.SetStateAction<number>>;
  setShowFullscreen: (show: boolean) => void;
  isWatched?: boolean;
  onToggleWatch?: (id: string) => void;
}

export function ProductGallery({
  item,
  seller,
  currentImg,
  setCurrentImg,
  setShowFullscreen,
  isWatched,
  onToggleWatch
}: ProductGalleryProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const loadedImagesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentSrc = item.images[currentImg];
    if (!currentSrc) return;
    setIsImageLoaded(loadedImagesRef.current.has(currentSrc));
  }, [currentImg, item.id, item.images]);

  return (
    <div id={`product-details-gallery-${item.id}`} className="relative w-full bg-slate-100 group md:flex-[0_0_60%] md:min-h-0 h-[300px] sm:h-[400px] md:h-full">
      <div 
        id={`product-details-image-${item.id}`}
        className="relative h-full w-full overflow-hidden z-10"
      >
        {!isImageLoaded && (
          <Skeleton
            className="absolute inset-0 z-0 rounded-none bg-gradient-to-r from-slate-200/70 via-white/80 to-slate-200/70 pointer-events-none"
          />
        )}
        <img
          key={currentImg}
          src={item.images[currentImg]}
          className={`relative z-10 h-full w-full object-cover transition-opacity duration-300 ${
            isImageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          alt={item.title}
          onLoad={(event) => {
            loadedImagesRef.current.add(event.currentTarget.currentSrc);
            setIsImageLoaded(true);
          }}
          onError={() => setIsImageLoaded(true)}
        />
        
        {/* Top-Left Stack: Geography & Identity */}
        <div id={`product-gallery-left-stack`} className="absolute top-4 left-4 z-20 flex flex-col items-start gap-1.5">
          {/* 1. Location (Geography First) */}
          <div className="bg-black/60 backdrop-blur-md text-white px-2.5 py-1.5 rounded-md flex items-center gap-2 shadow-lg border border-white/20">
            <MapPin className="h-3.5 w-3.5" />
            <span className="text-xs font-black tracking-tight leading-none truncate max-w-[100px] sm:max-w-[150px]">
              {seller?.location ? getFuzzyLocationString(seller.location.address) : 'Unknown Location'}
            </span>
          </div>
          {/* 2. Category Identity */}
          <CategoryBadge 
            category={item.category} 
            variant="glass" 
            className="px-2.5 py-1.5"
          />
          {/* 3. Full Details Link (Mobile Only) */}
          <Link
            id={`view-details-btn-mobile-${item.id}`}
            href={`/product/${item.slug ?? item.id}`}
            className="md:hidden h-8 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 active:scale-90 bg-slate-900 text-white hover:bg-black w-8 gap-2 border border-white/20"
            title="Full Page"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        {/* Top-Right Stack: Urgency & State */}
        <div className="absolute top-4 right-12 z-20 flex flex-col items-end gap-1.5">
          {/* 1. Timer (Urgency First) */}
          <TimerBadge 
            expiryAt={item.expiryAt} 
            variant="glass" 
            className="px-2.5 py-1.5"
          />
          
          {/* 2. Condition State */}
          <ConditionBadge 
            condition={item.condition} 
            variant="glass"
            className="px-2.5 py-1.5"
          />

          {/* 3. Action Buttons Row (Mobile Only) */}
          <div className="md:hidden flex flex-col items-end gap-1.5">
            {/* Watch Button */}
            {onToggleWatch && (
              <button
                id={`toggle-watch-btn-mobile-${item.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleWatch(item.id);
                }}
                className={`h-8 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 active:scale-90 border
                  ${isWatched 
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 w-8 gap-2' 
                    : 'bg-white/85 text-slate-700 border-white/20 hover:bg-white w-8 gap-2'
                  }`}
                title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
              >
                <Bookmark className={`h-3.5 w-3.5 ${isWatched ? 'fill-current' : ''}`} />
              </button>
            )}

            {/* Expand Gallery Button */}
            <button
              id={`expand-gallery-btn-mobile-${item.id}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowFullscreen(true);
              }}
              className="h-8 w-8 flex items-center justify-center bg-white/85 hover:bg-white text-slate-800 rounded-full shadow-lg transition-all active:scale-90"
              title="Expand Gallery"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Bottom-Right Actions (Desktop Only) */}
        <div className="hidden md:flex absolute bottom-4 right-4 z-20 items-center gap-2">
           {/* Watch Button */}
           {onToggleWatch && (
            <button
              id={`toggle-watch-btn-${item.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleWatch(item.id);
              }}
              className={`h-9 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 active:scale-90 border
                ${isWatched 
                  ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 w-auto px-3 gap-2' 
                  : 'bg-white/85 text-slate-700 border-white/20 hover:bg-white w-auto px-3 gap-2'
                }`}
              title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
            >
              <Bookmark className={`h-4 w-4 ${isWatched ? 'fill-current' : ''}`} />
              <span className="text-xs font-bold">{isWatched ? 'Watched' : 'Watch'}</span>
            </button>
           )}

           {/* Full Details Button */}
            <Link
              id={`view-details-btn-${item.id}`}
              href={`/product/${item.slug ?? item.id}`}
              className="h-9 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 active:scale-90 bg-slate-900 text-white hover:bg-black w-auto px-3 gap-2 border border-white/20"
              title="Full Page"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="text-xs font-bold">Full Page</span>
            </Link>

          <button
            id={`expand-gallery-btn-${item.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setShowFullscreen(true);
            }}
            className="h-9 w-9 flex items-center justify-center bg-white/85 hover:bg-white text-slate-800 rounded-full shadow-lg transition-all active:scale-90"
            title="Expand Gallery"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
        </div>

        {item.images.length > 1 && (
          <>
            <button 
              id={`product-gallery-prev-${item.id}`}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center bg-slate-900/45 hover:bg-slate-900/65 text-white rounded-full backdrop-blur-md border border-white/25 shadow-[0_12px_24px_rgba(0,0,0,0.35)] transition-all active:scale-90 z-20"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImg(prev => (prev > 0 ? prev - 1 : item.images.length - 1));
              }}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button 
              id={`product-gallery-next-${item.id}`}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center bg-slate-900/45 hover:bg-slate-900/65 text-white rounded-full backdrop-blur-md border border-white/25 shadow-[0_12px_24px_rgba(0,0,0,0.35)] transition-all active:scale-90 z-20"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImg(prev => (prev < item.images.length - 1 ? prev + 1 : 0));
              }}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>
      
      {/* Thumbs Overlay - Only visible if more than 1 image */}
      {item.images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex justify-center">
          <div className="flex gap-2 p-1.5 rounded-2xl bg-black/35 backdrop-blur-md border border-white/20 shadow-[0_12px_24px_rgba(0,0,0,0.35)]">
            {item.images.map((img, i) => (
              <button
                key={i}
                id={`product-gallery-thumb-${item.id}-${i}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImg(i);
                }}
                className={`h-12 w-12 rounded-lg border-2 overflow-hidden transition-all ${i === currentImg ? 'border-blue-400 scale-110 shadow-lg' : 'border-white/40 grayscale-[40%] hover:grayscale-0 hover:border-white/70'}`}
              >
                <img src={img} className="h-full w-full object-cover" alt="" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
