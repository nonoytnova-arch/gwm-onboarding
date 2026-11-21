const crypto = require('crypto');
const db = require('../config/db');

function hashAnswer(answer) {
  return crypto.createHash('sha256').update(String(answer).trim().toLowerCase()).digest('hex');
}

// Simple arithmetic CAPTCHA — generated and checked server-side (the answer
// is never sent to the client, only its hash is stored), so it can't be
// bypassed by reading the page source. Good enough to stop simple scripted
// form-spam; a determined attacker would still need a reputable CAPTCHA
// service (hCaptcha/reCAPTCHA) swapped in here for stronger protection.
async function getCaptcha(req, res) {
  try {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    const question = `What is ${a} + ${b}?`;
    const answer = a + b;
    const id = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.query('INSERT INTO captcha_challenges (id, answer_hash, expires_at) VALUES (?, ?, ?)', [
      id,
      hashAnswer(answer),
      expiresAt
    ]);

    res.json({ captchaId: id, question });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// Used internally by the final-submit flow, not exposed as its own route.
async function verifyCaptcha(captchaId, answer) {
  if (!captchaId || answer === undefined || answer === null) return false;
  const [rows] = await db.query('SELECT answer_hash, expires_at FROM captcha_challenges WHERE id = ?', [captchaId]);
  if (rows.length === 0) return false;
  const row = rows[0];
  // One-time use: delete immediately so the same challenge can't be replayed.
  await db.query('DELETE FROM captcha_challenges WHERE id = ?', [captchaId]);
  if (new Date(row.expires_at).getTime() < Date.now()) return false;
  return row.answer_hash === hashAnswer(answer);
}

module.exports = { getCaptcha, verifyCaptcha };
