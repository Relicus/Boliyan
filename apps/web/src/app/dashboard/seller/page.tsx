'use client';

import { DashboardProvider } from '@/context/DashboardContext';
import { SellerStats } from '@/components/dashboard/SellerStats';
import BuyerStats from '@/components/dashboard/BuyerStats';
import { MyListingsTable } from '@/components/dashboard/MyListingsTable';
import MyBidCard from '@/components/dashboard/MyBidCard';
import { Tabs, TabsList, TabsContent } from '@/components/ui/tabs';
import { DashboardTab } from '@/components/dashboard/DashboardTab';
import { BarChart3, Gavel, Store, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/lib/store';
import Link from 'next/link';

export default function SellerDashboardPage() {
  const { bids, itemsById, user } = useApp();
  const myBids = user ? bids.filter(bid => bid.bidderId === user.id) : [];

  return (
    <DashboardProvider>
      <div id="analytics-page" className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-7xl">
        <h1 id="analytics-title" className="sr-only">Analytics</h1>

        <Tabs defaultValue="seller" className="space-y-6">
          <TabsList id="analytics-tabs" className="grid w-full grid-cols-2 mb-6 bg-slate-100 p-1 rounded-xl h-auto">
            <DashboardTab
              id="analytics-buyer-tab"
              value="buyer"
              icon={UserCircle}
              label="Buyer"
            />
            <DashboardTab
              id="analytics-seller-tab"
              value="seller"
              icon={Store}
              label="Seller"
            />
          </TabsList>

          <TabsContent id="analytics-buyer-panel" value="buyer" className="space-y-6">
            <BuyerStats />

            <div id="buyer-activity-section" className="space-y-4">
              <div className="flex items-center gap-2">
                <Gavel className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold tracking-tight">Buying Activity</h2>
              </div>

              {myBids.length === 0 ? (
                <div id="buyer-activity-empty" className="flex flex-col items-center justify-center py-12 text-center text-slate-500 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <Gavel className="w-12 h-12 text-slate-300 mb-3" />
                  <h3 className="text-lg font-bold text-slate-700">No buying activity</h3>
                  <p className="max-w-xs mx-auto mb-4">Place a bid to start tracking your buying performance.</p>
                  <Link href="/">
                    <Button variant="outline">Explore Marketplace</Button>
                  </Link>
                </div>
              ) : (
                <div id="buyer-activity-list" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {myBids.map(bid => {
                    const item = itemsById[bid.itemId];
                    if (!item || !item.seller) return null;

                    return (
                      <MyBidCard
                        key={bid.id}
                        item={item}
                        userBid={bid}
                        seller={item.seller}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent id="analytics-seller-panel" value="seller" className="space-y-6">
            <SellerStats />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold tracking-tight">Listing Performance</h2>
              </div>
              <MyListingsTable />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardProvider>
  );
}
