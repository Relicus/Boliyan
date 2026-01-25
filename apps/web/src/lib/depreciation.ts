/**
 * Depreciation Calculator for Boliyan Marketplace
 * 
 * Formula: Estimated Price = Original Price × Age Factor × Condition Multiplier
 * 
 * @see depreciation_formulas.md for detailed documentation
 */

import { Item } from '@/types';

// Category tier mappings
const CATEGORY_TIERS: Record<string, 'fast' | 'medium' | 'slow'> = {
  'Mobiles': 'fast',
  'Electronics': 'fast',
  'Gaming': 'fast',
  'Cameras': 'medium',
  'Audio': 'medium',
  'Fashion': 'medium',
  'Sports': 'medium',
  'Appliances': 'medium',
  'Community': 'medium',
  'Watches': 'slow',
  'Furniture': 'fast',
  'Hobbies': 'slow',
};

// Annual depreciation rates by tier (adjusted for realistic market values)
const TIER_RATES = {
  fast: { year1: 0.25, year2_3: 0.15, year4Plus: 0.15, floor: 0.10 },
  medium: { year1: 0.15, year2_3: 0.10, year4Plus: 0.08, floor: 0.15 },
  slow: { year1: 0.08, year2_3: 0.05, year4Plus: 0.05, floor: 0.30 },
};

// Average annual inflation rate (PKR) - disabled to prevent appreciation confusion
const ANNUAL_INFLATION_RATE = 0;

// Condition multipliers
const CONDITION_MULTIPLIERS: Record<Item['condition'], number> = {
  'new': 0.95,
  'like_new': 0.90,
  'used': 0.80,
  'fair': 0.65,
};

/**
 * Calculate age factor based on category tier and years of ownership
 */
function calculateAgeFactor(tier: 'fast' | 'medium' | 'slow', years: number): number {
  const rates = TIER_RATES[tier];
  
  if (years <= 0) return 1.0;
  
  let factor = 1.0;
  
  // Year 1 (0 to 1)
  const y1 = Math.min(years, 1);
  factor *= Math.pow(1 - rates.year1, y1);
  
  // Years 2-3 (1 to 3)
  const y23 = Math.min(Math.max(years - 1, 0), 2);
  if (y23 > 0) {
    factor *= Math.pow(1 - rates.year2_3, y23);
  }
  
  // Years 4+ (3 onwards)
  const y4Plus = Math.max(years - 3, 0);
  if (y4Plus > 0) {
    factor *= Math.pow(1 - rates.year4Plus, y4Plus);
  }
  
  return factor;
}

/**
 * Calculate inflation-adjusted base price
 * If currentNewPrice is provided, use that instead of inflation calculation
 */
function getInflationAdjustedPrice(purchasePrice: number, yearsOwned: number, currentNewPrice?: number): number {
  if (currentNewPrice && currentNewPrice > 0) {
    return currentNewPrice;
  }
  // Compound inflation adjustment
  return purchasePrice * Math.pow(1 + ANNUAL_INFLATION_RATE, yearsOwned);
}

export interface DepreciationInput {
  purchasePrice: number;
  purchaseYear: number;
  purchaseMonth?: number; // Optional: 1-12 for more precise calculation
  category: string;
  condition: Item['condition'];
  currentNewPrice?: number; // Optional: current retail price of equivalent new item
}

export interface DepreciationResult {
  estimatedPrice: number;
  lowEstimate: number;
  highEstimate: number;
  ageFactor: number;
  conditionMultiplier: number;
  yearsOwned: number;
  tier: 'fast' | 'medium' | 'slow';
  floorPrice: number;
  inflationAdjustedBase: number;
  usedCurrentNewPrice: boolean;
}

/**
 * Calculate estimated resale price based on purchase details
 * 
 * Formula: 
 * 1. Get base price (currentNewPrice if provided, else inflation-adjusted purchasePrice)
 * 2. Apply age depreciation factor based on category tier
 * 3. Apply condition multiplier
 * 4. Ensure result doesn't fall below floor
 */
export function calculateDepreciation(input: DepreciationInput): DepreciationResult {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  
  // Calculate fractional years owned (more precise if month is provided)
  let yearsOwned = currentYear - input.purchaseYear;
  if (input.purchaseMonth && input.purchaseMonth >= 1 && input.purchaseMonth <= 12) {
    yearsOwned += (currentMonth - input.purchaseMonth) / 12;
  }
  yearsOwned = Math.max(0, yearsOwned);
  
  // Get tier (default to medium if category not found)
  const tier = CATEGORY_TIERS[input.category] || 'medium';
  const rates = TIER_RATES[tier];
  
  // Get inflation-adjusted base price
  const usedCurrentNewPrice = !!(input.currentNewPrice && input.currentNewPrice > 0);
  const inflationAdjustedBase = getInflationAdjustedPrice(input.purchasePrice, yearsOwned, input.currentNewPrice);
  
  // Calculate factors
  const ageFactor = calculateAgeFactor(tier, yearsOwned);
  const conditionMultiplier = CONDITION_MULTIPLIERS[input.condition] || 0.80;
  
  // Calculate floor price (based on inflation-adjusted base)
  const floorPrice = Math.round(inflationAdjustedBase * rates.floor);
  
  // Calculate estimated price
  let estimatedPrice = Math.round(inflationAdjustedBase * ageFactor * conditionMultiplier);
  
  // Apply floor
  estimatedPrice = Math.max(estimatedPrice, floorPrice);
  
  // Calculate range (±5%) and round to nearest 100 for cleaner aesthetics
  const lowEstimate = Math.round((estimatedPrice * 0.95) / 100) * 100;
  const highEstimate = Math.round((estimatedPrice * 1.05) / 100) * 100;
  
  return {
    estimatedPrice,
    lowEstimate,
    highEstimate,
    ageFactor,
    conditionMultiplier,
    yearsOwned,
    tier,
    floorPrice,
    inflationAdjustedBase: Math.round(inflationAdjustedBase),
    usedCurrentNewPrice,
  };
}

/**
 * Format price estimate as display string
 */
export function formatPriceEstimate(result: DepreciationResult): string {
  const low = result.lowEstimate.toLocaleString();
  const high = result.highEstimate.toLocaleString();
  return `Rs. ${low} – Rs. ${high}`;
}

/**
 * Generate array of years for dropdown (last 20 years)
 */
export function getPurchaseYearOptions(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let i = 0; i <= 20; i++) {
    years.push(currentYear - i);
  }
  return years;
}

/**
 * Generate array of months for dropdown
 */
export function getPurchaseMonthOptions(): { value: number; label: string }[] {
  return [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];
}
