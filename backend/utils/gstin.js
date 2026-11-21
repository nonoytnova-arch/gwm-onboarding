// GSTIN validation: format, check-digit (Luhn mod-36), and extraction of the
// embedded state code and PAN. This is real, self-contained validation logic
// (no external API needed) — it confirms a GSTIN is well-formed, not that it
// is currently active/registered with the government. A live status lookup
// needs a GSP/GST-API subscription; see lookupGstin() below for where to
// plug that in.

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
const CHECKSUM_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const GST_STATE_CODES = {
  '01': 'Jammu and Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh',
  '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan',
  '09': 'Uttar Pradesh', '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
  '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram', '16': 'Tripura',
  '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal', '20': 'Jharkhand',
  '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
  '25': 'Daman and Diu', '26': 'Dadra and Nagar Haveli', '27': 'Maharashtra',
  '28': 'Andhra Pradesh (Old)', '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep',
  '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry', '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana', '37': 'Andhra Pradesh', '38': 'Ladakh', '97': 'Other Territory'
};

function isValidFormat(gstin) {
  return typeof gstin === 'string' && GSTIN_REGEX.test(gstin.trim().toUpperCase());
}

// Luhn mod-36 check digit, as used for the 15th GSTIN character.
function isValidChecksum(gstin) {
  if (!gstin || gstin.length !== 15) return false;
  const value = gstin.toUpperCase();
  const mod = CHECKSUM_CHARS.length; // 36
  let factor = 2;
  let sum = 0;

  for (let i = value.length - 2; i >= 0; i--) {
    const codePoint = CHECKSUM_CHARS.indexOf(value[i]);
    if (codePoint === -1) return false;
    let digit = factor * codePoint;
    digit = Math.floor(digit / mod) + (digit % mod);
    sum += digit;
    factor = factor === 2 ? 1 : 2;
  }

  const checkCodePoint = (mod - (sum % mod)) % mod;
  return CHECKSUM_CHARS[checkCodePoint] === value[value.length - 1];
}

function extractStateCode(gstin) {
  return gstin.slice(0, 2);
}

function extractPan(gstin) {
  return gstin.slice(2, 12);
}

function getStateName(stateCode) {
  return GST_STATE_CODES[stateCode] || null;
}

function validate(gstinRaw) {
  const gstin = (gstinRaw || '').trim().toUpperCase();
  if (!isValidFormat(gstin)) {
    return { valid: false, reason: 'GSTIN format is invalid (expected 15 characters, e.g. 27ABCDE1234F1Z5)' };
  }
  if (!isValidChecksum(gstin)) {
    return { valid: false, reason: 'GSTIN check digit does not match — please re-check for typos' };
  }
  const stateCode = extractStateCode(gstin);
  return {
    valid: true,
    gstin,
    stateCode,
    stateName: getStateName(stateCode),
    pan: extractPan(gstin)
  };
}

// Stub: a real implementation calls a GSP (GST Suvidha Provider) API with
// GST_LOOKUP_API_KEY to confirm the GSTIN is currently ACTIVE and to fetch
// the registered legal name/address for prefill. Not wired up — requires a
// paid subscription. Until then this always returns null so the frontend
// falls back to manual entry rather than displaying fabricated data.
async function lookupGstin(gstin) {
  if (!process.env.GST_LOOKUP_API_KEY) {
    return null;
  }
  // TODO: call the real GSP API here once GST_LOOKUP_API_KEY is configured.
  return null;
}

module.exports = { isValidFormat, isValidChecksum, extractStateCode, extractPan, getStateName, validate, lookupGstin, GST_STATE_CODES };
