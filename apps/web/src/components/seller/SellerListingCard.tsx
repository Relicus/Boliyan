"use client";

import { Item } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardShell, CardBody } from "@/components/common/CardShell";
import { CategoryBadge } from "@/components/common/CategoryBadge";
import { ConditionBadge } from "@/components/common/ConditionBadge";
import { Clock, Eye, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useTime } from "@/context/TimeContext";
import { useApp } from "@/lib/store";
import { formatCountdown, formatPrice } from "@/lib/utils";
import { TimerBadge } from "@/components/common/TimerBadge";

interface SellerListingCardProps {
  item: Item;
  onView: () => void;
  onDelete: () => void;
}

export default function SellerListingCard({ item, onView, onDelete }: SellerListingCardProps) {
  const { now } = useTime();
  const { conversations } = useApp();
  const maxSlots = 3;
  const displayChatCount = Math.min(
    conversations.filter(c => c.itemId === item.id).length,
    maxSlots
  );

  const goLiveAt = item.goLiveAt ? new Date(item.goLiveAt).getTime() : null;
  const isPendingGoLive = goLiveAt !== null && now < goLiveAt;
  const goLiveCountdown = isPendingGoLive && goLiveAt ? formatCountdown(goLiveAt, now) : null;

  const lastEditedAt = item.lastEditedAt ? new Date(item.lastEditedAt).getTime() : null;
  const editCooldownUntil = lastEditedAt ? lastEditedAt + 60 * 60 * 1000 : null;
  const isEditCooldown = editCooldownUntil !== null && now < editCooldownUntil;
  const editCooldownCountdown = isEditCooldown && editCooldownUntil ? formatCountdown(editCooldownUntil, now) : null;
  
  return (
    <CardShell 
      id={`listing-card-${item.id}`} 
    >
      <CardBody id={`listing-body-${item.id}`}>
        <div id={`listing-img-container-${item.id}`} className="relative shrink-0">
          <img 
            id={`listing-img-${item.id}`} 
            src={item.images[0]} 
            alt="" 
            className="h-20 w-20 rounded-lg object-cover bg-slate-100" 
            loading="lazy"
          />
          {item.images.length > 1 && (
            <Badge id={`listing-img-count-${item.id}`} className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-blue-600 text-[10px] font-bold border-2 border-white">
              {item.images.length}
            </Badge>
          )}
        </div>
        <div id={`listing-content-${item.id}`} className="flex-1 min-w-0 flex flex-col justify-between">
          {/* Top Section - Column on mobile, row on lg+ */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-1 lg:gap-2">
              {/* Left: Title & Meta */}
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <h3 id={`listing-title-${item.id}`} className="font-bold text-sm text-slate-900 line-clamp-2 lg:line-clamp-1">{item.title}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                      <ConditionBadge condition={item.condition} className="text-[9px] px-1.5 py-0.5" />
                      <CategoryBadge category={item.category} className="text-[9px] px-1.5 py-0.5" />
                  </div>
              </div>

              {/* Right: Timer & Slots - Inline on mobile, column on lg+ */}
              <div className="flex flex-wrap items-center gap-1.5 lg:flex-col lg:items-end">
                  {/* Timer */}
                  {isPendingGoLive ? (
                     <div
                       id={`listing-timer-${item.id}`}
                       className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-md flex items-center gap-1"
                     >
                         <Clock className="w-3 h-3 text-amber-600" />
                         Live in {goLiveCountdown}
                     </div>
                  ) : (
                    <TimerBadge 
                      expiryAt={item.expiryAt} 
                      variant="solid" 
                      className="bg-red-600 text-white" 
                    />
                  )}
                  {isPendingGoLive && (
                    <Badge
                      id={`listing-inactive-badge-${item.id}`}
                      variant="outline"
                      className="text-[9px] font-bold uppercase tracking-tight h-5 px-1.5 border-amber-200 text-amber-700"
                    >
                      Inactive
                    </Badge>
                  )}
                  {/* Slots Badge */}
                   <div className="flex items-center gap-1">
                      <Badge
                          id={`listing-slots-${item.id}`}
                          variant="outline"
                          className="text-[9px] font-bold uppercase tracking-tight h-5 px-1.5 border-slate-200 text-slate-400"
                      >
                          Slots {displayChatCount}/{maxSlots}
                      </Badge>
                   </div>
              </div>
          </div>

          {/* Bottom Section: Price & Actions */}
          <div className="flex flex-wrap items-end justify-between gap-2 mt-2 pt-1 border-t border-slate-100/50">
               {/* Asking Price - Left Aligned */}
               <div id={`listing-price-container-${item.id}`} className="flex flex-col items-start min-w-0 shrink-0">
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1 text-slate-400">
                    Asking
                  </span>
                  <span id={`listing-price-${item.id}`} className="font-outfit font-black text-[clamp(1rem,6cqi,1.5rem)] leading-none text-blue-600">
                    Rs. {formatPrice(item.askPrice)}
                  </span>
              </div>

              {/* Actions - Right Aligned, wraps on small screens */}
              <div id={`listing-actions-${item.id}`} className="flex flex-wrap items-center gap-1.5 md:gap-2">
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
                    {isEditCooldown ? (
                      <Button
                        id={`listing-edit-btn-${item.id}`}
                        variant="outline"
                        size="sm"
                        className="h-7 md:h-8 text-[10px] md:text-[11px] px-2 md:px-3 font-bold text-slate-400 border-slate-200"
                        disabled
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {editCooldownCountdown ? `Edit in ${editCooldownCountdown}` : "Edit"}
                      </Button>
                    ) : (
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
                    )}
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
      </CardBody>
    </CardShell>
  );
}
