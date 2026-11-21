const express = require('express');
const router = express.Router();
const { param, body } = require('express-validator');
const {
  listSubmissions,
  getSubmission,
  updateStatus,
  getDocumentFile
} = require('../controllers/adminSubmissionController');
const { exportApproved } = require('../controllers/adminExportController');
const { getExpiryDashboard } = require('../controllers/adminExpiryController');
const { verifyAdminToken, requireRole } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validate');

// Every route below requires a valid admin token; status changes and the
// export are further restricted to admin/operations (accounts can view but
// not approve/reject — adjust as your actual workflow needs).
router.use(verifyAdminToken, requireRole('admin', 'operations', 'accounts'));

router.get('/submissions', listSubmissions);
router.get('/submissions/:id', [param('id').isInt()], handleValidationErrors, getSubmission);
router.put(
  '/submissions/:id/status',
  requireRole('admin', 'operations'),
  [param('id').isInt(), body('status').isString().notEmpty()],
  handleValidationErrors,
  updateStatus
);
router.get('/documents/:docId/file', [param('docId').isInt()], handleValidationErrors, getDocumentFile);
router.get('/expiry-dashboard', getExpiryDashboard);
router.get('/export/approved', requireRole('admin', 'operations'), exportApproved);

module.exports = router;
