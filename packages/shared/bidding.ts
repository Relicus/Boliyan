export const MIN_BID_PERCENTAGE = 0.7; // 30% lower than asked price
export const MAX_BID_PERCENTAGE = 1.5; // 50% higher than asked price
export const WARNING_PERCENTAGE = 1.4; // Dual-tap warning threshold
export const MAX_BID_ATTEMPTS = 5;     // Pyramid: 2 top row + 3 bottom row

export function isValidBid(askedPrice: number, bidAmount: number): boolean {
  const min = askedPrice * MIN_BID_PERCENTAGE;
  const max = askedPrice * MAX_BID_PERCENTAGE;
  // Must be within range AND end in 0 (min 10 Rs increment rule)
  return bidAmount >= min && bidAmount <= max && bidAmount % 10 === 0;
}

export function getMinimumAllowedBid(askedPrice: number): number {
  return askedPrice * MIN_BID_PERCENTAGE;
}

export function getMaximumAllowedBid(askedPrice: number): number {
  return askedPrice * MAX_BID_PERCENTAGE;
}

export function getSmartStep(currentPrice: number): number {
  if (currentPrice >= 100000) return 1000;
  if (currentPrice >= 10000) return 500;
  return 100;
}

/**
 * Rounds a price to a "reasonable" human-friendly value based on tiers.
 * This is separate from smart steps and prevents "weird" numbers like 4999.
 */
export function roundToReasonablePrice(amount: number): number {
  if (amount <= 0) return 0;
  
  if (amount < 10000) {
    // < 10k: Round to nearest 10
    return Math.round(amount / 10) * 10;
  }
  if (amount < 100000) {
    // 10k - 100k: Round to nearest 100
    return Math.round(amount / 100) * 100;
  }
  if (amount < 1000000) {
    // 100k - 1M: Round to nearest 500
    return Math.round(amount / 500) * 500;
  }
  // 1M+: Round to nearest 1,000
  return Math.round(amount / 1000) * 1000;
}
