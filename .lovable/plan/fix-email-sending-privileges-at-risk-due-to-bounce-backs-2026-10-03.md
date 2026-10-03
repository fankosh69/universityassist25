# Fix "Email sending privileges at risk due to bounce backs"

Supabase sends this warning when its built-in email service gets too many bounced emails. If it continues, Supabase can stop sending sign-up and password-reset emails. The fix is to send these emails through your own email provider (Resend, which already sends your branded emails from info@uniassist.net).

## Step 1 — Connect Resend as the email sender in Supabase (you do this, about 5 minutes)

1. In Resend, make sure `uniassist.net` shows as **Verified** under Domains.
2. In Resend, create an API key with "Sending access".
3. Open Supabase → Authentication → Emails → **SMTP Settings** and turn on **Enable custom SMTP**:
   - Sender email: `info@uniassist.net`
   - Sender name: `University Assist`
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: the Resend API key from step 2
4. Save. Under Authentication → Rate Limits, raise "emails per hour" (for example to 100) because the 2-per-hour default only applies to the built-in sender.

## Step 2 — Reduce bounces from the app (I do this after you approve)

- Check the custom email sender in the code to confirm it uses Resend and doesn't fall back to Supabase's built-in sender.
- Tighten the sign-up email check so made-up or mistyped addresses (for example `gmial.com`, addresses with no inbox, throwaway domains) are rejected before an email goes out.
- Stop any automated test accounts (QA addresses) from triggering real emails.

## Step 3 — Confirm the fix

- Send a test password reset and a test sign-up, and confirm they arrive from info@uniassist.net.
- Archive the warning in Supabase once emails are going through Resend.

## Technical details

- SMTP configuration lives in the Supabase dashboard, so it can't be changed from code; it needs your dashboard access.
- The code changes cover the `send-auth-email` edge function and the sign-up email validation (`src/lib/email-validation.ts`, `EmailInput`).
