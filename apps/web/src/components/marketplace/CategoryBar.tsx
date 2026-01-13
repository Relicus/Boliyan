"use client";

import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useRef, useState, useEffect } from "react";
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
  ChevronLeft,
  ChevronRight
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      checkScroll();
      scrollContainer.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
      return () => {
        scrollContainer.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 350;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="relative w-full group overflow-hidden">
      {/* Scroll Gradient - Left */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none transition-opacity duration-300",
        "bg-gradient-to-r from-white md:from-slate-50 via-white/80 md:via-slate-50/80 to-transparent",
        showLeftArrow ? "opacity-100" : "opacity-0"
      )} />

      {/* Navigation Button - Left */}
      {showLeftArrow && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-20 h-10 w-10 flex items-center justify-center rounded-full bg-white md:bg-slate-50 border border-slate-200 shadow-xl text-slate-600 hover:text-slate-900 transition-all active:scale-95"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Scrollable Container */}
      <div 
        id="category-bar-root" 
        ref={scrollContainerRef}
        className="flex w-full overflow-x-auto scrollbar-hide gap-3 px-4 py-2 scroll-smooth items-center"
      >
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.label;
          const slug = category.label.toLowerCase().replace(/\s+/g, '-');
          
          return (
            <button
              key={category.label}
              id={`category-btn-${slug}`}
              onClick={() => setFilter('category', category.label === "All Items" ? null : category.label)}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all duration-300 border shrink-0",
                isSelected
                  ? "bg-slate-900 text-white border-slate-900 shadow-md transform scale-105"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm"
              )}
            >
              <Icon id={`category-icon-${slug}`} className={cn("h-4 w-4", isSelected ? "text-white" : "text-slate-500")} />
              {category.label}
            </button>
          );
        })}
      </div>

       {/* Scroll Gradient - Right */}
       <div className={cn(
        "absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none transition-opacity duration-300",
        "bg-gradient-to-l from-white md:from-slate-50 via-white/80 md:via-slate-50/80 to-transparent",
        showRightArrow ? "opacity-100" : "opacity-0"
      )} />

      {/* Navigation Button - Right */}
      {showRightArrow && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-20 h-10 w-10 flex items-center justify-center rounded-full bg-white md:bg-slate-50 border border-slate-200 shadow-xl text-slate-600 hover:text-slate-900 transition-all active:scale-95"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
