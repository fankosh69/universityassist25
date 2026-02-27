

## Plan: Replace `signup_source` with existing `lead_source` property

### Problem
The Edge Function currently sets a custom `signup_source` text property, but HubSpot already has a built-in `lead_source` dropdown. This is redundant and uses the wrong field type.

### Changes

**1. Update Edge Function** (`supabase/functions/sync-hubspot-lead/index.ts`)
- In `buildSignupProperties()`: replace `signup_source: "university_assist_platform"` → `lead_source: "Platform Signup"`
- In `buildOnboardingProperties()`: same replacement
- Remove all references to `signup_source`

**2. HubSpot manual step (user action)**
- Go to Settings → Properties → Contact → `Lead Source`
- Add new dropdown option: Label = `Platform Signup`, Internal name = `Platform Signup`

### No new properties to create
`signup_source` is removed from the custom properties list.

