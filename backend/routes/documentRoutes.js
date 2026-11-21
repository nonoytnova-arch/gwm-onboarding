const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const upload = require('../middleware/upload');
const { uploadDocument, deleteDocument } = require('../controllers/documentController');
const { handleValidationErrors } = require('../middleware/validate');
const { publicFormLimiter } = require('../middleware/rateLimiter');

router.post('/:id/documents', publicFormLimiter, [param('id').isInt()], handleValidationErrors, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}, uploadDocument);

router.delete(
  '/documents/:docId',
  publicFormLimiter,
  [param('docId').isInt()],
  handleValidationErrors,
  deleteDocument
);

module.exports = router;
