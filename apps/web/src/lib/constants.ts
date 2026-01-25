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

export const LISTING_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif"
];

export const LISTING_IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".heic",
  ".heif"
];

export const LISTING_IMAGE_ACCEPT = LISTING_IMAGE_MIME_TYPES.join(",");

export const isAllowedListingImage = (file: File) => {
  const type = file.type.toLowerCase();
  if (LISTING_IMAGE_MIME_TYPES.includes(type)) return true;
  const name = file.name.toLowerCase();
  return LISTING_IMAGE_EXTENSIONS.some((ext) => name.endsWith(ext));
};


