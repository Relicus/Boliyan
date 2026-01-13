import { Card, CardContent } from "@/components/ui/card";

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
      <div className={`relative ${getHeightClass()} bg-slate-200 animate-pulse w-full shrink-0`} />

      <CardContent className="p-2 flex flex-col gap-2 flex-1 animate-pulse">
        {/* Title Skeleton */}
        <div className="h-4 bg-slate-200 rounded w-3/4 mb-1" />

        {/* Price Row Skeleton */}
        <div className="flex justify-between items-end mt-1">
          <div className="flex flex-col gap-1">
            <div className="h-2 bg-slate-200 rounded w-8" /> {/* Label */}
            <div className="h-5 bg-slate-200 rounded w-16" /> {/* Price */}
          </div>
          <div className="flex flex-col gap-1 items-end">
            <div className="h-2 bg-slate-200 rounded w-10" /> {/* Label */}
            <div className="h-5 bg-slate-200 rounded w-12" /> {/* Bid/Count */}
          </div>
        </div>

        {/* Spacious Mode Details Skeleton */}
        {viewMode === 'spacious' && (
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-slate-200" />
              <div className="h-3 bg-slate-200 rounded w-20" />
            </div>
            <div className="h-3 bg-slate-200 rounded w-full" />
            <div className="h-3 bg-slate-200 rounded w-2/3" />
          </div>
        )}

        {/* Action Row Skeleton */}
        <div className="mt-auto pt-1 flex flex-col gap-2">
             <div className="h-9 w-full bg-slate-200 rounded-md" />
             <div className="h-9 w-full bg-slate-200 rounded-md" />
        </div>

      </CardContent>
    </Card>
  );
}
