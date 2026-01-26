"use client";

import { useState, useMemo } from "react";
import { MapPin, Bookmark, Trash2, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { Item, User, Bid } from "@/types";
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

  const handleChat = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!acceptedConversation) return;
    router.push(`/inbox?id=${acceptedConversation.id}`);
  };


  return (
    <>
      <div 
        id={`watched-item-card-${item.id}`} 
        onClick={() => setIsModalOpen(true)}
        className="group relative overflow-hidden rounded-xl transition-all hover:shadow-md cursor-pointer bg-white shadow-sm border border-slate-200"
      >
        
        <div className="flex p-3 gap-3">
          {/* Image */}
          <div className="h-20 w-20 relative shrink-0">
             <img id={`watched-item-img-${item.id}`} src={item.images[0]} alt="" className="h-full w-full rounded-lg object-cover bg-slate-100" />
             <div className="absolute -top-1 -right-1 bg-blue-600 text-white p-0.5 rounded-full border-2 border-white shadow-sm">
               <Bookmark className="h-2.5 w-2.5 fill-current" />
             </div>
          </div>
          
          {/* Content */}
          <div id={`watched-item-content-${item.id}`} className="flex-1 min-w-0 flex flex-col justify-between">
            {/* Top Section */}
            <div className="flex justify-between items-start gap-2">
               {/* Left: Title & Meta */}
               <div className="flex flex-col gap-1 min-w-0">
                  <h3 id={`watched-item-title-${item.id}`} className="font-bold text-sm text-slate-900 line-clamp-1 pr-1">{item.title}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <ConditionBadge condition={item.condition} className="text-[9px] px-1.5 py-0.5" />
                    <CategoryBadge category={item.category} className="text-[9px] px-1.5 py-0.5" />
                  </div>
                  {/* Location (Optional - if space permits) */}
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{seller.location.address}</span>
                  </div>
               </div>

               {/* Right: Actions & Timer */}
               <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {/* Timer */}
                  <div className="text-xs font-bold text-white bg-red-600 px-2 py-1 rounded-md flex items-center gap-1">
                     {/* TimerBadge rendering logic manual for consistency or use component */}
                      <TimerBadge expiryAt={item.expiryAt} variant="solid" className="p-0 h-auto bg-transparent text-white text-[10px]" />
                  </div>
                  
                  {/* Action Buttons Row */}
                  <div className="flex items-center gap-1 mt-auto">
                    {canChat && (
                        <Button
                          id={`watched-item-chat-btn-${item.id}`}
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                          onClick={handleChat}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </Button>
                    )}
                    <Button 
                      id={`watched-item-remove-btn-${item.id}`}
                      size="sm" 
                      variant="outline" 
                      className="h-7 px-2 bg-slate-50 border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100"
                      onClick={handleRemove}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      <span className="text-[10px] font-bold">Remove</span>
                    </Button>
                  </div>
               </div>
            </div>

            {/* Bottom: Price Display */}
            <PriceDisplay 
                config={biddingConfig}
                askPrice={item.askPrice}
                bidCount={item.bidCount}
                viewMode="compact"
                remainingAttempts={remainingAttempts}
                showAttempts={!!activeBid}
                userCurrentBid={activeBid?.amount}
                className="mt-2 pt-1"
                itemId={item.id}
            />
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
