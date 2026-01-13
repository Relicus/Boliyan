"use client";

import { useMemo } from "react";
import { Bid, User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, MessageSquare, Star, Clock } from "lucide-react";

interface SellerBidCardProps {
  bid: Bid;
  bidder: User;
}

export default function SellerBidCard({ bid, bidder }: SellerBidCardProps) {
  // Stable "random" distance based on bidder ID to prevent hydration mismatch
  const distance = useMemo(() => {
    const hash = bidder.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return ((hash % 40) / 10 + 1.1).toFixed(1);
  }, [bidder.id]);
  const duration = Math.round(Number(distance) * 2.5);

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 bg-white border border-slate-100 rounded-xl hover:shadow-md transition-all">
      <div className="flex items-center gap-4 w-full md:w-auto">
        <Avatar className="h-12 w-12 border-2 border-slate-50">
          <AvatarImage src={bidder.avatar} />
          <AvatarFallback>{bidder.name[0]}</AvatarFallback>
        </Avatar>
        
        <div className="md:hidden flex-1">
            <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-sm text-slate-900 truncate">{bidder.name}</h4>
            <div className="flex items-center gap-0.5 text-xs text-amber-500 font-bold">
                <Star className="h-3 w-3 fill-amber-500" />
                {bidder.rating}
            </div>
            </div>
        </div>
      </div>

      <div className="flex-1 min-w-0 w-full">
        <div className="hidden md:flex items-center gap-2 mb-1">
          <h4 className="font-bold text-sm text-slate-900 truncate">{bidder.name}</h4>
          <div className="flex items-center gap-0.5 text-xs text-amber-500 font-bold">
            <Star className="h-3 w-3 fill-amber-500" />
            {bidder.rating}
          </div>
          <Badge variant="outline" className="text-[10px] py-0 h-4 border-slate-200 text-slate-500 font-normal">
            Buyer
          </Badge>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-red-400" />
            {distance} km away
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-blue-400" />
            {duration} mins drive
          </div>
           <div className="md:hidden flex items-center gap-1">
             <Badge variant="outline" className="text-[10px] py-0 h-4 border-slate-200 text-slate-500 font-normal">
                Buyer
              </Badge>
           </div>
        </div>
      </div>

      <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 gap-4 mt-2 md:mt-0">
          <div className="text-left md:text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Offer</p>
            <p className="text-lg font-black text-blue-600">Rs. {bid.amount.toLocaleString()}</p>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-9 px-4 border-slate-200 hover:bg-slate-50">
              Reject
            </Button>
            <Button size="sm" className="h-9 px-4 bg-blue-600 hover:bg-blue-700 font-bold">
              <MessageSquare className="h-4 w-4 mr-2" />
              Unlock Chat
            </Button>
          </div>
      </div>
    </div>
  );
}
