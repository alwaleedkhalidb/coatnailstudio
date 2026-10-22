const crypto = require('crypto');
const T = ['10:00', '12:00', '14:00', '16:00', '18:00'];
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOK = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const pw = () => process.env.ADMIN_PASSWORD || '1234';

const r = async (cmd) => {
  const x = await fetch(URL_, { method: 'POST', headers: { Authorization: 'Bearer ' + TOK }, body: JSON.stringify(cmd) });
  const j = await x.json();
  if (j.error) throw new Error(j.error);
  return j.result;
};
const token = () => crypto.createHmac('sha256', pw()).update('coat-admin').digest('hex');
const authed = (q) => {
  const a = Buffer.from(String(q.headers['x-token'] || '')), b = Buffer.from(token());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
// Sends an email with Resend. Goes to Rinad (OWNER_EMAIL) unless `to` is given.
const mail = async (subject, text, to, replyTo) => {
  const owner = process.env.OWNER_EMAIL;
  if (!process.env.RESEND_API_KEY || !(to || owner)) return false;
  const x = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL || 'COAT Bookings <onboarding@resend.dev>',
      to: [to || owner], subject, text, ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  if (!x.ok) console.error('email failed', x.status);
  return x.ok;
};
const pretty = (o) => new Date(o.d + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }) + ' at ' + o.t;
const customerMail = (o, kind) => {
  if (!o.em) return false;
  const det = `Service: ${o.s} (${o.p} OMR)\nDate: ${pretty(o)}\n`;
  const foot = `\nCOAT Nail Studio\nAl-Ma’abailah, Al-Seeb, Al-Nuzha Street\nInstagram: @coatnailstudio_\n`;
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
const list = async () => {
  const a = (await r(['HGETALL', 'bookings'])) || [];
  const o = [];
  for (let i = 0; i < a.length; i += 2) o.push(JSON.parse(a[i + 1]));
  return o;
};
module.exports = { T, r, token, authed, mail, customerMail, pretty, list, pw };
