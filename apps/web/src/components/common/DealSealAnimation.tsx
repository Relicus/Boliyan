"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface DealSealAnimationProps {
  isVisible: boolean;
  onComplete?: () => void;
}

export function DealSealAnimation({ isVisible, onComplete }: DealSealAnimationProps) {
  const [show, setShow] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setTimeout(() => setShow(true), 0);
      const timer = setTimeout(() => {
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setTimeout(() => setShow(false), 0);
    }
  }, [isVisible, onComplete]);

  const [particles] = useState(() => 
    [...Array(6)].map(() => ({
      x: (Math.random() - 0.5) * 300,
      y: (Math.random() - 0.5) * 300,
      scale: Math.random() * 1.5
    }))
  );

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
          {particles.map((p, i) => (
            <motion.div
              key={i}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
              animate={{ 
                x: p.x, 
                y: p.y,
                opacity: 0,
                scale: p.scale
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
