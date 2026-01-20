"use client";

import { Bid, Item, User } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Trophy, AlertTriangle } from "lucide-react";
import { useApp } from "@/lib/store";
import { useMemo, useState } from "react";
import ProductDetailsModal from "@/components/marketplace/ProductDetailsModal";

interface MyBidCardProps {
  item: Item;
  userBid: Bid;
  seller: User;
}

export default function MyBidCard({ item, userBid, seller }: MyBidCardProps) {
  const { user, now } = useApp();
  
  const isLeading = user && item.isPublicBid && item.currentHighBidderId === user.id;

  const isOutbid = user && item.isPublicBid && item.currentHighBidderId !== user.id && (item.currentHighBid || 0) > userBid.amount;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getTimeLeft = (expiryAt: string) => {
    if (now === 0) return "Loading...";
    const diff = new Date(expiryAt).getTime() - now;
    const hours = Math.max(0, Math.floor(diff / 3600000));
    const mins = Math.max(0, Math.floor((diff % 3600000) / 60000));
    
    if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    return `${hours}h ${mins}m`;
  };

  return (
    <>
    <div 
      id={`my-bid-card-${item.id}`} 
      onClick={() => setIsModalOpen(true)}
      className="@container p-4 bg-white border rounded-xl flex gap-4 transition-all hover:shadow-sm cursor-pointer"
    >
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
            <span id={`my-bid-amount-${item.id}`} className="text-[clamp(0.875rem,4cqi,1.125rem)] font-black text-blue-600 shrink-0 font-outfit">
              Rs. {userBid.amount.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
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
                 Current: Rs. {item.currentHighBid?.toLocaleString()}
               </div>
             )}
          </div>
          <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-tight h-5 px-1.5 border-slate-200 text-slate-400">
            {item.isPublicBid ? "Public" : "Secret"}
          </Badge>
        </div>
      </div>
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
