"use client";

import { useMemo } from "react";
import type { ComponentType } from "react";
import { Target, Bookmark, Trophy, Gavel } from "lucide-react";

import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BuyerMetric {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  color: string;
}

export default function BuyerStats() {
  const { user, bids, itemsById, watchedItemIds } = useApp();

  const metrics = useMemo<BuyerMetric[]>(() => {
    const myBids = user ? bids.filter(b => b.bidderId === user.id) : [];
    const activeBids = myBids.filter(b => b.status === "pending").length;
    const wins = myBids.filter(b => b.status === "accepted").length;
    const outbid = user
      ? myBids.reduce((count, bid) => {
          const item = itemsById[bid.itemId];
          if (!item || !item.isPublicBid) return count;
          if (item.currentHighBidderId && item.currentHighBidderId !== user.id && (item.currentHighBid || 0) > bid.amount) {
            return count + 1;
          }
          return count;
        }, 0)
      : 0;

    return [
      { label: "Bids Placed", value: myBids.length, icon: Gavel, color: "text-blue-500" },
      { label: "Active Bids", value: activeBids, icon: Target, color: "text-amber-500" },
      { label: "Wins", value: wins, icon: Trophy, color: "text-emerald-500" },
      { label: "Watchlist", value: watchedItemIds.length, icon: Bookmark, color: "text-slate-500" },
      { label: "Outbid", value: outbid, icon: Gavel, color: "text-rose-500" }
    ];
  }, [bids, itemsById, user, watchedItemIds.length]);

  return (
    <div id="buyer-stats-grid" className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {metrics.map(metric => (
        <Card key={metric.label} id={`buyer-stat-${metric.label.toLowerCase().replace(/\s+/g, "-")}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {metric.label}
            </CardTitle>
            <metric.icon className={`h-4 w-4 ${metric.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value.toLocaleString()}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
