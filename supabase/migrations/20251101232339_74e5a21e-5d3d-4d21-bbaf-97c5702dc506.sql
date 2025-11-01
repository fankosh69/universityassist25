-- Add session management columns to ai_conversations
ALTER TABLE ai_conversations ADD COLUMN IF NOT EXISTS session_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE ai_conversations ADD COLUMN IF NOT EXISTS session_number INTEGER DEFAULT 1;
ALTER TABLE ai_conversations ADD COLUMN IF NOT EXISTS parent_conversation_id UUID REFERENCES ai_conversations(id);

-- Add search functionality for messages
ALTER TABLE ai_messages ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create index for full-text search
CREATE INDEX IF NOT EXISTS idx_messages_search ON ai_messages USING GIN(search_vector);

-- Create trigger to automatically update search vector
CREATE OR REPLACE FUNCTION update_messages_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_search_update
  BEFORE INSERT OR UPDATE OF content ON ai_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_messages_search_vector();

-- Update existing messages with search vectors
UPDATE ai_messages 
SET search_vector = to_tsvector('english', COALESCE(content, ''))
WHERE search_vector IS NULL;

-- Add index for conversation lookups by profile and date
CREATE INDEX IF NOT EXISTS idx_conversations_profile_session ON ai_conversations(profile_id, session_date DESC, session_number DESC);

-- Add index for parent conversation lookups
CREATE INDEX IF NOT EXISTS idx_conversations_parent ON ai_conversations(parent_conversation_id);