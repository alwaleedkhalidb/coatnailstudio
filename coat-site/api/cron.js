const { mail, list } = require('./_lib');
module.exports = async (q, s) => {
  if (process.env.CRON_SECRET && q.headers.authorization !== 'Bearer ' + process.env.CRON_SECRET) return s.status(401).end();
  const f = (x) => new Date(x).toISOString().slice(0, 10);
  const now = Date.now() + 4 * 36e5; // Oman time (UTC+4)
  const d0 = f(now), d1 = f(now + 864e5);
  const all = await list();
  const by = (d) => all.filter((b) => b.status === 'confirmed' && b.d === d).sort((a, b) => a.t.localeCompare(b.t))
    .map((b) => `${b.t}  ${b.n}  ${b.s}  ${b.ph}`).join('\n') || 'Nothing booked';
  const fresh = all.filter((b) => b.status === 'new').length;
  if (fresh || by(d0) !== 'Nothing booked' || by(d1) !== 'Nothing booked') {
    await mail('COAT: your appointments', `Today (${d0})\n${by(d0)}\n\nTomorrow (${d1})\n${by(d1)}\n\nNew requests waiting: ${fresh}`);
  }
  s.json({ ok: 1 });
};
