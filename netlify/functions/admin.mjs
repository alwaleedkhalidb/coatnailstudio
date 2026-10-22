import { r, token, authed, mail, list, pw, customerMail, json } from './_lib.mjs';

export default async (req) => {
  if (req.method !== 'POST') return new Response(null, { status: 405 });
  const b = await req.json().catch(() => ({}));

  if (b.action === 'login') {
    if (b.password === pw()) return json({ token: token() });
    await new Promise((x) => setTimeout(x, 800));
    return json({ e: 'Wrong password' }, 401);
  }
  if (!authed(req)) return json({ e: 'auth' }, 401);

  if (b.action === 'list') return json({ bookings: await list() });
  if (b.action === 'test') {
    const ok = await mail('COAT test email', 'Email reminders are working.');
    return json(ok ? { ok: 1 } : { e: 'Email isn’t set up yet. Add RESEND_API_KEY and OWNER_EMAIL in Netlify.' });
  }

  const raw = await r(['HGET', 'bookings', String(b.id)]);
  if (!raw) return json({ e: 'Not found' }, 404);
  const o = JSON.parse(raw);

  if (b.action === 'status' && ['confirmed', 'done', 'cancelled'].includes(b.status)) {
    o.status = b.status;
    await r(['HSET', 'bookings', o.id, JSON.stringify(o)]);
    if (b.status === 'confirmed' && o.em) { try { await customerMail(o, 'confirmed'); } catch (e) {} }
    if (b.status === 'cancelled') await r(['DEL', 'slot:' + o.d + '_' + o.t]);
  }
  if (b.action === 'remove') {
    await r(['HDEL', 'bookings', o.id]);
    await r(['DEL', 'slot:' + o.d + '_' + o.t]);
  }
  return json({ ok: 1 });
};
export const config = { path: '/api/admin' };
