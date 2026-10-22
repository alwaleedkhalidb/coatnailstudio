# COAT Nail Studio

Static pages plus Netlify Functions in netlify/functions.

## Deploy on Netlify
1. Push these files to a GitHub repo (the contents, not the enclosing folder).
2. netlify.com > Add new site > Import an existing project > pick the repo > Deploy.
   Leave the build command empty and the publish directory as `.` (netlify.toml already sets this).
3. Create a free Redis database at upstash.com. Copy its REST URL and REST token.
4. Turn on 2-Step Verification on Rinad's Google account, then create an App Password
   (Google Account > Security > 2-Step Verification > App passwords). Copy the 16 characters.
5. In Netlify > Site configuration > Environment variables, add:

| Name | Value |
|---|---|
| UPSTASH_REDIS_REST_URL | from Upstash |
| UPSTASH_REDIS_REST_TOKEN | from Upstash |
| GMAIL_USER | Rinad's Gmail address |
| GMAIL_APP_PASSWORD | 16-character app password from Google (spaces are fine) |
| OWNER_EMAIL | where booking alerts go (usually the same Gmail) |
| ADMIN_PASSWORD | dashboard password — not 1234 |
| CRON_SECRET | any long random text |
| FROM_NAME | optional, the sender name shown to clients (default: COAT Nail Studio) |

6. Deploys > Trigger deploy > Deploy site.

## What happens
- A booking is saved, Rinad is emailed, and the client's phone opens WhatsApp with the details typed out for Rinad (number set in app.js as WA).
- The client gets a "request received" email, and a "confirmed" email when Rinad presses confirm.
- Daily at ~10:00 Oman time: Rinad gets a summary of today's and tomorrow's confirmed appointments, and every client with a confirmed appointment tomorrow gets a reminder email. Each booking is reminded once (a `rem` flag on the record).
- Dashboard: /studio (not in the menu; small link in the footer).

## Email
All mail goes out through Rinad's Gmail over SMTP (netlify/functions/_smtp.mjs, no dependencies).
Free Gmail allows up to 500 recipients per day, which is far more than this site will use.
If RESEND_API_KEY is set and Gmail fails or is not configured, it falls back to Resend.

## Custom domain
Netlify > Domain management > Add a domain, then follow its instructions. HTTPS is issued automatically.
