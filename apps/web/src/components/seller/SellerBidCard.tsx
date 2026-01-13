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
  // Stable "random" derived values based on bidder ID
  const { distance, location, duration } = useMemo(() => {
    const hash = bidder.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const dist = ((hash % 40) / 10 + 1.1).toFixed(1);
    
    const locations = ["Satellite Town, Sargodha", "Model Town, Lahore", "DHA, Karachi", "Blue Area, Islamabad", "Civil Lines, Faisalabad", "Cantt, Rawalpindi"];
    const loc = locations[hash % locations.length];
    
    // Duration approx 2.5 mins per km
    const dur = Math.round(Number(dist) * 2.5);
    
    return { distance: dist, location: loc, duration: dur };
  }, [bidder.id]);

  return (
    <div id={`bid-card-${bid.id}`} className="bg-slate-50 border border-slate-200 rounded-xl hover:shadow-md transition-all p-3">
      {/* MOBILE Layout (md:hidden) */}
      <div id={`bid-card-mobile-${bid.id}`} className="flex flex-col gap-2 md:hidden">
        {/* Top Row: User (65%) | Price (35%) */}
        <div id={`bid-card-mobile-top-row-${bid.id}`} className="flex items-start">
          <div id={`bid-card-mobile-user-info-${bid.id}`} className="flex items-center gap-2 w-[65%]">
            <Avatar className="h-9 w-9 border-2 border-slate-50 shrink-0">
              <AvatarImage id={`bidder-avatar-img-mobile-${bid.id}`} src={bidder.avatar} />
              <AvatarFallback id={`bidder-avatar-fallback-mobile-${bid.id}`}>{bidder.name[0]}</AvatarFallback>
            </Avatar>
            
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 id={`bidder-name-mobile-${bid.id}`} className="font-bold text-sm text-slate-900 truncate">{bidder.name}</h4>
                <div id={`bidder-rating-mobile-${bid.id}`} className="flex items-center gap-1.5 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100 shrink-0">
                  <div className="flex items-center gap-0.5 text-xs text-amber-600 font-black">
                      <Star className="h-3 w-3 fill-amber-500" />
                      {bidder.rating}
                  </div>
                  <span className="text-xs text-amber-600/70 font-semibold">(24)</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  <div id={`bidder-location-mobile-${bid.id}`} className="flex items-center gap-0.5 min-w-0">
                    <MapPin className="h-3 w-3 text-red-400 shrink-0" />
                    <span className="truncate">{location}</span>
                  </div>
              </div>
            </div>
          </div>

          <div id={`bid-card-mobile-price-section-${bid.id}`} className="text-right w-[35%]">
            <p id={`bid-amount-mobile-${bid.id}`} className="text-xl font-black text-blue-600 leading-none truncate">Rs. {bid.amount.toLocaleString()}</p>
            <div id={`bid-distance-info-mobile-${bid.id}`} className="flex items-center justify-end gap-2 mt-0.5 text-xs text-muted-foreground font-medium whitespace-nowrap">
               <div className="flex items-center gap-0.5">
                 <MapPin className="h-3 w-3 text-red-400" />
                 <span>{distance} km</span>
               </div>
               <div className="flex items-center gap-0.5">
                 <Clock className="h-3 w-3 text-blue-400" />
                 <span>{duration} min</span>
               </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Actions */}
        <div id={`bid-card-mobile-actions-${bid.id}`} className="grid grid-cols-2 gap-3 mt-1">
          <Button id={`bid-reject-btn-mobile-${bid.id}`} variant="outline" className="w-full h-10 border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold">
            Reject
          </Button>
          <Button id={`bid-unlock-btn-mobile-${bid.id}`} className="w-full h-10 bg-blue-600 hover:bg-blue-700 font-bold">
            <MessageSquare className="h-4 w-4 mr-2" />
            Unlock Chat
          </Button>
        </div>
      </div>

      {/* DESKTOP Layout (hidden md:flex) */}
      <div id={`bid-card-desktop-${bid.id}`} className="hidden md:flex flex-row items-center justify-between gap-4">
          <div id={`bid-card-desktop-left-${bid.id}`} className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border-2 border-slate-50">
              <AvatarImage id={`bidder-avatar-img-desktop-${bid.id}`} src={bidder.avatar} />
              <AvatarFallback id={`bidder-avatar-fallback-desktop-${bid.id}`}>{bidder.name[0]}</AvatarFallback>
            </Avatar>
            
            <div id={`bidder-info-desktop-${bid.id}`}>
                <div className="flex items-center gap-2 mb-1">
                  <h4 id={`bidder-name-desktop-${bid.id}`} className="font-bold text-sm text-slate-900 truncate">{bidder.name}</h4>
                  <div id={`bidder-rating-desktop-${bid.id}`} className="flex items-center gap-0.5 text-xs text-amber-500 font-bold">
                    <Star className="h-3 w-3 fill-amber-500" />
                    {bidder.rating}
                  </div>
                  <span className="text-xs text-amber-600/70 font-semibold">(24)</span>
                </div>
                
                <div id={`bidder-stats-desktop-${bid.id}`} className="flex items-center gap-3 text-[11px] text-muted-foreground">
                   <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-red-400" />
                    {location}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-red-400" />
                    {distance} km away
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-blue-400" />
                    {duration} mins drive
                  </div>
                </div>
            </div>
          </div>

          <div id={`bid-card-desktop-right-${bid.id}`} className="flex flex-row items-center gap-6">
              <div className="text-left">
                <p id={`bid-amount-desktop-${bid.id}`} className="text-2xl font-black text-blue-600">Rs. {bid.amount.toLocaleString()}</p>
              </div>

              <div id={`bid-actions-desktop-${bid.id}`} className="flex gap-2">
                <Button id={`bid-reject-btn-desktop-${bid.id}`} size="sm" variant="outline" className="h-9 px-4 border-slate-200 hover:bg-slate-50">
                  Reject
                </Button>
                <Button id={`bid-unlock-btn-desktop-${bid.id}`} size="sm" className="h-9 px-4 bg-blue-600 hover:bg-blue-700 font-bold">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Unlock Chat
                </Button>
              </div>
          </div>
      </div>
    </div>
  );
}
