/**
 * Realtime DOM Updater
 * 
 * This module provides direct DOM updates for real-time bid events,
 * bypassing React's reconciliation for instant visual feedback.
 * 
 * ARCHITECTURE:
 * 1. React state is ALWAYS updated (source of truth)
 * 2. DOM updates happen IN PARALLEL for instant visuals
 * 3. When React eventually re-renders, it matches the DOM state
 * 
 * DATA ATTRIBUTES REQUIRED ON ELEMENTS:
 * - data-rt-item-id: The item/listing ID
 * - data-rt-bid-count: Element displaying bid count
 * - data-rt-high-bid: Element displaying high bid price
 * - data-rt-high-bid-value: Current numeric value (for comparison)
 */

import { formatPrice } from './utils';

// ============================================
// TYPES
// ============================================

export interface BidUpdatePayload {
  itemId: string;
  newAmount: number;
  bidderId: string;
  isNewHighBid: boolean;
  previousHighBid?: number;
}

// ============================================
// SELECTORS (Centralized for easy maintenance)
// ============================================

const SELECTORS = {
  bidCount: (itemId: string) => `[data-rt-item-id="${itemId}"][data-rt-bid-count]`,
  bidCountSmall: (itemId: string) => `[data-rt-item-id="${itemId}"][data-rt-bid-count-small]`,
  highBid: (itemId: string) => `[data-rt-item-id="${itemId}"][data-rt-high-bid]`,
  itemCard: (itemId: string) => `#item-card-${itemId}`,
} as const;

// ============================================
// ANIMATION HELPERS
// ============================================

/**
 * Animate a number from current to target using requestAnimationFrame.
 * Matches the RollingPrice component behavior for consistency.
 */
function animateNumber(
  element: HTMLElement,
  from: number,
  to: number,
  duration: number = 600,
  formatter: (n: number) => string = formatPrice
): void {
  const startTime = performance.now();
  
  const tick = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Cubic ease-out (same as RollingPrice)
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = from + (to - from) * ease;
    
    element.textContent = formatter(current);
    
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      // Ensure final value is exact
      element.textContent = formatter(to);
    }
  };
  
  requestAnimationFrame(tick);
}

/**
 * Apply a brief highlight animation to indicate update.
 */
function pulseElement(element: HTMLElement): void {
  // Add pulse class
  element.classList.add('rt-pulse');
  
  // Remove after animation completes
  setTimeout(() => {
    element.classList.remove('rt-pulse');
  }, 600);
}

// ============================================
// CORE UPDATE FUNCTIONS
// ============================================

/**
 * Update bid count display directly in DOM.
 */
export function updateBidCount(itemId: string, newCount: number): boolean {
  const element = document.querySelector<HTMLElement>(SELECTORS.bidCount(itemId));
  
  if (!element) {
    return false; // Element not in DOM (item not visible)
  }
  
  const bidText = newCount === 1 ? 'Bid' : 'Bids';
  element.textContent = `${newCount} ${bidText}`;
  pulseElement(element);
  
  return true;
}

/**
 * Update the small (x) bid count display directly in DOM.
 */
export function updateBidCountSmall(itemId: string, newCount: number): boolean {
  const element = document.querySelector<HTMLElement>(SELECTORS.bidCountSmall(itemId));
  
  if (!element) {
    return false;
  }
  
  element.textContent = `(${newCount})`;
  element.classList.remove('hidden');
  pulseElement(element);
  
  return true;
}

/**
 * Update high bid price display with animation.
 */
export function updateHighBid(
  itemId: string, 
  newAmount: number,
  animate: boolean = true
): boolean {
  const element = document.querySelector<HTMLElement>(SELECTORS.highBid(itemId));
  
  if (!element) {
    return false; // Element not in DOM
  }
  
  const currentValue = parseFloat(element.getAttribute('data-rt-high-bid-value') || '0');
  
  // Only update if new amount is higher
  if (newAmount <= currentValue) {
    return false;
  }
  
  // Update the data attribute for future comparisons
  element.setAttribute('data-rt-high-bid-value', String(newAmount));
  
  if (animate && currentValue > 0) {
    // Animate from current to new
    animateNumber(element, currentValue, newAmount);
  } else {
    // Instant update (first load or no animation)
    element.textContent = formatPrice(newAmount);
  }
  
  pulseElement(element);
  
  return true;
}

/**
 * Apply outbid visual feedback to card.
 */
export function flashOutbidIndicator(itemId: string): void {
  const card = document.querySelector<HTMLElement>(SELECTORS.itemCard(itemId));
  
  if (!card) return;
  
  // Add outbid visual state
  card.classList.add('rt-outbid');
  
  // Remove after animation
  setTimeout(() => {
    card.classList.remove('rt-outbid');
  }, 800);
}

// ============================================
// MAIN HANDLER (Called from useBidRealtime)
// ============================================

/**
 * Process a realtime bid update with direct DOM manipulation.
 * 
 * @param payload - The bid update information
 * @param currentUserId - The current logged-in user's ID (to detect outbid)
 * @returns Object indicating what was updated
 */
export function handleRealtimeBidDOM(
  payload: BidUpdatePayload,
  currentUserId?: string
): { bidCountUpdated: boolean; highBidUpdated: boolean; isOutbid: boolean } {
  const { itemId, newAmount, bidderId, isNewHighBid } = payload;
  
  // 1. Always try to update bid count (increment by 1 from current display)
  let bidCountUpdated = false;
  
  // Try main bid count first
  const bidCountEl = document.querySelector<HTMLElement>(SELECTORS.bidCount(itemId));
  if (bidCountEl) {
    const currentText = bidCountEl.textContent || '0';
    const currentCount = parseInt(currentText.match(/\d+/)?.[0] || '0', 10);
    bidCountUpdated = updateBidCount(itemId, currentCount + 1);
  }
  
  // Also try small bid count (x)
  const bidCountSmallEl = document.querySelector<HTMLElement>(SELECTORS.bidCountSmall(itemId));
  if (bidCountSmallEl) {
    const currentText = bidCountSmallEl.textContent || '0';
    const currentCount = parseInt(currentText.match(/\d+/)?.[0] || '0', 10);
    const smallUpdated = updateBidCountSmall(itemId, currentCount + 1);
    bidCountUpdated = bidCountUpdated || smallUpdated;
  }
  
  // 2. Update high bid if this is a new high
  let highBidUpdated = false;
  if (isNewHighBid) {
    highBidUpdated = updateHighBid(itemId, newAmount, true);
  }
  
  // 3. Check if current user was outbid
  const isOutbid = !!(
    currentUserId && 
    bidderId !== currentUserId && 
    isNewHighBid
  );
  
  if (isOutbid) {
    flashOutbidIndicator(itemId);
  }
  
  return { bidCountUpdated, highBidUpdated, isOutbid };
}

// ============================================
// CSS CLASSES (Add to global styles)
// ============================================

/**
 * Required CSS for animations (add to globals.css):
 * 
 * .rt-pulse {
 *   animation: rt-pulse 0.6s ease-out;
 * }
 * 
 * @keyframes rt-pulse {
 *   0% { transform: scale(1); }
 *   50% { transform: scale(1.05); color: #2563eb; }
 *   100% { transform: scale(1); }
 * }
 * 
 * .rt-outbid {
 *   animation: rt-outbid 0.8s ease-out;
 * }
 * 
 * @keyframes rt-outbid {
 *   0%, 100% { box-shadow: none; }
 *   25%, 75% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.4); }
 * }
 */
