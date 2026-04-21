DROP POLICY IF EXISTS "Anyone can view message templates" ON public.message_templates;
DROP POLICY IF EXISTS "Public can view message templates" ON public.message_templates;
DROP POLICY IF EXISTS "Message templates are viewable by everyone" ON public.message_templates;
DROP POLICY IF EXISTS "Authenticated users can view message templates" ON public.message_templates;

CREATE POLICY "Admins can view message templates"
ON public.message_templates FOR SELECT TO authenticated
USING (has_role('admin'::app_role));

CREATE POLICY "Users can view extractions of their documents"
ON public.document_extractions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.student_documents sd
    WHERE sd.id = document_extractions.document_id
      AND sd.uploaded_by = auth.uid()
  )
);