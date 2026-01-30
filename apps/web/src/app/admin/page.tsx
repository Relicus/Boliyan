"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Flag, Users, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";

interface Stats {
  pendingReports: number;
  totalUsers: number;
  bannedUsers: number;
  resolvedToday: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      // Fetch pending reports count
      const { count: pendingReports } = await supabase
        .from("reports")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Fetch total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Fetch banned users
      const { count: bannedUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gt("banned_until", new Date().toISOString());

      // Fetch resolved today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: resolvedToday } = await supabase
        .from("reports")
        .select("*", { count: "exact", head: true })
        .eq("status", "resolved")
        .gte("resolved_at", today.toISOString());

      setStats({
        pendingReports: pendingReports ?? 0,
        totalUsers: totalUsers ?? 0,
        bannedUsers: bannedUsers ?? 0,
        resolvedToday: resolvedToday ?? 0,
      });
      setLoading(false);
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      label: "Pending Reports",
      value: stats?.pendingReports ?? 0,
      icon: Flag,
      color: "text-amber-600",
      bg: "bg-amber-50",
      href: "/admin/reports?status=pending",
    },
    {
      label: "Total Users",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      href: "/admin/users",
    },
    {
      label: "Banned Users",
      value: stats?.bannedUsers ?? 0,
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50",
      href: "/admin/users?filter=banned",
    },
    {
      label: "Resolved Today",
      value: stats?.resolvedToday ?? 0,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
      href: "/admin/reports?status=resolved",
    },
  ];

  return (
    <div id="admin-dashboard" className="space-y-6">
      <h2 className="text-2xl font-black text-slate-900">Overview</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card 
              id={`stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer border-slate-200"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">
                    {loading ? "—" : stat.value}
                  </p>
                  <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {stats && stats.pendingReports > 0 && (
        <Card className="p-4 border-amber-200 bg-amber-50">
          <div className="flex items-center gap-3">
            <Flag className="h-5 w-5 text-amber-600" />
            <p className="font-semibold text-amber-800">
              You have {stats.pendingReports} pending report{stats.pendingReports > 1 ? "s" : ""} to review.
            </p>
            <Link 
              href="/admin/reports?status=pending" 
              className="ml-auto text-sm font-bold text-amber-700 hover:underline"
            >
              Review Now →
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
