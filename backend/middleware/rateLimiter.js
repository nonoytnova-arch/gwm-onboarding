/*
const rateLimit = require('express-rate-limit');

// Generic public-form limiter: generous enough for real form-filling, tight
// enough to blunt scripted abuse of unauthenticated endpoints.
const publicFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please wait a few minutes and try again.' }
});

// Tighter limiter specifically for OTP requests, to blunt SMS-bombing abuse.
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many OTP requests for this number. Please wait a few minutes.' }
});

// Admin login limiter, to blunt password-guessing.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please wait a few minutes.' }
});

module.exports = { publicFormLimiter, otpLimiter, loginLimiter };
*/

const rateLimit = require('express-rate-limit');

// General public endpoints: draft creation, draft retrieval,
// CAPTCHA and document-related requests.
const publicFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests. Please wait a few minutes and try again.'
  }
});

// Autosave has a separate, higher limit because users may save
// repeatedly while completing a long onboarding form.
const draftSaveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many draft saves. Please wait a few minutes and try again.'
  }
});

// OTP protection against SMS bombing.
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many OTP requests for this number. Please wait a few minutes.'
  }
});

// Admin login protection against password guessing.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many login attempts. Please wait a few minutes.'
  }
});

module.exports = {
  publicFormLimiter,
  draftSaveLimiter,
  otpLimiter,
  loginLimiter
};
