'use client';

import { Notification } from '@/types/notification';
import { Gavel, MessageSquare, Check, Bell, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
  onDismiss?: () => void;
}

export function NotificationItem({ notification, onClick, onDismiss }: NotificationItemProps) {
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

  return (
    <div className="relative group overflow-hidden bg-white">
      <Link
        href={notification.link || '#'}
        onClick={onClick}
        className={cn(
          'flex items-start gap-3 p-4 transition-colors border-b border-slate-100 last:border-0 relative hover:bg-slate-50/50 active:bg-slate-100/50'
        )}
      >
        <div className="mt-0.5 shrink-0 p-2.5 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm group-hover:border-blue-200 transition-colors">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2 mb-0.5">
            <p className="text-sm font-bold text-slate-900 leading-tight">
              {notification.title}
            </p>
            <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap shrink-0 mt-0.5">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
          </div>
          {notification.body && (
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">
              {notification.body}
            </p>
          )}
        </div>
      </Link>

      {/* Desktop Only Dismiss Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDismiss?.();
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white border border-slate-200 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hidden md:flex hover:bg-slate-50 hover:text-red-500 hover:border-red-100 active:scale-90"
        title="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
