'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Notification } from '@/types/notification';
import { toast } from 'sonner';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
//   const supabase = createClient();

  // Fetch notifications
  const refreshNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setNotifications(data.map(transformNotification));
    }
    setIsLoading(false);
  }, [user?.id, supabase]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    refreshNotifications();

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = transformNotification(payload.new as Record<string, unknown>);
          setNotifications((prev) => [newNotification, ...prev]);
          
          // Show toast
          toast(newNotification.title, {
            description: newNotification.body,
            action: newNotification.link ? {
              label: 'View',
              onClick: () => window.location.href = newNotification.link!
            } : undefined,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, supabase, refreshNotifications]);

  const markAsRead = async (id: string) => {
    await (supabase.from('notifications') as any).update({ is_read: true }).eq('id', id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await (supabase.from('notifications') as any).update({ is_read: true }).eq('user_id', user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, isLoading, markAsRead, markAllAsRead, refreshNotifications }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
}

// Transform DB snake_case to camelCase
function transformNotification(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as Notification['type'],
    title: row.title as string,
    body: row.body as string | undefined,
    link: row.link as string | undefined,
    isRead: row.is_read as boolean,
    metadata: (row.metadata as Notification['metadata']) || {},
    createdAt: row.created_at as string,
  };
}
