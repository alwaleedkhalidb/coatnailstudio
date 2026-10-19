# COAT Nail Studio

Static pages plus Vercel serverless functions in /api.

## Settings to add in Vercel (Settings > Environment Variables)
| Name | What it is |
|---|---|
| ADMIN_PASSWORD | Password for /studio. Defaults to 1234 if missing, so set a stronger one. |
| RESEND_API_KEY | API key from resend.com |
| OWNER_EMAIL | Where booking emails go. Until a domain is verified in Resend, this must be the email the Resend account was made with. |
| CRON_SECRET | Any long random text. |

Connect a Redis database from Vercel > Storage > Upstash. It adds KV_REST_API_URL and KV_REST_API_TOKEN by itself.

## What happens
- A booking is saved, Rinad is emailed, and the client's phone opens WhatsApp with the details already typed for Rinad (number set in app.js as WA).
- Every morning around 10:00 Oman time Rinad gets an email listing today's and tomorrow's confirmed appointments.
- The dashboard is at /studio.
