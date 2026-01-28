'use client';
 
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Bell, Check } from 'lucide-react';
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleNotificationClick = async (id: string) => {
    markAsRead(id);
    setIsOpen(false);
  };

  const activeNotifications = notifications.filter(n => !n.isRead);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          id="notification-bell-btn" 
          variant="ghost" 
          className="relative rounded-full h-9 w-9 p-1 hover:bg-slate-100 transition-colors duration-300"
        >
          <Bell className={cn("!h-6 !w-6 text-slate-600 transition-colors duration-300", isOpen && "text-blue-600 fill-blue-50")} strokeWidth={isOpen ? 2.5 : 2} />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600 ring-2 ring-white"></span>
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-[calc(100vw-32px)] sm:w-96 p-0 rounded-2xl shadow-2xl border-white/20 overflow-hidden bg-white/90 backdrop-blur-xl ring-1 ring-black/5 sm:mx-0">
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
              id="notifications-mark-all-read-btn"
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
             <div className="p-8 text-center text-slate-500 text-xs font-medium">Loading...</div>
          ) : activeNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center p-8">
              <div className="h-16 w-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-4 ring-1 ring-slate-100 shadow-sm">
                <Bell className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-900 font-outfit">All caught up!</p>
              <p className="text-xs text-slate-500 mt-1 max-w-[200px] leading-relaxed font-medium">
                You have no new notifications at the moment.
              </p>
            </div>
          ) : (
            <div className="flex flex-col bg-slate-100/20">
              <AnimatePresence initial={false} mode="popLayout">
                {activeNotifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: -200, transition: { duration: 0.2 } }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    drag={isMobile ? "x" : false}
                    dragConstraints={{ left: -100, right: 0 }}
                    dragElastic={0.1}
                    onDragEnd={(_, info) => {
                      if (info.offset.x < -60) {
                        markAsRead(notification.id);
                      }
                    }}
                    className="relative group touch-pan-y"
                  >
                    {/* Background reveal layer */}
                    <div className="absolute inset-0 bg-blue-600 flex items-center justify-end px-6 transition-opacity">
                      <div className="flex flex-col items-center gap-1 text-white opacity-80">
                        <Check className="h-5 w-5" strokeWidth={3} />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Done</span>
                      </div>
                    </div>

                    <NotificationItem
                      notification={notification}
                      onClick={() => handleNotificationClick(notification.id)}
                      onDismiss={() => markAsRead(notification.id)}
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
