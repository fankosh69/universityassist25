
-- counselor_students: admin-only writes
CREATE POLICY "counselor_students_admin_insert"
  ON public.counselor_students FOR INSERT TO authenticated
  WITH CHECK (public.has_role('admin'::app_role));
CREATE POLICY "counselor_students_admin_update"
  ON public.counselor_students FOR UPDATE TO authenticated
  USING (public.has_role('admin'::app_role))
  WITH CHECK (public.has_role('admin'::app_role));
CREATE POLICY "counselor_students_admin_delete"
  ON public.counselor_students FOR DELETE TO authenticated
  USING (public.has_role('admin'::app_role));

-- ocr_extractions: admin-only writes (service role bypasses RLS)
CREATE POLICY "ocr_extractions_admin_insert"
  ON public.ocr_extractions FOR INSERT TO authenticated
  WITH CHECK (public.has_role('admin'::app_role));
CREATE POLICY "ocr_extractions_admin_update"
  ON public.ocr_extractions FOR UPDATE TO authenticated
  USING (public.has_role('admin'::app_role))
  WITH CHECK (public.has_role('admin'::app_role));
CREATE POLICY "ocr_extractions_admin_delete"
  ON public.ocr_extractions FOR DELETE TO authenticated
  USING (public.has_role('admin'::app_role));

-- document_extractions: admin-only writes (service role bypasses RLS)
CREATE POLICY "document_extractions_admin_insert"
  ON public.document_extractions FOR INSERT TO authenticated
  WITH CHECK (public.has_role('admin'::app_role));
CREATE POLICY "document_extractions_admin_update"
  ON public.document_extractions FOR UPDATE TO authenticated
  USING (public.has_role('admin'::app_role))
  WITH CHECK (public.has_role('admin'::app_role));
CREATE POLICY "document_extractions_admin_delete"
  ON public.document_extractions FOR DELETE TO authenticated
  USING (public.has_role('admin'::app_role));

-- program_matches_v2: admin-only writes (matching engine uses service role)
CREATE POLICY "program_matches_v2_admin_insert"
  ON public.program_matches_v2 FOR INSERT TO authenticated
  WITH CHECK (public.has_role('admin'::app_role));
CREATE POLICY "program_matches_v2_admin_update"
  ON public.program_matches_v2 FOR UPDATE TO authenticated
  USING (public.has_role('admin'::app_role))
  WITH CHECK (public.has_role('admin'::app_role));
CREATE POLICY "program_matches_v2_admin_delete"
  ON public.program_matches_v2 FOR DELETE TO authenticated
  USING (public.has_role('admin'::app_role));

-- location_events: users may only insert rows for their own profile_id
CREATE POLICY "location_events_self_insert"
  ON public.location_events FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());
