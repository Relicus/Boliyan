"use client";

import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Gavel, Loader2 } from "lucide-react";
import { Item, User } from "@/types";
import { formatPrice } from "@/lib/utils";

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
  lastDelta: number | null;
  showDelta: boolean;
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
  lastDelta,
  showDelta,
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

  const currentBidValue = parseFloat(bidAmount.replace(/,/g, ''));
  const isBelowMin = !isNaN(currentBidValue) && currentBidValue < minNextBid;

  const isOwner = user?.id === seller.id;

  return (
    <div id={`product-details-dashboard-${item.id}`} className="w-full h-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col justify-between">
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col rounded-xl bg-white border border-slate-200 px-2.5 py-2 shadow-sm">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-1">Ask Price</div>
          <div className="text-sm sm:text-base font-black text-slate-900 leading-tight truncate">
            {formatPrice(item.askPrice)}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center text-center rounded-xl bg-white border border-slate-200 px-2.5 py-2 shadow-sm">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-1">
            {item.isPublicBid ? "High Bid" : "Bids"}
          </div>
          <div className={`text-sm sm:text-base font-black leading-tight truncate ${item.isPublicBid && item.currentHighBid ? 'text-blue-600' : 'text-slate-500'}`}>
            {item.isPublicBid && item.currentHighBid
              ? formatPrice(item.currentHighBid)
              : `${item.bidCount} Bids`
            }
          </div>
        </div>
        
        <div className="flex flex-col items-end text-right rounded-xl bg-white border border-slate-200 px-2.5 py-2 shadow-sm">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-1">Ends In</div>
          <div className={`text-sm sm:text-base font-black leading-tight tabular-nums truncate ${isUrgent ? 'text-red-600' : 'text-slate-800'}`}>
            {timeLeft}
          </div>
        </div>
      </div>

      {/* Controls Container */}
      <div className="mt-4 flex flex-col gap-3">
        {/* Smart Stepper */}
        <div className={`flex h-12 sm:h-14 w-full border border-slate-300 rounded-xl shadow-sm overflow-hidden bg-white ${isOwner ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
          <button
            id={`modal-decrement-btn-${item.id}`}
            onClick={(e) => onSmartAdjust(e, -1)}
            disabled={isOwner || isSubmitting}
            className="w-12 sm:w-14 bg-slate-50 hover:bg-slate-100 border-r border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-600 transition-colors active:bg-slate-200 disabled:cursor-not-allowed"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 12H6" /></svg>
          </button>

          <div className="relative flex-1">
            <AnimatePresence>
              {showDelta && lastDelta !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.8 }}
                  animate={{ opacity: 1, y: -25, scale: 1.1 }}
                  exit={{ opacity: 0, y: -30 }}
                  className={`absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 font-black text-sm z-50 pointer-events-none select-none
                    ${lastDelta > 0 ? 'text-amber-600' : 'text-red-600'}`}
                >
                  {lastDelta > 0 ? `+${lastDelta.toLocaleString()}` : lastDelta.toLocaleString()}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.input
              id={`modal-bid-input-${item.id}`}
              type="text"
              value={bidAmount}
              key={`modal-input-${animTrigger}`}
              initial={false}
              disabled={isOwner || isSubmitting}
              animate={{ 
                scale: [1, 1.02],
                x: isBelowMin || error ? [0, -3, 3, -3, 3, 0] : 0
              }}
              transition={{ 
                scale: { duration: 0.1, repeat: 1, repeatType: "reverse" },
                x: { duration: 0.2, type: "spring", stiffness: 400, damping: 25 }
              }}
              onKeyDown={onKeyDown}
              onChange={onInputChange}
              className={`w-full h-full text-center text-lg sm:text-xl font-black text-slate-900 focus:outline-none px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors duration-300
                    ${isBelowMin ? 'bg-red-50 text-red-900' : 'bg-transparent'}
                  `}
            />
          </div>

          <button
            id={`modal-increment-btn-${item.id}`}
            onClick={(e) => onSmartAdjust(e, 1)}
            disabled={isOwner || isSubmitting}
            className="w-12 sm:w-14 bg-slate-50 hover:bg-slate-100 border-l border-slate-200 flex items-center justify-center text-slate-500 hover:text-amber-600 transition-colors active:bg-slate-200 disabled:cursor-not-allowed"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v12m6-6H6" /></svg>
          </button>
        </div>

        {/* Action Button */}
        <button
          id={`modal-place-bid-btn-${item.id}`}
          onClick={(e) => onBid(e)}
          disabled={isSuccess || isOwner || isSubmitting}
          className={`h-12 sm:h-14 w-full rounded-xl font-bold shadow-md transition-all duration-300 active:scale-[0.98] text-base sm:text-lg flex items-center justify-center
            ${isSuccess 
              ? 'bg-amber-600 text-white scale-100 ring-4 ring-amber-100' 
              : isOwner
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none active:scale-100'
                : isHighBidder 
                  ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200 hover:shadow-orange-300'
                  : hasPriorBid
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-200 hover:shadow-green-300'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 hover:shadow-blue-300'
            }`}
        >
          {isSubmitting ? (
             <Loader2 className="w-6 h-6 animate-spin text-white/80" />
          ) : isSuccess ? (
            <span className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
               <motion.svg 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-5 h-5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </motion.svg>
              <span>Bid Placed!</span>
            </span>
          ) : isOwner ? (
            "Your Listing"
          ) : isHighBidder ? (
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-5 h-5" />
              Raise Bid
            </span>
          ) : hasPriorBid ? (
            <span className="flex items-center gap-1.5">
              <Gavel className="w-5 h-5" />
              Bid Again
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Gavel className="w-5 h-5" />
              Place Bid
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
