-- Clean orphan rows then add missing FK from program_matches_v2.program_id -> programs.id
DELETE FROM public.program_matches_v2 pm
WHERE NOT EXISTS (SELECT 1 FROM public.programs p WHERE p.id = pm.program_id);

ALTER TABLE public.program_matches_v2
  ADD CONSTRAINT program_matches_v2_program_id_fkey
  FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_program_matches_v2_program_id
  ON public.program_matches_v2(program_id);