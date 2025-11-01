-- Fix RLS security issues

-- Enable RLS on message_templates
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage message templates" ON message_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

CREATE POLICY "All can view message templates" ON message_templates
  FOR SELECT USING (true);

-- Enable RLS on message_outbox
ALTER TABLE message_outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages" ON message_outbox
  FOR SELECT USING (
    auth.uid() = recipient_id OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'marketing')
    )
  );

CREATE POLICY "Admins can manage messages" ON message_outbox
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'marketing')
    )
  );

-- Enable RLS on badges (public read)
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badges" ON badges
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage badges" ON badges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );