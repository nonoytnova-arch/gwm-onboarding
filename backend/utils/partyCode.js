const db = require('../config/db');

const PREFIX = { client: 'CL', transporter: 'TR', vendor: 'VN' };

// Atomically increments the per-role counter and returns the next party
// code, e.g. CL-0001. Uses a row lock (FOR UPDATE) inside a transaction so
// two approvals happening at the same moment can never get the same number.
async function nextPartyCode(role) {
  const prefix = PREFIX[role];
  if (!prefix) throw new Error(`Unknown role for party code: ${role}`);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT last_number FROM party_code_counters WHERE role = ? FOR UPDATE', [role]);
    const next = (rows[0]?.last_number || 0) + 1;
    await conn.query('UPDATE party_code_counters SET last_number = ? WHERE role = ?', [next, role]);
    await conn.commit();
    return `${prefix}-${String(next).padStart(4, '0')}`;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { nextPartyCode };
