"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, PlusCircle, MessageSquare, LayoutDashboard, Bookmark, type LucideIcon } from "lucide-react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import FilterSheetContent from "@/components/marketplace/FilterSheetContent";
import { useState } from "react";
import { NotificationBadge } from "@/components/common/NotificationBadge";

export default function BottomNav() {
  const pathname = usePathname();
  const { messages, items, bids, user, watchedItemIds } = useApp();

  const unreadCount = user ? messages.filter(m => !m.isRead && m.senderId !== user.id).length : 0;
  
  // Dashboard count: pending/accepted bids on my listings (matches navbar)
  const myItemIds = user ? new Set(items.filter(i => i.sellerId === user.id).map(i => i.id)) : new Set();
  const totalDashboardCount = user 
    ? bids.filter(b => myItemIds.has(b.itemId) && (b.status === 'pending' || b.status === 'accepted')).length 
    : 0;
  
  // Watchlist count
  const watchlistCount = watchedItemIds?.length || 0;
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Nav order: Market, Watch, +Sell, Chat, Dash
  const navItems: { label: string; icon: LucideIcon; href: string; isDrawer?: boolean; badgeCount?: number }[] = [
    {
      label: "Market",
      icon: Store,
      href: "/",
    },
    {
      label: "Watch",
      icon: Bookmark,
      href: "/dashboard?tab=watchlist",
      badgeCount: watchlistCount,
    },
    {
      label: "Sell",
      icon: PlusCircle,
      href: "/list",
    },
    {
      label: "Chat",
      icon: MessageSquare,
      href: "/inbox",
      badgeCount: unreadCount,
    },
    {
      label: "Dash",
      icon: LayoutDashboard,
      href: "/dashboard?tab=offers",
      badgeCount: totalDashboardCount,
    },
  ];

  return (
    <div id="bottom-nav-container-01" className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 h-16 safe-area-pb overflow-visible">
      {/* The "Pimple" Bulge - Smooth curve integrated into the bar */}
      <div className="absolute left-1/2 -top-6 -translate-x-1/2 w-16 h-12 bg-white rounded-t-[2.5rem] border-t border-x border-slate-200 shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.05)]" />
      
      <div id="bottom-nav-wrapper-02" className="flex items-center justify-between h-full px-4 relative z-10">
        {navItems.map((item) => {
          let isActive = false;
          
          if (item.label === "Dash" || item.label === "Watch") {
            isActive = pathname === "/dashboard";
          } else {
            isActive = item.href ? pathname === item.href : false;
          }

          const isPost = item.label === "Sell";
          const Icon = item.icon;

          const content = (
            <div
              key={item.label}
              id={`bottom-nav-item-${item.label.toLowerCase()}`}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[60px] h-full transition-all duration-300 cursor-pointer",
                isPost ? "text-blue-600 -mt-7" : (isActive ? "text-slate-900" : "text-slate-400 hover:text-slate-600")
              )}
            >
              <div className="relative text-center flex flex-col items-center">
                <div className={cn(
                  "flex flex-col items-center justify-center transition-all duration-300",
                  isPost && "scale-125"
                )}>
                  <Icon 
                    id={`bottom-nav-icon-${item.label.toLowerCase()}`}
                    className={cn(
                      "h-6 w-6 transition-transform duration-200",
                      isActive && "scale-110",
                      isPost && "scale-110"
                    )} 
                    strokeWidth={isActive ? 2.5 : 2}
                    fill="none"
                  />
                </div>
                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <NotificationBadge 
                    count={item.badgeCount} 
                    size="sm" 
                    className="absolute -top-1 -right-1" 
                  />
                )}
                <span 
                  id={`bottom-nav-text-${item.label.toLowerCase()}`}
                  className={cn(
                  "text-[10px] tracking-tight transition-all duration-300",
                  isActive ? "font-bold opacity-100" : "font-medium opacity-60",
                  isPost ? "mt-2.5 scale-110" : "mt-0.5"
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
