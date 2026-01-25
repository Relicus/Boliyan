-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 1. Conversations Policies
-- Users can see conversations they are part of
CREATE POLICY "Conversations View Policy"
ON conversations FOR SELECT
USING (
  (SELECT auth.uid()) = seller_id OR (SELECT auth.uid()) = bidder_id
);

-- Users can create conversations (Logic usually handled by 'Accept Bid' context)
-- But effectively, only valid participants should insert.
CREATE POLICY "Users can insert conversations"
ON conversations FOR INSERT
WITH CHECK (
  (SELECT auth.uid()) = seller_id OR (SELECT auth.uid()) = bidder_id
);

-- Users can update their own conversations (last_message, updated_at, etc.)
CREATE POLICY "Users can update their conversations"
ON conversations FOR UPDATE
USING (
  (SELECT auth.uid()) = seller_id OR (SELECT auth.uid()) = bidder_id
)
WITH CHECK (
  (SELECT auth.uid()) = seller_id OR (SELECT auth.uid()) = bidder_id
);

-- 2. Messages Policies
-- Users can view messages of conversations they belong to
CREATE POLICY "Users can view messages in their conversations"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (c.seller_id = (SELECT auth.uid()) OR c.bidder_id = (SELECT auth.uid()))
  )
);

-- Users can insert messages if they are the sender AND part of the conversation
CREATE POLICY "Users can send messages in their conversations"
ON messages FOR INSERT
WITH CHECK (
  (SELECT auth.uid()) = sender_id
  AND EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id
    AND (c.seller_id = (SELECT auth.uid()) OR c.bidder_id = (SELECT auth.uid()))
  )
);
