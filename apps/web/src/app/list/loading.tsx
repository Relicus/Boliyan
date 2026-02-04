import Skeleton from "@/components/ui/Skeleton";

export default function ListLoading() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      {/* Header skeleton */}
      <div className="text-center mb-8">
        <Skeleton className="h-10 w-64 mx-auto mb-4" />
        <Skeleton className="h-4 w-96 mx-auto" />
      </div>

      {/* Form skeleton */}
      <div className="space-y-6">
        {/* Image upload skeleton */}
        <Skeleton className="h-48 rounded-xl" />
        
        {/* Title field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-12 rounded-lg" />
        </div>

        {/* Category field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-12 rounded-lg" />
        </div>

        {/* Price field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-12 rounded-lg" />
        </div>

        {/* Submit button */}
        <Skeleton className="h-14 rounded-xl" />
      </div>
    </div>
  );
}
