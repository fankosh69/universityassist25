
Goal: Fix signup failing with “email rate limit exceeded” and/or “Hook requires authorization token” by ensuring the Supabase Auth “Send Email” hook is correctly configured and the Edge Function receives the expected secret, then make the Edge Function more diagnosable (clear logs + graceful error) so this doesn’t happen again.

What we know from your logs
- Client (browser) is getting 429 `over_email_send_rate_limit` from `POST /auth/v1/signup`.
- Supabase Auth logs show earlier failures: `500: Hook requires authorization token` when calling the hook URL.
- Edge function logs show earlier failures: `Webhook verification failed: Error: Secret can't be empty.` which happens when the function constructs `new Webhook(hookSecret)` and `hookSecret` is empty.
- In the Lovable “project secrets” list, `SEND_EMAIL_HOOK_SECRET` is not visible (only `RESEND_API_KEY` etc. are present). This strongly suggests the secret is either not actually saved, saved under a different name, saved in the wrong place, or saved but not applied to the deployed function runtime yet.

Most likely root cause (why trying a different email still fails)
- The hook pipeline is still misconfigured, so Supabase keeps failing to send confirmation emails and throttles email sending to protect the system. Changing the email doesn’t help because the underlying “send email” mechanism is still failing/throttled.
- Additionally, “Hook requires authorization token” indicates the Auth Hook is calling your Edge Function without the required Bearer token (or with an empty one). That is configured in Supabase Auth Hook settings (not in code).

Planned fix (no code changes first; confirm config)
1) Confirm the Supabase Auth Hook configuration (this is the key)
   - Go to Supabase Dashboard → Authentication → Hooks → “Send email hook”.
   - Ensure:
     - URL is exactly: https://zfiexgjcuojodmnsinsz.supabase.co/functions/v1/send-auth-email
     - Authorization header is set (Bearer token) and is NOT blank.
       - If the UI provides “Generate secret”, use that, and it should look like `v1,whsec_...` (often prefixed with `v1,`).
   - Reason: Your auth logs explicitly show “Hook requires authorization token”, which only happens if this header is missing/empty.

2) Ensure the Edge Function secret matches the hook secret (must be identical)
   - Supabase Dashboard → Project Settings → Edge Functions → Secrets:
     - Name: SEND_EMAIL_HOOK_SECRET
     - Value: exactly the same `v1,whsec_...` secret used as the Auth Hook Bearer token.
   - Important: This value is case- and character-sensitive. A missing `v1,` prefix (if Supabase generated one) will break verification.

3) Verify that the secret is actually present in the project runtime
   - Because our tool-based “fetch secrets” list did not show `SEND_EMAIL_HOOK_SECRET`, we should re-check:
     - Whether it was added in the correct Supabase project (project ref: `zfiexgjcuojodmnsinsz`)
     - Whether the name is exactly correct
     - Whether it was saved successfully (sometimes the UI can fail to persist if you navigate away quickly)

4) Re-trigger one signup attempt only after the above is correct
   - Use one fresh email address.
   - Wait for the throttle window to clear (often 1–5 minutes depending on prior failures; repeated rapid retries can extend the cooldown).
   - Expected outcome:
     - Supabase Auth logs should no longer show “Hook requires authorization token”.
     - Edge function logs should show it received the webhook and successfully sent via Resend.

If config is correct but still failing, apply code hardening (implementation work)
5) Update `supabase/functions/send-auth-email/index.ts` to fail fast with a clear message when secrets are missing
   - Add safe logs (boolean only, never the secret values):
     - `SEND_EMAIL_HOOK_SECRET exists: true/false`
     - `RESEND_API_KEY exists: true/false`
     - `SUPABASE_URL exists: true/false`
   - If missing, return a 500 with a clear “Missing SEND_EMAIL_HOOK_SECRET in Edge Function secrets” message.
   - Reason: prevents confusing “Secret can’t be empty” errors and speeds up future debugging.

6) Add extra logging around webhook verification vs Resend sending
   - Distinguish:
     - Verification failures (wrong secret / wrong signature / wrong hook token)
     - Resend failures (domain not verified, wrong from address, etc.)
   - This lets us pinpoint the bottleneck in 1 attempt.

Rate-limit expectations (so it’s clear this isn’t “normal waiting between signups”)
- The waiting period is not a normal “one user signup per 2–3 minutes” product behavior.
- It’s a temporary anti-abuse throttle that kicks in when email sending repeatedly fails or is attempted too frequently.
- Once the hook is configured correctly and we stop hammering signups during failures, signups should behave normally.

Acceptance criteria for “fixed”
- A single signup attempt returns success (no 429).
- Supabase Auth logs show `request completed` for /signup with 200 (or expected status) and no hook errors.
- Edge function logs show:
  - webhook verified successfully
  - resend send succeeded
- The user receives the branded confirmation email.

Implementation sequencing (once you approve)
- Step A: Add code hardening + better logs in `send-auth-email` (so we can diagnose instantly)
- Step B: Deploy function
- Step C: Run a single signup attempt and validate logs + inbox delivery
- Step D: (Optional) add a small UX note on the signup UI: if Supabase returns `over_email_send_rate_limit`, show a friendly explanation and disable the button briefly to prevent repeated retries that worsen throttling

Risks / edge cases
- If the Resend domain isn’t verified for `info@uniassist.net`, Resend will reject sends even if the hook verifies. In that case we’ll see a Resend error in edge logs and fix by verifying the domain / adjusting the “from” address.
- If multiple signups are attempted in rapid succession while broken, the throttle can extend; we’ll avoid repeated attempts and use logs instead.

What I need from you (non-technical checklist)
- Confirm the Auth Hook “Send email hook” has a Bearer token configured (not blank).
- Confirm the token value looks like `v1,whsec_...` and paste only the prefix format (not the full secret) so we can confirm it matches the expected style, e.g. “It starts with v1,whsec_”.

Relevant links (for your convenience)
- Edge Function secrets: https://supabase.com/dashboard/project/zfiexgjcuojodmnsinsz/settings/functions
- Auth hooks: https://supabase.com/dashboard/project/zfiexgjcuojodmnsinsz/auth/hooks
- Edge Function logs: https://supabase.com/dashboard/project/zfiexgjcuojodmnsinsz/functions/send-auth-email/logs
