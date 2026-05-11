## Fixes

### 1. Recompute toast: "Could not find a relationship between 'program_matches_v2' and 'programs'"

Root cause: `src/pages/DashboardEnhanced.tsx` runs an embedded select `program:programs(*)` on `program_matches_v2`, but the table only has a FK to `profiles` — no FK on `program_id` → `programs.id`. PostgREST therefore can't auto-join.

Fix (migration):
- Clean up any orphan rows in `program_matches_v2` whose `program_id` is not in `programs`.
- Add `ALTER TABLE public.program_matches_v2 ADD CONSTRAINT program_matches_v2_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE CASCADE;`
- Add an index on `program_matches_v2(program_id)` if missing.

After the FK lands, the existing embed call works as-is. (Also re-check that `match_score` is the column being ordered by — it is, per types.ts.)

### 2. Profile save: `invalid input syntax for type numeric: ""`

Root cause: in `src/pages/Profile.tsx` `handleSaveProfile`, the GPA fields (`gpa_raw`, `gpa_scale_max`, `gpa_min_pass`) and `credits_taken` can be `""` from the inputs and are forwarded as-is to `secureUpdateProfile` / `secure_update_academic_data`.

Fix (frontend only):
- Coerce empty strings to `null` for `gpa_raw`, `gpa_scale_max`, `gpa_min_pass`, `current_gpa`, `credits_taken` before sending.
- In the `credits_taken` input `onChange`, guard `parseInt` so empty input becomes `null` rather than `NaN`.

### Out of scope
No UI / business-logic changes. No edits to `src/integrations/supabase/types.ts` (auto-regenerated after migration).
