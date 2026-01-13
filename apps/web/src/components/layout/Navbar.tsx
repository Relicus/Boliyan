"use client";

import { Search, User, Bell, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useApp } from "@/lib/store";

export default function Navbar() {
  const { filters, setFilter, user } = useApp();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center gap-3 select-none transition-transform duration-200 active:scale-95">
            {/* Geometric 'Ba' Logomark */}
            <svg viewBox="0 0 40 40" className="h-10 w-10 shrink-0">
              <path
                d="M5,15 Q20,35 35,15"
                stroke="currentColor"
                strokeWidth="4.5"
                fill="none"
                strokeLinecap="round"
                className="transition-all duration-300 text-slate-800 group-hover:text-blue-600"
              />
              <circle
                cx="20"
                cy="32"
                r="3"
                className="transition-all duration-300 fill-slate-800 group-hover:fill-blue-600"
              />
            </svg>
            
            <div className="flex flex-col items-center justify-center gap-0">
              <span className="text-3xl font-[900] tracking-tight transition-all duration-300 font-[family-name:var(--font-outfit)] bg-clip-text text-transparent bg-gradient-to-br from-slate-950 via-slate-800 to-slate-900 group-hover:from-blue-600 group-hover:via-blue-500 group-hover:to-indigo-600">
                Boliyan
              </span>
              <span className="text-sm font-black transition-all duration-300 font-[family-name:var(--font-noto-urdu)] bg-clip-text text-transparent bg-gradient-to-br from-slate-600 to-slate-400 group-hover:from-blue-400 group-hover:to-blue-200">
                بولیاں
              </span>
            </div>
          </Link>
          
          <div className="hidden md:flex relative w-[400px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search items, categories..." 
              className="w-full pl-10 bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-blue-200"
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Search className="h-5 w-5" />
          </Button>
          
          <Button asChild variant="outline" className="hidden sm:flex items-center gap-2 border-blue-100 hover:bg-blue-50 text-blue-600">
            <Link href="/list">
              <Plus className="h-4 w-4" />
              Sell Item
            </Link>
          </Button>

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white" />
          </Button>

          <Link href="/dashboard">
            <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-transparent hover:ring-blue-100 transition-all">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </nav>
  );
}
