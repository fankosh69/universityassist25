
The user's custom domain `uniassist.net` works without `www.` but fails when prefixed with `www.`. This is a DNS/domain configuration issue, not a code issue.

Per Lovable's custom domain docs:
- Both `yourdomain.com` AND `www.yourdomain.com` must be added as **separate entries** in Project Settings → Domains
- `www` is NOT auto-added
- An A record for `www` pointing to `185.158.133.1` must exist at the registrar

The user likely only connected the root domain (`uniassist.net`) and never added the `www.uniassist.net` entry, OR added the entry in Lovable but never created the corresponding DNS A record at their registrar.

This is a configuration task the user must do themselves — no code changes needed.

## Why `www.uniassist.net` doesn't work

Lovable treats `uniassist.net` and `www.uniassist.net` as two separate domains. You connected the root, but `www` was never added — so browsers visiting `www.uniassist.net` get no response from Lovable.

## Fix (2 steps)

**Step 1 — Add `www` in Lovable**
1. Go to **Project Settings → Domains**
2. Click **Connect Domain**
3. Enter `www.uniassist.net` (full subdomain)
4. Lovable will show you the DNS record to add

**Step 2 — Add the DNS record at your registrar**
At wherever you bought/manage `uniassist.net`, add:
- **Type:** A
- **Name:** `www`
- **Value:** `185.158.133.1`

(If you bought the domain through Lovable, use **⋯ → Configure → Manage DNS records** instead.)

**Step 3 — Pick a primary**
Once both are Active, set one as **Primary** in Project Settings → Domains. The other will redirect to it (recommended: redirect `www` → root, or vice versa, your choice).

DNS propagation can take a few minutes up to 72 hours. SSL is provisioned automatically once verified.

## If you're using Cloudflare
When connecting `www`, expand **Advanced** in the Connect Domain dialog and check **"Domain uses Cloudflare or a similar proxy"** — this switches to CNAME-based verification.

No code changes are needed for this — it's purely DNS configuration.
