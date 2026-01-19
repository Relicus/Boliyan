'use client';
 
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
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
import { AnimatePresence, motion } from 'framer-motion';

export function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = async (id: string) => {
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
          className="relative rounded-full hover:bg-slate-100 transition-colors duration-300"
        >
          <Bell className={cn("h-5 w-5 text-slate-600 transition-colors duration-300", isOpen && "text-blue-600 fill-blue-50")} strokeWidth={isOpen ? 2.5 : 2} />
          {unreadCount > 0 && (
            <span className="absolute top-2.5 right-2.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600 ring-2 ring-white"></span>
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0 rounded-2xl shadow-2xl border-white/20 overflow-hidden bg-white/80 backdrop-blur-xl ring-1 ring-black/5">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100/50 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm text-slate-900">Notifications</h4>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 min-w-[1.25rem] bg-blue-100 text-blue-700 hover:bg-blue-200 border-none font-bold text-[10px] flex items-center justify-center rounded-full">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => markAllAsRead()}
              className="h-auto p-0 text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-700 hover:bg-transparent transition-colors"
            >
              Mark all read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          {isLoading ? (
             <div className="p-8 text-center text-slate-500 text-xs">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center p-8">
              <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 ring-1 ring-slate-100">
                <Bell className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-900">All caught up!</p>
              <p className="text-xs text-slate-500 mt-1 max-w-[200px] leading-relaxed">
                You have no new notifications at the moment.
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              <AnimatePresence initial={false} mode="popLayout">
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <NotificationItem
                      notification={notification}
                      onClick={() => handleNotificationClick(notification.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
