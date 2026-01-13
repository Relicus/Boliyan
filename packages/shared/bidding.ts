export const MIN_BID_PERCENTAGE = 0.7; // 30% lower than asked price

export function isValidBid(askedPrice: number, bidAmount: number): boolean {
  return bidAmount >= askedPrice * MIN_BID_PERCENTAGE;
}

export function getMinimumAllowedBid(askedPrice: number): number {
  return askedPrice * MIN_BID_PERCENTAGE;
}
