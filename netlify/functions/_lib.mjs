import crypto from 'node:crypto';
import { sendSmtp } from './_smtp.mjs';
import { clientEmail } from './_mailtpl.mjs';

export const T = ['10:00', '12:00', '14:00', '16:00', '18:00'];
const URL_ = () => process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOK = () => process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
export const pw = () => process.env.ADMIN_PASSWORD || '1234';

export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

// Upstash Redis over its REST API — works from any host.
export const r = async (cmd) => {
  const u = URL_(), t = TOK();
  if (!u || !t) throw new Error('DB_NOT_CONFIGURED: set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN, then redeploy');
  const x = await fetch(u, { method: 'POST', headers: { Authorization: 'Bearer ' + t }, body: JSON.stringify(cmd) });
  const j = await x.json();
  if (j.error) throw new Error(j.error);
  return j.result;
};

export const token = () => crypto.createHmac('sha256', pw()).update('coat-admin').digest('hex');
export const authed = (req) => {
  const a = Buffer.from(String(req.headers.get('x-token') || '')), b = Buffer.from(token());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// Sends one plain-text email.
// Prefers Rinad's Gmail (works to any address, no domain needed); falls back to Resend.
export const mail = async (subject, text, to, replyTo, html) => {
  const owner = process.env.OWNER_EMAIL;
  const dest = to || owner;
  if (!dest) return false;

  const gu = process.env.GMAIL_USER, gp = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s/g, '');
  if (gu && gp) {
    try {
      return await sendSmtp({
        host: process.env.SMTP_HOST || 'smtp.gmail.com', port: +(process.env.SMTP_PORT || 465), secure: process.env.SMTP_PORT ? false : true, user: gu, pass: gp,
        from: `${process.env.FROM_NAME || 'COAT Nail Studio'} <${gu}>`,
        to: dest, replyTo: replyTo || gu, subject, text,
      });
    } catch (e) { console.error('gmail send failed', e.message); /* fall through to Resend */ }
  }

  if (!process.env.RESEND_API_KEY) return false;
  const x = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL || 'COAT Bookings <onboarding@resend.dev>',
      to: [dest], subject, text, ...(html ? { html } : {}), ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  if (!x.ok) console.error('resend failed', x.status);
  return x.ok;
};

export const pretty = (o) =>
  new Date(o.d + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }) + ' at ' + o.t;

export const customerMail = (o, kind) => {
  if (!o.em) return false;
  const e = clientEmail(o, kind);
  return mail(e.subject, e.text, o.em, process.env.OWNER_EMAIL, e.html);
};

export const clientReminder = (o) => customerMail(o, 'reminder');

export const list = async () => {
  const a = (await r(['HGETALL', 'bookings'])) || [];
  const o = [];
  for (let i = 0; i < a.length; i += 2) o.push(JSON.parse(a[i + 1]));
  return o;
};
