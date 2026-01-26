import { TabsTrigger } from "@/components/ui/tabs";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardTabProps {
  value: string;
  id?: string;
  icon: LucideIcon;
  label: string;
  count?: number;
  badgeClassName?: string;
  className?: string;
}

export function DashboardTab({
  value,
  id,
  icon: Icon,
  label,
  count,
  badgeClassName,
  className,
}: DashboardTabProps) {
  const iconBadgeBase = "absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 flex min-w-4 h-4 items-center justify-center rounded-full px-1 text-[9px] font-extrabold backdrop-blur-md bg-white/70 border border-white/70 shadow-[0_4px_10px_rgba(15,23,42,0.12)]";

  return (
    <TabsTrigger
      id={id}
      value={value}
      className={cn(
        "rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm",
        "flex flex-col md:flex-row items-center justify-center h-auto py-2 gap-1 md:gap-2", // Responsive layout
        className
      )}
    >
      <div className="relative">
        <Icon className="w-6 h-6 sm:w-5 sm:h-5" />
        {count !== undefined && count > 0 && (
          <span className={cn(iconBadgeBase, badgeClassName)}>
            {count}
          </span>
        )}
      </div>
      <span className="text-[10px] sm:text-xs md:text-sm truncate">{label}</span>
    </TabsTrigger>
  );
}
