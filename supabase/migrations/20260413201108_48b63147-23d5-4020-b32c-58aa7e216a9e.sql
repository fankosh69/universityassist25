-- Create a private storage bucket for language certificates
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: Users can view their own certificates
CREATE POLICY "Users can view own certificates"
ON storage.objects FOR SELECT
USING (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS: Users can upload their own certificates
CREATE POLICY "Users can upload own certificates"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS: Users can update their own certificates
CREATE POLICY "Users can update own certificates"
ON storage.objects FOR UPDATE
USING (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS: Users can delete their own certificates
CREATE POLICY "Users can delete own certificates"
ON storage.objects FOR DELETE
USING (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);