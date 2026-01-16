"use client";

import { Search, User, Bell, Plus, LogOut, Activity, Heart, UserCircle, MessageSquare, LayoutGrid, Tag, Gavel } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { LocationSelector } from "@/components/marketplace/LocationSelector";
import { VerifiedBadge } from "@/components/common/VerifiedBadge";
import { SearchDropdown } from "./SearchDropdown";
import { useState, useEffect, useRef } from "react";


export default function Navbar() {
  const { filters, setFilter, user, isLoggedIn, logout, items, bids, messages } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab');
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Notifications Calculation
  const unreadMsgCount = messages.filter(m => !m.isRead && m.senderId !== user.id).length;
  
  const myItems = items.filter(i => i.sellerId === user.id);
  const receivedBidsCount = bids.filter(b => b.status === 'pending' && myItems.some(i => i.id === b.itemId)).length;
  
  const myBidsItems = items.filter(i => bids.some(b => b.bidderId === user.id && b.itemId === i.id));
  const outbidCount = myBidsItems.filter(i => i.currentHighBidderId && i.currentHighBidderId !== user.id).length;

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        const currentScrollY = window.scrollY;
        
        // Disable hide effect for Inbox and restricted views
        if (pathname === '/inbox' || pathname === '/signin' || pathname === '/signup') {
          setIsVisible(true);
          return;
        }

        // Show navbar if scrolling up or at the very top
        // Hide navbar if scrolling down and past 100px
        if (currentScrollY < lastScrollY.current || currentScrollY < 10) {
          setIsVisible(true);
        } else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
          setIsVisible(false);
        }

        lastScrollY.current = currentScrollY;
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', controlNavbar);

      // Cleanup function
      return () => {
        window.removeEventListener('scroll', controlNavbar);
      };
    }
  }, [pathname]);

  return (
    <nav 
      id="navbar-01" 
      className={`fixed top-0 left-0 right-0 z-50 w-full border-b bg-white transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div id="navbar-container-02" className="w-full flex h-16 items-center justify-between px-4 lg:px-6">
        {/* ... existing navbar content */}

        <div id="navbar-left-section-03" className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <Link id="navbar-logo-link-04" href="/" className="group flex items-center gap-2 select-none transition-transform duration-200 active:scale-95">
              {/* Geometric 'Ba' (ب) Logomark */}
              <svg id="navbar-logo-svg-05" viewBox="0 0 40 40" className="h-[clamp(32px,4vw,40px)] w-[clamp(32px,4vw,40px)] shrink-0 transition-all duration-300 group-hover:drop-shadow-md">
                {/* Ba Curve */}
                <path
                  d="M32,10 C32,20 28,26 16,26 C12,26 8,24 8,24"
                  stroke="currentColor"
                  strokeWidth="7"
                  fill="none"
                  strokeLinecap="round"
                  id="navbar-logo-path-06"
                  className="transition-all duration-300 text-blue-600"
                />
                {/* Dot at bottom */}
                <circle
                  cx="18"
                  cy="36"
                  r="4"
                  id="navbar-logo-dot-07"
                  className="transition-all duration-300 fill-blue-600"
                />
              </svg>
              
              <div id="navbar-brand-name-08" className="flex flex-col items-center justify-center gap-0 py-0.5">
                <span id="navbar-brand-urdu-09" className="text-[clamp(1.25rem,3vw,1.75rem)] font-black mb-[-2px] transition-all duration-300 font-[family-name:var(--font-noto-urdu)] bg-clip-text text-transparent bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600">
                  بولیاں
                </span>
                {/* English: Much smaller, wide spacing */}
                <span id="navbar-brand-english-10" className="text-[clamp(7px,1.2vw,9px)] font-bold tracking-[0.4em] uppercase transition-all duration-300 font-[family-name:var(--font-outfit)] bg-clip-text text-transparent bg-gradient-to-br from-blue-400 to-blue-200 leading-none">
                  Boliyan
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* Global Search Bar (Full Width on Mobile) */}
        <div className="flex-1 px-3 md:px-6 max-w-4xl">
          <SearchDropdown />
        </div>

        <div id="navbar-right-section-11" className="flex items-center gap-2 shrink-0">
          <Button id="navbar-sell-btn-12" asChild variant="outline" className="hidden sm:flex items-center gap-2 border-blue-100 hover:bg-blue-50 text-blue-600">
            <Link href={isLoggedIn ? "/list" : "/signin"}>
              <Plus id="navbar-sell-plus-icon-13" className="h-4 w-4" />
              Sell Item
            </Link>
          </Button>

          {isLoggedIn ? (
            <>
              {/* Desktop Actions */}
              <div className="hidden md:flex items-center gap-1 mr-2">
                <Button id="navbar-market-btn" asChild variant="ghost" className={cn(
                  "flex items-center gap-2 rounded-full px-4 relative transition-colors hover:bg-slate-100/80",
                  pathname === '/' ? "text-blue-600 font-bold" : "text-slate-600 font-medium"
                )}>
                  <Link href="/">
                    <LayoutGrid id="navbar-market-icon" className={cn("h-5 w-5", pathname === '/' && "stroke-[2.5]")} strokeWidth={pathname === '/' ? 2.5 : 1.5} />
                    <span>Market</span>
                  </Link>
                </Button>

                <Button id="navbar-offers-btn" asChild variant="ghost" className={cn(
                  "flex items-center gap-2 rounded-full px-4 relative transition-colors hover:bg-slate-100/80",
                  pathname === '/dashboard' && currentTab === 'active-bids' ? "text-blue-600 font-bold" : "text-slate-600 font-medium"
                )}>
                  <Link href="/dashboard?tab=active-bids">
                    <Tag id="navbar-offers-icon" className={cn("h-5 w-5", pathname === '/dashboard' && currentTab === 'active-bids' && "stroke-[2.5]")} strokeWidth={pathname === '/dashboard' && currentTab === 'active-bids' ? 2.5 : 1.5} />
                    <span>Offers</span>
                    {receivedBidsCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white ring-2 ring-white">
                        {receivedBidsCount}
                      </span>
                    )}
                  </Link>
                </Button>

                <Button id="navbar-bids-btn" asChild variant="ghost" className={cn(
                  "flex items-center gap-2 rounded-full px-4 relative transition-colors hover:bg-slate-100/80",
                  pathname === '/dashboard' && currentTab === 'my-bids' ? "text-blue-600 font-bold" : "text-slate-600 font-medium"
                )}>
                  <Link href="/dashboard?tab=my-bids">
                    <Gavel id="navbar-bids-icon" className={cn("h-5 w-5", pathname === '/dashboard' && currentTab === 'my-bids' && "stroke-[2.5]")} strokeWidth={pathname === '/dashboard' && currentTab === 'my-bids' ? 2.5 : 1.5} />
                    <span>Bids</span>
                    {outbidCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white ring-2 ring-white">
                        {outbidCount}
                      </span>
                    )}
                  </Link>
                </Button>

                <Button id="navbar-chat-btn" asChild variant="ghost" className={cn(
                  "flex items-center gap-2 rounded-full px-4 relative transition-colors hover:bg-slate-100/80",
                  pathname.startsWith('/inbox') ? "text-blue-600 font-bold" : "text-slate-600 font-medium"
                )}>
                  <Link href="/inbox">
                    <MessageSquare id="navbar-chat-icon" className={cn("h-5 w-5", pathname.startsWith('/inbox') && "stroke-[2.5]")} strokeWidth={pathname.startsWith('/inbox') ? 2.5 : 1.5} />
                    <span>Chat</span>
                    {unreadMsgCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                        {unreadMsgCount}
                      </span>
                    )}
                  </Link>
                </Button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar id="navbar-avatar-18" className="h-12 w-12 cursor-pointer ring-2 ring-transparent hover:ring-blue-100 transition-all border shadow-sm">
                    <AvatarImage id="navbar-avatar-image-19" src={user.avatar} />
                    <AvatarFallback id="navbar-avatar-fallback-20">{user.name[0]}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-1 p-2 rounded-2xl shadow-xl border-slate-100">
                  <DropdownMenuLabel className="font-outfit pb-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-black text-slate-900 flex items-center gap-1.5">
                        {user.name}
                        {user.isVerified && <VerifiedBadge size="sm" />}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">Verified User</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-100" />
                  <DropdownMenuItem asChild className="rounded-xl py-2.5 cursor-pointer focus:bg-slate-50 focus:text-blue-600">
                    <Link href="/dashboard" className="flex items-center w-full">
                      <Activity className="mr-2.5 h-4 w-4 opacity-70" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl py-2.5 cursor-pointer focus:bg-slate-50 focus:text-blue-600">
                    <Link href="/profile" className="flex items-center w-full">
                      <UserCircle className="mr-2.5 h-4 w-4 opacity-70" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl py-2.5 cursor-pointer focus:bg-slate-50 focus:text-blue-600">
                    <Link href="/inbox" className="flex items-center w-full">
                      <MessageSquare className="mr-2.5 h-4 w-4 opacity-70" />
                      Messages
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl py-2.5 cursor-pointer focus:bg-slate-50 focus:text-blue-600">
                    <Link href="/dashboard?tab=watchlist" className="flex items-center w-full">
                      <Heart className="mr-2.5 h-4 w-4 opacity-70" />
                      Watched Items
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-100" />
                  <DropdownMenuItem 
                    onClick={() => {
                      logout();
                      router.push("/");
                    }}
                    className="rounded-xl py-2.5 cursor-pointer focus:bg-red-50 focus:text-red-600 text-red-500"
                  >
                    <LogOut className="mr-2.5 h-4 w-4 opacity-70" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button id="navbar-signin-btn" asChild className="h-11 px-6 bg-blue-600 hover:bg-blue-700 font-bold text-sm shadow-md shadow-blue-200">
              <Link href="/signin">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
