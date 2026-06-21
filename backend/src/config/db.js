const mongoose = require('mongoose');

// =============================================================================
// MongoDB Connection
// =============================================================================

/**
 * Connects to MongoDB using the MONGO_URI environment variable.
 * Exits the process immediately if the URI is missing or the initial
 * connection attempt fails — there is no point running the server
 * without a working database connection.
 */
const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('[DB] CRITICAL: MONGO_URI is not defined in environment variables.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`[DB] MongoDB connected successfully → ${conn.connection.host}`);
  } catch (error) {
    console.error(`[DB] Initial connection failed: ${error.message}`);
    process.exit(1);
  }
};

// =============================================================================
// Connection Lifecycle Listeners
// =============================================================================

mongoose.connection.on('connected', () => {
  console.log('[DB] Mongoose connection is open.');
});

mongoose.connection.on('disconnected', () => {
  console.warn('[DB] Mongoose connection was lost.');
});

mongoose.connection.on('error', (err) => {
  console.error(`[DB] Mongoose connection error: ${err.message}`);
});

// =============================================================================
// Graceful Shutdown Handler
// =============================================================================

/**
 * Attempts to gracefully close the Mongoose connection before exiting.
 * Called on POSIX signals that indicate the process is about to terminate.
 *
 * @param {string} signal - The name of the OS signal received (e.g. 'SIGINT')
 */
const gracefulShutdown = async (signal) => {
  console.log(`\n[DB] Received ${signal}. Closing MongoDB connection gracefully...`);
  try {
    await mongoose.connection.close();
    console.log('[DB] MongoDB connection closed. Process exiting.');
    process.exit(0);
  } catch (err) {
    console.error(`[DB] Error while closing MongoDB connection: ${err.message}`);
    process.exit(1);
  }
};

// SIGINT  — Ctrl+C from the terminal
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// SIGTERM — Sent by process managers (e.g. Render, PM2) on deployment or restart
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// SIGUSR2 — Sent by Nodemon before restarting the process during development
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2'));

module.exports = connectDB;
