import Skeleton from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-7xl">
      {/* Tab switcher skeleton */}
      <div className="grid grid-cols-2 gap-2 mb-6 bg-slate-100 p-1 rounded-xl">
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
