// Branded HTML email matching the site, with a plain-text twin for clients that strip HTML.
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const DEPOSIT = 5;
const ADDRESS = 'Al-Maabilah, Al-Seeb, Al-Nuzha Street';
const IG = 'https://www.instagram.com/coatnailstudio_/';

export const pretty = (o) =>
  new Date(o.d + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

const firstName = (n) => String(n || '').trim().split(/\s+/)[0] || 'there';
// stored as "category / service"; drop the category when the service already says it
const svc = (v) => {
  const i = String(v || '').indexOf(' / ');
  if (i < 0) return String(v || '');
  const cat = v.slice(0, i), name = v.slice(i + 3);
  return name.toLowerCase().startsWith(cat.toLowerCase()) ? name : `${cat} · ${name}`;
};
const balance = (p) => Math.max(0, (+p || 0) - DEPOSIT);

// kind: 'received' | 'confirmed' | 'reminder'
const COPY = {
  received: (o) => ({
    subject: `We’ve got your booking, ${firstName(o.n)}`,
    lead: 'Your spot is nearly yours.',
    body: [
      `Rinad will message you on WhatsApp at ${o.ph} with the deposit details. Once your ${DEPOSIT} OMR deposit lands, your appointment is locked in — and it comes off your total, so there’s ${balance(o.p)} OMR to pay at the studio.`,
    ],
    notes: [
      'Please arrive on time. There’s a 30-minute grace period, and after that the appointment is cancelled.',
      'Deposits aren’t refundable, so pick a time you’re sure about.',
      'Need to move it? Let Rinad know at least 24 hours ahead.',
      'It’s a small, calm space — no extra guests or children, please.',
    ],
    sign: 'Can’t wait to do your nails.',
  }),
  confirmed: (o) => ({
    subject: 'You’re all set — your COAT appointment is confirmed',
    lead: 'You’re booked in.',
    body: [
      `There’s ${balance(o.p)} OMR to pay at the studio. We’re at ${ADDRESS}.`,
    ],
    notes: [
      'Please arrive on time — there’s a 30-minute grace period.',
      'If something changes, message Rinad at least 24 hours ahead.',
      'No extra guests or children, so the studio stays calm for everyone.',
    ],
    sign: 'See you then.',
  }),
  reminder: (o) => ({
    subject: 'Tomorrow’s the day — your COAT appointment',
    lead: 'Just a reminder: we’ll see you tomorrow.',
    body: [
      `There’s ${balance(o.p)} OMR to pay at the studio. We’re at ${ADDRESS}.`,
    ],
    notes: [
      'Come on time — there’s a 30-minute grace period.',
      'If something’s come up, message Rinad as soon as you can.',
    ],
    sign: 'See you tomorrow.',
  }),
};

export function clientEmail(o, kind) {
  const c = COPY[kind](o);
  const when = `${pretty(o)} at ${o.t}`;

  const text =
`Hi ${firstName(o.n)},

${c.lead}

  ${svc(o.s)}
  ${when}
  ${o.p} OMR

${c.body.join('\n\n')}

${c.notes.map((n) => '- ' + n).join('\n')}

${c.sign}

COAT Nail Studio
${ADDRESS}
Instagram: @coatnailstudio_
`;

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#efe8e3;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#efe8e3;padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FBF6F3;border-radius:22px;overflow:hidden;">

<tr><td style="background:#201d1b;padding:30px 32px;text-align:center;">
  <div style="font-family:Georgia,'Times New Roman',serif;font-size:38px;letter-spacing:10px;color:#FBF6F3;">COAT</div>
  <div style="font-family:Georgia,serif;font-size:12px;letter-spacing:3px;color:#b6aaa1;padding-top:8px;">NAIL STUDIO</div>
</td></tr>

<tr><td style="padding:34px 32px 0;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#262626;">
  <p style="margin:0 0 6px;font-size:16px;">Hi ${esc(firstName(o.n))},</p>
  <p style="margin:0 0 24px;font-family:Georgia,serif;font-size:25px;line-height:1.3;color:#201d1b;">${esc(c.lead)}</p>
</td></tr>

<tr><td style="padding:0 32px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #ded2cb;border-bottom:1px solid #ded2cb;">
    <tr><td style="padding:18px 0;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;">
      <div style="font-size:17px;color:#201d1b;font-weight:600;">${esc(svc(o.s))}</div>
      <div style="font-size:15px;color:#262626;padding-top:7px;">${esc(when)}</div>
      <div style="font-size:15px;color:#7d7670;padding-top:7px;">${esc(o.p)} OMR</div>
    </td></tr>
  </table>
</td></tr>

<tr><td style="padding:22px 32px 0;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#262626;font-size:15px;line-height:1.65;">
  ${c.body.map((p) => `<p style="margin:0 0 15px;">${esc(p)}</p>`).join('')}
</td></tr>

<tr><td style="padding:6px 32px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3ece7;border-radius:16px;">
    <tr><td style="padding:17px 20px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:13.5px;line-height:1.75;color:#5d5650;">
      ${c.notes.map((n) => `<div style="padding:2px 0;">${esc(n)}</div>`).join('')}
    </td></tr>
  </table>
</td></tr>

<tr><td style="padding:24px 32px 32px;font-family:Georgia,serif;font-size:19px;color:#201d1b;">${esc(c.sign)}</td></tr>

<tr><td style="background:#201d1b;padding:22px 32px;text-align:center;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:12.5px;line-height:1.8;color:#b6aaa1;">
  <div style="color:#FBF6F3;letter-spacing:2px;">COAT NAIL STUDIO</div>
  <div>${esc(ADDRESS)}</div>
  <div><a href="${IG}" style="color:#b6aaa1;text-decoration:none;">@coatnailstudio_</a></div>
</td></tr>

</table></td></tr></table></body></html>`;

  return { subject: c.subject, text, html };
}
