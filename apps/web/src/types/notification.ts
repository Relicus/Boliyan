export type NotificationType = 'outbid' | 'bid_accepted' | 'new_message' | 'bid_received';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  isRead: boolean;
  metadata: {
    itemId?: string;
    bidId?: string;
    conversationId?: string;
    [key: string]: unknown;
  };
  createdAt: string;
}
