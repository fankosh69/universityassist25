

# Custom Auth Emails Implementation Plan

## Overview
Create 4 branded React Email templates and an edge function handler to replace Supabase's default auth emails with fully branded emails sent from `info@uniassist.net`.

## Brand Styling (Matching Existing Shortlist Email)
- **Primary Color**: `#2E57F6`
- **Background**: `#f5f7fa`
- **Container**: White card with rounded corners
- **Header**: Blue background with logo
- **Font**: System fonts (Apple, Segoe UI, Roboto)
- **Footer**: Legal disclaimer in gray italic

## Files to Create

### 1. Signup Confirmation Template
**File**: `supabase/functions/send-auth-email/_templates/signup-confirmation.tsx`

```text
Structure:
- Blue header with University Assist logo
- "Welcome to University Assist!" heading
- Personalized greeting with user's name
- Brief welcome message about starting their journey to Germany
- Primary CTA button: "Confirm My Email"
- Gray box with 6-digit OTP code as fallback
- "This link expires in 24 hours" notice
- Footer with legal disclaimer
```

### 2. Password Reset Template
**File**: `supabase/functions/send-auth-email/_templates/password-reset.tsx`

```text
Structure:
- Blue header with University Assist logo
- "Reset Your Password" heading
- Security-focused message
- Primary CTA button: "Reset Password"
- Gray box with 6-digit OTP code as fallback
- Yellow warning box: "This link expires in 1 hour"
- "Didn't request this?" section with security advice
- Footer with legal disclaimer
```

### 3. Magic Link Template
**File**: `supabase/functions/send-auth-email/_templates/magic-link.tsx`

```text
Structure:
- Blue header with University Assist logo
- "Sign In to University Assist" heading
- Brief message about one-click sign in
- Primary CTA button: "Sign In Now"
- Gray box with 6-digit OTP code as fallback
- "This link expires in 1 hour" notice
- Footer with legal disclaimer
```

### 4. Email Change Template
**File**: `supabase/functions/send-auth-email/_templates/email-change.tsx`

```text
Structure:
- Blue header with University Assist logo
- "Confirm Your New Email" heading
- Shows the new email address being confirmed
- Primary CTA button: "Confirm Email Change"
- Gray box with 6-digit OTP code as fallback
- Red warning box: Security notice about unauthorized changes
- Footer with legal disclaimer
```

### 5. Edge Function Handler
**File**: `supabase/functions/send-auth-email/index.ts`

```text
Logic flow:
1. Receive POST from Supabase Auth Hook
2. Verify webhook signature using standardwebhooks library
3. Extract payload: user email, user_metadata.full_name, email_data (token, token_hash, redirect_to, email_action_type)
4. Determine template based on email_action_type:
   - "signup" → SignupConfirmationEmail
   - "recovery" → PasswordResetEmail
   - "magiclink" → MagicLinkEmail
   - "email_change" → EmailChangeEmail
5. Build verification URL: {SUPABASE_URL}/auth/v1/verify?token={token_hash}&type={email_action_type}&redirect_to={redirect_to}
6. Render template with React Email
7. Send via Resend from info@uniassist.net
8. Return success/error response
```

### 6. Config Update
**File**: `supabase/config.toml`

Add at end:
```toml
[functions.send-auth-email]
verify_jwt = false
```

## Technical Details

### Dependencies (in edge function)
- `npm:react@18.3.1`
- `npm:@react-email/components@0.0.22`
- `npm:resend@4.0.0`
- `https://esm.sh/standardwebhooks@1.0.0`

### Environment Variables Required
- `RESEND_API_KEY` (already configured)
- `SEND_EMAIL_HOOK_SECRET` (to be added)
- `SUPABASE_URL` (auto-provided)

### Logo URL
```
https://zfiexgjcuojodmnsinsz.supabase.co/storage/v1/object/public/email-assets/logo-white-transparent.png?v=1
```

### Email Subjects
| Type | Subject |
|------|---------|
| Signup | "Confirm your University Assist account" |
| Recovery | "Reset your password - University Assist" |
| Magic Link | "Sign in to University Assist" |
| Email Change | "Confirm your new email address - University Assist" |

## Post-Implementation Manual Steps

After the code is deployed, you'll need to:

1. **Add the secret to Supabase Edge Functions**:
   - Go to Edge Functions Secrets
   - Add `SEND_EMAIL_HOOK_SECRET` with value: `ua_auth_hook_2026_xK9mP4nQ7rS2wL5vY8bC3dF6gH1jN0tZ`

2. **Enable the Auth Hook in Supabase Dashboard**:
   - Go to Authentication → Hooks
   - Enable "Send Email" hook
   - Set URL: `https://zfiexgjcuojodmnsinsz.supabase.co/functions/v1/send-auth-email`
   - Set HTTP Authorization Header: `Bearer ua_auth_hook_2026_xK9mP4nQ7rS2wL5vY8bC3dF6gH1jN0tZ`

## Implementation Order

1. Create the 4 email templates (can be done in parallel)
2. Create the edge function handler
3. Update config.toml
4. Deploy automatically
5. Manual: Add secret and enable hook in Supabase Dashboard
6. Test by signing up a new user

