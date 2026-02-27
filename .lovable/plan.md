

## Plan: Map to existing HubSpot `student_high_school_curriculum` property

### Problem
The Edge Function sends `curriculum` but HubSpot already has a dropdown property with internal name `student_high_school_curriculum` — with matching options (American Diploma, IGCSE, IB, NATIONAL DIPLOMA, Other, French BAC, Canadian Diploma).

### Change

**`supabase/functions/sync-hubspot-lead/index.ts`** — in `buildOnboardingProperties()`:
- Rename key `curriculum` → `student_high_school_curriculum`
- Values already match the HubSpot dropdown options exactly, so no value mapping needed.

One-line change, no new property to create.

