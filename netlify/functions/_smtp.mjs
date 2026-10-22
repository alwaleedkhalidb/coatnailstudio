import net from 'node:net';
import tls from 'node:tls';

// Minimal SMTP client — enough to send one plain-text email through Gmail.
// Avoids a dependency, so Netlify needs no npm install step.
const b64 = (s) => Buffer.from(s, 'utf8').toString('base64');
// RFC 2047 encoded-word, so non-ASCII subjects (’ and the like) survive
const header = (s) => (/^[\x20-\x7E]*$/.test(s) ? s : '=?UTF-8?B?' + b64(s) + '?=');

export async function sendSmtp({ host, port, secure = true, user, pass, from, to, replyTo, subject, text, timeout = 15000 }) {
  const sock = secure
    ? tls.connect({ host, port, servername: host })
    : net.connect({ host, port });

  let buf = '';
  const waiters = [];
  sock.setEncoding('utf8');
  sock.setTimeout(timeout);

  const fail = (e) => { while (waiters.length) waiters.shift().reject(e); sock.destroy(); };
  sock.on('error', fail);
  sock.on('timeout', () => fail(new Error('SMTP timeout')));
  sock.on('data', (d) => {
    buf += d;
    // a reply ends with a line like "250 ..." (space, not hyphen, after the code)
    let m;
    while ((m = buf.match(/^(?:\d{3}-[^\n]*\n)*(\d{3}) [^\n]*\n/))) {
      const chunk = buf.slice(0, m[0].length);
      buf = buf.slice(m[0].length);
      const w = waiters.shift();
      if (w) w.resolve({ code: +m[1], text: chunk.trim() });
    }
  });

  const reply = () => new Promise((resolve, reject) => waiters.push({ resolve, reject }));
  const say = async (line, expect) => {
    sock.write(line + '\r\n');
    const r = await reply();
    if (expect && !expect.includes(r.code)) throw new Error('SMTP ' + r.code + ': ' + r.text);
    return r;
  };

  try {
    await new Promise((res, rej) => { sock.once(secure ? 'secureConnect' : 'connect', res); sock.once('error', rej); });
    const greet = await reply();
    if (greet.code !== 220) throw new Error('SMTP greeting ' + greet.code);

    await say('EHLO coat', [250]);
    await say('AUTH LOGIN', [334]);
    await say(b64(user), [334]);
    await say(b64(pass), [235]);
    await say(`MAIL FROM:<${user}>`, [250]);
    await say(`RCPT TO:<${to}>`, [250, 251]);
    await say('DATA', [354]);

    const msg = [
      `From: ${from}`,
      `To: <${to}>`,
      replyTo ? `Reply-To: <${replyTo}>` : null,
      `Subject: ${header(subject)}`,
      `Date: ${new Date().toUTCString()}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      b64(text).replace(/(.{76})/g, '$1\r\n'),
    ].filter((l) => l !== null).join('\r\n');

    sock.write(msg + '\r\n.\r\n');
    const sent = await reply();
    if (sent.code !== 250) throw new Error('SMTP send ' + sent.code + ': ' + sent.text);
    try { await say('QUIT'); } catch (e) {}
    return true;
  } finally {
    sock.destroy();
  }
}
