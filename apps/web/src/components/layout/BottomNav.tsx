"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, PlusCircle, MessageSquare, Activity, type LucideIcon } from "lucide-react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import FilterSheetContent from "@/components/marketplace/FilterSheetContent";
import { useState } from "react";

export default function BottomNav() {
  const pathname = usePathname();
  const { messages, items, bids, user } = useApp();


  const unreadCount = user ? messages.filter(m => !m.isRead && m.senderId !== user.id).length : 0;
  
  const myItems = user ? items.filter(i => i.sellerId === user.id) : [];
  const receivedBidsCount = user ? bids.filter(b => b.status === 'pending' && myItems.some(i => i.id === b.itemId)).length : 0;
  
  const myBidsItems = user ? items.filter(i => bids.some(b => b.bidderId === user.id && b.itemId === i.id)) : [];
  const outbidCount = user ? myBidsItems.filter(i => i.currentHighBidderId && i.currentHighBidderId !== user.id).length : 0;
  const totalDashboardCount = receivedBidsCount + outbidCount;
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const navItems: { label: string; icon: LucideIcon; href: string; isDrawer?: boolean }[] = [
    {
      label: "Post",
      icon: PlusCircle,
      href: "/list",
    },
    {
      label: "Market",
      icon: LayoutGrid,
      href: "/",
    },
    {
      label: "Inbox",
      icon: MessageSquare,
      href: "/inbox",
    },
    {
      label: "Dashboard",
      icon: Activity,
      href: "/dashboard",
    },
  ];

  return (
    <div id="bottom-nav-container-01" className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 h-16 safe-area-pb">
      <div id="bottom-nav-wrapper-02" className="flex items-center justify-around h-full px-2">
        {navItems.map((item) => {
          const isActive = item.href ? pathname === item.href : false;
          const Icon = item.icon;

          const content = (
            <div
              key={item.label}
              id={`bottom-nav-item-${item.label.toLowerCase()}`}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px] h-full transition-colors duration-200 cursor-pointer",
                isActive ? "text-blue-600" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <div className="relative text-center flex flex-col items-center">
                <Icon 
                  id={`bottom-nav-icon-${item.label.toLowerCase()}`}
                  className={cn(
                    "h-6 w-6 transition-transform duration-200",
                    isActive && "scale-110"
                  )} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {item.label === "Inbox" && unreadCount > 0 && (
                  <span className="absolute -top-1 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
                {item.label === "Dashboard" && totalDashboardCount > 0 && (
                  <span className="absolute -top-1 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white ring-2 ring-white">
                    {totalDashboardCount}
                  </span>
                )}
                <span 
                  id={`bottom-nav-text-${item.label.toLowerCase()}`}
                  className={cn(
                  "text-[10px] font-medium tracking-wide mt-1",
                  isActive ? "font-bold" : "font-medium"
                )}>
                  {item.label}
                </span>
              </div>
            </div>
          );

          if (item.isDrawer) {
            return (
              <Sheet key={item.label} open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  {content}
                </SheetTrigger>
                <SheetContent side="bottom" className="p-0 h-[85vh] rounded-t-3xl border-none">
                  {/* Accessibility: Hidden Title */}
                  <div className="sr-only">
                    <h2 id="filters-sheet-title">Marketplace Filters</h2>
                  </div>
                  <FilterSheetContent onClose={() => setIsFilterOpen(false)} />
                </SheetContent>
              </Sheet>
            );
          }

          return (
            <Link
              key={item.label}
              id={`bottom-nav-link-${item.label.toLowerCase()}`}
              href={item.href || '#'}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
