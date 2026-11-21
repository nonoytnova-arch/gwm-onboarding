// AES-256-GCM encryption for sensitive fields at rest (bank account numbers).
// FIELD_ENCRYPTION_KEY in .env must be a 64-character hex string (32 bytes).
// Generate one with: openssl rand -hex 32

const crypto = require('crypto');

function getKey() {
  const hex = process.env.FIELD_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error('FIELD_ENCRYPTION_KEY must be set in .env as a 64-character hex string (32 bytes)');
  }
  return Buffer.from(hex, 'hex');
}

function encrypt(plainText) {
  if (plainText === null || plainText === undefined || plainText === '') return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Store iv + authTag + ciphertext together, base64, so it's one column value.
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

function decrypt(stored) {
  if (!stored) return null;
  const raw = Buffer.from(stored, 'base64');
  const iv = raw.subarray(0, 12);
  const authTag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

// For Aadhaar/ID proof: per the DPDP-compliance requirement, we never store
// the full number — only the last 4 digits, masked.
function maskToLast4(value) {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, '');
  if (digits.length < 4) return null;
  return `XXXX-XXXX-${digits.slice(-4)}`;
}

module.exports = { encrypt, decrypt, maskToLast4 };
