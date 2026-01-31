

# Custom Auth Emails with React Email & Resend

## Overview
Replace default Supabase auth emails with fully branded emails sent from your own domain (`info@uniassist.net`) using React Email templates and Resend.

## Architecture

```text
+------------------+      +--------------------+      +------------------+      +-------------+
| Supabase Auth    | ---> | send-auth-email    | ---> | Resend API       | ---> | User Inbox  |
| (Auth Hook)      |      | (Edge Function)    |      | info@uniassist   |      |             |
+------------------+      +--------------------+      +------------------+      +-------------+
                                  |
                                  v
                          +----------------+
                          | React Email    |
                          | Templates      |
                          +----------------+
```

## What Gets Customized

| Email Type | Trigger | Template |
|------------|---------|----------|
| Email Confirmation | User signs up | `signup-confirmation.tsx` |
| Password Reset | User requests reset | `password-reset.tsx` |
| Magic Link | User requests magic link | `magic-link.tsx` |
| Email Change | User changes email | `email-change.tsx` |

## Existing Infrastructure (Ready to Use)
- `RESEND_API_KEY` - Already configured
- `email-assets` storage bucket - Already exists with logo
- `logo-white-transparent.png` - Already uploaded
- Verified domain: `uniassist.net` (used by shortlist emails)

## Implementation Steps

### 1. Add Auth Hook Secret
Create a new secret `SEND_EMAIL_HOOK_SECRET` that Supabase will use to sign webhook payloads for security verification.

### 2. Create Email Templates
Four React Email templates following your existing brand style:

**Brand styling (matching shortlist-email.tsx):**
- Primary color: `#2E57F6`
- Secondary: `#5DC6C5`
- Font: System fonts (Apple, Segoe UI, Roboto)
- Logo in header on blue background
- Footer with disclaimer

**Template: Signup Confirmation**
```text
Subject: "Confirm your University Assist account"
Content:
- Welcome message with user's name
- Clear CTA button to confirm email
- 6-digit OTP code as fallback
- Expiration notice
```

**Template: Password Reset**
```text
Subject: "Reset your password - University Assist"
Content:
- Security-focused message
- Reset link button
- Expiration notice (1 hour)
- "Didn't request this?" section
```

**Template: Magic Link**
```text
Subject: "Sign in to University Assist"
Content:
- One-click sign in button
- 6-digit code as fallback
- Brief security note
```

**Template: Email Change**
```text
Subject: "Confirm your new email address"
Content:
- Acknowledge the change request
- Confirm new email button
- Security warning
```

### 3. Create Edge Function: `send-auth-email`

The function will:
1. Verify webhook signature using `standardwebhooks`
2. Parse the auth event type (`signup`, `recovery`, `magiclink`, `email_change`)
3. Select appropriate template
4. Render HTML with React Email
5. Send via Resend from `info@uniassist.net`

**Key payload fields from Supabase:**
```typescript
{
  user: { email: string, user_metadata: { full_name: string } },
  email_data: {
    token: string,           // 6-digit OTP
    token_hash: string,      // For URL verification
    redirect_to: string,     // Where to redirect after
    email_action_type: string // signup, recovery, etc.
  }
}
```

### 4. Configure Auth Hook in Supabase Dashboard

After deployment, you'll need to:
1. Go to Supabase Dashboard → Authentication → Hooks
2. Enable "Send Email" hook
3. Set the edge function URL
4. Add the hook secret

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/send-auth-email/_templates/signup-confirmation.tsx` | Welcome + confirm email |
| `supabase/functions/send-auth-email/_templates/password-reset.tsx` | Reset password link |
| `supabase/functions/send-auth-email/_templates/magic-link.tsx` | One-click sign in |
| `supabase/functions/send-auth-email/_templates/email-change.tsx` | Confirm new email |
| `supabase/functions/send-auth-email/index.ts` | Main handler |

## Files to Update

| File | Change |
|------|--------|
| `supabase/config.toml` | Add `send-auth-email` function config |

## Post-Deployment Setup (Manual)

You'll need to configure the auth hook in the Supabase dashboard:

1. Navigate to **Authentication → Hooks** in Supabase Dashboard
2. Find **"Send Email"** hook and click Configure
3. Set URL: `https://zfiexgjcuojodmnsinsz.supabase.co/functions/v1/send-auth-email`
4. Add the hook secret (generated during implementation)

## Security Features

- Webhook signature verification using `standardwebhooks`
- Token expiration notices in emails
- Clear security warnings for password reset
- Rate limiting handled by Supabase Auth
- All secrets server-side only

## Email Branding Details

All emails will include:
- University Assist logo in blue header
- Primary CTA button in brand blue (`#2E57F6`)
- Legal disclaimer in footer
- Consistent typography matching your app
- Mobile-responsive design

