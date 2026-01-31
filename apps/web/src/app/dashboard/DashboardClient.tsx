"use client";

import { useApp } from "@/lib/store";

import SellerListingCard from "@/components/seller/SellerListingCard";
import MyBidCard from "@/components/dashboard/MyBidCard";
import WatchedItemCard from "@/components/dashboard/WatchedItemCard";
import ListingOffersCard from "@/components/dashboard/ListingOffersCard";
import { Tabs, TabsList } from "@/components/ui/tabs";
import { DashboardTab } from "@/components/dashboard/DashboardTab";
import { Bookmark, Gavel, Tag, Inbox } from "lucide-react";
import ProductDetailsModal from "@/components/marketplace/ProductDetailsModal";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import DeleteConfirmationDialog from "@/components/seller/DeleteConfirmationDialog";
import { Item } from "@/types";

import { transformListingToItem, ListingWithSeller } from "@/lib/transform";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";

function DashboardContent() {
  const { itemsById, bids, user, deleteItem, watchedItemIds } = useApp();
  const [myItems, setMyItems] = useState<Item[]>([]);

  
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const initialTab = tabParam || "offers";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [viewingItem, setViewingItem] = useState<Item | null>(null);
  

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!tabParam) {
      router.replace(`/dashboard?tab=${initialTab}`, { scroll: false });
    }
  }, [initialTab, router, tabParam]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/dashboard?tab=${value}`, { scroll: false });
  };


  // Fetch My Listings independently of the discovery feed
  useEffect(() => {
    if (!user) return;

    const fetchMyItems = async () => {
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*, profiles!seller_id(*), bids(amount)')
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) {
          type ListingRow = Database["public"]["Tables"]["listings"]["Row"];
          type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
          type ListingWithRelations = ListingRow & {
            profiles: ProfileRow | null;
            bids: { amount: number | null }[] | null;
          };

          const transformed = data.map((row) => {
            const typedRow = row as unknown as ListingWithRelations;
            const bids = typedRow.bids ?? [];
            const highBid = bids.length > 0 ? Math.max(...bids.map((bid) => bid.amount ?? 0)) : undefined;
            const moderationStatus = typedRow.moderation_status;
            const normalizedModerationStatus =
              moderationStatus === "pending" || moderationStatus === "approved" || moderationStatus === "rejected"
                ? moderationStatus
                : null;

            const listingForTransform: ListingWithSeller = {
              ...typedRow,
              profiles: typedRow.profiles,
              bid_count: bids.length,
              high_bid: highBid,
              moderation_status: normalizedModerationStatus,
            };

            return transformListingToItem(listingForTransform);
          });
          setMyItems(transformed);
        }
      } catch (err) {
        console.error("Error fetching my listings:", err);
      }
    };

    fetchMyItems();
  }, [user]);

  const handleDeleteClick = (item: Item) => {
    setItemToDelete(item);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      await deleteItem(itemToDelete.id);
      setItemToDelete(null);
      // Remove locally
      setMyItems(prev => prev.filter(i => i.id !== itemToDelete.id));
    }
  };



  const myBids = bids
    .filter(b => b.bidderId === user?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  // Offers received on MY listings (I'm the seller) - grouped by listing
  const listingsWithOffers = myItems
    .map(item => ({
      item,
      offers: bids
        .filter(b => 
          b.itemId === item.id && 
          (b.status === 'pending' || b.status === 'accepted')
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // Latest offers first within each listing
    }))
    .filter(group => group.offers.length > 0)
    .sort((a, b) => {
      // Sort listings by most recent offer activity
      const latestA = Math.max(...a.offers.map(o => new Date(o.createdAt).getTime()));
      const latestB = Math.max(...b.offers.map(o => new Date(o.createdAt).getTime()));
      return latestB - latestA;
    });
  
  // Total offer count for badge
  const totalOfferCount = listingsWithOffers.reduce((sum, g) => sum + g.offers.length, 0);
  
  const watchedItems = watchedItemIds
    .map(id => itemsById[id])
    .filter(Boolean); // Only show items we have data for

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
      
      {/* Dashboard heading for accessibility */}
      <h1 className="sr-only">Dashboard</h1>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6 bg-slate-100 p-1 rounded-xl h-auto">
          <DashboardTab
             id="dashboard-offers-tab"
             value="offers"
             icon={Inbox}
             label="Selling"
             count={totalOfferCount}
             badgeClassName="text-amber-700"
          />
          <DashboardTab
             id="dashboard-bids-tab"
             value="active-bids"
             icon={Gavel}
             label="Buying"
             count={myBids.length}
             badgeClassName="text-slate-700"
          />
          <DashboardTab
             id="dashboard-watchlist-tab"
             value="watchlist"
             icon={Bookmark}
             label="Watchlist"
             count={watchedItems.length}
             badgeClassName="text-slate-700"
          />
          <DashboardTab
             id="dashboard-listings-tab"
             value="listings"
             icon={Tag}
             label="Listings"
             count={myItems.length}
             badgeClassName="text-slate-700"
          />
        </TabsList>

        <AnimatePresence mode="wait">
              {/* 1. OFFERS TAB (Bids received on MY listings, grouped by listing) */}
             {activeTab === 'offers' && (
                <motion.div
                    key="offers"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="grid gap-4 grid-cols-1 lg:grid-cols-2"
                >
                    {listingsWithOffers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <Inbox className="w-12 h-12 text-slate-300 mb-3" />
                            <h3 className="text-lg font-bold text-slate-700">No offers yet</h3>
                            <p className="max-w-xs mx-auto mb-4">When buyers bid on your listings, their offers will appear here.</p>
                            <Link href="/sell">
                                <Button variant="outline">Create a Listing</Button>
                            </Link>
                        </div>
                    ) : (
                        listingsWithOffers.map(({ item, offers }) => (
                            <ListingOffersCard 
                                key={item.id} 
                                item={item} 
                                offers={offers} 
                            />
                        ))
                    )}
                </motion.div>
             )}

              {/* 2. MY BIDS TAB */}
             {activeTab === 'active-bids' && (
                <motion.div
                    key="active-bids"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
                >
                    {myBids.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-12 text-center text-slate-500 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <Gavel className="w-12 h-12 text-slate-300 mb-3" />
                            <h3 className="text-lg font-bold text-slate-700">No active bids</h3>
                            <p className="max-w-xs mx-auto mb-4">You haven't placed any bids yet. Explore the marketplace to find deals!</p>
                            <Link href="/">
                                <Button variant="outline">Explore Marketplace</Button>
                            </Link>
                        </div>
                    ) : (
                        myBids.map(bid => {
                            const item = itemsById[bid.itemId];
                            // If we don't have the item in memory (e.g. not in feed), we might need to fetch it
                            // For now, assume feed/involvedIds covers it. 
                            // TODO: Add separate involved items fetcher in context if missing.
                            if (!item) return null; 

                            return (
                                <MyBidCard 
                                    key={bid.id} 
                                    item={item} 
                                    userBid={bid} 
                                    seller={item.seller!} 
                                />
                            );
                        })
                    )}
                </motion.div>
             )}

             {/* 3. WATCHLIST TAB */}
             {activeTab === 'watchlist' && (
                <motion.div
                    key="watchlist"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
                >
                     {watchedItems.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-12 text-center text-slate-500 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <Bookmark className="w-12 h-12 text-slate-300 mb-3" />
                            <h3 className="text-lg font-bold text-slate-700">Watchlist is empty</h3>
                            <p className="max-w-xs mx-auto mb-4">Save items you're interested in to track their price and status.</p>
                            <Link href="/">
                                <Button variant="outline">Browse Items</Button>
                            </Link>
                        </div>
                    ) : (
                        watchedItems.map(item => (
                             <WatchedItemCard
                                key={item.id}
                                item={item}
                                seller={item.seller!}
                            />
                        ))
                    )}
                </motion.div>
             )}

             {/* 4. MY LISTINGS TAB */}
             {activeTab === 'listings' && (
                <motion.div
                    key="listings"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
                >
                    {myItems.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-12 text-center text-slate-500 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <Tag className="w-12 h-12 text-slate-300 mb-3" />
                            <h3 className="text-lg font-bold text-slate-700">No active listings</h3>
                            <p className="max-w-xs mx-auto mb-4">You aren't selling anything yet. Turn your unused items into cash!</p>
                            <Link href="/sell">
                                <Button>Create Listing</Button>
                            </Link>
                        </div>
                    ) : (
                        myItems.map(item => (
                            <SellerListingCard
                                key={item.id}
                                item={item}
                                onView={() => setViewingItem(item)}
                                onDelete={() => handleDeleteClick(item)}
                            />
                        ))
                    )}
                </motion.div>
             )}
        </AnimatePresence>
      </Tabs>
    
      <DeleteConfirmationDialog 
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        itemTitle={itemToDelete?.title || ''}
      />

      {viewingItem && viewingItem.seller && (
        <ProductDetailsModal 
          item={viewingItem} 
          seller={viewingItem.seller} 
          isOpen={true} 
          onClose={() => setViewingItem(null)} 
        />
      )}
    </div>
  );
}

export default function DashboardClient() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
