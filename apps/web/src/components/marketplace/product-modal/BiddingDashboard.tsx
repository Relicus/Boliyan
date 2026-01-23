"use client";

import { Item, User } from "@/types";
import { formatPrice } from "@/lib/utils";
import { BiddingControls } from "@/components/common/BiddingControls";
import { Bookmark, ExternalLink } from "lucide-react";
import Link from "next/link";
import { getMinimumAllowedBid, MAX_BID_ATTEMPTS } from "@/lib/bidding";

interface BiddingDashboardProps {
  item: Item;
  user: User | null;
  seller: User;
  bidAmount: string;
  userCurrentBid?: number; // Added to show confirmed bid amount
  isHighBidder: boolean;
  hasPriorBid: boolean;
  isSuccess: boolean;
  isSubmitting?: boolean;
  error?: boolean;
  errorMessage?: string | null;
  remainingAttempts?: number;
  pendingConfirmation?: { type: 'double_bid' | 'high_bid' | 'out_of_bids', message: string } | null;
  animTrigger: number;
  isWatched?: boolean;
  onToggleWatch?: (id: string) => void;
  onSmartAdjust: (e: React.MouseEvent, direction: -1 | 1) => void;
  onBid: (e: React.MouseEvent) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  getSmartStep: (currentBid: number) => number;
}

export function BiddingDashboard({
  item,
  user,
  seller,
  bidAmount,
  userCurrentBid,
  isHighBidder,
  hasPriorBid,
  isSuccess,
  isSubmitting = false,
  error = false,
  errorMessage = null,
  remainingAttempts = MAX_BID_ATTEMPTS,
  pendingConfirmation = null,
  animTrigger,
  isWatched,
  onToggleWatch,
  onSmartAdjust,
  onBid,
  onKeyDown,
  onInputChange,
  getSmartStep
}: BiddingDashboardProps) {

  const minNextBid = getMinimumAllowedBid(item.askPrice);

  const isOwner = user?.id === seller.id;

  return (
    <div id={`product-details-dashboard-${item.id}`} className="w-full h-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col justify-between">
      {/* Stats Grid - Now Flex to support center Dots */}
      <div className="@container w-full flex items-stretch gap-2 mb-4">
        {/* Ask Price Card */}
        <div className="flex-1 flex flex-col items-center text-center min-w-0 bg-white border border-slate-200 shadow-sm rounded-xl p-4 h-full justify-center">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Ask Price</span>
          <span className="text-[clamp(1.5rem,8cqi,3rem)] font-black font-outfit text-slate-900 leading-tight tracking-tight truncate w-full pb-1" title={formatPrice(item.askPrice)}>
            {formatPrice(item.askPrice)}
          </span>
        </div>

        {/* Center: My Status (Beads + Current Offer) */}
        {!isOwner && (
          <div className="flex flex-col items-center justify-center gap-1.5 px-1 w-[90px] shrink-0">
             
             {/* Label */}
             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Status</span>

             {/* Beads */}
             <div className="flex items-center justify-center gap-1.5">
                {Array.from({ length: Math.max(0, remainingAttempts ?? 0) }).map((_, i) => (
                  <div 
                    key={i} 
                    className="h-1.5 w-1.5 rounded-full bg-slate-300 transition-all duration-300 shrink-0"
                  />
                ))}
             </div>

             {/* Current Offer (Only if bid exists) */}
             {hasPriorBid && userCurrentBid && (
               <span className="text-[clamp(0.875rem,3cqi,1rem)] font-black font-outfit text-slate-700 leading-none mt-0.5 animate-in fade-in zoom-in duration-300">
                  {formatPrice(userCurrentBid)}
               </span>
             )}
          </div>
        )}

        {/* Highest Bid / Bids Card */}
        <div className="flex-1 flex flex-col items-center text-center min-w-0 bg-white border border-slate-200 shadow-sm rounded-xl p-4 h-full justify-center">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">
             {item.isPublicBid ? "Highest Bid" : "Bids"}
          </span>
          <span className={`text-[clamp(1.5rem,8cqi,3rem)] font-black font-outfit leading-tight tracking-tight truncate w-full pb-1 ${item.isPublicBid && item.currentHighBid ? 'text-blue-600' : 'text-slate-900'}`}>
            {item.isPublicBid && item.currentHighBid
              ? formatPrice(item.currentHighBid)
              : `${item.bidCount}`
            }
          </span>
        </div>
      </div>

      {/* Controls Container */}
      <div className="mt-4">
        <BiddingControls
          bidAmount={bidAmount}
          isSuccess={isSuccess}
          isOwner={isOwner}
          isHighBidder={isHighBidder}
          hasPriorBid={hasPriorBid}
          isSubmitting={isSubmitting}
          error={error}
          errorMessage={errorMessage}
          remainingAttempts={remainingAttempts}
          minBid={minNextBid}
          pendingConfirmation={pendingConfirmation}
          animTrigger={animTrigger}
          viewMode="modal"
          idPrefix={`modal-item-card-${item.id}`}
          onSmartAdjust={onSmartAdjust}
          onBid={onBid}
          onKeyDown={onKeyDown}
          onInputChange={onInputChange}
          showAttemptsDots={false} // Rendered in stats grid above
        />
      </div>

      {/* Mobile-only Action Row: Full Page & Watch */}
      <div className="md:hidden grid grid-cols-2 gap-3 mt-4">
        <Link
          id={`view-details-btn-mobile-${item.id}`}
          href={`/product/${item.slug ?? item.id}`}
          className="h-11 flex items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-sm gap-2 active:scale-95 transition-all shadow-sm"
        >
          <ExternalLink className="h-4 w-4" />
          <span>Full Page</span>
        </Link>
        
        {onToggleWatch && (
          <button
            id={`toggle-watch-btn-mobile-${item.id}`}
            onClick={() => onToggleWatch(item.id)}
            className={`h-11 flex items-center justify-center rounded-xl font-bold text-sm gap-2 active:scale-95 transition-all border shadow-sm
              ${isWatched 
                ? 'bg-blue-50 text-blue-600 border-blue-200' 
                : 'bg-white text-slate-700 border-slate-200'
              }`}
          >
            <Bookmark className={`h-4 w-4 ${isWatched ? 'fill-current' : ''}`} />
            <span>{isWatched ? 'Watched' : 'Watch'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
