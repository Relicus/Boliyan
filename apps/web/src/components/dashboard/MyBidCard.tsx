"use client";

import { useState, useMemo } from "react";
import { Clock, Trophy, AlertTriangle, MessageSquare, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { Bid, Item, User } from "@/types";

import { Button } from "@/components/ui/button";
import ProductDetailsModal from "@/components/marketplace/ProductDetailsModal";
import { CategoryBadge } from "@/components/common/CategoryBadge";
import { ConditionBadge } from "@/components/common/ConditionBadge";
import { PriceDisplay } from "@/components/common/PriceDisplay";
import { createBiddingConfig } from "@/types/bidding";

import { useApp } from "@/lib/store";
import { useTime } from "@/context/TimeContext";

interface MyBidCardProps {
  item: Item;
  userBid: Bid;
  seller: User;
}

export default function MyBidCard({ item, userBid, seller }: MyBidCardProps) {
  const { user, bids, conversations } = useApp();
  const { now } = useTime();
  
  const isLeading = user && item.isPublicBid && item.currentHighBidderId === user.id;
  const isOutbid = user && item.isPublicBid && item.currentHighBidderId !== user.id && (item.currentHighBid || 0) > userBid.amount;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  // Unified Bidding Config
  const biddingConfig = useMemo(() => 
    createBiddingConfig(item, user, bids),
    [item, user, bids]
  );

  const getTimeLeft = (expiryAt: string) => {
    if (now === 0) return "Loading...";
    const diff = new Date(expiryAt).getTime() - now;
    const hours = Math.max(0, Math.floor(diff / 3600000));
    const mins = Math.max(0, Math.floor((diff % 3600000) / 60000));
    
    if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    return `${hours}h ${mins}m`;
  };

  const acceptedConversation = useMemo(() => {
    if (!user) return undefined;
    return conversations.find(conversation =>
      conversation.itemId === item.id && conversation.bidderId === user.id
    );
  }, [conversations, item.id, user]);
  const isAccepted = userBid.status === 'accepted';
  const canChat = isAccepted && !!acceptedConversation;
  const canCall = canChat && !!seller.phone;

  const handleChat = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!acceptedConversation) return;
    router.push(`/inbox?id=${acceptedConversation.id}`);
  };

  const handleCall = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!seller.phone) return;
    window.location.href = `tel:${seller.phone}`;
  };

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer relative"
      >
        {/* Status Badge */}
        {isAccepted && (
            <div className="absolute top-2 right-2 z-10 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                OFFER ACCEPTED
            </div>
        )}
        {!isAccepted && isLeading && (
           <div className="absolute top-2 right-2 z-10 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
             <Trophy className="w-3 h-3" />
             HIGHEST BIDDER
           </div>
        )}
        {!isAccepted && isOutbid && (
           <div className="absolute top-2 right-2 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 animate-pulse">
             <AlertTriangle className="w-3 h-3" />
             OUTBID
           </div>
        )}

        <div className="flex p-3 gap-3">
          {/* Image */}
          <div className="h-20 w-20 bg-slate-100 rounded-lg overflow-hidden shrink-0">
             {item.images[0] && (
               <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
             )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2">
                 <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{item.title}</h3>
              </div>
              
              <div className="flex items-center gap-2 mt-1">
                  <CategoryBadge category={item.category} className="text-[9px] px-1.5 py-0.5" />
                  <ConditionBadge condition={item.condition} className="text-[9px] px-1.5 py-0.5" />
              </div>
            </div>

            <div className="flex items-end justify-between mt-2">
               <PriceDisplay 
                  config={biddingConfig}
                  askPrice={item.askPrice}
                  bidCount={item.bidCount}
                  viewMode="compact"
                  className="scale-90 origin-left -ml-1"
                  userCurrentBid={userBid.amount}
               />
               
               {/* Time Remaining */}
               <div className="flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">
                  <Clock className="w-3 h-3" />
                  {getTimeLeft(item.expiryAt)}
               </div>
            </div>
          </div>
        </div>

        {/* Action Footer (Only for Accepted Deals) */}
        {isAccepted && (
            <div className="px-3 py-2 bg-green-50 border-t border-green-100 flex items-center justify-between">
                <span className="text-xs font-bold text-green-700">Deal Closed! Connect with Seller:</span>
                <div className="flex gap-2">
                    {canChat && (
                        <Button size="sm" variant="default" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={handleChat}>
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Chat
                        </Button>
                    )}
                     {canCall && (
                        <Button size="sm" variant="outline" className="h-7 text-xs border-green-200 text-green-700 hover:bg-green-100" onClick={handleCall}>
                            <Phone className="w-3 h-3 mr-1" />
                            Call
                        </Button>
                    )}
                </div>
            </div>
        )}
      </div>

      <ProductDetailsModal 
        item={item} 
        seller={seller} 
        isOpen={isModalOpen} 
        onClose={setIsModalOpen} 
      />
    </>
  );
}
