"use client";

import { useState, useMemo } from "react";
import { Clock, MapPin, Trophy, AlertTriangle, MessageSquare, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { Bid, Item, User } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ProductDetailsModal from "@/components/marketplace/ProductDetailsModal";
import { CategoryBadge } from "@/components/common/CategoryBadge";
import { ConditionBadge } from "@/components/common/ConditionBadge";
import { VictoryHalo } from "@/components/common";
import { PriceDisplay } from "@/components/common/PriceDisplay";
import { createBiddingConfig } from "@/types/bidding";
import { MAX_BID_ATTEMPTS } from "@/lib/bidding";
import { useApp } from "@/lib/store";

interface MyBidCardProps {
  item: Item;
  userBid: Bid;
  seller: User;
}

export default function MyBidCard({ item, userBid, seller }: MyBidCardProps) {
  const { user, now, bids, conversations } = useApp();
  
  const isLeading = user && item.isPublicBid && item.currentHighBidderId === user.id;
  const isOutbid = user && item.isPublicBid && item.currentHighBidderId !== user.id && (item.currentHighBid || 0) > userBid.amount;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  // Remaining Attempts
  const remainingAttempts = useMemo(() => {
    const updatesUsed = userBid.update_count || 0;
    return Math.max(0, (MAX_BID_ATTEMPTS - 1) - updatesUsed);
  }, [userBid]);

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

  const haloTheme = isLeading ? "orange" : isOutbid ? "green" : "none";
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
        id={`my-bid-card-${item.id}`} 
        onClick={() => setIsModalOpen(true)}
        className={`group relative isolation-isolate overflow-hidden rounded-xl transition-all hover:shadow-md cursor-pointer ${haloTheme !== 'none' ? 'p-[3px]' : 'p-0'}`}
      >
        <VictoryHalo theme={haloTheme} />
        
        <div className="relative z-10 bg-white rounded-[calc(0.75rem-3px)] p-4 flex gap-4 h-full">
          <div className="relative shrink-0">
            <img id={`my-bid-img-${item.id}`} src={item.images[0]} alt="" className="h-20 w-20 rounded-lg object-cover bg-slate-100" />
            <Badge className={`absolute -top-2 -right-2 h-5 flex items-center justify-center px-1.5 text-[10px] font-bold border-2 border-white ${
              isLeading ? "bg-amber-500" : isOutbid ? "bg-red-500" : "bg-blue-600"
            }`}>
              {isLeading ? "Leading" : isOutbid ? "Outbid" : "Pending"}
            </Badge>
          </div>
          
          <div id={`my-bid-content-${item.id}`} className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <h3 id={`my-bid-title-${item.id}`} className="font-bold text-slate-900 truncate mr-2 text-[clamp(1rem,5cqi,1.25rem)]">{item.title}</h3>
              </div>

              {/* Centralized Price Row */}
              <div className="mt-1 mb-2">
                <PriceDisplay 
                    config={biddingConfig}
                    askPrice={item.askPrice}
                    bidCount={item.bidCount}
                    viewMode="compact"
                    remainingAttempts={remainingAttempts}
                    showAttempts={true}
                    userCurrentBid={userBid.amount}
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
                  <Clock className="h-3 w-3 text-blue-400" />
                  <span>{getTimeLeft(item.expiryAt)}</span>
                </div>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                 {isLeading && (
                   <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                     <Trophy className="h-3 w-3 stroke-[3]" />
                     Highest Bidder
                   </div>
                 )}
                 {isOutbid && (
                   <div className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                     <AlertTriangle className="h-3 w-3 stroke-[3]" />
                      Current: {item.currentHighBid?.toLocaleString()}
                   </div>
                 )}
              </div>
              <div className="flex items-center gap-2">
                {canChat && (
                  <div className="flex items-center gap-1">
                    {canCall && (
                      <Button
                        id={`my-bid-call-btn-${item.id}`}
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50"
                        onClick={handleCall}
                      >
                        <Phone className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      id={`my-bid-chat-btn-${item.id}`}
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50"
                      onClick={handleChat}
                    >
                      <MessageSquare className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-tight h-5 px-1.5 border-slate-200 text-slate-400">
                  {item.isPublicBid ? "Public" : "Secret"}
                </Badge>
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
