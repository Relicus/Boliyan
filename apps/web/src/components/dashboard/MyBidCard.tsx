"use client";

import { useState, useMemo } from "react";
import { Trophy, AlertTriangle, MessageSquare, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { Bid, Item, User } from "@/types";

import { Button } from "@/components/ui/button";
import ProductDetailsModal from "@/components/marketplace/ProductDetailsModal";
import { CardShell, CardBody } from "@/components/common/CardShell";
import { CategoryBadge } from "@/components/common/CategoryBadge";
import { ConditionBadge } from "@/components/common/ConditionBadge";
import { PriceDisplay } from "@/components/common/PriceDisplay";
import { TimerBadge } from "@/components/common/TimerBadge";
import { createBiddingConfig } from "@/types/bidding";
import { WhatsAppIcon } from "@/components/common/WhatsAppIcon";

import { useApp } from "@/lib/store";
import { buildWhatsAppMessage, getFuzzyLocationString, getListingShortCode, getMapUrl, getWhatsAppUrl, cn } from "@/lib/utils";

interface MyBidCardProps {
  item: Item;
  userBid: Bid;
  seller: User;
}

export default function MyBidCard({ item, userBid, seller }: MyBidCardProps) {
  const { user, bids, conversations } = useApp();
  
  const isLeading = user && item.isPublicBid && item.currentHighBidderId === user.id;
  const isOutbid = user && item.isPublicBid && item.currentHighBidderId !== user.id && (item.currentHighBid || 0) > userBid.amount;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  // Unified Bidding Config
  const biddingConfig = useMemo(() => 
    createBiddingConfig(item, user, bids),
    [item, user, bids]
  );

  const acceptedConversation = useMemo(() => {
    if (!user) return undefined;
    return conversations.find(conversation =>
      conversation.itemId === item.id && conversation.bidderId === user.id
    );
  }, [conversations, item.id, user]);
  const isAccepted = userBid.status === 'accepted';
  const canChat = isAccepted && !!acceptedConversation;
  const listingPhone = item.contactWhatsapp || seller.whatsapp || item.contactPhone || seller.phone;
  const canCall = canChat && (!!item.contactPhone || !!seller.phone);
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://boliyan.pk';
  const productSlug = item.slug || item.id;
  const shortCode = getListingShortCode(item.slug);
  const productUrl = shortCode ? `${siteUrl}/p/${shortCode}` : (productSlug ? `${siteUrl}/product/${productSlug}` : siteUrl);
  const rawCity = item.location?.city || (item.location?.address ? getFuzzyLocationString(item.location.address) : '');
  const city = rawCity && rawCity !== 'Unknown Location' ? rawCity : undefined;
  const mapUrl = getMapUrl(item.location);
  const chatShortLink = acceptedConversation?.shortCode ? `${siteUrl}/i/${acceptedConversation.shortCode}` : (acceptedConversation?.id ? `${siteUrl}/i/${acceptedConversation.id}` : undefined);
  const waMessage = buildWhatsAppMessage({
    role: 'buyer',
    productName: item.title,
    askPrice: item.askPrice,
    bidPrice: userBid.amount,
    city,
    productUrl,
    mapUrl,
    chatUrl: chatShortLink
  });

  const handleChat = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!acceptedConversation) return;
    router.push(`/inbox?id=${acceptedConversation.id}`);
  };

  const handleCall = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!listingPhone) return;
    window.location.href = `tel:${listingPhone}`;
  };

  return (
    <>
{/* Status Badge Logic */}
        {(() => {
          let badge = null;
          if (isAccepted) {
            badge = (
              <div id={`status-${item.id}`} className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                OFFER ACCEPTED
              </div>
            );
          } else if (isLeading) {
            badge = (
              <div id={`status-${item.id}`} className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                HIGHEST BIDDER
              </div>
            );
          } else if (isOutbid) {
            badge = (
              <div id={`status-${item.id}`} className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                OUTBID
              </div>
            );
          }
          
          return (
            <CardShell 
              id={`my-bid-card-${item.id}`}
              onClick={() => setIsModalOpen(true)}
            >
              <CardBody id={`my-bid-body-${item.id}`}>
                {/* Image */}
                <div id={`my-bid-img-container-${item.id}`} className="h-20 w-20 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                  {item.images[0] && (
                    <img id={`my-bid-img-${item.id}`} src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                  )}
                </div>

                {/* Content */}
                <div id={`my-bid-content-${item.id}`} className="flex-1 min-w-0 flex flex-col justify-between">
                  {/* Top Section with Split Columns */}
                  <div className="flex justify-between items-start gap-2">
                     {/* Left: Title & Badges */}
                     <div className="flex flex-col gap-1">
                        <h3 id={`my-bid-title-${item.id}`} className="font-bold text-sm text-slate-900 line-clamp-1 pr-1">{item.title}</h3>
                        <div className="flex items-center gap-2">
                            <CategoryBadge category={item.category} className="text-[9px] px-1.5 py-0.5" />
                            <ConditionBadge condition={item.condition} className="text-[9px] px-1.5 py-0.5" />
                        </div>
                     </div>

                     {/* Right: Timer & Status (New Column) */}
                     <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {/* Timer */}
                        <TimerBadge 
                          expiryAt={item.expiryAt} 
                          variant="solid" 
                          className="bg-red-600 text-white" 
                        />
                        {/* Badge */}
                        <div id={`my-bid-status-${item.id}`}>{badge}</div>
                     </div>
                  </div>

                  {/* Bottom: Price Display (Pushed Right) */}
                  <PriceDisplay 
                      config={biddingConfig}
                        askPrice={item.askPrice}
                        bidCount={item.bidCount}
                        bidAttemptsCount={item.bidAttemptsCount}
                        viewMode="compact"
                      className="mt-2 pt-1"
                      userCurrentBid={userBid.amount}
                      itemId={item.id}
                  />
                </div>
              </CardBody>

              {/* Action Footer (Only for Accepted Deals) */}
              {isAccepted && (
                  <div id={`my-bid-footer-${item.id}`} className="px-3 py-2 bg-green-50 border-t border-green-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-green-700">Offer Accepted! Coordinate:</span>
                      <div className="flex gap-2">
                          {canChat && (
                              <Button id={`my-bid-chat-btn-${item.id}`} size="sm" variant="default" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={handleChat}>
                                  <MessageSquare className="w-3 h-3 mr-1" />
                                  Chat
                              </Button>
                          )}
                          <Button 
                            id={`my-bid-whatsapp-btn-${item.id}`}
                            size="sm" 
                            variant="outline" 
                            disabled={!listingPhone}
                            className={cn(
                                "h-7 text-xs transition-all",
                                listingPhone 
                                    ? "border-emerald-200 text-emerald-700 hover:bg-emerald-100" 
                                    : "opacity-40 grayscale cursor-not-allowed bg-slate-50 border-slate-200"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!listingPhone) return;
                              window.open(getWhatsAppUrl(listingPhone, waMessage), '_blank');
                            }}
                          >
                              <WhatsAppIcon className="w-3 h-3 mr-1" />
                              WhatsApp
                          </Button>
                          <Button 
                            id={`my-bid-call-btn-${item.id}`}
                            size="sm" 
                            variant="outline" 
                            disabled={!canCall}
                            className={cn(
                                "h-7 text-xs transition-all",
                                canCall 
                                    ? "border-green-200 text-green-700 hover:bg-green-100" 
                                    : "opacity-40 grayscale cursor-not-allowed bg-slate-50 border-slate-200"
                            )}
                            onClick={handleCall}
                          >
                              <Phone className="w-3 h-3 mr-1" />
                              Call
                          </Button>
                      </div>
                  </div>
              )}
            </CardShell>
          );
        })()}

      <ProductDetailsModal 
        item={item} 
        seller={seller} 
        isOpen={isModalOpen} 
        onClose={setIsModalOpen} 
      />
    </>
  );
}
