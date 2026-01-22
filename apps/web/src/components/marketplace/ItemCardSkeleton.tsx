import { Card, CardContent } from "@/components/ui/card";
import Skeleton from "@/components/ui/Skeleton";

interface ItemCardSkeletonProps {
  viewMode?: 'compact' | 'comfortable' | 'spacious';
}

export default function ItemCardSkeleton({ viewMode = 'compact' }: ItemCardSkeletonProps) {
  const getHeightClass = () => {
    switch (viewMode) {
      case 'spacious': return 'h-52';
      case 'comfortable': return 'h-40';
      default: return 'h-28';
    }
  };

  return (
    <Card className="border-none shadow-sm bg-white rounded-lg overflow-hidden flex flex-col h-full">
      {/* Image Skeleton */}
      <Skeleton className={`relative ${getHeightClass()} w-full shrink-0 rounded-none bg-slate-200`} />

      <CardContent className="p-2 flex flex-col gap-2 flex-1">
        {/* Title Skeleton */}
        <Skeleton className="h-4 w-3/4 mb-1 bg-slate-200" />

        {/* Price Row Skeleton */}
        <div className="flex justify-between items-end mt-1">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-2 w-8 bg-slate-200" /> {/* Label */}
            <Skeleton className="h-5 w-16 bg-slate-200" /> {/* Price */}
          </div>
          <div className="flex flex-col gap-1 items-end">
            <Skeleton className="h-2 w-10 bg-slate-200" /> {/* Label */}
            <Skeleton className="h-5 w-12 bg-slate-200" /> {/* Bid/Count */}
          </div>
        </div>

        {/* Spacious Mode Details Skeleton */}
        {viewMode === 'spacious' && (
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full bg-slate-200" />
              <Skeleton className="h-3 w-20 bg-slate-200" />
            </div>
            <Skeleton className="h-3 w-full bg-slate-200" />
            <Skeleton className="h-3 w-2/3 bg-slate-200" />
          </div>
        )}

        {/* Action Row Skeleton */}
        <div className="mt-auto pt-1 flex flex-col gap-2">
             <Skeleton className="h-9 w-full rounded-md bg-slate-200" />
             <Skeleton className="h-9 w-full rounded-md bg-slate-200" />
        </div>

      </CardContent>
    </Card>
  );
}
