"use client";

import { useApp } from "@/lib/store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Tag, 
  ArrowLeft,
  LayoutGrid,
  Laptop,
  Armchair,
  Wrench,
  Music,
  Camera,
  Car,
  Home,
  Shirt,
  Tv
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CATEGORY_ITEMS = [
  { label: "All Items", icon: LayoutGrid },
  { label: "Electronics", icon: Laptop },
  { label: "Furniture", icon: Armchair },
  { label: "Auto Parts", icon: Wrench },
  { label: "Audio", icon: Music },
  { label: "Cameras", icon: Camera },
  { label: "Vehicles", icon: Car },
  { label: "Property", icon: Home },
  { label: "Fashion", icon: Shirt },
  { label: "Home Appliances", icon: Tv },
];

export default function CategoriesPage() {
  const { filters, setFilter } = useApp();
  const router = useRouter();

  const handleCategoryClick = (cat: string) => {
    setFilter('category', cat === "All Items" ? null : cat);
    // Navigation is handled by Link
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-20 md:hidden">
      <div className="sticky top-0 z-10 bg-white border-b px-4 h-16 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Button>
        <h1 className="font-bold text-lg text-slate-900 flex items-center gap-2">
          <Tag className="h-5 w-5 text-blue-500" />
          Browse Categories
        </h1>
      </div>

      <div className="p-4 grid grid-cols-2 gap-3">
        {CATEGORY_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = filters.category === item.label || (item.label === "All Items" && !filters.category);
          
          return (
            <Link
              key={item.label}
              href="/"
              onClick={() => handleCategoryClick(item.label)}
              className={cn(
                "flex flex-col items-center justify-center p-6 rounded-xl border text-center transition-all active:scale-95",
                isActive
                  ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-slate-50"
              )}
            >
              <Icon 
                className={cn(
                  "h-8 w-8 mb-3 transition-colors",
                  isActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-500"
                )} 
                strokeWidth={1.5}
              />
              <span className="font-semibold text-sm">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
