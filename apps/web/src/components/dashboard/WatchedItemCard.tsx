"use client";

import { Item, User } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Heart, Gavel, Trash2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { useState } from "react";
import ProductDetailsModal from "@/components/marketplace/ProductDetailsModal";
import { Button } from "@/components/ui/button";

interface WatchedItemCardProps {
  item: Item;
  seller: User;
}

export default function WatchedItemCard({ item, seller }: WatchedItemCardProps) {
  const { toggleWatch } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getTimeLeft = (expiryAt: string) => {
    const diff = new Date(expiryAt).getTime() - Date.now();
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
        className="p-4 bg-white border rounded-xl flex gap-4 transition-all hover:shadow-sm cursor-pointer group relative"
      >
        <div className="relative shrink-0">
          <img id={`watched-item-img-${item.id}`} src={item.images[0]} alt="" className="h-20 w-20 rounded-lg object-cover bg-slate-100" />
          <div className="absolute -top-2 -right-2 bg-blue-600 text-white p-1 rounded-full border-2 border-white shadow-sm">
            <Heart className="h-3 w-3 fill-current" />
          </div>
        </div>
        
        <div id={`watched-item-content-${item.id}`} className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <h3 id={`watched-item-title-${item.id}`} className="font-bold text-slate-900 truncate mr-2">{item.title}</h3>
              <div className="flex flex-col items-end">
                <span id={`watched-item-price-${item.id}`} className="text-sm font-black text-slate-900">
                  Rs. {item.askPrice.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Asking</span>
              </div>
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
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-tight h-5 px-1.5 border-slate-200 text-slate-400">
                {item.bidCount} Bids
              </Badge>
              {item.isPublicBid && item.currentHighBid && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600">
                  <Gavel className="h-3 w-3" />
                  High: Rs. {item.currentHighBid.toLocaleString()}
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
      
      <ProductDetailsModal 
        item={item} 
        seller={seller} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
