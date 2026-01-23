import { Notification } from '@/types/notification';
import { Conversation } from '@/types';

/**
 * Resolves a notification to its appropriate internal app link.
 * 
 * @param notification The notification object
 * @param context Optional context to help resolve ambiguous links (e.g. finding a conversation by itemId)
 * @returns The relative URL path or null
 */
export function resolveNotificationLink(
  notification: Notification,
  context?: {
    conversations?: Conversation[];
    userId?: string;
  }
): string | null {
  if (notification.link) return notification.link;

  const { type, metadata } = notification;

  switch (type) {
    case 'outbid':
      // Link to the product or dashboard
      return metadata.itemId ? `/dashboard?id=${metadata.itemId}` : '/dashboard';
    
    case 'bid_accepted':
    case 'new_message':
      if (metadata.conversationId) {
        return `/inbox?id=${metadata.conversationId}`;
      }
      // Fallback: try to find conversation in context if we have itemId and userId
      if (context?.conversations && metadata.itemId && context.userId) {
        const conv = context.conversations.find(c => 
          c.itemId === metadata.itemId && 
          (c.sellerId === context.userId || c.bidderId === context.userId)
        );
        if (conv) return `/inbox?id=${conv.id}`;
      }
      return '/inbox';

    case 'bid_received':
      return metadata.itemId ? `/dashboard/seller?id=${metadata.itemId}` : '/dashboard/seller';

    default:
      return null;
  }
}
