const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// Authorizes the SAME way as the draft endpoints: the caller must present
// the draft's token. Kept here (not imported) to avoid a circular require
// with submissionController.
async function authorizeDraft(id, draftToken) {
  const [rows] = await db.query('SELECT id, draft_token, status FROM submissions WHERE id = ?', [id]);
  if (rows.length === 0) return { error: 404, message: 'Submission not found' };
  if (rows[0].draft_token !== draftToken) return { error: 403, message: 'Invalid draft token' };
  return { submission: rows[0] };
}

async function uploadDocument(req, res) {
  try {
    const { draftToken, docType, relatedVehicleId, relatedDriverId, expiryDate } = req.body;
    const auth = await authorizeDraft(req.params.id, draftToken);
    if (auth.error) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(auth.error).json({ message: auth.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    if (!docType) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ message: 'docType is required' });
    }

    const [result] = await db.query(
      `INSERT INTO documents (submission_id, doc_type, related_vehicle_id, related_driver_id,
         original_name, stored_path, mime_type, size_bytes, expiry_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.params.id, docType, relatedVehicleId || null, relatedDriverId || null,
        req.file.originalname, req.file.filename, req.file.mimetype, req.file.size, expiryDate || null
      ]
    );

    res.status(201).json({ id: result.insertId, docType, originalName: req.file.originalname });
  } catch (err) {
    console.error(err);
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function deleteDocument(req, res) {
  try {
    const { draftToken } = req.body;
    const [docs] = await db.query('SELECT submission_id, stored_path FROM documents WHERE id = ?', [req.params.docId]);
    if (docs.length === 0) return res.status(404).json({ message: 'Document not found' });

    const auth = await authorizeDraft(docs[0].submission_id, draftToken);
    if (auth.error) return res.status(auth.error).json({ message: auth.message });

    await db.query('DELETE FROM documents WHERE id = ?', [req.params.docId]);
    const filePath = path.join(__dirname, '..', 'uploads', docs[0].stored_path);
    fs.unlink(filePath, () => {}); // best-effort; missing file shouldn't fail the request

    res.json({ message: 'Document removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

module.exports = { uploadDocument, deleteDocument };
