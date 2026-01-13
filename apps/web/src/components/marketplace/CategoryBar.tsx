"use client";

import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

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
  Camera
} from "lucide-react";

const CATEGORIES = [
  { label: "All Items", icon: LayoutGrid },
  { label: "Mobiles", icon: Smartphone },
  { label: "Electronics", icon: Laptop },
  { label: "Furniture", icon: Armchair },
  { label: "Fashion", icon: Shirt },
  { label: "Sports", icon: Dumbbell },
  { label: "Gaming", icon: Gamepad2 },
  { label: "Watches", icon: Watch },
  { label: "Audio", icon: Music },
  { label: "Cameras", icon: Camera },
  { label: "Community", icon: Users }
];

export default function CategoryBar() {
  const { filters, setFilter } = useApp();
  const selectedCategory = filters.category || "All Items";

  return (
    <div className="flex w-full overflow-x-auto scrollbar-hide gap-2 py-1">
      {CATEGORIES.map((category) => {
        const Icon = category.icon;
        const isSelected = selectedCategory === category.label;
        
        return (
          <button
            key={category.label}
            onClick={() => setFilter('category', category.label === "All Items" ? null : category.label)}
            className={cn(
              "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all duration-200 border",
              isSelected
                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
            )}
          >
            <Icon className={cn("h-3.5 w-3.5", isSelected ? "text-white" : "text-slate-500")} />
            {category.label}
          </button>
        );
      })}
    </div>
  );
}
