import { mail, list, json, r, clientReminder } from './_lib.mjs';

// Runs daily on Netlify's scheduler (see netlify.toml). Also callable by hand with CRON_SECRET.
export default async (req) => {
  const body = await req.json().catch(() => ({}));
  const scheduled = !!body.next_run;
  const secret = process.env.CRON_SECRET;
  if (!scheduled && secret && req.headers.get('authorization') !== 'Bearer ' + secret) return new Response(null, { status: 401 });

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
  // day-before reminders to clients (each booking is reminded once)
  let reminded = 0;
  for (const bk of all) {
    if (bk.status !== 'confirmed' || bk.d !== d1 || bk.rem) continue;
    try {
      if (await clientReminder(bk)) {
        bk.rem = 1;
        await r(['HSET', 'bookings', bk.id, JSON.stringify(bk)]);
        reminded++;
      }
    } catch (e) { console.error('reminder failed', bk.id, e.message); }
  }

  return json({ ok: 1, reminded });
};
