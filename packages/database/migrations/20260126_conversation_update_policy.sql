-- Allow participants to update their conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;
CREATE POLICY "Users can update their conversations"
ON conversations FOR UPDATE
USING ((SELECT auth.uid()) = seller_id OR (SELECT auth.uid()) = bidder_id)
WITH CHECK ((SELECT auth.uid()) = seller_id OR (SELECT auth.uid()) = bidder_id);
