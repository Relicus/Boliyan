"use client";

import { useState, useMemo } from "react";
import { X, MessageSquare, Phone, Star, ChevronDown, ChevronUp, Clock, Tag, Activity, Trophy, Inbox, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Bid, Item } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";

import { useApp } from "@/lib/store";
import { useTime } from "@/context/TimeContext";
import { calculatePrivacySafeDistance, formatCountdown } from "@/lib/utils";

interface ListingOffersCardProps {
  item: Item;
  offers: Bid[];
}

export default function ListingOffersCard({ item, offers }: ListingOffersCardProps) {
  const { user, conversations, acceptBid, rejectBid, startConversation } = useApp();
  const { now } = useTime();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [processingBidId, setProcessingBidId] = useState<string | null>(null);
  const router = useRouter();

  const goLiveAt = item.goLiveAt ? new Date(item.goLiveAt).getTime() : null;
  const isPendingGoLive = goLiveAt !== null && now < goLiveAt;
  const goLiveCountdown = isPendingGoLive && goLiveAt ? formatCountdown(goLiveAt, now) : null;

  // Sort offers: highest amount first, then by closest distance
  const sortedOffers = useMemo(() => {
    return [...offers].sort((a, b) => {
      // Primary: Higher bid first
      if (b.amount !== a.amount) return b.amount - a.amount;
      
      // Secondary: Closer distance first
      const distA = calculatePrivacySafeDistance(user?.location, a.bidder?.location).distance;
      const distB = calculatePrivacySafeDistance(user?.location, b.bidder?.location).distance;
      return distA - distB;
    });
  }, [offers, user?.location]);

  const acceptedOffers = sortedOffers.filter(b => b.status === 'accepted');
  const totalOffers = sortedOffers.length;
  const bestPrice = sortedOffers[0]?.amount || 0;

  const getTimeLeft = (expiryAt: string) => {
    if (now === 0) return "...";
    const diff = new Date(expiryAt).getTime() - now;
    const hours = Math.max(0, Math.floor(diff / 3600000));
    const mins = Math.max(0, Math.floor((diff % 3600000) / 60000));
    if (hours >= 24) return `${Math.floor(hours / 24)}d`;
    return `${hours}h ${mins}m`;
  };

  const handleAccept = async (bidId: string) => {
    if (isPendingGoLive) return;
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
    if (isPendingGoLive) return;
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
    if (isPendingGoLive) return;
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

  const renderOfferRow = (bid: Bid) => {
    const bidder = bid.bidder;
    if (!bidder) return null;

    const isAccepted = bid.status === 'accepted';
    const isPending = bid.status === 'pending';
    const conv = getConversation(bid.bidderId);
    const canChat = isAccepted && !!conv;
    const canCall = canChat && !!bidder.phone;
    const isProcessing = processingBidId === bid.id;
    const actionsDisabled = isPendingGoLive || isProcessing;
    const locationInfo = calculatePrivacySafeDistance(user?.location, bidder.location);

    return (
      <div 
        key={bid.id} 
        id={`offer-row-${bid.id}`}
        className="bg-slate-50 rounded-lg p-3 mb-3 flex flex-col md:flex-row md:items-center gap-3"
      >
        {/* Top Section: Avatar + Info */}
        <div className="flex items-center gap-3 w-full md:w-auto md:flex-1 min-w-0">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0 ring-1 ring-white shadow-sm">
            {bidder.avatar ? (
              <img src={bidder.avatar} alt={bidder.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                {bidder.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Info - Name + Rating stacked, Price on right */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="font-bold text-sm text-slate-900 truncate block">{bidder.name}</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs text-slate-600">{bidder.rating.toFixed(1)}</span>
                  {locationInfo.distance > 0 && !locationInfo.isOutside && (
                    <span className="text-xs text-slate-500">• {locationInfo.distance} km</span>
                  )}
                </div>
              </div>
            <span 
              className={`font-black shrink-0 ${bid.amount >= item.askPrice ? 'text-green-600' : 'text-slate-900'}`}
              style={{ fontSize: 'clamp(1.125rem, 4vw, 1.5rem)' }}
            >
              PKR {bid.amount.toLocaleString()}
            </span>
          </div>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full grid grid-cols-2 gap-2 mt-2 md:mt-0 md:w-auto md:flex md:items-center md:gap-2 shrink-0">
          {isPending && (
            <>
               <Button
                id={`reject-btn-${bid.id}`}
                variant="ghost"
                size="icon"
                className="h-9 w-full md:w-8 md:h-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg md:rounded-full border border-red-100 md:border-transparent bg-white md:bg-transparent"
                 onClick={() => handleReject(bid.id)}
                 disabled={actionsDisabled}
                 title="Decline"
              >
                <X className="w-4 h-4" />
                <span className="md:hidden ml-2 text-sm font-medium">Decline</span>
              </Button>
              <Button 
                id={`accept-btn-${bid.id}`}
                size="sm"
                className="h-9 w-full md:w-auto px-3 text-xs font-bold bg-green-600 hover:bg-green-700 rounded-lg shadow-sm"
                 onClick={() => handleAccept(bid.id)}
                 disabled={actionsDisabled}
              >
                Accept
              </Button>
            </>
          )}
          {isAccepted && (
            <>
              <Button 
                id={`call-btn-${bid.id}`}
                variant="outline"
                size="icon"
                className="h-9 w-full md:w-8 md:h-8 text-blue-600 border-blue-200 hover:bg-blue-50 rounded-lg"
                 onClick={() => handleCall(bidder.phone!)}
                 disabled={!canCall || actionsDisabled}
                 title="Call"
              >
                <Phone className="w-4 h-4" />
                <span className="md:hidden ml-2 text-sm font-medium">Call</span>
              </Button>
              <Button 
                id={`chat-btn-${bid.id}`}
                size="sm"
                className="h-9 w-full md:w-auto px-3 text-xs font-bold bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                 onClick={() => handleChat(bid.bidderId)}
                 disabled={actionsDisabled}
              >
                <MessageSquare className="w-3 h-3 mr-1.5" />
                Chat
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
      id={`listing-offers-card-${item.id}`}
      className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"
    >
      {/* Header - clickable to toggle */}
      <div 
        className="flex cursor-pointer hover:bg-slate-50/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Left Column */}
        <div className="flex-1 p-2 flex flex-col justify-evenly min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-md bg-slate-100 overflow-hidden shrink-0">
              {item.images[0] && (
                <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <h3 className="font-bold text-sm text-slate-900 truncate">{item.title}</h3>
              <p className="text-xs text-slate-500 truncate">{item.description}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-1">
            {/* Ask Price */}
            <div id={`ask-price-${item.id}`} className="flex flex-col items-start">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1 mb-0.5">
                <Tag className="w-3 h-3" />
                Asking
              </span>
              <span className="font-outfit font-bold text-slate-900 text-lg leading-none">
                PKR {item.askPrice.toLocaleString()}
              </span>
            </div>
            
            {/* Status Badge */}
            <div
              id={`status-badge-${item.id}`}
              className={isPendingGoLive ? "inline-flex items-center gap-1 text-[10px] uppercase font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full w-fit" : "inline-flex items-center gap-1 text-[10px] uppercase font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full w-fit"}
            >
               <Activity className={isPendingGoLive ? "w-3 h-3 text-amber-600" : "w-3 h-3"} />
               {isPendingGoLive ? `Inactive · Live in ${goLiveCountdown || "1h"}` : "Active Listing"}
             </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="p-2 flex flex-col items-end justify-evenly shrink-0 min-w-[120px]">
           <div className="text-xs font-bold text-white bg-red-600 px-2 py-1 rounded-md flex items-center gap-1 w-fit">
             <Clock className="w-3 h-3 text-white" />
             {getTimeLeft(item.expiryAt)}
           </div>
           <div id={`offers-stat-${item.id}`} className="flex items-center gap-3 text-xs text-slate-500 mt-1 mb-0.5">
             <span className="flex items-center gap-1">
                <Inbox className="w-3 h-3 text-slate-400" />
                {totalOffers} Offers
             </span>
             {acceptedOffers.length > 0 && (
                <span className="flex items-center gap-1 text-green-600 font-medium">
                    <CheckCircle className="w-3 h-3" />
                    {acceptedOffers.length} Accepted
                </span>
             )}
           </div>

           <div id={`top-offer-${item.id}`} className="flex flex-col items-end">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-500" />
                Top Offer
              </span>
              <div id={`best-price-value-${item.id}`} className={`font-black leading-none ${bestPrice >= item.askPrice ? 'text-green-600' : 'text-slate-900'}`} style={{ fontSize: 'clamp(1.5rem, 5vw, 2.25rem)' }}>
                {bestPrice > 0 ? `PKR ${bestPrice.toLocaleString()}` : '—'}
              </div>
           </div>
           {/* Inline Toggle */}
           <button
             type="button"
             onClick={(e) => {
               e.stopPropagation();
               setIsExpanded(!isExpanded);
             }}
             className="mt-1 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline transition-colors"
           >
             {isExpanded ? (
               <>Hide offers <ChevronUp className="w-3 h-3" /></>
             ) : (
               <>Show {totalOffers} offers <ChevronDown className="w-3 h-3" /></>
             )}
           </button>
        </div>
      </div>

      {/* Offers List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden bg-white"
          >
            <div className="p-4 pt-6">
              {sortedOffers.length > 0 ? (
                sortedOffers.map(bid => renderOfferRow(bid))
              ) : (
                <div className="text-center py-6 text-slate-400 text-sm">
                  No offers yet
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
