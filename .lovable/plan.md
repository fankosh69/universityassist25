## Why no draft email arrived today

The daily cron jobs DID fire on schedule (06:00 and 06:30 UTC today), but both `pg_net` HTTP calls **timed out after 5 seconds** before the edge function could complete:

```
2026-05-18 06:30:00  error_msg: Timeout of 5000 ms reached
2026-05-18 06:00:00  error_msg: Timeout of 5000 ms reached
```

No edge function logs exist for `blog-draft-generator` because the connection was severed before the AI call (Gemini 2.5 Pro article generation) could finish — it easily takes 15–60s. Result: no draft was inserted, no email was sent.

This is the default `pg_net` behavior — `net.http_post` has a 5 second timeout unless explicitly overridden.

## Fix

Re-schedule both cron jobs (`blog-discover-daily`, `blog-draft-daily`) with an explicit `timeout_milliseconds` argument of 120000 (2 min). Since the cron command contains the project's anon key (user-specific), per Lovable conventions this is run via a one-off SQL `insert` call (not a migration file):

```sql
select cron.unschedule('blog-draft-daily');
select cron.schedule(
  'blog-draft-daily', '30 6 * * *',
  $$ select net.http_post(
      url:='https://zfiexgjcuojodmnsinsz.supabase.co/functions/v1/blog-draft-generator',
      headers:='{"Content-Type":"application/json","Authorization":"Bearer <anon>"}'::jsonb,
      body:='{}'::jsonb,
      timeout_milliseconds:=120000
  ); $$
);
-- same pattern for blog-discover-daily
```

Then immediately trigger `blog-draft-generator` once manually so today's draft + notification email goes out for the existing `proposed` candidate (`uni assist germany`).

## Verification

- Check `net._http_response` tomorrow morning: should show `status_code: 200` instead of timeout.
- Confirm a draft email lands at info@uniassist.net.

No code or file changes required — this is a database-side scheduler fix.