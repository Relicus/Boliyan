"use client";

import { useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import ProductPageClient from "@/app/product/[slug]/ProductPageClient";

interface ProductOverlayProps {
  slug: string;
}

/**
 * ProductOverlay Component
 * 
 * Wraps the existing ProductPageClient in an overlay container.
 * The marketplace stays mounted underneath, preserving scroll position.
 */
export function ProductOverlay({ slug }: ProductOverlayProps) {
  const router = useRouter();

  // Close handler - uses router.back() to preserve marketplace state
  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  // Prevent body scroll when overlay is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <>
      {/* Backdrop - click to close (below navbar) */}
      <motion.div
        id="product-overlay-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed top-16 left-0 right-0 bottom-0 z-[40] bg-black/50 backdrop-blur-sm"
      />

      {/* Overlay Panel (below navbar) */}
      <motion.div
        id="product-overlay-panel"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed top-16 left-0 right-0 bottom-0 z-[41] bg-slate-50 overflow-y-auto overscroll-contain"
      >
        {/* Reuse existing ProductPageClient with onClose callback */}
        <ProductPageClient params={{ slug }} onClose={handleClose} />
      </motion.div>
    </>
  );
}
