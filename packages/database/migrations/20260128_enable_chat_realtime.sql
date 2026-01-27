-- Enable realtime for chat tables and add message index
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at
ON messages (conversation_id, created_at);
