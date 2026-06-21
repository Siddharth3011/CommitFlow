const jwt = require('jsonwebtoken');
const User = require('../models/User');

// =============================================================================
// protect Middleware
// =============================================================================

/**
 * Verifies that the incoming request carries a valid JWT in its cookie.
 * On success, attaches the authenticated user document to `req.user` and
 * calls `next()`. On any failure, returns a 401 Unauthorized response.
 *
 * Execution flow:
 *   1. Read the `token` cookie from the request.
 *   2. Verify the token's signature and expiry using JWT_SECRET.
 *   3. Look up the user by the ID embedded in the token payload.
 *   4. Attach the user to `req.user` for use in downstream handlers.
 *
 * @type {import('express').RequestHandler}
 */
const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token found. Please log in.',
      });
    }

    // Throws JsonWebTokenError or TokenExpiredError if invalid/expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the user from DB to confirm they still exist.
    // We explicitly exclude the password field — it is never needed in middleware.
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user associated with this token no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    // Handle specific JWT error types with descriptive messages
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please log in again.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token. Please log in again.',
      });
    }

    // For any unexpected errors, delegate to the global error handler
    next(error);
  }
};

module.exports = { protect };
