import crypto from 'node:crypto';
import { sendSmtp } from './_smtp.mjs';

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
export const mail = async (subject, text, to, replyTo) => {
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
      to: [dest], subject, text, ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  if (!x.ok) console.error('resend failed', x.status);
  return x.ok;
};

export const pretty = (o) =>
  new Date(o.d + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }) + ' at ' + o.t;

export const customerMail = (o, kind) => {
  if (!o.em) return false;
  const det = `Service: ${o.s} (${o.p} OMR)\nDate: ${pretty(o)}\n`;
  const foot = `\nCOAT Nail Studio\nAl-Maabilah, Al-Seeb, Al-Nuzha Street\nInstagram: @coatnailstudio_\n`;
  const hi = `Hi ${o.n},\n\n`;
  if (kind === 'confirmed') {
    return mail('Your COAT Nail Studio appointment is confirmed',
      hi + 'Your appointment is confirmed.\n\n' + det +
      '\nPlease arrive on time. After a 30-minute grace period the appointment is cancelled and the deposit is forfeited. You can reschedule up to 24 hours before.\nNo extra guests or children, please.\n' + foot,
      o.em, process.env.OWNER_EMAIL);
  }
  return mail('COAT Nail Studio: we got your booking request',
    hi + 'Thanks for booking with COAT Nail Studio. Here’s your request:\n\n' + det +
    `\nYour time isn’t confirmed until Rinad receives the 5 OMR deposit. She’ll message you on WhatsApp (${o.ph}) with the deposit details and the exact location.\n\n` +
    'Good to know:\n- The deposit goes toward your service and can’t be refunded.\n- You can reschedule up to 24 hours before your appointment.\n- Please arrive on time. After a 30-minute grace period the appointment is cancelled and the deposit is forfeited.\n- No extra guests or children.\n' + foot,
    o.em, process.env.OWNER_EMAIL);
};

export const clientReminder = (o) => {
  if (!o.em) return false;
  return mail('Reminder: your COAT appointment is tomorrow',
    `Hi ${o.n},\n\nJust a reminder about your appointment tomorrow.\n\n` +
    `Service: ${o.s} (${o.p} OMR)\nWhen: ${pretty(o)}\nWhere: Al-Maabilah, Al-Seeb, Al-Nuzha Street\n\n` +
    'Please arrive on time — there is a 30-minute grace period, after which the appointment is cancelled and the deposit is forfeited.\n' +
    'No extra guests or children, please.\n\n' +
    'Need to change it? Message Rinad on WhatsApp as soon as you can.\n\n' +
    'See you tomorrow!\nCOAT Nail Studio\nInstagram: @coatnailstudio_\n',
    o.em, process.env.OWNER_EMAIL);
};

export const list = async () => {
  const a = (await r(['HGETALL', 'bookings'])) || [];
  const o = [];
  for (let i = 0; i < a.length; i += 2) o.push(JSON.parse(a[i + 1]));
  return o;
};
