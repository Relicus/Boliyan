"use client";

import { useApp } from "@/lib/store";
import { useRouter } from "next/navigation";
import { Tag, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const categories = [
  "All Items",
  "Electronics",
  "Furniture",
  "Auto Parts",
  "Audio",
  "Cameras",
  "Vehicles",
  "Property",
  "Fashion",
  "Home Appliances",
];

export default function CategoriesPage() {
  const { filters, setFilter } = useApp();
  const router = useRouter();

  const handleCategoryClick = (cat: string) => {
    setFilter('category', cat);
    router.push('/');
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
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryClick(cat)}
            className={`
              flex flex-col items-center justify-center p-6 rounded-xl border text-center transition-all active:scale-95
              ${filters.category === cat
                ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                : 'bg-white border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-slate-50'
              }
            `}
          >
            <span className="font-semibold text-sm">{cat}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
