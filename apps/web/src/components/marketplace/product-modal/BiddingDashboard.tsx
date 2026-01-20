"use client";

import { Item, User } from "@/types";
import { formatPrice } from "@/lib/utils";
import { BiddingControls } from "@/components/common/BiddingControls";

interface BiddingDashboardProps {
  item: Item;
  user: User | null;
  seller: User;
  bidAmount: string;
  timeLeft: string;
  isUrgent: boolean;
  isHighBidder: boolean;
  hasPriorBid: boolean;
  isSuccess: boolean;
  isSubmitting?: boolean;
  error?: boolean;
  animTrigger: number;
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
  timeLeft,
  isUrgent,
  isHighBidder,
  hasPriorBid,
  isSuccess,
  isSubmitting = false,
  error = false,
  animTrigger,
  onSmartAdjust,
  onBid,
  onKeyDown,
  onInputChange,
  getSmartStep
}: BiddingDashboardProps) {

  const minNextBid = item.isPublicBid && item.currentHighBid 
    ? item.currentHighBid + getSmartStep(item.currentHighBid)
    : item.askPrice * 0.7;

  const isOwner = user?.id === seller.id;

  return (
    <div id={`product-details-dashboard-${item.id}`} className="w-full h-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col justify-between">
      {/* Stats Grid */}
      {/* Stats Grid - Fluid Typography */}
      <div className="@container w-full grid grid-cols-2 gap-4 mb-4">
        {/* Ask Price Card */}
        <div className="flex flex-col items-center text-center min-w-0 bg-white border border-slate-200 shadow-sm rounded-xl p-4 h-full justify-center">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Ask Price</span>
          <span className="text-[clamp(1.5rem,8cqi,3rem)] font-black font-outfit text-slate-900 leading-tight tracking-tight truncate w-full pb-1" title={formatPrice(item.askPrice)}>
            {formatPrice(item.askPrice)}
          </span>
        </div>

        {/* High Bid / Bids Card */}
        <div className="flex flex-col items-center text-center min-w-0 bg-white border border-slate-200 shadow-sm rounded-xl p-4 h-full justify-center">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">
             {item.isPublicBid ? "High Bid" : "Bids"}
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
          minBid={minNextBid}
          animTrigger={animTrigger}
          viewMode="modal"
          onSmartAdjust={onSmartAdjust}
          onBid={onBid}
          onKeyDown={onKeyDown}
          onInputChange={onInputChange}
        />
      </div>
    </div>
  );
}
