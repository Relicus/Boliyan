"use client";

import { Search, User, Bell, Plus, LogOut, LayoutDashboard, Heart, UserCircle, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useRouter } from "next/navigation";
import { LocationSelector } from "@/components/marketplace/LocationSelector";

export default function Navbar() {
  const { filters, setFilter, user, isLoggedIn, logout } = useApp();
  const router = useRouter();

  return (
    <nav id="navbar-01" className="relative md:sticky md:top-0 z-50 w-full border-b bg-white">
      <div id="navbar-container-02" className="w-full flex h-16 items-center justify-between px-4 lg:px-6">
        <div id="navbar-left-section-03" className="flex items-center gap-6">
          <div className="flex items-center gap-5">
            <Link id="navbar-logo-link-04" href="/" className="group flex items-center gap-1.5 select-none transition-transform duration-200 active:scale-95">
              {/* Geometric 'Ba' (ب) Logomark */}
              <svg id="navbar-logo-svg-05" viewBox="0 0 40 40" className="h-10 w-10 shrink-0 transition-all duration-300 group-hover:drop-shadow-md">
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
                {/* Urdu: Larger, on top */}
                <span id="navbar-brand-urdu-09" className="text-2xl font-black mb-[-2px] transition-all duration-300 font-[family-name:var(--font-noto-urdu)] bg-clip-text text-transparent bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600">
                  بولیاں
                </span>
                {/* English: Much smaller, wide spacing */}
                <span id="navbar-brand-english-10" className="text-[10px] font-bold tracking-[0.4em] uppercase transition-all duration-300 font-[family-name:var(--font-outfit)] bg-clip-text text-transparent bg-gradient-to-br from-blue-400 to-blue-200">
                  Boliyan
                </span>
              </div>
            </Link>
          </div>
        </div>

        <div id="navbar-right-section-11" className="hidden md:flex items-center gap-2">
          <Button id="navbar-sell-btn-12" asChild variant="outline" className="hidden sm:flex items-center gap-2 border-blue-100 hover:bg-blue-50 text-blue-600">
            <Link href={isLoggedIn ? "/list" : "/signin"}>
              <Plus id="navbar-sell-plus-icon-13" className="h-4 w-4" />
              Sell Item
            </Link>
          </Button>

          {isLoggedIn ? (
            <>
              <Button id="navbar-bell-btn-14" variant="ghost" size="icon" className="relative size-12 rounded-full hover:bg-slate-100/80 transition-colors">
                <Bell id="navbar-bell-icon-15" className="size-8 text-slate-900 drop-shadow-sm" strokeWidth={1.5} />
                <span id="navbar-bell-badge-16" className="absolute top-2.5 right-2.5 h-3 w-3 rounded-full bg-red-500 border-2 border-white shadow-sm" />
              </Button>

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
                      <span className="font-black text-slate-900">{user.name}</span>
                      <span className="text-[10px] text-slate-500 font-medium">Verified User</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-100" />
                  <DropdownMenuItem asChild className="rounded-xl py-2.5 cursor-pointer focus:bg-slate-50 focus:text-blue-600">
                    <Link href="/inbox" className="flex items-center w-full">
                      <MessageSquare className="mr-2.5 h-4 w-4 opacity-70" />
                      Messages
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl py-2.5 cursor-pointer focus:bg-slate-50 focus:text-blue-600">
                    <Link href="/profile" className="flex items-center w-full">
                      <UserCircle className="mr-2.5 h-4 w-4 opacity-70" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl py-2.5 cursor-pointer focus:bg-slate-50 focus:text-blue-600">
                    <Link href="/dashboard" className="flex items-center w-full">
                      <LayoutDashboard className="mr-2.5 h-4 w-4 opacity-70" />
                      My Dashboard
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

        {/* Mobile View: Location Selection */}
        <div id="navbar-mobile-location-21" className="flex md:hidden items-center">
           <LocationSelector align="end" />
        </div>
      </div>
    </nav>
  );
}
