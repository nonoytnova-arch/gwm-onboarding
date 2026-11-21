const crypto = require('crypto');

// Reference number shown to the submitter right after they submit, e.g.
// GWM-20261117-7F3A1C. Unique enough (date + random hex) without needing a
// database round-trip, and the date prefix makes it easy to locate in logs.
function generateReferenceNumber() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `GWM-${y}${m}${d}-${random}`;
}

// Draft/resume token — long, random, URL-safe.
function generateDraftToken() {
  return crypto.randomBytes(24).toString('hex');
}

module.exports = { generateReferenceNumber, generateDraftToken };
