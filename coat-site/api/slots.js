const { T, r } = require('./_lib');
module.exports = async (q, s) => {
  const d = String(q.query.date || '');
  if (!/^\d{4}-\d\d-\d\d$/.test(d)) return s.json({ taken: [] });
  const v = await r(['MGET', ...T.map((t) => 'slot:' + d + '_' + t)]);
  s.json({ taken: T.filter((t, i) => v[i]) });
};
