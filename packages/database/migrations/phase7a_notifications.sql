-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('outbid', 'bid_accepted', 'new_message', 'bid_received')),
  title TEXT NOT NULL,
  body TEXT,
  link TEXT, -- e.g., /item/[id] or /inbox
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}', -- Flexible: { itemId, bidId, conversationId, etc. }
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast user queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING ((SELECT auth.uid()) = user_id);

-- Users can mark their own notifications as read
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING ((SELECT auth.uid()) = user_id);

-- System/triggers can insert (service role)
CREATE POLICY "Service can insert notifications"
ON notifications FOR INSERT
WITH CHECK (true);

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
