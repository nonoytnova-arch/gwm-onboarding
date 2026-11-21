const express = require('express');
const router = express.Router();
const { getCaptcha } = require('../controllers/captchaController');
const { publicFormLimiter } = require('../middleware/rateLimiter');

router.get('/', publicFormLimiter, getCaptcha);

module.exports = router;
