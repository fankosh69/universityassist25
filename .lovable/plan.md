

## Plan: Map `desired_education_level` values to HubSpot dropdown options

### Problem
The app sends `foundation_year` / `bachelors` / `masters` but HubSpot expects `Foundation Course` / `Bachelor Degree` / `Master's Degree`.

### Change

**`supabase/functions/sync-hubspot-lead/index.ts`** — in `buildOnboardingProperties()`:

Add a value mapping for `desired_education_level`:

```
foundation_year  →  Foundation Course
bachelors        →  Bachelor Degree
masters          →  Master's Degree
```

Replace the direct assignment with a lookup map so the correct HubSpot internal name is sent.

### Scope
- One file, ~8 lines added
- No frontend changes needed
- Remove `desired_education_level` from the list of properties you need to create (it already exists)

