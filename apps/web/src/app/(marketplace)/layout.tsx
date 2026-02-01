"use client";

import { ReactNode, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamic import for idle-time preloading
const ProductPageClientPreload = dynamic(
  () => import("@/app/product/[slug]/ProductPageClient"),
  { ssr: false }
);

/**
 * Marketplace Layout with Parallel Route Slot
 * 
 * Features:
 * - Instagram-style overlay pattern
 * - Idle-time preload of ProductPageClient for snappy overlays
 * - Marketplace stays mounted (preserving scroll position)
 */
export default function MarketplaceLayout({
  children,
  productOverlay,
}: {
  children: ReactNode;
  productOverlay: ReactNode;
}) {
  // Preload ProductPageClient during idle time after initial render
  useEffect(() => {
    const preload = () => {
      // Trigger dynamic import preload
      ProductPageClientPreload.preload?.();
    };
    
    // Use requestIdleCallback for idle-time preload, fallback to setTimeout
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(preload, { timeout: 2000 });
      return () => cancelIdleCallback(id);
    } else {
      const id = setTimeout(preload, 1000);
      return () => clearTimeout(id);
    }
  }, []);

  return (
    <>
      {children}
      {productOverlay}
    </>
  );
}
