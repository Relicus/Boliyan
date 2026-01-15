"use client";

import { useApp } from "@/lib/store";
import { mockUsers } from "@/lib/mock-data";
import SellerBidCard from "@/components/seller/SellerBidCard";
import MyBidCard from "@/components/dashboard/MyBidCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Clock, Eye, MessageSquare, ShoppingBag, TrendingUp, Package, Trophy, Heart, Settings, UserCircle } from "lucide-react";
import ProductDetailsModal from "@/components/marketplace/ProductDetailsModal";
import { AchievementSection } from "@/components/dashboard/AchievementSection";
import { ProfileSettings } from "@/components/dashboard/ProfileSettings";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import DeleteConfirmationDialog from "@/components/seller/DeleteConfirmationDialog";
import { Item } from "@/types";
import { getBidderLocationMock } from "@/lib/utils";

import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const { items, bids, user, deleteItem, getUser } = useApp();
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab") || "my-bids";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [viewingItem, setViewingItem] = useState<Item | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/dashboard?tab=${value}`, { scroll: false });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleDeleteClick = (item: Item) => {
    setItemToDelete(item);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteItem(itemToDelete.id);
      setItemToDelete(null);
    }
  };
  
  // SELLER DATA: Items created by current user
  const myItems = items.filter(item => item.sellerId === user.id);
  const itemsWithBids = myItems.filter(item => bids.some(b => b.itemId === item.id));

  // BUYER DATA: Bids placed by current user
  const bidsIMade = bids.filter(b => b.bidderId === user.id);
  const itemsIMadeBidsOn = items.filter(item => bidsIMade.some(b => b.itemId === item.id));

  const getUserBidForItem = (itemId: string) => {
    return bidsIMade
      .filter(b => b.itemId === itemId)
      .sort((a, b) => b.amount - a.amount)[0];
  };

  // Timer Helper
  const getTimeLeft = (expiryAt: string) => {
    const diff = new Date(expiryAt).getTime() - now;
    const hours = Math.max(0, Math.floor(diff / 3600000));
    const mins = Math.max(0, Math.floor((diff % 3600000) / 60000));
    const secs = Math.max(0, Math.floor((diff % 60000) / 1000));
    
    let color = "text-slate-500";
    let isUrgent = false;
    if (hours < 2) { color = "text-red-600"; isUrgent = true; }
    else if (hours < 6) { color = "text-orange-600"; }
    else if (hours < 12) { color = "text-amber-600"; }

    return {
      text: hours >= 24 ? `${Math.floor(hours / 24)}d ${hours % 24}h` : `${hours}h ${mins}m ${secs}s`,
      color,
      isUrgent
    };
  };

  return (
    <div id="dashboard-root" className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 id="dashboard-title" className="text-4xl font-black text-slate-900 tracking-tight">Dashboard</h1>
          <p id="dashboard-subtitle" className="text-slate-500 font-medium">Manage your marketplace activity.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button id="dashboard-messages-btn" variant="outline" asChild className="flex-1 md:flex-none h-11 px-6 font-bold border-slate-200 hover:bg-slate-50 transition-all">
            <Link href="/inbox" className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-slate-400" />
              Messages
            </Link>
          </Button>
          <Button id="dashboard-new-listing-btn" asChild className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 h-11 px-6 font-bold shadow-lg shadow-blue-100 transition-all hover:scale-105 active:scale-95">
            <Link href="/list" className="flex items-center">
              <Plus id="dashboard-new-listing-plus" className="h-5 w-5 mr-2" />
              Post New
            </Link>
          </Button>
        </div>
      </div>

      <Tabs id="dashboard-tabs" value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList id="dashboard-tabs-list" className="bg-transparent border-b rounded-none h-auto w-full justify-start p-0 gap-6 overflow-x-auto flex-nowrap scrollbar-hide">
          <TabsTrigger 
            id="tab-trigger-profile"
            value="profile" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-slate-500 data-[state=active]:text-blue-600 transition-all py-3 px-1"
          >
            <UserCircle className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger 
            id="tab-trigger-my-bids"
            value="my-bids" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-slate-500 data-[state=active]:text-blue-600 transition-all py-3 px-1"
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            Buying
            <Badge id="tab-badge-my-bids" className="ml-2 bg-blue-50 text-blue-600 hover:bg-blue-50 border-none transition-all duration-300">
              {itemsIMadeBidsOn.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            id="tab-trigger-active-bids"
            value="active-bids" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-slate-500 data-[state=active]:text-blue-600 transition-all py-3 px-1"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Selling
            <Badge id="tab-badge-active-bids" className="ml-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-50 border-none transition-all duration-300">
              {bids.filter(b => myItems.some(i => i.id === b.itemId)).length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            id="tab-trigger-my-listings"
            value="my-listings" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-slate-500 data-[state=active]:text-blue-600 transition-all py-3 px-1"
          >
            <Package className="h-4 w-4 mr-2" />
            My Listings
            <Badge id="tab-badge-my-listings" className="ml-2 bg-slate-100 text-slate-600 hover:bg-slate-100 border-none transition-all duration-300">
              {myItems.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            id="tab-trigger-watchlist"
            value="watchlist" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-slate-500 data-[state=active]:text-blue-600 transition-all py-3 px-1"
          >
            <Heart className="h-4 w-4 mr-2" />
            Watchlist
          </TabsTrigger>
          <TabsTrigger 
            id="tab-trigger-achievements"
            value="achievements" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-slate-500 data-[state=active]:text-blue-600 transition-all py-3 px-1"
          >
            <Trophy className="h-4 w-4 mr-2" />
            Achievements
            <Badge id="tab-badge-achievements" className="ml-2 bg-amber-50 text-amber-600 hover:bg-amber-50 border-none transition-all duration-300">
              {user.badges?.length || 0}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            {activeTab === "profile" && (
              <div className="space-y-4 m-0">
                <ProfileSettings />
              </div>
            )}
            {activeTab === "achievements" && (
              <div className="space-y-4 m-0">
                <AchievementSection user={user} />
              </div>
            )}
            {activeTab === "watchlist" && (
              <div className="space-y-4 m-0">
                 <div className="p-16 text-center border-2 border-dashed rounded-2xl bg-slate-50/50">
                    <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Heart className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">Watchlist Empty</h3>
                    <p className="text-slate-500 text-sm">Items you save will appear here for quick access.</p>
                    <Button asChild variant="outline" className="mt-6">
                      <Link href="/">Browse Items</Link>
                    </Button>
                 </div>
              </div>
            )}
            {activeTab === "my-bids" && (
              <div className="space-y-4 m-0">
                {itemsIMadeBidsOn.length === 0 && (
                   <div className="p-16 text-center border-2 border-dashed rounded-2xl bg-slate-50/50">
                      <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="font-bold text-slate-900 mb-1">No bids yet</h3>
                      <p className="text-slate-500 text-sm">You haven't placed any bids on items yet.</p>
                      <Button asChild variant="outline" className="mt-6">
                        <Link href="/">Explore Marketplace</Link>
                      </Button>
                   </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {itemsIMadeBidsOn.map(item => (
                    <MyBidCard 
                      key={item.id} 
                      item={item} 
                      userBid={getUserBidForItem(item.id)} 
                      seller={getUser(item.sellerId) || mockUsers[1]} 
                    />
                  ))}
                </div>
              </div>
            )}

            {activeTab === "active-bids" && (
              <div className="space-y-8 mt-4 m-0">
                {itemsWithBids.length === 0 && (
                   <div className="p-16 text-center border-2 border-dashed rounded-2xl bg-slate-50/50">
                      <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Badge className="h-8 w-8 text-slate-400" variant="outline" />
                      </div>
                      <h3 className="font-bold text-slate-900 mb-1">No activity</h3>
                      <p className="text-slate-500 text-sm">No one has bid on your items yet.</p>
                   </div>
                )}

                {itemsWithBids.map(item => (
                  <div key={item.id} className="border border-slate-200 rounded-xl overflow-hidden mb-6 bg-white shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200 w-full">
                      <div className="flex items-center gap-3">
                        <img src={item.images[0]} alt="" className="h-10 w-10 rounded-md object-cover border border-slate-200" />
                        <div>
                          <h3 className="font-bold text-slate-900">{item.title}</h3>
                          <p className="text-xs text-muted-foreground">Asking: Rs. {item.askPrice.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <Badge variant="secondary" className="bg-white text-slate-600 border border-slate-200 shadow-sm font-bold">
                          {item.bidCount} Bids Total
                        </Badge>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.listingDuration}h</span>
                          <div className={`text-xs font-black flex items-center gap-1 ${getTimeLeft(item.expiryAt).color}`}>
                            <Clock className={`h-3 w-3 ${getTimeLeft(item.expiryAt).isUrgent ? 'animate-pulse' : ''}`} />
                            {getTimeLeft(item.expiryAt).text}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 space-y-3 bg-white">
                      {bids
                        .filter(b => b.itemId === item.id)
                        .map(bid => {
                          const bidder = mockUsers.find(u => u.id === bid.bidderId) || mockUsers[0];
                          const { distance, duration } = getBidderLocationMock(bidder.id);
                          return { ...bid, bidder, distance, duration };
                        })
                        .sort((a, b) => {
                          // 1. Price first (highest at the top)
                          if (b.amount !== a.amount) {
                            return b.amount - a.amount;
                          }
                          // 2. Driving distance second (shortest first)
                          if (a.duration !== b.duration) {
                            return a.duration - b.duration;
                          }
                          // 3. Kilometers third (shortest first)
                          return a.distance - b.distance;
                        })
                        .map(bidData => (
                          <SellerBidCard key={bidData.id} bid={bidData} bidder={bidData.bidder} />
                        ))}
                      
                      {bids.filter(b => b.itemId === item.id).length === 0 && (
                        <div className="p-8 text-center border-2 border-dashed rounded-xl bg-slate-50/50">
                          <p className="text-slate-400 text-xs text-xs">No bids yet for this item.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "my-listings" && (
              <div className="m-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myItems.map(item => (
                    <div key={item.id} id={`listing-card-${item.id}`} className="p-4 bg-white border rounded-xl flex gap-4 transition-all hover:shadow-md">
                      <div className="relative shrink-0">
                        <img id={`listing-img-${item.id}`} src={item.images[0]} alt="" className="h-20 w-20 rounded-lg object-cover bg-slate-100" />
                        {item.images.length > 1 && (
                          <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-blue-600 text-[10px] font-bold border-2 border-white">
                            {item.images.length}
                          </Badge>
                        )}
                      </div>
                      <div id={`listing-content-${item.id}`} className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h3 id={`listing-title-${item.id}`} className="font-bold text-slate-900 truncate mb-1">{item.title}</h3>
                          <p id={`listing-price-${item.id}`} className="text-sm text-blue-600 font-bold mb-2">Rs. {item.askPrice.toLocaleString()}</p>
                          <div className="flex items-center gap-2 mb-2">
                             <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-tight h-5 px-1.5 border-slate-200 text-slate-400">
                               {item.listingDuration}h
                             </Badge>
                             <div className={`text-[10px] font-bold flex items-center gap-1 ${getTimeLeft(item.expiryAt).color}`}>
                               <Clock className={`h-2.5 w-2.5 ${getTimeLeft(item.expiryAt).isUrgent ? 'animate-pulse' : ''}`} />
                               {getTimeLeft(item.expiryAt).text}
                             </div>
                          </div>
                        </div>
                        <div id={`listing-actions-${item.id}`} className="flex gap-2">
                          <Button 
                            id={`listing-view-btn-${item.id}`} 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-[11px] px-3 font-bold transition-all hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100"
                            onClick={() => setViewingItem(item)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button 
                            id={`listing-edit-btn-${item.id}`} 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-[11px] px-3 font-bold transition-all hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100"
                            asChild
                          >
                            <Link href={`/list?id=${item.id}`}>
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Link>
                          </Button>
                          <Button 
                            id={`listing-delete-btn-${item.id}`} 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-[11px] px-3 font-bold text-red-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all"
                            onClick={() => handleDeleteClick(item)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {myItems.length === 0 && (
                     <div className="col-span-1 md:col-span-2 p-16 text-center border-2 border-dashed rounded-2xl bg-slate-50/50">
                        <h3 className="font-bold text-slate-900 mb-1">No items listed</h3>
                        <p className="text-slate-500 text-sm">Start selling by listing your first item!</p>
                     </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </Tabs>

      <DeleteConfirmationDialog 
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        itemTitle={itemToDelete?.title || ""}
      />

      {viewingItem && (
        <ProductDetailsModal 
          item={viewingItem} 
          seller={user} 
          isOpen={!!viewingItem} 
          onClose={() => setViewingItem(null)} 
        />
      )}
    </div>
  );
}
