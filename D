import type { Conversation } from '@/types';
import type { Notification } from '@/types/notification';

interface NotificationLinkOptions {
  conversations?: Conversation[];
  userId?: string;
}

const normalizeLegacyLink = (link?: string) => {
  if (!link) return undefined;

  if (link.startsWith('/item/')) {
    return link.replace('/item/', '/product/');
  }

  if (link.startsWith('/inbox?conversation=')) {
    return link.replace('/inbox?conversation=', '/inbox?id=');
  }

  return link;
};

const resolveConversationId = (notification: Notification, options?: NotificationLinkOptions) => {
  const conversationId = notification.metadata?.conversationId;
  if (conversationId) return conversationId;

  if (!options?.conversations || !options?.userId) return undefined;
  const itemId = notification.metadata?.itemId;
  if (!itemId) return undefined;

  return options.conversations.find(conversation =>
    conversation.itemId === itemId && conversation.bidderId === options.userId
  )?.id;
};

export const resolveNotificationLink = (
  notification: Notification,
  options?: NotificationLinkOptions
) => {
  if (notification.type === 'bid_received') {
    return '/dashboard?tab=active-bids';
  }

  if (notification.type === 'bid_accepted' || notification.type === 'new_message') {
    const conversationId = resolveConversationId(notification, options);
    if (conversationId) {
      return `/inbox?id=${conversationId}`;
    }

    if (notification.type === 'bid_accepted') {
      return '/dashboard?tab=my-bids';
    }
  }

  return normalizeLegacyLink(notification.link);
};
