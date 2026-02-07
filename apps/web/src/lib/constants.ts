import { 
  Smartphone, 
  Laptop, 
  Armchair, 
  Shirt, 
  Dumbbell, 
  Watch,
  Gamepad2,
  Users,
  LayoutGrid,
  Music,
  Camera,
  Activity,
  Tv
} from "lucide-react";

export const CATEGORIES = [
  { label: "All Items", icon: LayoutGrid, description: "Browse everything available" },
  { label: "Mobiles", icon: Smartphone, description: "Phones, tablets and accessories" },
  { label: "Electronics", icon: Laptop, description: "Computers, gadgets and tech" },
  { label: "Appliances", icon: Tv, description: "Home and kitchen appliances" },
  { label: "Furniture", icon: Armchair, description: "Home and office furniture" },
  { label: "Fashion", icon: Shirt, description: "Clothing, shoes and apparel" },
  { label: "Sports", icon: Dumbbell, description: "Gym equipment and sports gear" },
  { label: "Gaming", icon: Gamepad2, description: "Consoles, games and accessories" },
  { label: "Watches", icon: Watch, description: "Luxury and everyday timepieces" },
  { label: "Audio", icon: Music, description: "Headphones, speakers and systems" },
  { label: "Cameras", icon: Camera, description: "Photography and video gear" },
  { label: "Hobbies", icon: Activity, description: "Instruments, antiques and collectibles" },
  { label: "Community", icon: Users, description: "Local services and community items" }
];

export const LISTING_LIMITS = {
  TITLE: { MIN: 10, MAX: 80 },
  PRICE: { MIN: 500, MAX: 10000000 },
  DESCRIPTION: { MIN: 20, MAX: 2000 }
};

export const LISTING_IMAGE_INPUT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif"
];

export const LISTING_IMAGE_INPUT_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".heic",
  ".heif"
];

export const LISTING_IMAGE_OUTPUT_MIME = "image/webp";
export const LISTING_IMAGE_UPLOAD_MIME_TYPES = [
  ...LISTING_IMAGE_INPUT_MIME_TYPES,
  LISTING_IMAGE_OUTPUT_MIME
];

export const LISTING_IMAGE_ACCEPT = LISTING_IMAGE_INPUT_MIME_TYPES.join(",");

export const LISTING_IMAGE_MAX_BYTES = 1_000_000;
export const LISTING_IMAGE_MAX_DIMENSION = 1600;
export const LISTING_IMAGE_WEBP_QUALITY = 0.82;
export const LISTING_IMAGE_WEBP_MIN_QUALITY = 0.5;

export const isAllowedListingImageInput = (file: File) => {
  const type = file.type.toLowerCase();
  if (LISTING_IMAGE_INPUT_MIME_TYPES.includes(type)) return true;
  const name = file.name.toLowerCase();
  return LISTING_IMAGE_INPUT_EXTENSIONS.some((ext) => name.endsWith(ext));
};

export const isAllowedListingImageUpload = (file: File) => {
  const type = file.type.toLowerCase();
  if (LISTING_IMAGE_UPLOAD_MIME_TYPES.includes(type)) return true;
  const name = file.name.toLowerCase();
  return LISTING_IMAGE_INPUT_EXTENSIONS.some((ext) => name.endsWith(ext));
};


/**
 * Centralized condition configuration - SINGLE SOURCE OF TRUTH
 * 
 * Use this everywhere: badges, filters, dropdowns, active filters.
 * Structure:
 * - id: Database value ('new', 'like_new', 'used', 'fair')
 * - label: Display label for filters/dropdowns
 * - badgeLabel: Short label for badges (with emoji)
 * - icon: Lucide icon name for filter UI
 */
export const CONDITION_OPTIONS = [
  { id: 'new', label: 'New', badgeLabel: '🌟 New', icon: 'Sparkles' },
  { id: 'like_new', label: 'Like New', badgeLabel: '✨ Mint', icon: 'Star' },
  { id: 'used', label: 'Used', badgeLabel: '👌 Used', icon: 'ThumbsUp' },
  { id: 'fair', label: 'Fair', badgeLabel: '⚡ Fair', icon: 'Wrench' },
] as const;

export type ConditionId = typeof CONDITION_OPTIONS[number]['id'];

/**
 * Maps database condition strings to badge display labels.
 */
export function getConditionLabel(condition: string): string {
  const found = CONDITION_OPTIONS.find(c => c.id === condition);
  return found?.badgeLabel ?? '👌 Used';
}

/**
 * Maps database condition strings to filter display labels.
 */
export function getConditionFilterLabel(condition: string): string {
  const found = CONDITION_OPTIONS.find(c => c.id === condition);
  return found?.label ?? 'Used';
}
