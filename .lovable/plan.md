

## Plan: Migrate HubSpot Edge Function to Connector Gateway

### Problem
The `sync-hubspot-lead` edge function currently calls `api.hubapi.com` directly using a manually managed `HUBSPOT_ACCESS_TOKEN`. The HubSpot connector is now linked, providing automatic OAuth token refresh via the connector gateway.

### Changes

**Single file edit: `supabase/functions/sync-hubspot-lead/index.ts`**

1. Replace `HUBSPOT_API_BASE` (`https://api.hubapi.com`) with gateway URL: `https://connector-gateway.lovable.dev/hubspot`
2. Update `hubspotRequest()` to use two headers instead of one:
   - `Authorization: Bearer ${LOVABLE_API_KEY}` (gateway auth)
   - `X-Connection-Api-Key: ${HUBSPOT_API_KEY}` (connection identifier)
3. Replace `HUBSPOT_ACCESS_TOKEN` env var reads with `LOVABLE_API_KEY` + `HUBSPOT_API_KEY`
4. Update error messages to reference the new env var names

All business logic (property mapping, sync types, logging) stays identical. Only the HTTP transport layer changes.

### Technical Details
- The gateway URL pattern: `https://connector-gateway.lovable.dev/hubspot/crm/v3/objects/contacts/...`
- The gateway automatically refreshes OAuth tokens, eliminating manual token management
- After editing, the function will be deployed automatically

### Post-deploy
- The old `HUBSPOT_ACCESS_TOKEN` secret can be removed from Supabase function secrets (optional cleanup)

