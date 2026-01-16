"use client";

import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Notification } from "@/hooks/useOutbidAlerts";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface NotificationDropdownProps {
  notifications: Notification[];
  onMarkAllAsRead: () => void;
  unreadCount: number;
}

export function NotificationDropdown({
  notifications,
  onMarkAllAsRead,
  unreadCount,
}: NotificationDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-slate-600 hover:text-blue-600 hover:bg-slate-100/50"
        >
          <Bell className={cn("h-5 w-5", unreadCount > 0 && "fill-current")} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 rounded-xl overflow-hidden shadow-xl border-slate-100">
        <div className="flex items-center justify-between p-3 bg-white border-b border-slate-50">
          <DropdownMenuLabel className="p-0 text-sm font-bold text-slate-900">
            Notifications
          </DropdownMenuLabel>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllAsRead}
              className="h-auto px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 font-medium flex items-center gap-1"
            >
              <Check className="h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>
        
        <ScrollArea className="max-h-[300px]">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm p-4">
              <Bell className="h-8 w-8 mx-auto mb-2 text-slate-200" />
              <p>No new notifications</p>
            </div>
          ) : (
            <div className="flex flex-col py-1">
              {notifications.map((notif) => (
                <DropdownMenuItem
                  key={notif.id}
                  asChild
                  className="rounded-none cursor-pointer focus:bg-slate-50 p-3"
                >
                  <Link href={notif.link} className="flex flex-col gap-1 items-start">
                    <div className="flex w-full justify-between items-start gap-2">
                       <p className={cn(
                           "text-sm leading-snug",
                           !notif.isRead ? "font-semibold text-slate-900" : "text-slate-600"
                       )}>
                         {notif.message}
                       </p>
                       {!notif.isRead && (
                           <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500 mt-1" />
                       )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {formatDistanceToNow(notif.timestamp, { addSuffix: true })}
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
            <>
                <DropdownMenuSeparator className="m-0 bg-slate-100" />
                <div className="p-2 bg-slate-50 text-center">
                    <Link href="/dashboard?tab=my-bids" className="text-xs text-blue-600 hover:underline font-medium">
                        View all activity
                    </Link>
                </div>
            </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
