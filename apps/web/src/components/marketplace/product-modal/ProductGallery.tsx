"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Item } from "@/types";

interface ProductGalleryProps {
  item: Item;
  currentImg: number;
  setCurrentImg: React.Dispatch<React.SetStateAction<number>>;
  setShowFullscreen: (show: boolean) => void;
  showHalo: boolean;
  haloTheme: 'orange' | 'green' | 'blue';
  timeLeft?: string;
  isUrgent?: boolean;
}

export function ProductGallery({
  item,
  currentImg,
  setCurrentImg,
  setShowFullscreen,
  showHalo,
  haloTheme,
  timeLeft,
  isUrgent
}: ProductGalleryProps) {
  return (
    <div id={`product-details-gallery-${item.id}`} className="relative w-full bg-slate-100 group md:flex-[0_0_60%] md:min-h-0 h-[240px] sm:h-[320px] md:h-full">
      {/* Victory Halo - State Based Animated Border Background */}
      {showHalo && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Base Layer: Solid Vibrant Color */}
          <div 
            className={`absolute inset-0 opacity-20
              ${haloTheme === 'orange' ? 'bg-[#fbbf24]' : 
                haloTheme === 'green' ? 'bg-[#16a34a]' : 
                'bg-[#0ea5e9]'}`}
          />
          
          {/* Top Layer: The Racing Bar */}
          {item.isPublicBid && (
            <motion.div 
              className={`absolute inset-[-150%] opacity-30
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

      <div 
        id={`product-details-image-${item.id}`}
        className="relative h-full w-full overflow-hidden z-10"
      >
        <AnimatePresence mode="wait">
          <motion.img 
            key={currentImg}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            src={item.images[currentImg]} 
            className="h-full w-full object-cover"
            alt={item.title}
          />
        </AnimatePresence>
        
        {/* Time Remaining Overlay - Top Left */}
        {timeLeft && (
          <div className="absolute top-4 left-4 z-20">
            <div className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg border border-white/20
              ${isUrgent ? 'bg-red-500/80 text-white' : 'bg-black/60 text-white'}
            `}>
              <Clock className="h-4 w-4" />
              <span className="text-sm font-bold font-outfit tabular-nums tracking-wide">{timeLeft}</span>
            </div>
          </div>
        )}
        
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
          <button
            id={`expand-gallery-btn-${item.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setShowFullscreen(true);
            }}
            className="p-2 bg-white/85 hover:bg-white text-slate-800 rounded-full shadow-lg transition-all active:scale-90"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
        </div>

        {item.images.length > 1 && (
          <>
            <button 
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImg(prev => (prev > 0 ? prev - 1 : item.images.length - 1));
              }}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button 
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
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
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4 pointer-events-none">
          <div className="flex gap-2 pointer-events-auto">
            {item.images.map((img, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImg(i);
                }}
                className={`h-12 w-12 rounded-lg border-2 overflow-hidden transition-all ${i === currentImg ? 'border-blue-500 scale-110 shadow-lg' : 'border-white/50 grayscale-[50%] hover:grayscale-0'}`}
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
