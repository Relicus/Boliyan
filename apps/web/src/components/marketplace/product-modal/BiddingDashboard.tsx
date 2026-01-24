"use client";

import { Item, User } from "@/types";
import { formatPrice } from "@/lib/utils";
import { BiddingControls } from "@/components/common/BiddingControls";
import { Bookmark, ExternalLink } from "lucide-react";
import Link from "next/link";
import { MAX_BID_ATTEMPTS } from "@/lib/bidding";
import { motion } from "framer-motion";
import { memo } from "react";
import RollingPrice from "@/components/common/RollingPrice";

interface BiddingDashboardProps {
  item: Item;
  user: User | null;
  seller: User;
  bidAmount: string;
  userCurrentBid?: number; // Added to show confirmed bid amount
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
  derivedStatus?: { type: 'error', message: string } | null;
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
  derivedStatus = null
}: BiddingDashboardProps) {

  const isOwner = user?.id === seller.id;

  return (
    <div id={`product-details-dashboard-${item.id}`} className="w-full h-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col justify-between overflow-visible">
      {/* Stats Grid - Restore to 2-column layout */}
      <div className="@container w-full grid grid-cols-2 gap-4 mb-2">
        {/* Ask Price Card */}
        <div className="flex flex-col items-center text-center min-w-0 bg-white border border-slate-200 shadow-sm rounded-xl p-3 h-full justify-center">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Ask Price</span>
          <motion.span 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-[clamp(1.5rem,8cqi,3rem)] font-black font-outfit text-slate-900 leading-tight tracking-tight truncate w-full pb-1" title={formatPrice(item.askPrice)}>
            <RollingPrice price={item.askPrice} />
          </motion.span>
        </div>

        {/* Highest Bid / Bids Card */}
        <div className="flex flex-col items-center text-center min-w-0 bg-white border border-slate-200 shadow-sm rounded-xl p-3 h-full justify-center">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">
             {item.isPublicBid ? "Highest" : "Bids"}
          </span>
          <motion.span 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-[clamp(1.5rem,8cqi,3rem)] font-black font-outfit leading-tight tracking-tight truncate w-full pb-1 ${item.isPublicBid && item.currentHighBid ? 'text-blue-600' : 'text-slate-900'}`}>
            {item.isPublicBid && item.currentHighBid
              ? <RollingPrice price={item.currentHighBid} />
              : <RollingPrice price={item.bidCount} />
            }
          </motion.span>
        </div>
      </div>

      {/* Controls Container */}
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
          showAttemptsDots={false} // Rendered in status row above input
          showStatus={true}
        />
      </div>

      {/* Mobile-only Action Row: Full Page & Watch */}
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
