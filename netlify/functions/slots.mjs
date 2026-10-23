import { T, r, json } from './_lib.mjs';

export default async (req) => {
  const d = new URL(req.url).searchParams.get('date') || '';
  if (!/^\d{4}-\d\d-\d\d$/.test(d)) return json({ taken: [] });
  try {
    const v = await r(['MGET', ...T.map((t) => 'slot:' + d + '_' + t)]);
    return json({ taken: T.filter((t, i) => v[i]) });
  } catch (e) {
    // never break the booking form over a lookup — just show every time as free
    console.error('slots lookup failed:', e.message);
    return json({ taken: [], warn: e.message.split(':')[0] });
  }
};
export const config = { path: '/api/slots' };
