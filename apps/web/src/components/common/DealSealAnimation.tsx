"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface DealSealAnimationProps {
  isVisible: boolean;
  onComplete?: () => void;
}

export function DealSealAnimation({ isVisible, onComplete }: DealSealAnimationProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => {
        onComplete?.();
        // Keep it visible but let interaction pass through? 
        // Or fade out slightly? We want it to persist as a badge.
        // For the animation itself, we might want to hide the overlay after a bit.
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden">
          {/* Backdrop Flash */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-white"
          />

          {/* The Stamp */}
          <motion.div
            initial={{ scale: 2, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, opacity: 1, rotate: -5 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 15,
              mass: 1.5
            }}
            className="relative"
          >
            <div className="border-[8px] border-slate-900 px-8 py-4 rounded-xl bg-white/90 backdrop-blur-sm shadow-2xl transform rotate-[-5deg]">
              <span className="text-[clamp(2rem,10cqi,4rem)] font-black uppercase tracking-tighter text-slate-900 leading-none whitespace-nowrap">
                SEALED
              </span>
            </div>
            
            {/* Ink Splatter / Grunge Effect (CSS generated) */}
            <div className="absolute -inset-4 border-2 border-slate-900/20 rounded-[20px] blur-[1px] rotate-2" />
          </motion.div>

          {/* Particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
              animate={{ 
                x: (Math.random() - 0.5) * 300, 
                y: (Math.random() - 0.5) * 300,
                opacity: 0,
                scale: Math.random() * 1.5
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute w-2 h-2 rounded-full bg-slate-900"
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
