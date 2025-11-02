-- Create table to track conversation read status
CREATE TABLE ai_conversation_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL,
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  last_read_message_id UUID REFERENCES ai_messages(id) ON DELETE SET NULL,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, conversation_id)
);

-- Index for performance
CREATE INDEX idx_conversation_reads_profile_conversation 
  ON ai_conversation_reads(profile_id, conversation_id);

-- Enable RLS
ALTER TABLE ai_conversation_reads ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own conversation reads"
  ON ai_conversation_reads FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users can insert their own conversation reads"
  ON ai_conversation_reads FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own conversation reads"
  ON ai_conversation_reads FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());