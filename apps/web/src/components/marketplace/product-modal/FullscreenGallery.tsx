"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Item } from "@/types";

interface FullscreenGalleryProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item;
  currentImg: number;
  setCurrentImg: React.Dispatch<React.SetStateAction<number>>;
}

export function FullscreenGallery({
  isOpen,
  onOpenChange,
  item,
  currentImg,
  setCurrentImg
}: FullscreenGalleryProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        showCloseButton={false} 
        className="fixed inset-0 z-[100] w-screen h-[100svh] m-0 p-0 bg-black/95 border-none shadow-none top-0 left-0 translate-x-0 translate-y-0 rounded-none flex items-center justify-center overflow-hidden max-w-none sm:max-w-none md:max-w-none lg:max-w-none xl:max-w-none"
      >
        <DialogTitle className="sr-only">Full Screen Product Gallery</DialogTitle>
        <DialogClose className="absolute top-4 right-4 z-[110] p-2 bg-white/85 hover:bg-white text-slate-700 hover:text-red-500 rounded-full shadow-lg transition-all active:scale-y-95 active:bg-slate-50">
          <X className="h-5 w-5" />
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
                alt=""
             />
           </AnimatePresence>

           {/* Navigation */}
           {item.images.length > 1 && (
             <>
              {currentImg > 0 && (
                <button 
                  className="absolute left-4 sm:left-10 p-4 bg-white/5 hover:bg-white/10 text-white rounded-full backdrop-blur-xl border border-white/10 transition-all active:scale-y-95 active:bg-white/20 z-[110]"
                  onClick={() => setCurrentImg(prev => prev - 1)}
                >
                  <ChevronLeft className="h-10 w-10" />
                </button>
              )}
              {currentImg < item.images.length - 1 && (
                <button 
                  className="absolute right-4 sm:right-10 p-4 bg-white/5 hover:bg-white/10 text-white rounded-full backdrop-blur-xl border border-white/10 transition-all active:scale-y-95 active:bg-white/20 z-[110]"
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
  );
}
