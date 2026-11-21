const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

function verifyAdminToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.admin = decoded;
    next();
  });
}

// Re-checks the admin's CURRENT role/existence in MySQL on every request
// instead of trusting the role claim baked into the token at login time —
// so disabling/changing an admin's role takes effect immediately.
function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    try {
      const [rows] = await db.query('SELECT id, role FROM admin_users WHERE id = ?', [req.admin.id]);
      if (rows.length === 0) return res.status(403).json({ message: 'Account not found' });
      if (!allowedRoles.includes(rows[0].role)) {
        return res.status(403).json({ message: `Requires role: ${allowedRoles.join(' or ')}` });
      }
      req.admin.role = rows[0].role;
      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  };
}

module.exports = { verifyAdminToken, requireRole };
