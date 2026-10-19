const { T, r, mail } = require('./_lib');
module.exports = async (q, s) => {
  if (q.method !== 'POST') return s.status(405).end();
  const b = q.body || {};
  const c = (x) => String(x || '').slice(0, 200);
  const o = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), s: c(b.s), p: +b.p || 0, d: c(b.d), t: c(b.t), n: c(b.n), ph: c(b.ph), nt: c(b.nt), status: 'new', at: Date.now() };
  if (!o.s || !/^\d{4}-\d\d-\d\d$/.test(o.d) || !T.includes(o.t) || !o.n || !o.ph) return s.status(400).json({ e: 'Missing details' });
  if ((await r(['SET', 'slot:' + o.d + '_' + o.t, o.id, 'NX'])) !== 'OK') return s.status(409).json({ e: 'taken' });
  await r(['HSET', 'bookings', o.id, JSON.stringify(o)]);
  try {
    await mail(`New booking request: ${o.n}, ${o.d} at ${o.t}`,
      `${o.n} asked to book ${o.s} (${o.p} OMR)\nDate: ${o.d} at ${o.t}\nWhatsApp: ${o.ph}\nNotes: ${o.nt || 'none'}\n\nConfirm it in your studio dashboard.`);
  } catch (e) {}
  s.json({ ok: 1 });
};
