"use client";

import { useState, useMemo } from "react";
import { MapPin, Bookmark, Gavel, Trash2, MessageSquare, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { Item, User, Bid } from "@/types";
import { Badge } from "@/components/ui/badge";
import ProductDetailsModal from "@/components/marketplace/ProductDetailsModal";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/common/CategoryBadge";
import { ConditionBadge } from "@/components/common/ConditionBadge";
import { TimerBadge } from "@/components/common/TimerBadge";
import { PriceDisplay } from "@/components/common/PriceDisplay";
import { createBiddingConfig } from "@/types/bidding";
import { MAX_BID_ATTEMPTS } from "@/lib/bidding";
import { useApp } from "@/lib/store";

interface WatchedItemCardProps {
  item: Item;
  seller: User;
  userBid?: Bid; // Allow passing user bid if exists
}

export default function WatchedItemCard({ item, seller, userBid }: WatchedItemCardProps) {
  const { toggleWatch, user, bids, conversations } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWatch(item.id);
  };

  const activeBid = useMemo(() => {
    if (userBid) return userBid;
    if (!user) return undefined;
    return bids.find(b => b.itemId === item.id && b.bidderId === user.id);
  }, [bids, item.id, user, userBid]);

  const remainingAttempts = useMemo(() => {
    if (!activeBid) return MAX_BID_ATTEMPTS;
    const updatesUsed = activeBid.update_count || 0;
    return Math.max(0, (MAX_BID_ATTEMPTS - 1) - updatesUsed);
  }, [activeBid]);

  const acceptedConversation = useMemo(() => {
    if (!user) return undefined;
    return conversations.find(conversation =>
      conversation.itemId === item.id && conversation.bidderId === user.id
    );
  }, [conversations, item.id, user]);

  const biddingConfig = createBiddingConfig(item, user, bids);
  const canChat = activeBid?.status === 'accepted' && !!acceptedConversation;
  const listingPhone = item.contactPhone || seller.phone;
  const canCall = canChat && !!listingPhone;

  const handleChat = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!acceptedConversation) return;
    router.push(`/inbox?id=${acceptedConversation.id}`);
  };

  const handleCall = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!listingPhone) return;
    window.location.href = `tel:${listingPhone}`;
  };

  return (
    <>
      <div 
        id={`watched-item-card-${item.id}`} 
        onClick={() => setIsModalOpen(true)}
        className="group relative overflow-hidden rounded-xl transition-all hover:shadow-md cursor-pointer"
      >
        
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
                  <TimerBadge expiryAt={item.expiryAt} variant="outline" className="h-4 py-0 px-1 text-[8px] bg-red-600 text-white border-transparent hover:bg-red-700" />
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
              <div className="flex items-center gap-1.5">
                {canChat && (
                  <div className="flex items-center gap-1">
                    {canCall && (
                      <Button
                        id={`watched-item-call-btn-${item.id}`}
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[10px] font-bold border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50"
                        onClick={handleCall}
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        Call
                      </Button>
                    )}
                    <Button
                      id={`watched-item-chat-btn-${item.id}`}
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50"
                      onClick={handleChat}
                    >
                      <MessageSquare className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <Button 
                  id={`watched-item-remove-btn-${item.id}`}
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
