const { r, token, authed, mail, list, pw, customerMail } = require('./_lib');
module.exports = async (q, s) => {
  if (q.method !== 'POST') return s.status(405).end();
  const b = q.body || {};
  if (b.action === 'login') {
    if (b.password === pw()) return s.json({ token: token() });
    await new Promise((x) => setTimeout(x, 800));
    return s.status(401).json({ e: 'Wrong password' });
  }
  if (!authed(q)) return s.status(401).json({ e: 'auth' });
  if (b.action === 'list') return s.json({ bookings: await list() });
  if (b.action === 'test') {
    const ok = await mail('COAT test email', 'Email reminders are working.');
    return s.json(ok ? { ok: 1 } : { e: 'Email isn’t set up yet. Add RESEND_API_KEY and OWNER_EMAIL in Vercel.' });
  }
  const raw = await r(['HGET', 'bookings', String(b.id)]);
  if (!raw) return s.status(404).json({ e: 'Not found' });
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
  s.json({ ok: 1 });
};
