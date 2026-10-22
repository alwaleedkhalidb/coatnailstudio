# COAT Nail Studio

Static pages plus Vercel serverless functions in /api.

## Settings to add in Vercel (Settings > Environment Variables)
| Name | What it is |
|---|---|
| ADMIN_PASSWORD | Password for /studio. Defaults to 1234 if missing, so set a stronger one. |
| RESEND_API_KEY | API key from resend.com |
| OWNER_EMAIL | Rinad's email. Booking alerts go here. |
| CRON_SECRET | Any long random text. |
| FROM_EMAIL | Optional until you have a domain. Example: COAT Nail Studio <bookings@yourdomain.com> |

Connect a Redis database from Vercel > Storage > Upstash. It adds its own settings.

## Emails
- Rinad gets an email for every new booking, and a daily summary around 10:00 Oman time.
- Clients get a "request received" email, and a "confirmed" email when Rinad presses confirm in the dashboard.
- Until a domain is verified in Resend and FROM_EMAIL is set, Resend only delivers to the email the Resend account was made with. So Rinad's emails work, client emails don't.
- A booking is never blocked if an email fails.

## WhatsApp
After booking, the client's phone opens WhatsApp to Rinad with the details typed out (number set in app.js as WA).
