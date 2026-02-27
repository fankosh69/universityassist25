

## Plan: Rename "Total ECTS" to "Total Credit Points"

Rename the label and HubSpot property from `total_ects` to `total_credit_points` across the codebase. The DB column stays as-is (no migration needed — it's just a label change in the UI and HubSpot sync).

### Files to modify

#### 1. `src/pages/onboarding/steps/AcademicInfoStep.tsx`
- Line 209: Change label from "Total ECTS Credits (if applicable)" to "Total Credit Points (if applicable)"

#### 2. `src/pages/profile/ProfilePage.tsx`
- Line 176: Change label from "Total ECTS Credits (if applicable)" to "Total Credit Points (if applicable)"

#### 3. `src/components/admin/SubjectRequirementsBuilder.tsx`
- Line 211-213: Change label from "Total ECTS Required" to "Total Credit Points Required"

#### 4. `src/components/program/ApplicantRequirementsCard.tsx`
- Line 305: Change display text from "Your ECTS" to "Your Credit Points"

#### 5. `src/services/matching-v2.ts`
- Line 219: Change gap message from "Complete X more ECTS credits" to "Complete X more credit points"

#### 6. `supabase/functions/sync-hubspot-lead/index.ts`
- Line 161: Change HubSpot property key from `total_ects` to `total_credit_points`

#### HubSpot admin step (manual)
- Rename the HubSpot property from `total_ects` / "Total ECTS" to internal name `total_credit_points` / label "Total Credit Points"
- Or create a new property `total_credit_points` and retire the old one

**Note**: The database column `total_ects` in `student_academics` remains unchanged — renaming DB columns requires a migration and is cosmetic only. The UI and HubSpot labels are what matter for user/counselor visibility.

