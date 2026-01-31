
Goal
- You’re still hitting Supabase’s auth email throttle (`over_email_send_rate_limit`) even after we improved the UI. The UI change is working (it’s correctly detecting the throttle), but the backend is still refusing to send any more signup emails for a while.
- We’ll (1) confirm what is being rate-limited (per-email vs project-wide), (2) reduce user frustration with better UX paths, and (3) fix the root cause by moving off Supabase’s built-in email limits (or increasing them) via Auth settings / custom SMTP.

What we know from current evidence
- Network requests show `POST /auth/v1/signup` returning 429 with `{ code: "over_email_send_rate_limit" }`.
- This is happening even when you try a Gmail “+alias” address (which suggests the limit might be per-project, per-IP, or triggered by a recent burst—not just per exact email string).
- When Supabase returns this 429, the `send-auth-email` hook won’t help because the email is never queued for sending; the throttle happens before the hook runs.

1) Confirm the root cause (fast diagnostics)
A. Check if the throttle is project-wide
- Try signup from:
  - A different network/IP (e.g., mobile data) and a truly different email (not just +alias).
  - A different browser profile/incognito (reduces cached retries).
- Expected results:
  - If it works from a different IP/network, the throttle is likely IP-based/burst-abuse protection.
  - If it fails everywhere, it’s likely project-wide sending limits / auth rate limits.

B. Verify if Supabase is actually attempting to call the email hook
- Check Supabase Edge Function logs for `send-auth-email` while attempting signup after waiting.
- Expected results:
  - If you don’t see any `send-auth-email request received`, the signup is being blocked before hooks are invoked (pure rate limit).
  - If you do see it, we then need to ensure Resend domain/API key and hook secret are correct (but your current error is still 429 on signup, so likely not this path right now).

2) Improve the UX so users aren’t stuck (frontend changes)
Even when backend limits exist, we can guide users to successful paths and reduce “dead-end retries”.

A. Exponential backoff cooldown (instead of always 60s)
- Problem: Supabase’s throttle window can be longer than 60 seconds. A fixed 60s cooldown causes a frustrating loop.
- Change:
  - Track how many rate-limit hits occurred in the last N minutes (in component state + optionally localStorage).
  - Increase the cooldown progressively: 60s → 3m → 10m (cap at e.g. 10m).
  - Display “Estimated wait” messaging that matches reality: “This can take a few minutes after several attempts.”

B. Add alternate successful CTAs when throttled
- When `rateLimitCooldown > 0` show:
  - “Try Sign In instead” (some users already exist and are re-signing up).
  - “Use Magic Link Sign-In” (if you support it) to avoid password signup loops (still sends email, but it changes the flow and often reduces repeated signup spam).
  - “Change email” hint with example: use a truly different mailbox (not +alias) if the throttle is per provider/email family.

C. Make the error message more explicit and action-oriented
- Replace “Our email system is temporarily busy” with:
  - “We hit the email safety limit (429). This happens after multiple signup attempts. Please wait a few minutes and try again. If you already created an account, use Sign In.”
- Add a small “Why am I seeing this?” collapsible explanation to reduce support load.

D. Ensure the button re-enables reliably
- Add a small debug-safe UI indicator (only in dev) showing:
  - loading state
  - rateLimitCooldown
This helps confirm whether “button stays disabled” is UI state or backend refusal.

3) Fix the underlying cause (Supabase Auth configuration)
This is the real solution if you expect many signups concurrently.

A. Configure a custom SMTP provider in Supabase Auth (recommended for production scale)
- Supabase’s built-in email provider has conservative limits for abuse protection.
- By using your own SMTP provider (Resend SMTP, SendGrid SMTP, etc.), you typically gain higher throughput and more predictable deliverability.
- Implementation work is mostly configuration in Supabase Dashboard (no code changes needed for the throttle itself, though you’ll keep branded templates/hook if desired).

B. Review/adjust Supabase Auth rate limits (if your plan supports it)
- Supabase has configurable rate limits on Auth endpoints and email sending depending on plan.
- Increase limits appropriately for production; keep conservative limits in test.

C. Operational guidance
- During QA, avoid repeated signups with the same mailbox family.
- Prefer creating a few QA accounts once, then testing login/password reset flows rather than repeated signup attempts.

4) Acceptance criteria (how we’ll know it’s fixed)
- After configuration + UX improvements:
  - Signup attempts show either success OR a cooldown that realistically matches the throttle window (no misleading “try again in 60s” loop).
  - Users have at least one alternate path (Sign In / Magic Link) presented when throttled.
  - For production readiness: multiple different users can sign up within a short period without persistent 429s (assuming reasonable anti-abuse controls).

5) Files/components likely to change (implementation scope)
- `src/pages/Auth.tsx`
  - Exponential backoff logic
  - Throttle attempt counter + optional localStorage persistence
  - Additional CTA buttons and explanatory UI
- (Optional) `src/components/EmailInstructions.tsx` or a new small component
  - Reusable “rate limit explanation” / help text block

6) Risks / trade-offs
- Increasing or bypassing limits without anti-abuse measures can increase spam signups.
- If you add CAPTCHA later, it should be implemented carefully (and ideally server-verified) to keep signup secure.

7) What I need from you to proceed efficiently
- Confirm whether you want the “root fix” now:
  - Option 1: Only UX improvements (fast, but doesn’t remove Supabase throttle)
  - Option 2: UX improvements + configure custom SMTP / adjust Supabase Auth limits (recommended for real concurrent signups)
