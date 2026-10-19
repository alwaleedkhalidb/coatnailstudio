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
const mail = async (subject, text) => {
  if (!process.env.RESEND_API_KEY || !process.env.OWNER_EMAIL) return false;
  const x = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.FROM_EMAIL || 'COAT Bookings <onboarding@resend.dev>', to: [process.env.OWNER_EMAIL], subject, text }),
  });
  return x.ok;
};
const list = async () => {
  const a = (await r(['HGETALL', 'bookings'])) || [];
  const o = [];
  for (let i = 0; i < a.length; i += 2) o.push(JSON.parse(a[i + 1]));
  return o;
};
module.exports = { T, r, token, authed, mail, list, pw };
