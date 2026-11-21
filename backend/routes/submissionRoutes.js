/*
const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { createDraft, getDraft, updateDraft, finalSubmit } = require('../controllers/submissionController');
const { handleValidationErrors } = require('../middleware/validate');
const { publicFormLimiter } = require('../middleware/rateLimiter');

router.post(
  '/',
  publicFormLimiter,
  [body('role').isIn(['client', 'transporter', 'vendor'])],
  handleValidationErrors,
  createDraft
);

router.get(
  '/:id',
  publicFormLimiter,
  [param('id').isInt(), query('draftToken').notEmpty()],
  handleValidationErrors,
  getDraft
);

router.put(
  '/:id',
  publicFormLimiter,
  [param('id').isInt(), body('draftToken').notEmpty()],
  handleValidationErrors,
  updateDraft
);

router.post(
  '/:id/submit',
  publicFormLimiter,
  [param('id').isInt(), body('draftToken').notEmpty(), body('captchaId').notEmpty(), body('captchaAnswer').notEmpty()],
  handleValidationErrors,
  finalSubmit
);

module.exports = router;
*/

const express = require('express');
const router = express.Router();

const { body, param, query } = require('express-validator');

const {
  createDraft,
  getDraft,
  updateDraft,
  finalSubmit
} = require('../controllers/submissionController');

const { handleValidationErrors } = require('../middleware/validate');

const {
  publicFormLimiter,
  draftSaveLimiter
} = require('../middleware/rateLimiter');

// Create a new draft.
router.post(
  '/',
  publicFormLimiter,
  [
    body('role').isIn(['client', 'transporter', 'vendor'])
  ],
  handleValidationErrors,
  createDraft
);

// Retrieve an existing draft.
router.get(
  '/:id',
  publicFormLimiter,
  [
    param('id').isInt(),
    query('draftToken').notEmpty()
  ],
  handleValidationErrors,
  getDraft
);

// Save/update a draft.
// Uses its own higher rate limit for normal autosave activity.
router.put(
  '/:id',
  draftSaveLimiter,
  [
    param('id').isInt(),
    body('draftToken').notEmpty()
  ],
  handleValidationErrors,
  updateDraft
);

// Final submission.
router.post(
  '/:id/submit',
  publicFormLimiter,
  [
    param('id').isInt(),
    body('draftToken').notEmpty(),
    body('captchaId').notEmpty(),
    body('captchaAnswer').notEmpty()
  ],
  handleValidationErrors,
  finalSubmit
);

module.exports = router;
