## Remove HubSpot inbound webhook

HubSpot is updated only from this app (outbound via `sync-hubspot-lead`, `hubspot-manage-deals`, `hubspot-sync-universities`). The inbound `hubspot-webhook` endpoint and its log table aren't needed and the unsigned endpoint is a security finding — removing it eliminates the issue entirely.

### Changes

1. **Delete edge function**
   - Remove `supabase/functions/hubspot-webhook/index.ts`
   - Remove `[functions.hubspot-webhook]` block from `supabase/config.toml`
   - Call `supabase--delete_edge_functions` for `hubspot-webhook` to remove the deployed function

2. **Drop the webhook log table** (new migration)
   - `DROP TABLE IF EXISTS public.hubspot_webhook_log CASCADE;`

3. **Clean up admin UI** (`src/pages/admin/AdminHubSpot.tsx`)
   - Remove the `webhookLogs` query (lines 261–272)
   - Remove the "Inbound Webhook Log" Card (lines 318–358)
   - Rename the Sync Log tab heading context to drop the "Outbound" qualifier (optional polish)

4. **Mark security finding resolved**
   - Note: the open scan findings shown are for `sync-hubspot-lead` and `enrich-cities-de`, not the webhook. Those are separate and not addressed here. The webhook removal closes the prior unsigned-webhook concern raised earlier in the conversation.

### Out of scope
- No changes to outbound HubSpot functions
- No changes to `hubspot_sync_log`
- The two scanner findings currently visible (`sync-hubspot-lead`, `enrich-cities-de`) are not part of this request