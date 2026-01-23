"use client";

import { Item, User, Bid } from "@/types";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bookmark, Gavel, Trash2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { useState } from "react";
import ProductDetailsModal from "@/components/marketplace/ProductDetailsModal";
import { Button } from "@/components/ui/button";

import { CategoryBadge } from "@/components/common/CategoryBadge";
import { ConditionBadge } from "@/components/common/ConditionBadge";
import { TimerBadge } from "@/components/common/TimerBadge";
import { VictoryHalo } from "@/components/common";
import { PriceDisplay } from "@/components/common/PriceDisplay";
import { createBiddingConfig } from "@/types/bidding";
import { MAX_BID_ATTEMPTS } from "@/lib/bidding";
import { useMemo } from "react";

interface WatchedItemCardProps {
  item: Item;
  seller: User;
  userBid?: Bid; // Allow passing user bid if exists
}

export default function WatchedItemCard({ item, seller, userBid }: WatchedItemCardProps) {
  const { toggleWatch, now, user, bids } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // If userBid not passed, try to find it in store
  const activeBid = userBid || (user ? bids.find(b => b.itemId === item.id && b.bidderId === user.id) : undefined);

  // Remaining Attempts
  const remainingAttempts = useMemo(() => {
    if (!activeBid) return MAX_BID_ATTEMPTS;
    const updatesUsed = activeBid.update_count || 0;
    return Math.max(0, (MAX_BID_ATTEMPTS - 1) - updatesUsed);
  }, [activeBid]);

  // Unified Bidding Config
  const biddingConfig = createBiddingConfig(item, user, bids);

  const getTimeLeft = (expiryAt: string) => {
    if (now === 0) return "Loading...";
    const diff = new Date(expiryAt).getTime() - now;
    const hours = Math.max(0, Math.floor(diff / 3600000));
    const mins = Math.max(0, Math.floor((diff % 3600000) / 60000));
    
    if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    return `${hours}h ${mins}m`;
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWatch(item.id);
  };

  return (
    <>
      <div 
        id={`watched-item-card-${item.id}`} 
        onClick={() => setIsModalOpen(true)}
        className="group relative overflow-hidden rounded-xl p-[3px] transition-all hover:shadow-md cursor-pointer"
      >
        <VictoryHalo theme="blue" />
        
        <div className="relative z-10 bg-white rounded-[calc(0.75rem-3px)] p-4 flex gap-4 h-full">
          <div className="relative shrink-0">
            <img id={`watched-item-img-${item.id}`} src={item.images[0]} alt="" className="h-20 w-20 rounded-lg object-cover bg-slate-100" />
            <div className="absolute -top-2 -right-2 bg-blue-600 text-white p-1 rounded-full border-2 border-white shadow-sm">
              <Bookmark className="h-3 w-3 fill-current" />
            </div>
          </div>
          
          <div id={`watched-item-content-${item.id}`} className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <h3 id={`watched-item-title-${item.id}`} className="font-bold text-slate-900 truncate mr-2 text-[clamp(1rem,5cqi,1.25rem)]">{item.title}</h3>
              </div>
              
              {/* Centralized Price Row */}
              <div className="mt-1 mb-2">
                <PriceDisplay 
                    config={biddingConfig}
                    askPrice={item.askPrice}
                    bidCount={item.bidCount}
                    viewMode="compact"
                    remainingAttempts={remainingAttempts}
                    showAttempts={!!activeBid}
                    userCurrentBid={activeBid?.amount}
                />
              </div>

              <div className="flex items-center gap-2 mt-1">
                <ConditionBadge condition={item.condition} variant="outline" className="h-5 py-0 px-1.5" />
                <CategoryBadge category={item.category} variant="outline" className="h-5 py-0 px-1.5" />
              </div>

              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <MapPin className="h-3 w-3 text-red-400" />
                  <span className="truncate">{seller.location.address}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <TimerBadge expiryAt={item.expiryAt} variant="outline" className="h-4 py-0 px-1 text-[8px]" />
                </div>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-tight h-5 px-1.5 border-slate-200 text-slate-400">
                  {item.bidCount} Bids
                </Badge>
                {item.isPublicBid && item.currentHighBid && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600">
                    <Gavel className="h-3 w-3" />
                     Highest: {item.currentHighBid.toLocaleString()}
                  </div>
                )}
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 px-2 text-slate-400 hover:text-red-500 hover:bg-red-50 -mr-1"
                onClick={handleRemove}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                <span className="text-[10px] font-bold">Remove</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <ProductDetailsModal 
        item={item} 
        seller={seller} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
