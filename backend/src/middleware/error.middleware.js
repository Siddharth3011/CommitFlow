// =============================================================================
// Global Error Handler Middleware
// =============================================================================

/**
 * Express error-handling middleware.
 * Catches any error passed to next(err) and sends a structured JSON response.
 *
 * @param {Error} err - The error object
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log the error trace in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[Error Handler] ${req.method} ${req.originalUrl} → ${statusCode}`);
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Provide stack trace in development mode only
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
