/**
 * Card Size Constants
 * 
 * Standard dimensions for ItemCard, AdCard, and AdSenseCard
 * to ensure uniform grid layout across all view modes.
 */

export type ViewMode = 'compact' | 'comfortable' | 'spacious';

export const CARD_SIZES = {
  compact: {
    imageHeight: 'h-28',          // 112px
    minCardHeight: 'min-h-[280px]',
    maxCardHeight: 'max-h-[320px]',
    minWidth: 165,                // Mobile
    minWidthDesktop: 220,         // Desktop
  },
  comfortable: {
    imageHeight: 'h-40',          // 160px
    minCardHeight: 'min-h-[340px]',
    maxCardHeight: 'max-h-[380px]',
    minWidth: 200,
    minWidthDesktop: 260,
  },
  spacious: {
    imageHeight: 'h-52',          // 208px
    minCardHeight: 'min-h-[420px]',
    maxCardHeight: 'max-h-[480px]',
    minWidth: 280,
    minWidthDesktop: 360,
  },
} as const;

// Helper functions
export const getImageHeightClass = (viewMode: ViewMode) => CARD_SIZES[viewMode].imageHeight;
export const getMinCardHeightClass = (viewMode: ViewMode) => CARD_SIZES[viewMode].minCardHeight;
export const getMaxCardHeightClass = (viewMode: ViewMode) => CARD_SIZES[viewMode].maxCardHeight;

// Typography classes per view mode (matching ItemCard)
export const CARD_TYPOGRAPHY = {
  compact: {
    title: 'text-sm',
    label: 'text-[9px]',
    price: 'text-sm',
  },
  comfortable: {
    title: 'text-base',
    label: 'text-[10px]',
    price: 'text-base',
  },
  spacious: {
    title: 'text-lg',
    label: 'text-xs',
    price: 'text-lg',
  },
} as const;
