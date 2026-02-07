/**
 * Re-export barrel for bidding utilities.
 * Canonical source: packages/shared/bidding.ts
 */
export {
  MIN_BID_PERCENTAGE,
  MAX_BID_PERCENTAGE,
  WARNING_PERCENTAGE,
  MAX_BID_ATTEMPTS,
  isValidBid,
  getSmartStep,
  getMinimumAllowedBid,
  getMaximumAllowedBid,
  roundToReasonablePrice,
} from '../../../../packages/shared/bidding';
