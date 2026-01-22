import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("skeleton-shimmer rounded-md bg-slate-100", className)}
      aria-hidden="true"
    />
  );
}
