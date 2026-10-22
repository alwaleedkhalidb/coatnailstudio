import { T, r, json } from './_lib.mjs';

export default async (req) => {
  const d = new URL(req.url).searchParams.get('date') || '';
  if (!/^\d{4}-\d\d-\d\d$/.test(d)) return json({ taken: [] });
  const v = await r(['MGET', ...T.map((t) => 'slot:' + d + '_' + t)]);
  return json({ taken: T.filter((t, i) => v[i]) });
};
export const config = { path: '/api/slots' };
