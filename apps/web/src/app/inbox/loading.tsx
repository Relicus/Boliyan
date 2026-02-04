import Skeleton from "@/components/ui/Skeleton";

export default function InboxLoading() {
  return (
    <div className="flex h-[calc(100dvh-4rem)]">
      {/* Conversation list skeleton */}
      <div className="w-full md:w-80 lg:w-96 border-r flex-shrink-0">
        <div className="p-4 border-b">
          <Skeleton className="h-10 rounded-lg" />
        </div>
        <div className="space-y-1 p-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex gap-3 p-3">
              <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area skeleton (desktop only) */}
      <div className="hidden md:flex flex-1 items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    </div>
  );
}
