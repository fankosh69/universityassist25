## Goal
Send an email to admins each time the blog pipeline creates a new draft (manual, candidate-based, or daily cron), so you know when something is waiting for review at `/admin/blog`.

## Approach
Use Lovable's built-in email system (already configured — `info@uniassist.net` via the verified `notify` subdomain). Add one transactional template + invoke it from the existing `blog-draft-generator` edge function right after a draft is inserted.

## Steps

1. **Confirm app-email infrastructure is set up**
   - Verify the shared email queue + `send-transactional-email` function exists. If not, scaffold it (one-time setup). Auth emails are already live, so the domain + queue are ready.

2. **Add a new template** `blog-draft-ready` in `supabase/functions/_shared/transactional-email-templates/`
   - React Email component, branded with #2E57F6.
   - Props: `title`, `keyword`, `category`, `readingMinutes`, `adminUrl` (deep link to `/admin/blog`), `previewSnippet` (TL;DR).
   - Subject: `New blog draft ready: {title}`.
   - Register in `registry.ts`.

3. **Recipients list**
   - New table `blog_notification_recipients` (email, active) so you can add/remove addresses without redeploying. Seed with your address.
   - RLS: admin-only read/write (uses existing `has_role(auth.uid(), 'admin')`).
   - Alternative if you'd rather skip a table: hardcode `info@uniassist.net` as the single recipient. I'll default to the table approach unless you say otherwise.

4. **Trigger from `blog-draft-generator`**
   - After the successful `blog_posts` insert, fetch active recipients and, for each, call `send-transactional-email` with `idempotencyKey = draft-ready-{post.id}-{email}` so retries/cron re-runs never double-send.
   - Failures to send are logged but don't fail the draft creation.

5. **Small admin UI addition (optional, in `AdminBlog.tsx`)**
   - Tiny "Notifications" section listing recipients with add/remove. Skip if you only want one fixed address.

## Technical notes
- No new secrets needed.
- Daily cron path already calls `blog-draft-generator`, so the email fires automatically when the 06:30 UTC job creates a draft.
- Email body background stays white per platform rule; brand color used only for the CTA button.

## Open question
Do you want a managed recipients table (multi-address, editable in admin UI) or just hardcode `info@uniassist.net`?