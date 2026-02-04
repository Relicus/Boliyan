import Skeleton from "@/components/ui/Skeleton";

export default function HomeLoading() {
  return (
    <div className="min-h-screen">
      {/* Search bar skeleton */}
      <div className="px-4 py-3">
        <Skeleton className="h-12 rounded-xl max-w-2xl mx-auto" />
      </div>

      {/* Category pills skeleton */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full flex-shrink-0" />
        ))}
      </div>

      {/* Grid skeleton */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
