/**
 * Bidding Configuration Types
 * 
 * OOP-style type system for bidding behavior.
 * Shared base properties + variant-specific overrides.
 */

/**
 * Bidding Configuration Types
 * 
 * OOP-style type system for bidding behavior.
 * Shared base properties + variant-specific overrides.
 */

import { Item, User, Bid } from './index';

// ============================================
// VARIANT TYPES
// ============================================

export type BiddingVariant = 'public' | 'hidden';

// ============================================
// BASE CONFIG (Shared by all variants)
// ============================================

interface BiddingConfigBase {
  // Identity
  itemId: string;
  variant: BiddingVariant;
  
  // Pricing
  askPrice: number;
  minBid: number;
  smartStep: number;
  
  // User state
  isUserHighBidder: boolean;
  hasUserBid: boolean;
}

// ============================================
// VARIANT CONFIGS
// ============================================

export interface PublicBiddingConfig extends BiddingConfigBase {
  variant: 'public';
  
  // Public-specific: we CAN see the competition
  showHighBid: true;
  showHighBidder: true;
  currentHighBid: number | undefined;
  currentHighBidderId: string | undefined;
  
  // Visual states
  showOutbidWarning: boolean; // True when user was outbid
}

export interface HiddenBiddingConfig extends BiddingConfigBase {
  variant: 'hidden';
  
  // Hidden-specific: we CANNOT see the competition
  showHighBid: false;
  showHighBidder: false;
  currentHighBid: undefined;
  currentHighBidderId: undefined;
  
  // Visual states
  showHiddenBadge: true;
  showDuplicateBidWarning: boolean; // True when user already bid
}

// ============================================
// UNION TYPE
// ============================================

export type BiddingConfig = PublicBiddingConfig | HiddenBiddingConfig;

// ============================================
// FACTORY FUNCTION
// ============================================

import { getSmartStep, getMinimumAllowedBid } from '@/lib/bidding';

export function createBiddingConfig(
  item: Item,
  user: User | null,
  bids: Bid[]
): BiddingConfig {
  const isPublic = item.isPublicBid;
  const hasUserBid = user ? bids.some(b => b.itemId === item.id && b.bidderId === user.id) : false;
  const isUserHighBidder = user ? item.currentHighBidderId === user.id : false;
  
  // Base values
  const baseMinBid = getMinimumAllowedBid(item.askPrice);
  
  // NOTE: Boliyn 70/150/3 Protocol:
  // Public auctions NO LONGER require bids to be higher than current high bid.
  // The minimum allowed bid is ALWAYS the 70% floor.
  const effectiveMinBid = baseMinBid;
  
  if (isPublic) {
    return {
      variant: 'public',
      itemId: item.id,
      askPrice: item.askPrice,
      minBid: effectiveMinBid,
      smartStep: getSmartStep(item.currentHighBid || item.askPrice),
      isUserHighBidder,
      hasUserBid,
      
      // Public-specific
      showHighBid: true,
      showHighBidder: true,
      currentHighBid: item.currentHighBid,
      currentHighBidderId: item.currentHighBidderId,
      showOutbidWarning: hasUserBid && !isUserHighBidder,
    };
  } else {
    return {
      variant: 'hidden',
      itemId: item.id,
      askPrice: item.askPrice,
      minBid: baseMinBid,
      smartStep: getSmartStep(item.askPrice),
      isUserHighBidder: false, // Can never know in hidden
      hasUserBid,
      
      // Hidden-specific
      showHighBid: false,
      showHighBidder: false,
      currentHighBid: undefined,
      currentHighBidderId: undefined,
      showHiddenBadge: true,
      showDuplicateBidWarning: hasUserBid,
    };
  }
}

// ============================================
// VIEW MODE (for UI sizing)
// ============================================

export type BiddingViewMode = 'compact' | 'comfortable' | 'spacious' | 'modal';
