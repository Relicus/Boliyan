"use client";

import { useState, useMemo } from "react";
import { Check, X, MessageSquare, Phone, Star, ChevronDown, ChevronUp, Clock, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { Bid, Item } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { useApp } from "@/lib/store";
import { useTime } from "@/context/TimeContext";
import { calculatePrivacySafeDistance, getFuzzyLocationString } from "@/lib/utils";

interface ListingOffersCardProps {
  item: Item;
  offers: Bid[];
}

export default function ListingOffersCard({ item, offers }: ListingOffersCardProps) {
  const { user, conversations, acceptBid, rejectBid, startConversation } = useApp();
  const { now } = useTime();
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [processingBidId, setProcessingBidId] = useState<string | null>(null);
  const router = useRouter();

  // Sort offers: highest amount first, then by closest distance
  const sortedOffers = useMemo(() => {
    return [...offers].sort((a, b) => {
      // Primary: Higher bid first
      if (b.amount !== a.amount) return b.amount - a.amount;
      
      // Secondary: Closer distance first
      const distA = a.bidder?.location 
        ? calculatePrivacySafeDistance(user?.location, a.bidder.location).distance 
        : 9999;
      const distB = b.bidder?.location 
        ? calculatePrivacySafeDistance(user?.location, b.bidder.location).distance 
        : 9999;
      return distA - distB;
    });
  }, [offers, user?.location]);

  const pendingOffers = sortedOffers.filter(b => b.status === 'pending');
  const acceptedOffers = sortedOffers.filter(b => b.status === 'accepted');
  const maxSlots = 3;
  const displayChatCount = Math.min(
    conversations.filter(c => c.itemId === item.id).length,
    maxSlots
  );

  const getTimeLeft = (expiryAt: string) => {
    if (now === 0) return "...";
    const diff = new Date(expiryAt).getTime() - now;
    const hours = Math.max(0, Math.floor(diff / 3600000));
    const mins = Math.max(0, Math.floor((diff % 3600000) / 60000));
    if (hours >= 24) return `${Math.floor(hours / 24)}d`;
    return `${hours}h ${mins}m`;
  };

  const handleAccept = async (bidId: string) => {
    if (processingBidId) return;
    setProcessingBidId(bidId);
    try {
      const convId = await acceptBid(bidId);
      // Navigate to the new conversation if created
      if (convId) {
        router.push(`/inbox?id=${convId}`);
      }
    } finally {
      setProcessingBidId(null);
    }
  };

  const handleReject = async (bidId: string) => {
    if (processingBidId) return;
    setProcessingBidId(bidId);
    try {
      await rejectBid(bidId);
    } finally {
      setProcessingBidId(null);
    }
  };

  const getConversation = (bidderId: string) => {
    if (!user) return undefined;
    return conversations.find(c => c.itemId === item.id && c.bidderId === bidderId);
  };

  const handleChat = async (bidderId: string) => {
    // First check if conversation already exists
    const conv = getConversation(bidderId);
    
    if (!conv && user) {
      // Create conversation for previously-accepted bids that don't have one
      const convId = await startConversation('', item.id, bidderId, item.sellerId);
      if (convId) {
        router.push(`/inbox?id=${convId}`);
        return;
      }
    }
    
    if (conv) {
      router.push(`/inbox?id=${conv.id}`);
    } else {
      router.push('/inbox');
    }
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  return (
    <div 
      id={`listing-offers-card-${item.id}`}
      className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden"
    >
      {/* Listing Header */}
      <div 
        className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Item Thumbnail */}
        <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 shadow-sm">
          {item.images[0] && (
            <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
          )}
        </div>

        {/* Listing Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base text-slate-900 truncate">{item.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="price-font text-sm font-bold text-slate-600">Ask: PKR {item.askPrice.toLocaleString()}</span>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              {getTimeLeft(item.expiryAt)}
            </div>
          </div>
        </div>

        {/* Offer Count + Expand Toggle */}
        <div className="flex items-center gap-2">
          {pendingOffers.length > 0 && (
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200">
              {pendingOffers.length} pending
            </Badge>
          )}
          {acceptedOffers.length > 0 && (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
              {acceptedOffers.length} accepted
            </Badge>
          )}
          <Badge id={`offer-slots-${item.id}`} className="bg-slate-100 text-slate-500 hover:bg-slate-200">
            Slots {displayChatCount}/{maxSlots}
          </Badge>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </div>

      {/* Offers List */}
      <AnimatePresence>
        {isExpanded && sortedOffers.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
              {sortedOffers.map(bid => {
                const bidder = bid.bidder;
                if (!bidder) return null;

                const isAccepted = bid.status === 'accepted';
                const isPending = bid.status === 'pending';
                const conv = getConversation(bid.bidderId);
                const canChat = isAccepted && !!conv;
                const canCall = canChat && !!bidder.phone;
                const isProcessing = processingBidId === bid.id;
                
                // Calculate distance and travel time (always show if bidder has location)
                const locationInfo = bidder.location 
                  ? calculatePrivacySafeDistance(user?.location, bidder.location)
                  : null;

                return (
                  <div 
                    key={bid.id} 
                    id={`offer-row-${bid.id}`}
                    className="p-4 bg-slate-50/50 flex flex-col gap-3"
                  >
                    {/* Top Row: Avatar | Info | Price */}
                    <div className="flex items-start gap-3">
                      {/* Bidder Avatar */}
                      <div className="w-11 h-11 rounded-full bg-slate-200 overflow-hidden shrink-0 ring-2 ring-white shadow-sm">
                        {bidder.avatar ? (
                          <img src={bidder.avatar} alt={bidder.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                            {bidder.name.charAt(0)}
                          </div>
                        )}
                      </div>

                      {/* Bidder Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-900 truncate">{bidder.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <div className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span className="text-xs text-amber-600 font-bold">{bidder.rating.toFixed(1)}</span>
                          </div>
                          {bidder.location && (
                            <span className="flex items-center gap-0.5 text-[10px] text-red-600">
                              <MapPin className="w-2.5 h-2.5" />
                              {getFuzzyLocationString(bidder.location.address)}
                            </span>
                          )}
                          {locationInfo && locationInfo.distance > 0 && locationInfo.distance < 500 && (
                            <span className="text-[10px] text-slate-500">
                              {locationInfo.distance} km • {locationInfo.duration} min
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Price - Right aligned */}
                      <div className="text-right shrink-0">
                        <p className="price-font text-2xl font-black text-green-600">PKR {bid.amount.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Bottom Row: Full-width Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      {isPending && (
                        <>
                          <Button 
                            id={`reject-btn-${bid.id}`}
                            variant="outline" 
                            className="h-11 text-sm font-bold border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl" 
                            onClick={() => handleReject(bid.id)}
                            disabled={isProcessing}
                          >
                            <X className="w-4 h-4 mr-1.5" />
                            Decline
                          </Button>
                          <Button 
                            id={`accept-btn-${bid.id}`}
                            className="h-11 text-sm font-bold bg-green-600 hover:bg-green-700 rounded-xl shadow-lg shadow-green-500/30" 
                            onClick={() => handleAccept(bid.id)}
                            disabled={isProcessing}
                          >
                            <Check className="w-4 h-4 mr-1.5" />
                            Accept
                          </Button>
                        </>
                      )}
                      {isAccepted && (
                        <>
                          {canCall && (
                            <Button 
                              variant="outline"
                              className="h-11 text-sm font-bold border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 rounded-xl" 
                              onClick={() => handleCall(bidder.phone!)}
                            >
                              <Phone className="w-4 h-4 mr-1.5" />
                              Call
                            </Button>
                          )}
                          <Button 
                            className={`h-11 text-sm font-bold bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/30 ${!canCall ? 'col-span-2' : ''}`}
                            onClick={() => handleChat(bid.bidderId)}
                          >
                            <MessageSquare className="w-4 h-4 mr-1.5" />
                            Chat
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
