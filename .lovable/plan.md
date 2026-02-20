

## Post-Signup Journey: Collecting Additional Data and Syncing to HubSpot via Zapier

### Current State
- **Signup** (Auth.tsx) collects: name, email, gender, DOB, phone, country code
- **Signup sync** already sends this basic data to HubSpot via the `sync-hubspot-lead` Edge Function + Zapier webhook
- **Onboarding flow** (OnboardingFlow.tsx) exists at `/onboarding` with 4 steps (Basic Info, Academic, Language, Preferences) but does NOT sync to HubSpot -- it only saves to Supabase

### What We'll Build

After a user completes the onboarding flow, we'll send all the enriched profile data to HubSpot via Zapier so your CRM has the full picture -- not just the signup basics.

### Architecture

```text
Signup (Auth.tsx)
  --> sync-hubspot-lead (basic data: name, email, phone, gender)
  --> Redirect to /onboarding

Onboarding Complete (OnboardingFlow.tsx)
  --> Save to Supabase (already works)
  --> NEW: sync-hubspot-lead (enriched data: nationality, curriculum, GPA, languages, preferences)
       --> Zapier webhook --> HubSpot contact update
```

### Implementation Steps

#### 1. Extend the `sync-hubspot-lead` Edge Function
Add a new `sync_type` called `"onboarding_complete"` alongside the existing `"signup"` type. The function will accept additional fields:
- `nationality`
- `curriculum` (educational system, e.g., Egyptian, Saudi)
- `gpa_raw`, `gpa_scale`, `gpa_min_pass`
- `languages` (array of language + CEFR level)
- `preferred_fields`, `preferred_degree_type`, `preferred_cities`
- `career_goals`

The Zapier payload will include all these fields so you can map them to HubSpot contact properties in your Zap.

#### 2. Call the sync from OnboardingFlow.tsx
After the existing Supabase saves succeed (and before navigating to `/dashboard`), invoke `sync-hubspot-lead` with `sync_type: "onboarding_complete"` and all the collected form data. This call will be non-blocking (fire-and-forget) so it doesn't slow down the user experience.

#### 3. Auto-redirect new users to onboarding
After signup, redirect to `/onboarding` instead of `/dashboard` so users complete the journey before landing on their dashboard. If they've already completed onboarding (profile is populated), skip straight to `/dashboard`.

### HubSpot / Zapier Side (Your Action)
In your Zapier Zap, you'll need to:
1. The same webhook URL receives both `signup` and `onboarding_complete` events (differentiated by the `sync_type` field)
2. In Zapier, use a **Filter** or **Path** step to handle each type differently:
   - `signup` --> Create HubSpot Contact
   - `onboarding_complete` --> Update HubSpot Contact (match by email) with the enriched fields
3. Create matching **custom properties** in HubSpot for: nationality, curriculum, GPA, languages, preferred fields, degree type, preferred cities, career goals

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/sync-hubspot-lead/index.ts` | Extend `LeadData` interface and payload to accept onboarding fields; add `sync_type` to payload |
| `src/pages/onboarding/OnboardingFlow.tsx` | Add `sync-hubspot-lead` call with `sync_type: "onboarding_complete"` after successful save |
| `src/pages/Auth.tsx` | After successful signup, navigate to `/onboarding` instead of `/dashboard` |

### What the Zapier Payload Will Look Like

**On signup** (existing, unchanged):
```json
{
  "sync_type": "signup",
  "email": "student@example.com",
  "full_name": "Ahmed Ali",
  "phone": "+201234567890",
  "gender": "male",
  "signup_date": "2026-02-20T..."
}
```

**On onboarding complete** (new):
```json
{
  "sync_type": "onboarding_complete",
  "email": "student@example.com",
  "full_name": "Ahmed Ali",
  "nationality": "Egyptian",
  "curriculum": "Egyptian Thanaweya Amma",
  "gpa_raw": 85,
  "gpa_scale": 100,
  "gpa_min_pass": 50,
  "total_ects": 0,
  "languages": [
    { "language": "English", "cefr_level": "B2", "test_type": "IELTS", "test_score": "6.5" }
  ],
  "preferred_fields": ["Computer Science", "Engineering"],
  "preferred_degree_type": "bachelors",
  "preferred_cities": ["Munich", "Berlin"],
  "career_goals": "Software engineering in Germany",
  "onboarding_completed_date": "2026-02-20T..."
}
```

This approach reuses your existing Zapier webhook infrastructure, keeps the sync non-blocking, and logs everything in `hubspot_sync_log` for debugging.

