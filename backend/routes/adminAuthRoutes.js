const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { login } = require('../controllers/adminAuthController');
const { handleValidationErrors } = require('../middleware/validate');
const { loginLimiter } = require('../middleware/rateLimiter');

router.post(
  '/login',
  loginLimiter,
  [body('email').isEmail(), body('password').notEmpty()],
  handleValidationErrors,
  login
);

module.exports = router;
