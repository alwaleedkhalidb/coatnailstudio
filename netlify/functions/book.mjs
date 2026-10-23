import { T, r, mail, pretty, customerMail, json } from './_lib.mjs';

export default async (req) => {
  if (req.method !== 'POST') return new Response(null, { status: 405 });

  // simple abuse guard: at most 8 requests per hour per visitor
  try {
    const ip = String(req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || 'local').split(',')[0].trim();
    const n = await r(['INCR', 'rl:' + ip]);
    if (n === 1) await r(['EXPIRE', 'rl:' + ip, 3600]);
    if (n > 8) return json({ e: 'slow down' }, 429);
  } catch (e) {
    console.error('booking store unreachable:', e.message);
    return json({ e: 'store' }, 503);
  }

  const b = await req.json().catch(() => ({}));
  const c = (x) => String(x || '').slice(0, 200);
  const o = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), s: c(b.s), p: +b.p || 0, d: c(b.d), t: c(b.t), n: c(b.n), ph: c(b.ph), em: c(b.em).trim().toLowerCase(), nt: c(b.nt), status: 'new', at: Date.now() };
  if (!o.s || !/^\d{4}-\d\d-\d\d$/.test(o.d) || !T.includes(o.t) || !o.n || !o.ph || !/^\S+@\S+\.\S+$/.test(o.em)) return json({ e: 'Missing details' }, 400);

  if ((await r(['SET', 'slot:' + o.d + '_' + o.t, o.id, 'NX'])) !== 'OK') return json({ e: 'taken' }, 409);
  await r(['HSET', 'bookings', o.id, JSON.stringify(o)]);

  try {
    await mail(`New booking request: ${o.n}, ${o.d} at ${o.t}`,
      `${o.n} asked to book ${o.s} (${o.p} OMR)\nDate: ${pretty(o)}\nWhatsApp: ${o.ph}\nEmail: ${o.em}\nNotes: ${o.nt || 'none'}\n\nConfirm it in your studio dashboard.`);
  } catch (e) {}
  let emailed = false;
  try { emailed = await customerMail(o, 'received'); } catch (e) {}
  return json({ ok: 1, emailed });
};
export const config = { path: '/api/book' };
