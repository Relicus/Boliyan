"use client";

import { Search, User, Bell, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { LocationSelector } from "@/components/marketplace/LocationSelector";

export default function Navbar() {
  const { filters, setFilter, user } = useApp();

  return (
    <nav id="navbar-01" className="relative md:sticky md:top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div id="navbar-container-02" className="w-full flex h-16 items-center justify-between px-4 lg:px-6">
        <div id="navbar-left-section-03" className="flex items-center gap-8">
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
                className="transition-all duration-300 text-slate-800 group-hover:text-blue-600"
              />
              {/* Dot at bottom */}
              <circle
                cx="18"
                cy="36"
                r="4"
                id="navbar-logo-dot-07"
                className="transition-all duration-300 fill-slate-800 group-hover:fill-blue-600"
              />
            </svg>
            
            <div id="navbar-brand-name-08" className="flex flex-col items-center justify-center gap-0 py-0.5">
              {/* Urdu: Larger, on top */}
              <span id="navbar-brand-urdu-09" className="text-2xl font-black mb-[-2px] transition-all duration-300 font-[family-name:var(--font-noto-urdu)] bg-clip-text text-transparent bg-gradient-to-br from-slate-950 via-slate-800 to-slate-900 group-hover:from-blue-600 group-hover:via-blue-500 group-hover:to-indigo-600">
                بولیاں
              </span>
              {/* English: Much smaller, wide spacing */}
              <span id="navbar-brand-english-10" className="text-[10px] font-bold tracking-[0.4em] uppercase transition-all duration-300 font-[family-name:var(--font-outfit)] bg-clip-text text-transparent bg-gradient-to-br from-slate-600 to-slate-400 group-hover:from-blue-400 group-hover:to-blue-200">
                Boliyan
              </span>
            </div>
          </Link>
          

        </div>

        <div id="navbar-right-section-11" className="hidden md:flex items-center gap-2">
          <Button id="navbar-sell-btn-12" asChild variant="outline" className="hidden sm:flex items-center gap-2 border-blue-100 hover:bg-blue-50 text-blue-600">
            <Link href="/list">
              <Plus id="navbar-sell-plus-icon-13" className="h-4 w-4" />
              Sell Item
            </Link>
          </Button>

          <Button id="navbar-bell-btn-14" variant="ghost" size="icon" className="relative size-12 rounded-full hover:bg-slate-100/80 transition-colors">
            <Bell id="navbar-bell-icon-15" className="size-8 text-slate-900 drop-shadow-sm" strokeWidth={1.5} />
            <span id="navbar-bell-badge-16" className="absolute top-2.5 right-2.5 h-3 w-3 rounded-full bg-red-500 border-2 border-white shadow-sm" />
          </Button>

          <Link id="navbar-profile-link-17" href="/dashboard">
            <Avatar id="navbar-avatar-18" className="h-12 w-12 cursor-pointer ring-2 ring-transparent hover:ring-blue-100 transition-all">
              <AvatarImage id="navbar-avatar-image-19" src={user.avatar} />
              <AvatarFallback id="navbar-avatar-fallback-20">{user.name[0]}</AvatarFallback>
            </Avatar>
          </Link>
        </div>

        {/* Mobile View: Location Selection */}
        <div id="navbar-mobile-location-21" className="flex md:hidden items-center">
           <LocationSelector align="end" />
        </div>
      </div>
    </nav>
  );
}
