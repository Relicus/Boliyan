'use client';

import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/context/NotificationContext';
import { NotificationItem } from './NotificationItem';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = async (id: string) => {
    // Optimistic update handled by context
    markAsRead(id);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          id="notification-bell-btn" 
          variant="ghost" 
          size="icon" 
          className="relative rounded-full hover:bg-slate-100"
        >
          <Bell className={cn("h-5 w-5 text-slate-600 transition-colors", isOpen && "text-blue-600")} strokeWidth={isOpen ? 2.5 : 2} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 rounded-2xl shadow-xl border-slate-100 overflow-hidden bg-white/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-50">
          <h4 className="font-semibold text-sm text-slate-900">Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => markAllAsRead()}
              className="h-auto p-0 text-xs text-blue-600 hover:text-blue-700 hover:bg-transparent transition-colors"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          {isLoading ? (
             <div className="p-8 text-center text-slate-500 text-xs">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center p-4">
              <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                <Bell className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-900">All caught up!</p>
              <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                You have no new notifications at the moment.
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
