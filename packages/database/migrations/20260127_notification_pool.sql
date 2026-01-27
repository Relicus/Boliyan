-- Migration: Enforce notification pool and listing cleanup
-- Date: 2026-01-27
-- Description: Cap notifications per user and purge listing-scoped notifications on listing end.

-- 1) Cap notification pool per user (15 newest)
CREATE OR REPLACE FUNCTION enforce_notification_pool() RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM notifications
    WHERE id IN (
        SELECT id
        FROM notifications
        WHERE user_id = NEW.user_id
        ORDER BY created_at DESC, id DESC
        OFFSET 15
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_notification_pool_enforce ON notifications;
CREATE TRIGGER on_notification_pool_enforce
    AFTER INSERT ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION enforce_notification_pool();

-- 2) Remove notifications when a listing ends or is removed
CREATE OR REPLACE FUNCTION purge_listing_notifications() RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM notifications
    WHERE metadata->>'itemId' = OLD.id::text;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION purge_listing_notifications_on_status() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('completed', 'cancelled') AND NEW.status IS DISTINCT FROM OLD.status THEN
        DELETE FROM notifications
        WHERE metadata->>'itemId' = NEW.id::text;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_listing_status_purge_notifications ON listings;
CREATE TRIGGER on_listing_status_purge_notifications
    AFTER UPDATE OF status ON listings
    FOR EACH ROW
    EXECUTE FUNCTION purge_listing_notifications_on_status();

DROP TRIGGER IF EXISTS on_listing_delete_purge_notifications ON listings;
CREATE TRIGGER on_listing_delete_purge_notifications
    AFTER DELETE ON listings
    FOR EACH ROW
    EXECUTE FUNCTION purge_listing_notifications();
