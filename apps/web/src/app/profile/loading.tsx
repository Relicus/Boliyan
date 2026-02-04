import Skeleton from "@/components/ui/Skeleton";

export default function ProfileLoading() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-3xl">
      {/* Profile header skeleton */}
      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      {/* Settings sections skeleton */}
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border rounded-xl p-4 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-12 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
