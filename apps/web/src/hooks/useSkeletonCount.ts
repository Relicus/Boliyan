"use client";

import { useSyncExternalStore } from "react";

/**
 * Card minimum widths per view mode (from MarketplaceGrid CSS)
 * These match the minmax() values in the grid-cols definitions
 */
const CARD_MIN_WIDTHS = {
  compact: 165,      // sm:grid-cols-[repeat(auto-fill,minmax(165px,1fr))]
  comfortable: 300,  // md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]
  spacious: 400,     // md:grid-cols-[repeat(auto-fill,minmax(400px,1fr))]
} as const;

/**
 * Approximate card heights per view mode (including gap)
 */
const CARD_HEIGHTS = {
  compact: 280,
  comfortable: 360,
  spacious: 480,
} as const;

const GAP = 12; // gap-3 = 0.75rem = 12px

type ViewMode = 'compact' | 'comfortable' | 'spacious';

function calculateSkeletonCount(viewMode: ViewMode, width: number, height: number): number {
  // Account for page padding (px-4 = 16px each side = 32px total)
  const availableWidth = width - 32;
  
  const minCardWidth = CARD_MIN_WIDTHS[viewMode];
  const cardHeight = CARD_HEIGHTS[viewMode];
  
  // Calculate columns that fit
  const cols = Math.max(1, Math.floor((availableWidth + GAP) / (minCardWidth + GAP)));
  
  // Calculate rows that fit in viewport (plus 1 for partial visibility)
  // Account for header/nav (~200px) and filter bar (~100px)
  const headerOffset = 300;
  const visibleHeight = Math.max(400, height - headerOffset);
  const rows = Math.max(2, Math.ceil(visibleHeight / (cardHeight + GAP)));
  
  // Total skeletons = cols * rows
  const total = cols * rows;
  
  // Minimum 4, no maximum cap to ensure full screen coverage
  return Math.max(4, total);
}

// Cached viewport dimensions - updated only on resize
let cachedViewport = { width: 1280, height: 720 };

function getSnapshot(): { width: number; height: number } {
  return cachedViewport; // Return cached reference, not new object
}

// Cached SSR snapshot - static, never changes
const serverSnapshot = { width: 1280, height: 720 };

function getServerSnapshot(): { width: number; height: number } {
  return serverSnapshot; // Return same reference always
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  
  // Initialize cache on first subscribe
  cachedViewport = { width: window.innerWidth, height: window.innerHeight };
  
  const handleResize = () => {
    // Update cache, then notify
    cachedViewport = { width: window.innerWidth, height: window.innerHeight };
    callback();
  };
  
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}

/**
 * Hook to calculate the optimal number of skeleton cards to show
 * based on the current viewport dimensions and view mode.
 * 
 * @param viewMode - The current view mode ('compact', 'comfortable', 'spacious')
 * @returns The number of skeleton cards to render
 */
export function useSkeletonCount(viewMode: ViewMode): number {
  const viewport = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return calculateSkeletonCount(viewMode, viewport.width, viewport.height);
}
