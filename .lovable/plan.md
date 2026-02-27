

## Plan: Replace custom `country_of_residence` with HubSpot's built-in `country` property

### Problem
The Edge Function sets a custom `country_of_residence` property, but HubSpot already has a built-in **Country/Region** dropdown with internal name `country`.

### Changes

**1. Update Edge Function** (`supabase/functions/sync-hubspot-lead/index.ts`)
- In `buildOnboardingProperties()`: rename `country_of_residence` → `country`
- Value format must match HubSpot's expected country labels (e.g., "Egypt", "Saudi Arabia") — our current values already match.

### No new property needed
`country_of_residence` is removed from the custom properties list.

