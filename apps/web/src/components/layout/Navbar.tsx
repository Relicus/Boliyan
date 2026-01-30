"use client";

import { Plus, LogOut, UserCircle, MessageSquare, Store, LayoutDashboard, BarChart3, MapPin, Bell, Shield, Users, Flag } from "lucide-react";
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
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { LocationSelector } from "@/components/marketplace/LocationSelector";
import { VerifiedBadge } from "@/components/common/VerifiedBadge";
// import { SearchDropdown } from "./SearchDropdown";
import SearchBar from "@/components/search/SearchBar";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { useNotifications } from "@/context/NotificationContext";
import Skeleton from "@/components/ui/Skeleton";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";


export default function Navbar() {
  const { user, isLoggedIn, logout, items, bids, messages, isLoading, resetFilters, isAdminMode, toggleAdminMode } = useApp();
  const { unreadCount: notificationUnreadCount } = useNotifications();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentTab = searchParams.get('tab');
  const dashboardTab = currentTab || 'offers';
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Other notifications
  const unreadMsgCount = (messages || []).filter(m => !m.isRead && m.senderId !== user?.id).length;
  
  const myItems = user ? items.filter(i => i.sellerId === user.id) : [];
  const receivedBidsCount = bids.filter(b => b.status === 'pending' && myItems.some(i => i.id === b.itemId)).length;
  
  const myBidsItems = user ? items.filter(i => bids.some(b => b.bidderId === user.id && b.itemId === i.id)) : [];
  const currentOutbidCount = user ? myBidsItems.filter(i => i.currentHighBidderId && i.currentHighBidderId !== user.id).length : 0;
  const dashboardAlertCount = receivedBidsCount + currentOutbidCount;

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        const currentScrollY = window.scrollY;
        
        // Disable hide effect for Inbox and restricted views
        if (pathname === '/inbox' || pathname === '/signin' || pathname === '/signup') {
          setIsVisible(true);
          lastScrollY.current = currentScrollY;
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
    
    // ... existing scroll logic ...
    
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', controlNavbar);
      return () => window.removeEventListener('scroll', controlNavbar);
    }
  }, [pathname]);

  return (
    <nav 
      id="navbar-01" 
      suppressHydrationWarning={true}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 w-full border-b bg-white transition-all duration-300",
        isVisible ? "translate-y-0" : "-translate-y-full",
        isAdminMode && "border-b-2 border-amber-400 bg-amber-50/30"
      )}
    >
      <div id="navbar-container-02" className="w-full flex h-16 items-center justify-between px-4 lg:px-0">
        <LayoutGroup>
        {/* ... existing navbar content ... */}

        <div id="navbar-left-section-03" className="flex items-center gap-4 shrink-0 lg:w-72 lg:justify-center">
          <div className="flex items-center gap-3">
            <Link id="navbar-logo-link-04" href="/" onClick={resetFilters} className="group flex items-center gap-2 select-none transition-transform duration-200 active:scale-y-95 active:opacity-80">
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
                <span id="navbar-brand-urdu-09" className="text-[clamp(1.25rem,3vw,1.75rem)] font-black mb-[-2px] transition-all duration-300 font-[family-name:var(--font-noto-urdu)] bg-clip-text text-transparent bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700">
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
        <motion.div 
          layout
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          className="flex-1 px-3 md:px-6 lg:px-0 lg:pl-10 max-w-4xl flex justify-center lg:justify-start"
        >
          <SearchBar />
        </motion.div>

        <motion.div 
          layout
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          id="navbar-right-section-11" 
          className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto lg:pr-6"
        >
          {/* Desktop Location Selector */}
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-[2px] pr-1 leading-none flex items-center gap-1">
              <MapPin className="h-2.5 w-2.5" />
              YOUR LOCATION
            </span>
            <LocationSelector align="end" mode="user" />
          </div>

          <Button id="navbar-sell-btn-12" asChild className="hidden sm:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 sm:px-4 shadow-lg shadow-blue-100 border-0">
            <Link href={isLoggedIn ? "/list" : `/signin?redirect=${encodeURIComponent("/list")}`}>
              <Plus id="navbar-sell-plus-icon-13" className="h-4 w-4 text-white" />
              <span className="hidden lg:inline">Sell Item</span>
            </Link>
          </Button>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                layout="position"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                id="navbar-loading-avatar"
                className="h-10 w-10"
              >
                <Skeleton className="h-10 w-10 rounded-full ring-1 ring-slate-200" />
              </motion.div>
            ) : isLoggedIn && user ? (
              <motion.div
                key="logged-in"
                layout="position"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex items-center"
              >
              {/* Desktop Actions - Hidden in Admin Mode */}
              {!isAdminMode && (
              <div className="hidden md:flex items-center gap-1 mr-2">
                <Button id="navbar-market-btn" asChild variant="ghost" className={cn(
                  "flex items-center gap-2 rounded-full px-4 relative transition-colors hover:bg-slate-100/80",
                  pathname === '/' ? "text-blue-600 font-bold" : "text-slate-600 font-medium"
                )}>
                  <Link href="/" onClick={resetFilters}>
                    <Store id="navbar-market-icon" className={cn("h-5 w-5", pathname === '/' && "stroke-[2.5]")} strokeWidth={pathname === '/' ? 2.5 : 1.5} />
                    <span>Market</span>
                  </Link>
                </Button>

                <Button id="navbar-dash-btn" asChild variant="ghost" className={cn(
                  "flex items-center gap-2 rounded-full px-4 relative transition-colors hover:bg-slate-100/80",
                  pathname === '/dashboard' ? "text-blue-600 font-bold" : "text-slate-600 font-medium"
                )}>
                  <Link href={`/dashboard?tab=${dashboardTab}`}>
                    <LayoutDashboard id="navbar-dash-icon" className={cn("h-5 w-5", pathname === '/dashboard' && "stroke-[2.5]")} strokeWidth={pathname === '/dashboard' ? 2.5 : 1.5} />
                    <span>Dash</span>
                    {dashboardAlertCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white">
                        {dashboardAlertCount}
                      </span>
                    )}
                  </Link>
                </Button>

                <Button id="navbar-analytics-btn" asChild variant="ghost" className={cn(
                  "flex items-center gap-2 rounded-full px-4 relative transition-colors hover:bg-slate-100/80",
                  pathname === '/dashboard/seller' ? "text-blue-600 font-bold" : "text-slate-600 font-medium"
                )}>
                  <Link href="/dashboard/seller">
                    <BarChart3 id="navbar-analytics-icon" className={cn("h-5 w-5", pathname === '/dashboard/seller' && "stroke-[2.5]")} strokeWidth={pathname === '/dashboard/seller' ? 2.5 : 1.5} />
                    <span>Analytics</span>
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
              )}

              {/* Admin Navigation (shown when in admin mode) */}
              {isAdminMode && (
                <div className="hidden md:flex items-center gap-1 mr-2">
                  <Button id="navbar-admin-reports-btn" asChild variant="ghost" className={cn(
                    "flex items-center gap-2 rounded-full px-4 relative transition-colors hover:bg-amber-50",
                    pathname === '/admin/reports' ? "text-amber-600 font-bold bg-amber-50" : "text-slate-600 font-medium"
                  )}>
                    <Link href="/admin/reports">
                      <Flag id="navbar-admin-reports-icon" className={cn("h-5 w-5", pathname === '/admin/reports' && "stroke-[2.5]")} strokeWidth={pathname === '/admin/reports' ? 2.5 : 1.5} />
                      <span>Reports</span>
                    </Link>
                  </Button>

                  <Button id="navbar-admin-users-btn" asChild variant="ghost" className={cn(
                    "flex items-center gap-2 rounded-full px-4 relative transition-colors hover:bg-amber-50",
                    pathname === '/admin/users' ? "text-amber-600 font-bold bg-amber-50" : "text-slate-600 font-medium"
                  )}>
                    <Link href="/admin/users">
                      <Users id="navbar-admin-users-icon" className={cn("h-5 w-5", pathname === '/admin/users' && "stroke-[2.5]")} strokeWidth={pathname === '/admin/users' ? 2.5 : 1.5} />
                      <span>Users</span>
                    </Link>
                  </Button>
                </div>
              )}

              {/* New Notification Dropdown - Hidden below lg (1024px) */}
              <div className="hidden lg:block ml-1 mr-3">
                 <NotificationDropdown />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="relative">
                    <Avatar id="navbar-avatar-18" className="h-12 w-12 cursor-pointer ring-2 ring-transparent hover:ring-blue-100 transition-all border shadow-sm">
                      <AvatarImage id="navbar-avatar-image-19" src={user.avatar} />
                      <AvatarFallback id="navbar-avatar-fallback-20">{user.name[0]}</AvatarFallback>
                    </Avatar>
                    {/* Notification dot on avatar - shown below lg (1024px) when there are unread notifications */}
                    {notificationUnreadCount > 0 && (
                      <span className="lg:hidden absolute -top-0.5 -right-0.5 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600 ring-2 ring-white"></span>
                      </span>
                    )}
                  </div>
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
                  {/* Notifications menu item - shown below lg (1024px) */}
                  <DropdownMenuItem asChild className="lg:hidden rounded-xl py-2.5 cursor-pointer focus:bg-slate-50 focus:text-blue-600">
                    <Link id="navbar-notifications-link" href="/notifications" className="flex items-center w-full">
                      <Bell className="mr-2.5 h-4 w-4 opacity-70" />
                      Notifications
                      {notificationUnreadCount > 0 && (
                        <span className="ml-auto flex h-5 min-w-[1.25rem] px-1.5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                          {notificationUnreadCount}
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl py-2.5 cursor-pointer focus:bg-slate-50 focus:text-blue-600">
                    <Link id="navbar-profile-link" href="/profile" className="flex items-center w-full">
                      <UserCircle className="mr-2.5 h-4 w-4 opacity-70" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  {/* Admin Mode Toggle - only visible to admin users */}
                  {user.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator className="bg-slate-100" />
                      <DropdownMenuItem 
                        id="navbar-admin-toggle"
                        onClick={toggleAdminMode}
                        className={cn(
                          "rounded-xl py-2.5 cursor-pointer",
                          isAdminMode 
                            ? "bg-amber-50 text-amber-700 focus:bg-amber-100" 
                            : "focus:bg-amber-50 focus:text-amber-700"
                        )}
                      >
                        <Shield className="mr-2.5 h-4 w-4 opacity-70" />
                        {isAdminMode ? "Exit Admin Mode" : "Admin Mode"}
                        {isAdminMode && (
                          <span className="ml-auto text-[9px] font-bold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full">
                            ON
                          </span>
                        )}
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="bg-slate-100" />
                  <DropdownMenuItem 
                    id="navbar-logout-btn"
                    onClick={() => {
                      logout();
                    }}
                    className="rounded-xl py-2.5 cursor-pointer focus:bg-red-50 focus:text-red-600 text-red-500"
                  >
                    <LogOut className="mr-2.5 h-4 w-4 opacity-70" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </motion.div>
            ) : (
              <motion.div
                key="signed-out"
                layout="position"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Button id="navbar-signin-btn" asChild className="h-11 px-6 bg-blue-600 hover:bg-blue-700 font-bold text-sm shadow-md shadow-blue-200">
                  <Link href={`/signin?redirect=${encodeURIComponent(pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : ""))}`}>Sign In</Link>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        </LayoutGroup>
      </div>
    </nav>
  );
}
