

# HubSpot Integration via Zapier

## Overview
Connect new user signups to HubSpot through Zapier, automatically creating a new contact/lead whenever someone registers on the platform.

## Architecture

```text
+-------------+      +-------------------+      +------------------+      +----------+
|   Auth.tsx  | ---> | sync-hubspot-lead | ---> | Zapier Webhook   | ---> | HubSpot  |
|  (Signup)   |      |  (Edge Function)  |      | (Catch Hook)     |      | Contact  |
+-------------+      +-------------------+      +------------------+      +----------+
                              |
                              v
                     +-------------------+
                     | hubspot_sync_log  |
                     |    (Audit Log)    |
                     +-------------------+
```

## Implementation Steps

### 1. Add Zapier Webhook Secret
- Add a new secret `ZAPIER_HUBSPOT_WEBHOOK_URL` to store your Zapier Catch Hook URL
- You will need to create a Zap in Zapier with:
  - Trigger: "Webhooks by Zapier" → "Catch Hook"
  - Action: "HubSpot" → "Create Contact"

### 2. Create Edge Function: `sync-hubspot-lead`
A new edge function that:
- Receives new user data (name, email, phone, etc.)
- Sends it to the Zapier webhook using `no-cors` mode
- Logs the sync attempt to `hubspot_sync_log` table
- Returns success/failure status

**Payload sent to Zapier:**
```json
{
  "email": "user@example.com",
  "full_name": "John Doe",
  "phone": "+201234567890",
  "gender": "Male",
  "date_of_birth": "2000-01-15",
  "signup_date": "2026-01-31T12:00:00Z",
  "source": "university_assist_signup"
}
```

### 3. Update Auth.tsx
After successful signup, call the edge function to sync the new user to HubSpot:
- Add a call to `supabase.functions.invoke('sync-hubspot-lead', { body: userData })`
- Handle errors gracefully (don't block signup if HubSpot sync fails)
- The sync happens in the background

### 4. Zapier Configuration (User Action Required)
You will need to set up a Zap:
1. Go to Zapier and create a new Zap
2. Trigger: "Webhooks by Zapier" → "Catch Hook" → Copy the webhook URL
3. Action: "HubSpot" → "Create Contact"
4. Map fields:
   - Email → `email`
   - First Name → Extract from `full_name`
   - Phone → `phone`
   - Add custom properties as needed

---

## Technical Details

### Edge Function Code Structure
```typescript
// supabase/functions/sync-hubspot-lead/index.ts
- CORS headers for preflight requests
- Validate incoming user data
- Fetch Zapier webhook URL from environment
- POST to Zapier with user data (no-cors mode)
- Log to hubspot_sync_log with success/error status
- Return appropriate response
```

### Auth.tsx Changes
- After line 236 (successful signup), add async call to sync edge function
- Non-blocking: use `.then()` instead of `await` to not delay user feedback
- Graceful error handling with console logging

### Data Flow
1. User completes signup form
2. `supabase.auth.signUp()` creates the user
3. Database trigger creates the profile
4. Client calls `sync-hubspot-lead` edge function
5. Edge function POSTs to Zapier webhook
6. Zapier creates HubSpot contact
7. Edge function logs result to `hubspot_sync_log`

### Files to Create/Modify
| File | Action |
|------|--------|
| `supabase/functions/sync-hubspot-lead/index.ts` | Create |
| `supabase/config.toml` | Add function config |
| `src/pages/Auth.tsx` | Add HubSpot sync call |

### Security Considerations
- Webhook URL stored as server-side secret (not exposed to client)
- Edge function validates data before sending
- All sync attempts logged for auditing
- Sync failures don't block user signup

