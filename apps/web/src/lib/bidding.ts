export const MIN_BID_PERCENTAGE = 0.7; // 30% lower than asked price

export function isValidBid(askedPrice: number, bidAmount: number): boolean {
  return bidAmount >= askedPrice * MIN_BID_PERCENTAGE;
}

export function getMinimumAllowedBid(askedPrice: number): number {
  return askedPrice * MIN_BID_PERCENTAGE;
}

export function getSmartStep(currentPrice: number): number {
  if (currentPrice >= 100000) return 1000;
  if (currentPrice >= 10000) return 500;
  return 100;
}
