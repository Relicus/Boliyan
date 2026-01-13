"use client";

import { useState, useMemo } from "react";
import { Item, User } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight, Lock, Globe } from "lucide-react";
import { useApp } from "@/lib/store";

interface ItemCardProps {
  item: Item;
  seller: User;
}

export default function ItemCard({ item }: ItemCardProps) {
  const { placeBid } = useApp();
  const [bidAmount, setBidAmount] = useState<string>("");
  const [error, setError] = useState<boolean>(false);

  // Stable "random" distance based on item ID to prevent hydration mismatch
  const distance = useMemo(() => {
    const hash = item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return ((hash % 80) / 10 + 1.2).toFixed(1);
  }, [item.id]);

  const handleBid = () => {
    const amount = parseFloat(bidAmount);
    const minBid = item.askPrice * 0.7;

    if (isNaN(amount) || amount < minBid) {
      setError(true);
      setTimeout(() => setError(false), 2000);
      return;
    }

    placeBid(item.id, amount, item.isPublicBid ? 'public' : 'private');
    setBidAmount("");
  };

  return (
    <Card className="group border-none shadow-sm hover:shadow-md transition-all duration-200 bg-white rounded-lg overflow-hidden flex flex-col">
      {/* 
        Image Section:
        Maintained h-28 for aspect ratio balance.
      */}
      <div className="relative h-28 bg-slate-100 overflow-hidden shrink-0">
        <img 
          src={item.images[0]} 
          alt={item.title}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* High Contrast Bottom Bar on Image */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-[2px] px-2 py-1 flex justify-between items-center">
           <div className="flex items-center gap-1 text-[10px] text-white font-bold tracking-wide">
             <MapPin className="h-3 w-3 text-red-400" />
             {distance}km
           </div>
           {item.isPublicBid ? (
             <div className="flex items-center gap-1 text-[10px] text-blue-200 font-bold">
                <Globe className="h-3 w-3" />
                <span>Public</span>
             </div>
           ) : (
             <div className="flex items-center gap-1 text-[10px] text-amber-200 font-bold">
                <Lock className="h-3 w-3" />
                <span>Secret</span>
             </div>
           )}
        </div>
      </div>
      
      {/* 
        Content Section:
        - Removed mt-auto from input row to eliminate variable gap
        - Reduced gap-2 to gap-1.5 for tighter fit
        - Removed pt-1
      */}
      <CardContent className="p-2 flex flex-col gap-1.5 flex-1">
        {/* Title */}
        <h3 className="font-bold text-sm text-slate-900 leading-tight line-clamp-1" title={item.title}>
          {item.title}
        </h3>

        {/* Price Row */}
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Asking</span>
            <span className="text-base font-black text-slate-800 leading-none">
              {Math.round(item.askPrice/1000)}k
            </span>
          </div>
          
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
              {item.isPublicBid ? "High Bid" : "Offers"}
            </span>
            {item.isPublicBid && item.currentHighBid ? (
              <span className="text-base font-black text-blue-600 leading-none">
                {Math.round(item.currentHighBid/1000)}k
              </span>
            ) : (
              <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-bold border-slate-300 text-slate-600">
                {item.bidCount}
              </Badge>
            )}
          </div>
        </div>

        {/* Input Row - Removed mt-auto */}
        <div className="flex gap-1">
          <div className="relative flex-1">
             <Input 
                type="number" 
                placeholder="Your Offer..."
                value={bidAmount}
                onChange={(e) => {
                  setBidAmount(e.target.value);
                  setError(false);
                }}
                className={`h-9 px-2 text-sm font-bold bg-slate-50 border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-600 
                  ${error ? 'border-red-500 bg-red-50 text-red-900 placeholder:text-red-400' : 'text-slate-900'}
                `}
              />
          </div>
          <Button 
            size="sm" 
            className="h-9 w-10 p-0 bg-blue-600 hover:bg-blue-700 rounded-md shrink-0 shadow-sm active:scale-95 transition-transform"
            onClick={handleBid}
          >
            <ArrowRight className="h-5 w-5 text-white stroke-[3px]" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
