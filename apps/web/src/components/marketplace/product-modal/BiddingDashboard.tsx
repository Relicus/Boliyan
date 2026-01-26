"use client";

import { Item, User } from "@/types";
import { BiddingControls } from "@/components/common/BiddingControls";
import { Bookmark, ExternalLink } from "lucide-react";
import Link from "next/link";
import { MAX_BID_ATTEMPTS } from "@/lib/bidding";
import { memo, useMemo } from "react";
import { PriceDisplay } from "@/components/common/PriceDisplay";
import { createBiddingConfig } from "@/types/bidding";

interface BiddingDashboardProps {
  item: Item;
  user: User | null;
  seller: User;
  bidAmount: string;
  userCurrentBid?: number; 
  hasPriorBid: boolean;
  isSuccess: boolean;
  isSubmitting: boolean;
  cooldownRemaining: number;
  error?: boolean;
  errorMessage?: string | null;
  remainingAttempts?: number;
  pendingConfirmation?: { type: 'double_bid' | 'high_bid' | 'out_of_bids' | 'confirm_bid', message: string } | null;
  isWatched?: boolean;
  onToggleWatch?: (id: string) => void;
  onSmartAdjust: (e: React.MouseEvent, direction: -1 | 1) => void;
  onBid: (e: React.MouseEvent) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onInputBlur?: () => void;
  derivedStatus?: { type: 'error', message: string } | null;
  minBid: number;
  maxBid: number;
}

export const BiddingDashboard = memo(function BiddingDashboard({
  item,
  user,
  seller,
  bidAmount,
  userCurrentBid,
  hasPriorBid,
  isSuccess,
  isSubmitting,
  cooldownRemaining,
  error = false,
  errorMessage = null,
  remainingAttempts = MAX_BID_ATTEMPTS,
  pendingConfirmation = null,
  isWatched,
  onToggleWatch,
  onSmartAdjust,
  onBid,
  onKeyDown,
  onInputChange,
  onInputBlur,
  derivedStatus = null
}: BiddingDashboardProps) {

  // Use the standard factory to ensure all required fields are present
  const biddingConfig = useMemo(() => 
    createBiddingConfig(item, user, []), // Pass empty array if we don't have all bids here, or use approximate
    [item, user]);

  // Override specific fields if we have more accurate local data
  const finalConfig = useMemo(() => ({
      ...biddingConfig,
      hasUserBid: hasPriorBid,
      isUserHighBidder: item.currentHighBidderId === user?.id,
  }), [biddingConfig, hasPriorBid, item.currentHighBidderId, user?.id]);

  const isOwner = user?.id === seller.id;

  return (
    <div id={`product-details-dashboard-${item.id}`} className="w-full h-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col justify-between overflow-visible">
      
      <div className="mb-2">
         <PriceDisplay 
            config={finalConfig}
            askPrice={item.askPrice}
            bidCount={item.bidCount}
            viewMode="modal"
            orientation="stacked"
            showTotalBids={true}
            userCurrentBid={userCurrentBid}
         />
      </div>

      <div className="mt-1">
        <BiddingControls
          bidAmount={bidAmount}
          isSuccess={isSuccess}
          isOwner={isOwner}
          hasPriorBid={hasPriorBid}
          isSubmitting={isSubmitting}
          cooldownRemaining={cooldownRemaining}
          error={error}
          errorMessage={errorMessage}
          remainingAttempts={remainingAttempts}
          userCurrentBid={userCurrentBid}
          pendingConfirmation={pendingConfirmation}
          derivedStatus={derivedStatus}
          viewMode="modal"
          idPrefix={`modal-item-card-${item.id}`}
          onSmartAdjust={onSmartAdjust}
          onBid={onBid}
          onKeyDown={onKeyDown}
          onInputChange={onInputChange}
          onInputBlur={onInputBlur}
          showAttemptsDots={false}
          showStatus={true}
          isSecretBid={!item.isPublicBid}
        />
      </div>

      <div className="md:hidden grid grid-cols-2 gap-3 mt-4">
        <Link
          id={`view-details-btn-mobile-${item.id}`}
          href={`/product/${item.slug ?? item.id}`}
          className="h-11 flex items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-sm gap-2 active:bg-black active:scale-y-95 transition-all shadow-sm"
        >
          <ExternalLink className="h-4 w-4" />
          <span>Full Page</span>
        </Link>
        
        {onToggleWatch && (
          <button
            id={`toggle-watch-btn-mobile-${item.id}`}
            onClick={() => onToggleWatch(item.id)}
            className={`h-11 flex items-center justify-center rounded-xl font-bold text-sm gap-2 active:scale-y-95 transition-all border shadow-sm
              ${isWatched 
                ? 'bg-blue-50 text-blue-600 border-blue-200 active:bg-blue-100' 
                : 'bg-white text-slate-700 border-slate-200 active:bg-slate-50'
              }`}
          >
            <Bookmark className={`h-4 w-4 ${isWatched ? 'fill-current' : ''}`} />
            <span>{isWatched ? 'Watched' : 'Watch'}</span>
          </button>
        )}
      </div>
    </div>
  );
});
