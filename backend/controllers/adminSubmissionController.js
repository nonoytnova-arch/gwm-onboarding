const db = require('../config/db');
const path = require('path');
const { sendConfirmation } = require('../utils/notify');
const { nextPartyCode } = require('../utils/partyCode');

const VALID_STATUSES = ['submitted', 'under_review', 'need_more_info', 'approved', 'rejected'];

// List + filter + search. Draft (never-submitted) records are excluded —
// the admin panel only concerns itself with things people actually sent in.
async function listSubmissions(req, res) {
  try {
    const { role, state, status, dateFrom, dateTo, search } = req.query;
    const conditions = ["status != 'draft'"];
    const params = [];

    if (role) { conditions.push('role = ?'); params.push(role); }
    if (state) { conditions.push('reg_state = ?'); params.push(state); }
    if (status) { conditions.push('status = ?'); params.push(status); }
    if (dateFrom) { conditions.push('DATE(submitted_at) >= ?'); params.push(dateFrom); }
    if (dateTo) { conditions.push('DATE(submitted_at) <= ?'); params.push(dateTo); }
    if (search) {
      conditions.push('(legal_name LIKE ? OR trade_name LIKE ? OR gstin LIKE ? OR pan LIKE ? OR mobile LIKE ? OR reference_number LIKE ? OR party_code LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like, like, like, like, like);
    }

    const sql = `SELECT id, party_code, role, sub_role, status, legal_name, trade_name, gstin, pan,
                        reg_city, reg_state, mobile, email, reference_number, submitted_at, created_at
                 FROM submissions WHERE ${conditions.join(' AND ')} ORDER BY submitted_at DESC`;
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function getSubmission(req, res) {
  try {
    const [rows] = await db.query("SELECT * FROM submissions WHERE id = ? AND status != 'draft'", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Submission not found' });

    const [vehicles] = await db.query('SELECT * FROM vehicles WHERE submission_id = ?', [req.params.id]);
    const [drivers] = await db.query('SELECT * FROM drivers WHERE submission_id = ?', [req.params.id]);
    const [documents] = await db.query('SELECT * FROM documents WHERE submission_id = ?', [req.params.id]);
    const [auditLog] = await db.query(
      `SELECT a.*, u.name AS admin_name FROM audit_log a
       LEFT JOIN admin_users u ON a.admin_user_id = u.id
       WHERE a.submission_id = ? ORDER BY a.created_at DESC`,
      [req.params.id]
    );

    // Bank account number is deliberately never decrypted/returned here —
    // the admin UI only needs to show that bank details exist, not the
    // number itself, for day-to-day review. (A deliberate, separate,
    // audited action would be needed to decrypt it — not implemented here,
    // since the spec doesn't call for admins to view raw account numbers.)
    const { bank_account_number_encrypted, ...submission } = rows[0];

    res.json({
      ...submission,
      hasBankAccountOnFile: Boolean(bank_account_number_encrypted),
      vehicles,
      drivers,
      documents,
      auditLog
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// Status workflow: Submitted -> Under review -> Need more info -> Approved/Rejected.
// Every change is written to audit_log, and on first approval a party code
// (CL-0001 etc.) is assigned.
async function updateStatus(req, res) {
  try {
    const { status, comment } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const [rows] = await db.query("SELECT * FROM submissions WHERE id = ? AND status != 'draft'", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Submission not found' });
    const submission = rows[0];

    let partyCode = submission.party_code;
    if (status === 'approved' && !partyCode) {
      partyCode = await nextPartyCode(submission.role);
    }

    await db.query('UPDATE submissions SET status = ?, party_code = ? WHERE id = ?', [status, partyCode, req.params.id]);

    await db.query(
      `INSERT INTO audit_log (submission_id, admin_user_id, action, from_status, to_status, comment)
       VALUES (?, ?, 'status_change', ?, ?, ?)`,
      [req.params.id, req.admin.id, submission.status, status, comment || null]
    );

    const statusMessages = {
      under_review: 'Your submission is now under review.',
      need_more_info: `We need more information from you: ${comment || 'please check your email/WhatsApp for details.'}`,
      approved: `Your submission has been approved. Your party code is ${partyCode}.`,
      rejected: `Unfortunately your submission could not be approved. ${comment || ''}`
    };
    const notifyMessage = statusMessages[status];
    if (notifyMessage) {
      await sendConfirmation({
        mobile: submission.mobile,
        email: submission.email,
        subject: 'Gale World Wide Movers — Submission Update',
        message: notifyMessage
      });
    }

    res.json({ message: 'Status updated', status, partyCode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// Uploaded documents (PAN cards, licences, cancelled cheques) are never
// served from a public static folder — only through this authenticated
// route, so a stranger can't enumerate/guess their way to someone else's
// identity documents.
async function getDocumentFile(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT d.original_name, d.stored_path, d.mime_type FROM documents d
       JOIN submissions s ON d.submission_id = s.id
       WHERE d.id = ? AND s.status != 'draft'`,
      [req.params.docId]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Document not found' });

    const filePath = path.join(__dirname, '..', 'uploads', rows[0].stored_path);
    res.setHeader('Content-Type', rows[0].mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${rows[0].original_name}"`);
    res.sendFile(filePath, (err) => {
      if (err && !res.headersSent) res.status(404).json({ message: 'File not found on server' });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

module.exports = { listSubmissions, getSubmission, updateStatus, getDocumentFile };
