// Format validators for the remaining identifiers in the spec. Each of these
// is a real, self-contained check — no external API involved.

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const MOBILE_REGEX = /^[6-9][0-9]{9}$/; // 10-digit Indian mobile, starts 6-9
const PINCODE_REGEX = /^[1-9][0-9]{5}$/; // 6 digits, doesn't start with 0

// Indian vehicle registration format, e.g. MH17CV6950 or MH-17-CV-6950.
// State(2 letters) + RTO code(1-2 digits) + series(1-3 letters) + number(4 digits).
const VEHICLE_NUMBER_REGEX = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/;

function isValidPan(pan) {
  return typeof pan === 'string' && PAN_REGEX.test(pan.trim().toUpperCase());
}

function isValidMobile(mobile) {
  return typeof mobile === 'string' && MOBILE_REGEX.test(mobile.trim());
}

function isValidPincode(pincode) {
  return typeof pincode === 'string' && PINCODE_REGEX.test(pincode.trim());
}

function normalizeVehicleNumber(value) {
  return (value || '').toUpperCase().replace(/[\s-]/g, '');
}

function isValidVehicleNumber(value) {
  return VEHICLE_NUMBER_REGEX.test(normalizeVehicleNumber(value));
}

// Driving licence formats vary significantly by issuing state in India, so
// this intentionally only checks a plausible length/character shape rather
// than a strict per-state pattern (which would reject many genuine valid
// licences). A tighter check would need a maintained per-state format table.
function isPlausibleDlNumber(value) {
  const v = (value || '').toUpperCase().replace(/[\s-]/g, '');
  return /^[A-Z0-9]{10,16}$/.test(v);
}

// A future date (used for RC/insurance/fitness/permit/PUC/DL validity checks).
function isFutureDate(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() > Date.now();
}

// Returns true if the date falls within the next N days (used to warn on
// documents expiring soon — spec asks for a 30-day warning).
function isExpiringWithinDays(dateStr, days = 30) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  const now = Date.now();
  const windowMs = days * 24 * 60 * 60 * 1000;
  return d.getTime() > now && d.getTime() - now <= windowMs;
}

module.exports = {
  isValidPan,
  isValidMobile,
  isValidPincode,
  normalizeVehicleNumber,
  isValidVehicleNumber,
  isPlausibleDlNumber,
  isFutureDate,
  isExpiringWithinDays
};
