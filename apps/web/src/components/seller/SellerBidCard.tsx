"use client";

import { useMemo } from "react";
import { Bid, User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MapPin, MessageSquare, Star, Check, X } from "lucide-react";
import { buildWhatsAppMessageForDeal, calculatePrivacySafeDistance, getFuzzyLocationString, formatPrice, getWhatsAppUrl, cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import { useTime } from "@/context/TimeContext";
import { useRouter } from "next/navigation";
import { WhatsAppIcon } from "@/components/common/WhatsAppIcon";

import { DistanceBadge } from "@/components/common/DistanceBadge";
import Link from "next/link";

interface SellerBidCardProps {
  bid: Bid;
  bidder: User;
}

export default function SellerBidCard({ bid, bidder }: SellerBidCardProps) {
  const { rejectBid, acceptBid, conversations, user, itemsById } = useApp();
  const { now } = useTime();
  const router = useRouter();
  
  const item = itemsById[bid.itemId];
  // Stable derived values based on bidder profile
  const { distance, duration, isOutside } = useMemo(() => {
    return calculatePrivacySafeDistance(user?.location, bidder.location);
  }, [user?.location, bidder.location]);

  const location = useMemo(() => getFuzzyLocationString(bidder.location.address), [bidder.location.address]);

  const waMessage = buildWhatsAppMessageForDeal({
    item,
    bidAmount: bid.amount,
    myRole: 'seller',
    myLocation: user?.location,
    otherUserLocation: bidder.location
  });

  // Calculate time remaining
  const expiresAt = useMemo(() => 
    bid.expiresAt ? new Date(bid.expiresAt) : new Date(new Date(bid.createdAt).getTime() + 24 * 60 * 60 * 1000)
  , [bid.expiresAt, bid.createdAt]);

  const isExpired = bid.status === 'expired' || expiresAt.getTime() <= now;
  
  const handleReject = () => {
    rejectBid(bid.id);
  };

  const handleAccept = async () => {
    const convId = await acceptBid(bid.id);
    if (convId) {
        router.push(`/inbox?id=${convId}`);
    }
  };

  const handleChat = () => {
    const conv = conversations.find(c => 
      c.itemId === bid.itemId && 
      ((c.sellerId === user?.id && c.bidderId === bidder.id) || 
       (c.bidderId === user?.id && c.sellerId === bidder.id))
    );
    
    if (conv) {
      router.push(`/inbox?id=${conv.id}`);
    } else {
      router.push("/inbox");
    }
  };

  if (bid.status === 'rejected') {
    return null;
  }

  return (
    <div id={`bid-card-${bid.id}`} className="@container bg-slate-50 border border-slate-200 rounded-xl hover:shadow-md transition-all p-3">
      {/* MOBILE Layout */}
      <div id={`bid-card-mobile-${bid.id}`} className="flex flex-col gap-2 md:hidden">
        <div id={`bid-card-mobile-top-row-${bid.id}`} className="flex items-start justify-between gap-3">
          <div id={`bid-card-mobile-user-info-${bid.id}`} className="flex items-center gap-2 min-w-0 flex-1">
            <Avatar className="h-9 w-9 border-2 border-slate-50 shrink-0">
              <AvatarImage id={`bidder-avatar-img-mobile-${bid.id}`} src={bidder.avatar} />
              <AvatarFallback id={`bidder-avatar-fallback-mobile-${bid.id}`}>{bidder.name[0]}</AvatarFallback>
            </Avatar>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link href={`/user/${bidder.id}`} id={`bidder-name-mobile-${bid.id}`} className="font-semibold text-sm text-slate-700 truncate max-w-[120px] hover:text-blue-600 transition-colors">{bidder.name}</Link>
                <div id={`bidder-rating-mobile-${bid.id}`} className="flex items-center gap-1 bg-amber-50 px-1 py-0.5 rounded-md border border-amber-100 shrink-0">
                  <div className="flex items-center gap-0.5 text-[10px] text-amber-600 font-black">
                      <Star className="h-2.5 w-2.5 fill-amber-500" />
                      {bidder.rating}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground w-full">
                  <div id={`bidder-location-mobile-${bid.id}`} className="flex items-center gap-0.5 min-w-0 overflow-hidden">
                    <MapPin className="h-2.5 w-2.5 text-red-400 shrink-0" />
                    <span className="truncate max-w-[120px]">{location}</span>
                  </div>
              </div>
            </div>
          </div>

          <div id={`bid-card-mobile-price-section-${bid.id}`} className="text-right shrink-0 flex flex-col items-end">
            <span className="text-[clamp(0.5625rem,2.25cqi,0.75rem)] font-black uppercase tracking-[0.08em] text-slate-500/80 mb-1">Bid Amount</span>
            <p id={`bid-amount-mobile-${bid.id}`} className="price-font font-black text-blue-600 leading-none truncate text-[clamp(1rem,5cqi,1.25rem)]">Rs. {formatPrice(bid.amount)}</p>

            {isExpired && bid.status !== 'accepted' && (
                <div className="text-[9px] font-bold mt-1 text-right text-red-500 uppercase tracking-tighter">
                   Expired
                </div>
            )}
            {!isOutside && (
              <div id={`bid-distance-info-mobile-${bid.id}`} className="flex items-center justify-end gap-2 mt-1 text-[10px] text-muted-foreground font-medium whitespace-nowrap">
                <DistanceBadge 
                  distance={distance} 
                  duration={duration} 
                  variant="inline" 
                  className="bg-slate-100 px-1.5 py-0.5 rounded text-muted-foreground"
                  iconClassName="h-2.5 w-2.5"
                />
              </div>
            )}
          </div>
        </div>

        <div id={`bid-card-mobile-actions-${bid.id}`} className="grid grid-cols-2 gap-3 mt-1">
          {bid.status !== 'accepted' && (
            <Button id={`bid-reject-btn-mobile-${bid.id}`} onClick={handleReject} variant="outline" className="w-full h-10 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-600 font-semibold">
              <X className="h-4 w-4 mr-2" />
              Reject
            </Button>
          )}
          {bid.status === 'accepted' ? (
            <div className="col-span-2 flex gap-2">
              <Button 
                id={`bid-whatsapp-btn-mobile-${bid.id}`} 
                disabled={!bidder.phone && !bidder.whatsapp}
                className={cn(
                  "flex-1 h-10 font-bold transition-all",
                  (bidder.phone || bidder.whatsapp)
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                    : "bg-slate-100 text-slate-400 grayscale cursor-not-allowed border border-slate-200"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!bidder.phone && !bidder.whatsapp) return;
                  window.open(getWhatsAppUrl(bidder.whatsapp || bidder.phone || "", waMessage), '_blank');
                }} 
              >
                <WhatsAppIcon className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
              <Button id={`bid-chat-btn-mobile-${bid.id}`} onClick={handleChat} className="flex-1 h-10 bg-green-600 hover:bg-green-700 font-bold">
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </Button>
            </div>
          ) : (
            <Button id={`bid-unlock-btn-mobile-${bid.id}`} onClick={handleAccept} className="w-full h-10 bg-blue-600 hover:bg-blue-700 font-bold">
              <Check className="h-4 w-4 mr-2" />
              Accept & Chat
            </Button>
          )}
        </div>
      </div>

      {/* DESKTOP Layout */}
      <div id={`bid-card-desktop-${bid.id}`} className="hidden md:flex flex-row items-center justify-between gap-4">
          <div id={`bid-card-desktop-left-${bid.id}`} className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border-2 border-slate-50">
              <AvatarImage id={`bidder-avatar-img-desktop-${bid.id}`} src={bidder.avatar} />
              <AvatarFallback id={`bidder-avatar-fallback-desktop-${bid.id}`}>{bidder.name[0]}</AvatarFallback>
            </Avatar>
            
            <div id={`bidder-info-desktop-${bid.id}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Link href={`/user/${bidder.id}`} id={`bidder-name-desktop-${bid.id}`} className="font-semibold text-[clamp(0.875rem,3cqi,1rem)] text-slate-700 truncate hover:text-blue-600 transition-colors">{bidder.name}</Link>
                  <div id={`bidder-rating-desktop-${bid.id}`} className="flex items-center gap-0.5 text-xs text-amber-500 font-bold">
                    <Star className="h-3 w-3 fill-amber-500" />
                    {bidder.rating}
                  </div>
                </div>
                
                 <div id={`bidder-stats-desktop-${bid.id}`} className="flex items-center gap-3 text-[11px] text-muted-foreground">
                   <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-red-400" />
                    <span className="truncate max-w-[150px]">{location}</span>
                  </div>
                  {!isOutside && (
                    <DistanceBadge distance={distance} duration={duration} variant="inline" className="bg-transparent p-0 text-muted-foreground" iconClassName="h-3 w-3" />
                  )}
                </div>
            </div>
          </div>

          <div id={`bid-card-desktop-right-${bid.id}`} className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Bid Amount</span>
                <p id={`bid-amount-desktop-${bid.id}`} className="price-font font-black text-xl text-blue-600 leading-none">Rs. {formatPrice(bid.amount)}</p>

                {isExpired && bid.status !== 'accepted' && (
                  <div className="text-[10px] font-bold mt-1.5 text-right text-red-500 uppercase tracking-widest">
                    Expired
                  </div>
                )}
              </div>

              <div id={`bid-card-desktop-actions-${bid.id}`} className="flex items-center gap-2 border-l border-slate-200 pl-6 py-1">
                {bid.status === 'accepted' ? (
                  <>
                    <Button 
                      id={`bid-whatsapp-btn-desktop-${bid.id}`}
                      variant="outline" 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!bidder.phone && !bidder.whatsapp) return;
                        window.open(getWhatsAppUrl(bidder.whatsapp || bidder.phone || "", waMessage), '_blank');
                      }}
                      disabled={!bidder.phone && !bidder.whatsapp}
                      className={cn(
                        "h-9 px-4 font-bold transition-all",
                        (bidder.phone || bidder.whatsapp)
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                          : "bg-slate-100 text-slate-400 grayscale cursor-not-allowed border border-slate-200 shadow-none"
                      )}
                      size="sm" 
                    >
                      <WhatsAppIcon className="h-4 w-4 mr-1" />
                      WhatsApp
                    </Button>
                    <Button id={`bid-chat-btn-desktop-${bid.id}`} onClick={handleChat} size="sm" className="h-9 px-4 bg-green-600 hover:bg-green-700 font-bold text-white">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Chat
                    </Button>
                  </>
                ) : (
                  <>
                    <Button id={`bid-reject-btn-desktop-${bid.id}`} onClick={handleReject} variant="ghost" size="sm" className="h-9 w-9 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                      <X className="h-5 w-5" />
                    </Button>
                    <Button id={`bid-accept-btn-desktop-${bid.id}`} onClick={handleAccept} size="sm" className="h-9 px-4 bg-blue-600 hover:bg-blue-700 font-bold text-white rounded-lg shadow-sm">
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                  </>
                )}
              </div>
          </div>
      </div>
    </div>
  );
}
