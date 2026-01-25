-- Consolidated RLS Performance Optimization
-- Optimization: Wrap auth.uid() in (SELECT auth.uid()) to prevent row-by-row re-evaluation.

DO $$
BEGIN
    -- 1. Conversations Table (Core)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversations') THEN
        DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
        DROP POLICY IF EXISTS "Conversations View Policy" ON conversations;
        CREATE POLICY "Conversations View Policy" ON conversations FOR SELECT
        USING ((SELECT auth.uid()) = seller_id OR (SELECT auth.uid()) = bidder_id);

        DROP POLICY IF EXISTS "Users can insert conversations" ON conversations;
        CREATE POLICY "Users can insert conversations" ON conversations FOR INSERT
        WITH CHECK ((SELECT auth.uid()) = seller_id OR (SELECT auth.uid()) = bidder_id);

        DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;
        CREATE POLICY "Users can update their conversations" ON conversations FOR UPDATE
        USING ((SELECT auth.uid()) = seller_id OR (SELECT auth.uid()) = bidder_id)
        WITH CHECK ((SELECT auth.uid()) = seller_id OR (SELECT auth.uid()) = bidder_id);
    END IF;

    -- 2. Messages Table (Core)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') THEN
        DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
        CREATE POLICY "Users can view messages in their conversations" ON messages FOR SELECT
        USING (EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = messages.conversation_id
            AND (c.seller_id = (SELECT auth.uid()) OR c.bidder_id = (SELECT auth.uid()))
        ));

        DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
        CREATE POLICY "Users can send messages in their conversations" ON messages FOR INSERT
        WITH CHECK (
            (SELECT auth.uid()) = sender_id
            AND EXISTS (
                SELECT 1 FROM conversations c
                WHERE c.id = messages.conversation_id
                AND (c.seller_id = (SELECT auth.uid()) OR c.bidder_id = (SELECT auth.uid()))
            )
        );
    END IF;

    -- 3. Watchlist Table (Optional/Migration)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'watchlist') THEN
        DROP POLICY IF EXISTS "Users can view their own watchlist" ON watchlist;
        CREATE POLICY "Users can view their own watchlist" ON watchlist FOR SELECT
        USING ((SELECT auth.uid()) = user_id);

        DROP POLICY IF EXISTS "Users can add to their own watchlist" ON watchlist;
        CREATE POLICY "Users can add to their own watchlist" ON watchlist FOR INSERT
        WITH CHECK ((SELECT auth.uid()) = user_id);

        DROP POLICY IF EXISTS "Users can remove from their own watchlist" ON watchlist;
        CREATE POLICY "Users can remove from their own watchlist" ON watchlist FOR DELETE
        USING ((SELECT auth.uid()) = user_id);
    END IF;

    -- 4. Reviews Table (Optional/Migration)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reviews') THEN
        DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
        CREATE POLICY "Users can create reviews" ON reviews FOR INSERT
        WITH CHECK ((SELECT auth.uid()) = reviewer_id);
    END IF;

    -- 5. Notifications Table (Optional/Migration)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
        DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
        CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT
        USING ((SELECT auth.uid()) = user_id);

        DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
        CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE
        USING ((SELECT auth.uid()) = user_id);
    END IF;

    -- 6. Search History Table (Optional/Migration)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'search_history') THEN
        DROP POLICY IF EXISTS "Users can view own search history" ON search_history;
        CREATE POLICY "Users can view own search history" ON search_history FOR SELECT
        USING ((SELECT auth.uid()) = user_id);

        DROP POLICY IF EXISTS "Users can insert own search history" ON search_history;
        CREATE POLICY "Users can insert own search history" ON search_history FOR INSERT
        WITH CHECK ((SELECT auth.uid()) = user_id);
    END IF;
END $$;

