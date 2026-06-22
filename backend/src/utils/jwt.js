const jwt = require('jsonwebtoken');

// =============================================================================
// JWT Utility
// =============================================================================

// Cookie maxAge is derived from JWT_EXPIRES_IN ("7d" → 7 days in milliseconds).
// This keeps the cookie lifetime in sync with the token lifetime so neither
// outlives the other.
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Signs a JWT for the given userId, then writes it to an httpOnly cookie on
 * the response object. Attaching the token to a cookie (rather than returning
 * it in the response body) keeps it inaccessible to JavaScript running in the
 * browser, which protects against XSS-based token theft.
 *
 * @param {import('express').Response} res      - Express response object
 * @param {string|import('mongoose').Types.ObjectId} userId - MongoDB _id of the authenticated user
 * @returns {string} The signed JWT string (useful for testing or logging)
 */
const generateTokenAndSetCookie = (res, userId) => {
  const token = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.cookie('token', token, {
    httpOnly: true,   // Prevents client-side JS from reading the cookie (XSS protection)
    secure: true, // HTTPS-only in production
    sameSite: 'none',// Prevents the cookie from being sent in cross-site requests (CSRF protection)
    maxAge: COOKIE_MAX_AGE_MS,
  });

  return token;
};

module.exports = { generateTokenAndSetCookie };
