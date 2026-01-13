"use client";

import { useApp } from "@/lib/store";
import { mockUsers } from "@/lib/mock-data";
import SellerBidCard from "@/components/seller/SellerBidCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { items, bids, user } = useApp();
  
  // Filter items created by current user
  const myItems = items.filter(item => item.sellerId === user.id);
  const itemsWithBids = myItems.filter(item => bids.some(b => b.itemId === item.id));

  return (
    <div id="dashboard-root" className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 id="dashboard-title" className="text-3xl font-black text-slate-900 tracking-tight">Seller Dashboard</h1>
          <p id="dashboard-subtitle" className="text-slate-500">Manage your listings and bids.</p>
        </div>
        <Button id="dashboard-new-listing-btn" asChild className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
          <Link href="/list">
            <Plus id="dashboard-new-listing-plus" className="h-4 w-4 mr-2" />
            New Listing
          </Link>
        </Button>
      </div>

      <Tabs id="dashboard-tabs" defaultValue="bids" className="space-y-6">
        <TabsList id="dashboard-tabs-list" className="bg-transparent border-b rounded-none h-auto w-full justify-start p-0 gap-4 overflow-x-auto flex-nowrap">
          <TabsTrigger 
            id="tab-trigger-bids"
            value="bids" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-slate-500 data-[state=active]:text-blue-600"
          >
            Active Bids
            <Badge id="tab-badge-bids" className="ml-2 bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">
              {bids.filter(b => myItems.some(i => i.id === b.itemId)).length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            id="tab-trigger-items"
            value="items" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-slate-500 data-[state=active]:text-blue-600"
          >
            My Listings
            <Badge id="tab-badge-items" className="ml-2 bg-slate-100 text-slate-700 hover:bg-slate-200 border-none">
              {myItems.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bids" className="space-y-8">
          {itemsWithBids.length === 0 && (
             <div className="p-12 text-center border-2 border-dashed rounded-xl bg-slate-50/50">
                <p className="text-slate-400">No active bids at the moment.</p>
             </div>
          )}

          {itemsWithBids.map(item => (
            <div key={item.id} className="border border-slate-200 rounded-xl overflow-hidden mb-6 bg-white">
              <div className="flex items-center justify-between p-4 bg-slate-100 border-b border-slate-200 w-full">
                <div className="flex items-center gap-3">
                  <img src={item.images[0]} alt="" className="h-10 w-10 rounded-md object-cover border border-slate-200" />
                  <div>
                    <h3 className="font-bold text-slate-900">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">Asking: Rs. {item.askPrice.toLocaleString()}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-white text-slate-600 border border-slate-200 shadow-sm">
                  {item.bidCount} Bids Total
                </Badge>
              </div>

              <div className="p-4 space-y-3 bg-white">
                {bids.filter(b => b.itemId === item.id).map(bid => {
                  const bidder = mockUsers.find(u => u.id === bid.bidderId) || mockUsers[0];
                  return (
                    <SellerBidCard key={bid.id} bid={bid} bidder={bidder} />
                  );
                })}
                
                {bids.filter(b => b.itemId === item.id).length === 0 && (
                  <div className="p-8 text-center border-2 border-dashed rounded-xl bg-slate-50/50">
                    <p className="text-slate-400 text-xs">No bids yet for this item.</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="items">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myItems.map(item => (
              <div key={item.id} id={`listing-card-${item.id}`} className="p-4 bg-white border rounded-xl flex gap-4 transition-all hover:shadow-sm">
                <img id={`listing-img-${item.id}`} src={item.images[0]} alt="" className="h-20 w-20 rounded-lg object-cover shrink-0 bg-slate-100" />
                <div id={`listing-content-${item.id}`} className="flex-1 min-w-0">
                  <h3 id={`listing-title-${item.id}`} className="font-bold text-slate-900 truncate mb-1">{item.title}</h3>
                  <p id={`listing-price-${item.id}`} className="text-sm text-blue-600 font-semibold mb-2">Rs. {item.askPrice.toLocaleString()}</p>
                  <div id={`listing-actions-${item.id}`} className="flex gap-2">
                    <Button id={`listing-edit-btn-${item.id}`} variant="outline" size="sm" className="h-8 text-[11px] px-3">Edit</Button>
                    <Button id={`listing-delete-btn-${item.id}`} variant="outline" size="sm" className="h-8 text-[11px] px-3 text-red-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100">Delete</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
