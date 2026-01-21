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

