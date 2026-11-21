const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { sendDraftOtp, verifyDraftOtp } = require('../controllers/otpController');
const { handleValidationErrors } = require('../middleware/validate');
const { otpLimiter } = require('../middleware/rateLimiter');

router.post(
  '/send',
  otpLimiter,
  [body('mobile').trim().notEmpty().withMessage('Mobile number is required')],
  handleValidationErrors,
  sendDraftOtp
);
router.post(
  '/verify',
  otpLimiter,
  [body('mobile').trim().notEmpty(), body('code').trim().notEmpty()],
  handleValidationErrors,
  verifyDraftOtp
);

module.exports = router;
