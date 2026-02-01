

## Fix Signup "Hook requires authorization token" Error

### Root Cause
The `send-auth-email` Edge Function's webhook verification is failing because the `SEND_EMAIL_HOOK_SECRET` value has invalid Base64 characters. This causes Supabase Auth to return the error you're seeing.

### Solution: Two-Step Fix

#### Step 1: Immediate Unblock (Dashboard - No Code Changes)

**Option A - Disable the Send Email Hook temporarily:**
1. Go to **Supabase Dashboard → Authentication → Hooks**
2. Find the "Send Email" hook and **disable it**
3. Signups will now work using Supabase's default email system
4. You can re-enable it after properly configuring the secret

**Option B - Fix the secret properly:**
1. Go to **Supabase Dashboard → Authentication → Hooks → Send Email**
2. Click "Regenerate Secret" to get a fresh secret
3. Copy the **ENTIRE** secret (must start with `v1,whsec_`)
4. Go to **Settings → Edge Functions → Secrets**
5. Update `SEND_EMAIL_HOOK_SECRET`:
   - Delete the current value completely
   - Paste the new secret with NO extra spaces before or after
6. Wait 30 seconds for the function to reload

#### Step 2: Code Enhancement (Clearer Error Messages)

Update the edge function to return more actionable error messages when webhook verification fails, helping diagnose future issues faster.

**File: `supabase/functions/send-auth-email/index.ts`**

Change the webhook verification error response from:
```typescript
return new Response(
  JSON.stringify({ 
    error: { 
      http_code: 401, 
      message: 'Webhook verification failed...' 
    } 
  }),
  { status: 401 }
);
```

To return a proper Auth Hook error format that Supabase understands:
```typescript
return new Response(
  JSON.stringify({ 
    error: { 
      http_code: 500, 
      message: 'Email service configuration error. Please try again later.' 
    } 
  }),
  { status: 500 }
);
```

This prevents the cryptic "Hook requires authorization token" message and gives users a clearer indication that it's a temporary server issue.

### Verification Steps (You Test)
1. After disabling hook OR fixing secret, try signup with a new email
2. If signup succeeds, check if confirmation email arrives
3. If using Option A (hook disabled), emails come from Supabase's default sender

### Why This Happened
The `standardwebhooks` library requires the secret in exact `v1,whsec_<base64>` format. Common issues:
- Copying only part of the secret
- Including leading/trailing whitespace
- Browser auto-formatting when pasting

