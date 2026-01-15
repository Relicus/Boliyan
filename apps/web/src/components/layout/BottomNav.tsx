"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, LayoutGrid, PlusCircle, MessageSquare, User } from "lucide-react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const pathname = usePathname();
  const { messages } = useApp();
  const unreadCount = messages.filter(m => !m.isRead).length;

  const navItems = [
    {
      label: "Home",
      icon: Compass,
      href: "/",
    },
    {
      label: "Categories",
      icon: LayoutGrid,
      href: "/categories",
    },

    {
      label: "Post",
      icon: PlusCircle,
      href: "/list",
    },
    {
      label: "Inbox",
      icon: MessageSquare,
      href: "/inbox",
    },
    {
      label: "Dashboard",
      icon: User,
      href: "/dashboard",
    },
  ];

  return (
    <div id="bottom-nav-container-01" className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 h-16 safe-area-pb">
      <div id="bottom-nav-wrapper-02" className="flex items-center justify-around h-full px-2">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              id={`bottom-nav-link-${item.label.toLowerCase()}`}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px] h-full transition-colors duration-200",
                isActive ? "text-blue-600" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <div className="relative">
                <Icon 
                  id={`bottom-nav-icon-${item.label.toLowerCase()}`}
                  className={cn(
                    "h-6 w-6 transition-transform duration-200",
                    isActive && "scale-110"
                  )} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {item.label === "Inbox" && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white" />
                )}
              </div>
              <span 
                id={`bottom-nav-text-${item.label.toLowerCase()}`}
                className={cn(
                "text-[10px] font-medium tracking-wide",
                isActive ? "font-bold" : "font-medium"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
