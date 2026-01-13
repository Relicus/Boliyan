"use client";

import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "All Items",
  "Vehicles",
  "Properties",
  "Mobiles",
  "Computers",
  "Home & Garden",
  "Fashion",
  "Sports",
  "Services",
  "Jobs",
  "Community"
];

export default function CategoryBar() {
  const { filters, setFilter } = useApp();
  const selectedCategory = filters.category || "All Items";

  return (
    <div className="flex w-full overflow-x-auto scrollbar-hide py-2 gap-2 px-4 border-b border-slate-100 bg-white sticky top-0 z-20">
      {CATEGORIES.map((category) => (
        <button
          key={category}
          onClick={() => setFilter('category', category === "All Items" ? null : category)}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-200",
            selectedCategory === category
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
