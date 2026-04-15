

## Plan: Full HubSpot Bi-Directional Integration

### Summary
Build 5 edge functions and an Admin CRM panel to enable full bi-directional HubSpot sync: read contacts, create deals, sync universities as companies, receive webhooks, and view CRM data in admin.

### 1. Edge Function: `hubspot-read-contacts`
- New edge function that proxies HubSpot CRM v3 `GET /crm/v3/objects/contacts` through the gateway
- Supports search by email, pagination, and fetching specific contact properties
- Admin-only (validate JWT + admin role)
- Used by the Admin CRM panel to display HubSpot contact data alongside student profiles

### 2. Edge Function: `hubspot-manage-deals`
- New edge function for creating/updating HubSpot deals via gateway
- `POST` to create a deal when a student submits an application (triggered from the app)
- Maps application data → deal properties (student name, program, university, stage)
- Also supports `GET` to list deals for a contact
- Admin-only access

### 3. Edge Function: `hubspot-sync-universities`
- New edge function that syncs universities from the `universities` table to HubSpot as Companies
- Uses `POST /crm/v3/objects/companies` via gateway
- Maps: university name → company name, city, website, type (public/private)
- Supports bulk sync (all universities) or single university sync
- Stores `hubspot_company_id` back in the universities table (new column)
- Admin-only trigger

### 4. Edge Function: `hubspot-webhook`
- New edge function to receive HubSpot webhook events
- Handles contact property changes → updates relevant profile/academic data in Supabase
- Handles deal stage changes → updates application status
- Validates webhook signature for security
- No JWT required (incoming from HubSpot), but validates via shared secret

### 5. Admin CRM Panel Page (`/admin/hubspot`)
- New admin page added to sidebar with HubSpot icon
- **Contacts tab**: Search/browse HubSpot contacts, view mapped properties, see sync status from `hubspot_sync_log`
- **Deals tab**: View deals by contact, create new deals, update deal stages
- **Companies tab**: View synced universities, trigger sync for individual or all universities
- **Sync Log tab**: Show recent entries from `hubspot_sync_log` with status/errors

### 6. Database Migration
- Add `hubspot_company_id` column to `universities` table
- Add `hubspot_deal_id` column to `user_applications` table
- Create `hubspot_webhook_log` table for incoming webhook audit trail

### Technical Details

**All edge functions use the connector gateway pattern:**
```
Gateway: https://connector-gateway.lovable.dev/hubspot
Headers: Authorization: Bearer ${LOVABLE_API_KEY}, X-Connection-Api-Key: ${HUBSPOT_API_KEY}
```

**University → Company property mapping:**
- `name` → `name`
- `website` → `website`  
- `city` → `city`
- `institution_type` → `industry` (mapped to "Higher Education")
- `country_code` → `country`

**Files to create:**
- `supabase/functions/hubspot-read-contacts/index.ts`
- `supabase/functions/hubspot-manage-deals/index.ts`
- `supabase/functions/hubspot-sync-universities/index.ts`
- `supabase/functions/hubspot-webhook/index.ts`
- `src/pages/admin/AdminHubSpot.tsx`

**Files to edit:**
- `src/components/admin/AdminSidebar.tsx` — add HubSpot menu item
- `src/App.tsx` — add `/admin/hubspot` route
- Database migration for new columns and webhook log table

