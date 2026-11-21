// Client-side format validation — fast feedback as the user types. The
// server independently re-validates everything on submit (never trust the
// client alone), so these exist purely for UX, not security.

const CHECKSUM_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const MOBILE_REGEX = /^[6-9][0-9]{9}$/;
const PINCODE_REGEX = /^[1-9][0-9]{5}$/;
const VEHICLE_NUMBER_REGEX = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/;

export function isValidGstinChecksum(gstinRaw) {
  const value = (gstinRaw || '').toUpperCase();
  if (value.length !== 15) return false;
  const mod = CHECKSUM_CHARS.length;
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

export function validateGstin(value) {
  const gstin = (value || '').trim().toUpperCase();
  if (!gstin) return null; // handled by required-field check separately
  if (!GSTIN_REGEX.test(gstin)) return 'GSTIN format looks incorrect (expected 15 characters, e.g. 27ABCDE1234F1Z5)';
  if (!isValidGstinChecksum(gstin)) return 'GSTIN check digit does not match — please check for typos';
  return null;
}

export function validatePan(value) {
  const pan = (value || '').trim().toUpperCase();
  if (!pan) return null;
  return PAN_REGEX.test(pan) ? null : 'PAN format looks incorrect (expected like ABCDE1234F)';
}

export function validateMobile(value) {
  const mobile = (value || '').trim();
  if (!mobile) return null;
  return MOBILE_REGEX.test(mobile) ? null : 'Enter a valid 10-digit Indian mobile number';
}

export function validatePincode(value) {
  const pincode = (value || '').trim();
  if (!pincode) return null;
  return PINCODE_REGEX.test(pincode) ? null : 'Pincode must be 6 digits';
}

export function validateVehicleNumber(value) {
  const v = (value || '').toUpperCase().replace(/[\s-]/g, '');
  if (!v) return null;
  return VEHICLE_NUMBER_REGEX.test(v) ? null : 'Vehicle number format looks incorrect (expected like MH17CV6950)';
}

export function validateFutureDate(value, label = 'Date') {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Invalid date';
  if (d.getTime() <= Date.now()) return `${label} must be a future date`;
  return null;
}

export function expiryWarning(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const daysLeft = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return 'This has already expired';
  if (daysLeft <= 30) return `Expiring soon — ${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;
  return null;
}

export function extractPanFromGstin(gstin) {
  const v = (gstin || '').toUpperCase();
  return v.length === 15 ? v.slice(2, 12) : '';
}

export function extractStateCodeFromGstin(gstin) {
  const v = (gstin || '').toUpperCase();
  return v.length >= 2 ? v.slice(0, 2) : '';
}
