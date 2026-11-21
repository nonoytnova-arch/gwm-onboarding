// One-time setup script: creates (or resets the password of) an admin login.
// Run this AFTER `npm install` (it needs bcryptjs installed) and after the
// database + schema.sql have been loaded.
//
// Usage:
//   node seed-admin.js "Full Name" "email@example.com" "YourPassword123" admin
//   (role is optional: admin | operations | accounts — defaults to admin)
//
// This hashes the password with the same bcryptjs library the server uses
// to verify logins, so — unlike a hand-written hash pasted into a SQL file —
// the account this creates is guaranteed to actually work.

const bcrypt = require('bcryptjs');
const db = require('./config/db');

async function main() {
  const [, , name, email, password, role] = process.argv;

  if (!name || !email || !password) {
    console.log('Usage: node seed-admin.js "Full Name" "email@example.com" "Password123" [admin|operations|accounts]');
    process.exit(1);
  }

  const finalRole = ['admin', 'operations', 'accounts'].includes(role) ? role : 'admin';
  const hashed = await bcrypt.hash(password, 10);

  try {
    const [existing] = await db.query('SELECT id FROM admin_users WHERE email = ?', [email]);
    if (existing.length > 0) {
      await db.query('UPDATE admin_users SET name = ?, password = ?, role = ? WHERE email = ?', [
        name,
        hashed,
        finalRole,
        email
      ]);
      console.log(`Updated existing admin user: ${email} (role: ${finalRole})`);
    } else {
      await db.query('INSERT INTO admin_users (name, email, password, role) VALUES (?, ?, ?, ?)', [
        name,
        email,
        hashed,
        finalRole
      ]);
      console.log(`Created admin user: ${email} (role: ${finalRole})`);
    }
  } catch (err) {
    console.error('Failed to seed admin user:', err.message);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
}

main();
