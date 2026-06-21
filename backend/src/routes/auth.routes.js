const express = require('express');
const { register, login, logout, getMe, verifyEmailOTP, resendOTP } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// =============================================================================
// Auth Routes  —  Base path: /api/auth
// =============================================================================

// POST /api/auth/register
// Public — Creates a new user account and issues a session cookie.
router.post('/register', register);

// POST /api/auth/verify-otp
// Public — Verifies 6-digit OTP and issues a session cookie.
router.post('/verify-otp', verifyEmailOTP);

// POST /api/auth/resend-otp
// Public — Resends the OTP and enforces a 60-second cooldown.
router.post('/resend-otp', resendOTP);

// POST /api/auth/login
// Public — Authenticates an existing user and issues a session cookie.
router.post('/login', login);

// POST /api/auth/logout
// Public — Clears the session cookie. No token validation needed since we are
// simply expiring the cookie, not reading protected data.
router.post('/logout', logout);

// GET /api/auth/me
// Protected — Returns the profile of the currently authenticated user.
router.get('/me', protect, getMe);

module.exports = router;
