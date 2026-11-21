const crypto = require('crypto');
const db = require('../config/db');
const { isValidMobile } = require('../utils/validators');
const { sendSms } = require('../utils/notify');

function hashCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

// Sends a 6-digit OTP for resuming a saved draft. Real delivery requires an
// SMS provider (see utils/notify.js) — until one is configured, the code is
// only logged server-side and returned in the API response under devOtp,
// and ONLY when NODE_ENV is not 'production', so a real deployment never
// silently exposes OTPs to the client while still pretending "sent".
async function sendDraftOtp(req, res) {
  try {
    const { mobile } = req.body;
    if (!isValidMobile(mobile)) {
      return res.status(400).json({ message: 'Enter a valid 10-digit Indian mobile number' });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.query(
      'INSERT INTO otp_codes (mobile, code_hash, purpose, expires_at) VALUES (?, ?, ?, ?)',
      [mobile, hashCode(code), 'draft_resume', expiresAt]
    );

    const message = `Your Gale World Wide Movers OTP is ${code}. Valid for 10 minutes. Do not share this code.`;
    const result = await sendSms(mobile, message);

    const response = { message: 'OTP generated.', delivered: result.sent };
    if (process.env.NODE_ENV !== 'production') {
      response.devOtp = code; // dev/testing convenience only — see notify.js
      response.note = 'devOtp is only included because no SMS provider is configured; remove by setting NODE_ENV=production once one is.';
    }
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function verifyDraftOtp(req, res) {
  try {
    const { mobile, code } = req.body;
    if (!isValidMobile(mobile) || !code) {
      return res.status(400).json({ message: 'Mobile number and OTP code are required' });
    }

    const [rows] = await db.query(
      `SELECT id, code_hash, attempts, verified, expires_at FROM otp_codes
       WHERE mobile = ? AND purpose = 'draft_resume' ORDER BY created_at DESC LIMIT 1`,
      [mobile]
    );
    if (rows.length === 0) {
      return res.status(400).json({ message: 'No OTP was requested for this number' });
    }
    const otp = rows[0];
    if (otp.verified) {
      return res.status(400).json({ message: 'This OTP has already been used' });
    }
    if (new Date(otp.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }
    if (otp.attempts >= 5) {
      return res.status(429).json({ message: 'Too many incorrect attempts. Please request a new OTP.' });
    }
    if (otp.code_hash !== hashCode(code)) {
      await db.query('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?', [otp.id]);
      return res.status(400).json({ message: 'Incorrect OTP' });
    }

    await db.query('UPDATE otp_codes SET verified = TRUE WHERE id = ?', [otp.id]);

    const [drafts] = await db.query(
      `SELECT id, draft_token, role FROM submissions
       WHERE mobile = ? AND status = 'draft' ORDER BY updated_at DESC LIMIT 1`,
      [mobile]
    );

    if (drafts.length === 0) {
      return res.json({ verified: true, draft: null, message: 'No saved draft found for this number.' });
    }

    res.json({ verified: true, draft: { id: drafts[0].id, draftToken: drafts[0].draft_token, role: drafts[0].role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

module.exports = { sendDraftOtp, verifyDraftOtp };
