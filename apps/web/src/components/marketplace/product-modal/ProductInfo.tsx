"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { Item, User } from "@/types";
import { DialogTitle } from "@/components/ui/dialog";
import { getFuzzyLocationString } from "@/lib/utils";
import { ListingBadges } from "@/components/marketplace/ListingBadges";

interface ProductInfoProps {
  item: Item;
  seller: User;
  isOutside: boolean;
  duration: number;
  distance: number;
}

export function ProductInfo({
  item,
  seller,
  isOutside,
  duration,
  distance
}: ProductInfoProps) {
  return (
    <div id={`product-details-left-${item.id}`} className="flex flex-col gap-3 min-w-0 h-full">
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <DialogTitle className="text-xl sm:text-2xl font-black font-outfit text-slate-900 leading-tight mb-2 line-clamp-2">
            {item.title}
          </DialogTitle>
          <ListingBadges item={item} seller={seller} />
        </div>
      </div>

      {/* Description - Compact */}
      <div className="space-y-1">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</h4>
        <p className="text-[13px] sm:text-sm text-slate-700 leading-relaxed line-clamp-3 md:line-clamp-4">
          {item.description}
        </p>
      </div>

      <div className="mt-2 pt-2">
          {/* Seller Info Compact Card */}
          <div id={`seller-details-${item.id}`} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5">
            <div className="flex items-center gap-3 min-w-0 w-full">
              <div className="h-9 w-9 rounded-full bg-slate-200 overflow-hidden shrink-0">
                <img src={seller.avatar} alt={seller.name} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex flex-col justify-center flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-bold text-slate-900 text-sm truncate">{seller.name}</div>
                  <Badge variant="outline" className="font-bold bg-white text-yellow-700 border-yellow-200 py-0 px-1.5 text-[10px] shrink-0 shadow-sm h-5">
                    ⭐ {seller.rating} <span className="text-yellow-600/70 ml-0.5">({seller.reviewCount})</span>
                  </Badge>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1 leading-none mt-1">
                  <MapPin className="h-3 w-3 text-red-500" />
                  <span className="truncate">{getFuzzyLocationString(seller.location.address)}</span>
                  {!isOutside && (
                     <span className="font-medium text-slate-600 border-l border-slate-300 pl-1 ml-1">
                       {duration} min ({distance} km)
                     </span>
                  )}
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}
