"use client";

import { AdminGuard } from "@/components/admin/AdminGuard";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Flag, Users, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/listings", label: "Listings", icon: Package },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/users", label: "Users", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AdminGuard>
      <div id="admin-layout" className="min-h-screen bg-amber-50/30 pt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex gap-6">
            {/* Sidebar */}
            <aside id="admin-sidebar" className="w-48 shrink-0 hidden md:block">
              <nav className="space-y-1 sticky top-20">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || 
                    (item.href !== "/admin" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      id={`admin-nav-${item.label.toLowerCase()}`}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all",
                        isActive 
                          ? "bg-amber-100 text-amber-800 border border-amber-200" 
                          : "text-slate-600 hover:bg-white hover:shadow-sm"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </aside>

            {/* Mobile Nav */}
            <nav id="admin-mobile-nav" className="md:hidden flex gap-2 mb-4 overflow-x-auto pb-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== "/admin" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all",
                      isActive 
                        ? "bg-amber-600 text-white" 
                        : "bg-white text-slate-600 border border-slate-200"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Main Content */}
            <main id="admin-content" className="flex-1 min-w-0">
              {children}
            </main>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
