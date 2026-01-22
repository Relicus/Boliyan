import { Badge } from "@/components/ui/badge";
import { BadgeCheck, Lock } from "lucide-react";
import { Item, User } from "@/types";
import { getConditionLabel } from "@/lib/utils";

interface ListingBadgesProps {
  item: Item;
  seller: User;
}

export function ListingBadges({ item, seller }: ListingBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {/* Condition Badge */}
      <Badge variant="outline" className="font-bold bg-slate-50 text-slate-700 border-slate-200">
        {getConditionLabel(item.condition)}
      </Badge>

      {/* Verified Badge */}
      {seller.isVerified && (
        <Badge variant="outline" className="font-bold bg-blue-50 text-blue-700 border-blue-100 flex items-center gap-1">
          <BadgeCheck className="h-3.5 w-3.5 fill-current text-blue-700 stroke-white" />
          Verified Listing
        </Badge>
      )}

      {/* Secret Bidding Badge */}
      {!item.isPublicBid && (
        <Badge variant="secondary" className="font-bold bg-amber-500 text-white border-none shadow-sm flex items-center gap-1">
          <Lock className="h-3.5 w-3.5" />
          Secret Bidding
        </Badge>
      )}
    </div>
  );
}
