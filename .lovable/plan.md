

## Plan: Fix Eligibility Checker UX Issues

### Changes

#### 1. `src/pages/onboarding/steps/CurriculumFields.tsx` — AmericanDiplomaFields fixes

**Reorder sections** (lines 368-490):
- Move `GraduatedSection` call but restructure so university study fields appear AFTER AP/SAT/ACT, not immediately after graduation question
- Split `GraduatedSection` usage: render graduation yes/no + current grade at top, but move the "Have you started university?" block to the bottom of the form
- Change GPA label: if `graduated === true`, show "Final High School GPA (out of 4.0)" instead of "Unweighted CGPA (Grade 9–12)"
- Remove GPA Scale field entirely; hardcode `gpa_scale: 4` in the update call
- SAT/ACT: change from `grid grid-cols-2` to stacked vertical layout — each test in its own div with label + toggle + score grouped clearly

#### 2. `src/pages/EligibilityChecker.tsx` — Auth gate + save + sync

- Add auth state check on mount; track `user` and `isLoggedIn` state
- **Guest flow**: Allow filling the form, but on "Check My Eligibility":
  - Store form data + curriculum in `sessionStorage`
  - Redirect to `/auth?returnTo=/eligibility-checker`
  - On mount, if `sessionStorage` has saved data AND user is now logged in, restore data, run check, save to DB, and sync to HubSpot
- **Logged-in flow**: On "Check My Eligibility":
  1. Run eligibility rules
  2. Upsert `student_academics` with curriculum + extras
  3. Call `sync-hubspot-lead` with `sync_type: "eligibility_check"`
  4. Show result with CTAs: "Go to Dashboard" / "Browse Programs"
- Add saving/loading state indicator

#### 3. `supabase/functions/sync-hubspot-lead/index.ts` — Add eligibility_check sync type

- Add `eligibility_check` to the `sync_type` handling
- New `buildEligibilityProperties` function that maps:
  - `curriculum` → `student_high_school_curriculum`
  - `eligibility_status` → new `eligibility_status` property (single-line text)
  - `curriculum_details` → new `curriculum_details` property (JSON stringified, multi-line text)
- Add `eligibility_status` and `curriculum_details` fields to `LeadData` interface

### Files Modified
- `src/pages/onboarding/steps/CurriculumFields.tsx`
- `src/pages/EligibilityChecker.tsx`
- `supabase/functions/sync-hubspot-lead/index.ts`

