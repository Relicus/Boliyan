export const MIN_BID_PERCENTAGE = 0.7; // 30% lower than asked price
export const MAX_BID_PERCENTAGE = 1.5; // 50% higher than asked price
export const WARNING_PERCENTAGE = 1.4; // Dual-tap warning threshold
export const MAX_BID_ATTEMPTS = 3;     // 1 Initial + 2 Updates

export function isValidBid(askedPrice: number, bidAmount: number): boolean {
  const min = askedPrice * MIN_BID_PERCENTAGE;
  const max = askedPrice * MAX_BID_PERCENTAGE;
  return bidAmount >= min && bidAmount <= max;
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
