'use client';

import { Notification } from '@/types/notification';
import { Gavel, MessageSquare, Check, Bell } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'outbid':
        return <Gavel className="h-4 w-4 text-red-500" />;
      case 'bid_accepted':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'new_message':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'bid_received':
        return <Gavel className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4 text-slate-500" />;
    }
  };

  const getBackgroundClass = () => {
    if (!notification.isRead) return 'bg-blue-50/50 hover:bg-blue-50';
    return 'hover:bg-slate-50';
  };

  return (
    <Link
      href={notification.link || '#'}
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 p-3 transition-colors border-b border-slate-100 last:border-0 relative group',
        getBackgroundClass()
      )}
    >
      <div className="mt-0.5 shrink-0 p-2 rounded-full bg-white border border-slate-100 shadow-sm group-hover:border-blue-200 transition-colors">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2 mb-0.5">
          <p className={cn("text-xs font-semibold text-slate-900 leading-tight", !notification.isRead && "text-blue-900")}>
            {notification.title}
          </p>
          <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </span>
        </div>
        {notification.body && (
          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
            {notification.body}
          </p>
        )}
      </div>
      {!notification.isRead && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-blue-600 shadow-sm shadow-blue-200" />
      )}
    </Link>
  );
}
