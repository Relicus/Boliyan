-- Auto-update conversation preview on new messages

CREATE OR REPLACE FUNCTION handle_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.conversation_id IS NULL THEN
        RETURN NEW;
    END IF;

    UPDATE conversations
    SET last_message = NEW.content,
        updated_at = COALESCE(NEW.created_at, NOW())
    WHERE id = NEW.conversation_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_message_update_conversation ON messages;
CREATE TRIGGER on_message_update_conversation
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION handle_conversation_last_message();
