"use client";

import { Item } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/common/CategoryBadge";
import { ConditionBadge } from "@/components/common/ConditionBadge";
import { Clock, Eye, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useTime } from "@/context/TimeContext";

interface SellerListingCardProps {
  item: Item;
  onView: () => void;
  onDelete: () => void;
}

export default function SellerListingCard({ item, onView, onDelete }: SellerListingCardProps) {
  const { now } = useTime();
  
  const getTimeLeft = (expiryAt: string) => {
    if (!now) return { text: "--:--", color: "text-slate-500", isUrgent: false };
    
    const diff = new Date(expiryAt).getTime() - now;
    const hours = Math.max(0, Math.floor(diff / 3600000));
    const mins = Math.max(0, Math.floor((diff % 3600000) / 60000));
    
    let color = "text-slate-500";
    let isUrgent = false;
    if (hours < 2) { color = "text-red-600"; isUrgent = true; }
    else if (hours < 6) { color = "text-orange-600"; }
    else if (hours < 12) { color = "text-amber-600"; }

    return {
      text: hours >= 24 ? `${Math.floor(hours / 24)}d ${hours % 24}h` : `${hours}h ${mins}m`,
      color,
      isUrgent
    };
  };

  const timeInfo = getTimeLeft(item.expiryAt);

  return (
    <div 
      id={`listing-card-${item.id}`} 
      className="@container p-3 bg-white border rounded-xl flex gap-3 transition-all hover:shadow-md"
    >
      <div className="relative shrink-0">
        <img 
          id={`listing-img-${item.id}`} 
          src={item.images[0]} 
          alt="" 
          className="h-16 w-16 md:h-20 md:w-20 rounded-lg object-cover bg-slate-100" 
          loading="lazy"
        />
        {item.images.length > 1 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-blue-600 text-[10px] font-bold border-2 border-white">
            {item.images.length}
          </Badge>
        )}
      </div>
      <div id={`listing-content-${item.id}`} className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <h3 id={`listing-title-${item.id}`} className="font-bold text-slate-900 truncate mb-1 text-[clamp(0.875rem,5cqi,1.125rem)] leading-none">
            {item.title}
          </h3>
          <div id={`listing-title-row-${item.id}`} className="flex flex-col mb-2">
            <div className="flex items-center gap-1.5 mb-1.5">
              <ConditionBadge condition={item.condition} variant="outline" className="h-4 py-0 px-1 text-[8px]" />
              <CategoryBadge category={item.category} variant="outline" className="h-4 py-0 px-1 text-[8px]" />
            </div>
            <span className="text-[clamp(0.5625rem,2.25cqi,0.75rem)] font-black uppercase tracking-[0.08em] text-slate-500/80 mb-0.5">
              Asking Price
            </span>
            <p id={`listing-price-${item.id}`} className="text-[clamp(0.75rem,4cqi,1rem)] text-blue-600 font-black font-outfit leading-none">
              Rs. {item.askPrice.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-tight h-5 px-1.5 border-slate-200 text-slate-400">
              {item.listingDuration}h
            </Badge>
            <div className={`text-[10px] font-bold flex items-center gap-1 ${timeInfo.color}`}>
              <Clock className={`h-2.5 w-2.5 ${timeInfo.isUrgent ? 'animate-pulse' : ''}`} />
              {timeInfo.text}
            </div>
          </div>
        </div>
        <div id={`listing-actions-${item.id}`} className="flex gap-1.5 md:gap-2">
          <Button 
            id={`listing-view-btn-${item.id}`} 
            variant="outline"  
            size="sm" 
            className="h-7 md:h-8 text-[10px] md:text-[11px] px-2 md:px-3 font-bold transition-all hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100"
            onClick={onView}
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button 
            id={`listing-edit-btn-${item.id}`} 
            variant="outline"  
            size="sm" 
            className="h-7 md:h-8 text-[10px] md:text-[11px] px-2 md:px-3 font-bold transition-all hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100"
            asChild
          >
            <Link href={`/list?id=${item.id}`}>
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Link>
          </Button>
          <Button 
            id={`listing-delete-btn-${item.id}`} 
            variant="outline"  
            size="sm" 
            className="h-7 md:h-8 text-[10px] md:text-[11px] px-2 md:px-3 font-bold text-red-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
