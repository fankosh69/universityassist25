
## Goal
Unblock signup testing immediately and prevent getting stuck in Supabase’s `over_email_send_rate_limit (429)` loop, while keeping production-safe anti-abuse behavior.

## What’s happening (confirmed)
- Your **frontend is working** and sending `POST /auth/v1/signup`.
- Supabase responds with **429** and body:
  - `{"code":"over_email_send_rate_limit","message":"email rate limit exceeded"}`
- This is happening **even with different emails**, which strongly suggests the limit is **project-wide and/or IP/burst based**, not “this exact email address”.
- Even if the “Send Email” hook works perfectly, **Supabase can still block signup before email sending** when its anti-abuse thresholds are hit.

## Immediate “stop wasting time” unblock options (pick one)
### Option A (fastest for testing): Create/confirm test users directly in Supabase
1. Go to Supabase Dashboard → **Auth → Users**
2. Create a user (or edit) and set **Email Confirmed** (if available)
3. Use “Sign In” in the app with that account and continue testing the rest of the product.

Pros: Instant, no code needed.  
Cons: Doesn’t validate the public signup experience.

### Option B (still fast): Temporarily disable email confirmations in Supabase (Test only)
1. Supabase Dashboard → **Auth settings**
2. Temporarily disable “Confirm email” (or set email confirmations off)
3. Signup should work again immediately (no email sent/required)

Pros: Lets you test signup without waiting.  
Cons: Not production-ready; we re-enable later.

### Option C (proper long-term): Increase/adjust Auth rate limits / anti-abuse settings
1. Supabase Dashboard → **Auth → Rate Limits** (or Security/Abuse controls depending on UI)
2. Increase allowed email sends / signup attempts (plan-dependent)

Pros: Real fix for real traffic.  
Cons: Might require paid plan/support; still should keep anti-abuse.

## Code changes to implement (so users aren’t trapped when 429 happens)
Even after you unblock yourself, real users can hit this too. We’ll make the UI smarter and more actionable.

### 1) Read and respect server-provided wait time (Retry-After) when available
- Update signup error handling to:
  - Detect `429` + `over_email_send_rate_limit`
  - Prefer `Retry-After` header (if Supabase sends it)
  - Otherwise fall back to exponential backoff (already present)

Outcome: the app won’t keep telling users “wait 60s” if Supabase is effectively blocking for longer.

### 2) Add “safe escape hatches” on the rate-limit screen
When throttled, show 2–3 clear actions:
- “Try Sign In instead” (many users are re-signing up by mistake)
- “Use a different network” (mobile data / different Wi‑Fi) if IP-based throttling is likely
- “Continue with a QA account” (in non-production/test mode), optional

Outcome: user can keep moving without repeating failed signups.

### 3) Reduce accidental repeated signups from the UI
- Disable the submit button during loading (already)
- Add a short client-side guard against double-submit (e.g., ignore if already submitting)
- Ensure we don’t automatically retrigger signup due to state changes

Outcome: fewer bursts that trigger rate limits.

### 4) (Optional but recommended) Add a “Resend confirmation email” + “Didn’t get it?” flow
- If user already exists but unconfirmed, guide them to:
  - Sign in → if blocked, send recovery / resend confirmation via supported Supabase flow
- This reduces repeated “signup spam” attempts.

## Verification steps (what you’ll do, no more agent testing)
1. Try signup once.
2. If it returns 429:
   - confirm the UI shows a realistic wait (Retry-After or longer cooldown)
   - confirm the UI offers Sign In + alternate actions
3. Create a QA user in Supabase and verify Sign In works end-to-end (dashboard loads, profile created, etc.).

## Technical notes (for implementation)
- Files involved:
  - `src/pages/Auth.tsx` (rate-limit detection + cooldown calculation + extra CTA buttons)
  - Potentially `src/components/auth/RateLimitAlert.tsx` (add “Use different network / Sign in / QA account” actions)
- I also reviewed DOB handling:
  - There is a known edge case where typed DOB may not propagate to parent state until blur if incomplete; you reported DOB is fine, so we won’t touch it unless you want it hardened.

## Supabase dashboard links you’ll likely need
- Auth Users (for QA accounts)
- Auth Rate Limits / Auth Settings

If you approve this plan, I’ll implement the improved 429 handling + escape hatches in the signup UI so you can proceed smoothly even when Supabase throttles.