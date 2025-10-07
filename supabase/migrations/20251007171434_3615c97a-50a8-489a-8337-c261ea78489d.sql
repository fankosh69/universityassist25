-- Create table for AI assistant conversations
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Conversation',
  status TEXT DEFAULT 'active', -- active, completed, archived
  profile_completion_progress JSONB DEFAULT '{}',
  collected_data JSONB DEFAULT '{}', -- stores extracted profile data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for conversation messages
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- user, assistant, system
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}', -- stores question type, collected fields, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_ai_conversations_profile ON public.ai_conversations(profile_id);
CREATE INDEX idx_ai_messages_conversation ON public.ai_messages(conversation_id);

-- Enable RLS
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_conversations
CREATE POLICY "Users can view own conversations"
  ON public.ai_conversations
  FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users can create own conversations"
  ON public.ai_conversations
  FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own conversations"
  ON public.ai_conversations
  FOR UPDATE
  USING (profile_id = auth.uid());

-- RLS Policies for ai_messages
CREATE POLICY "Users can view own messages"
  ON public.ai_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations
      WHERE ai_conversations.id = ai_messages.conversation_id
      AND ai_conversations.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own messages"
  ON public.ai_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_conversations
      WHERE ai_conversations.id = ai_messages.conversation_id
      AND ai_conversations.profile_id = auth.uid()
    )
  );

COMMENT ON TABLE public.ai_conversations IS 'AI assistant conversations for profile completion and program recommendations';
COMMENT ON TABLE public.ai_messages IS 'Messages in AI assistant conversations';