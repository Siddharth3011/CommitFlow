// Load environment variables from .env FIRST, before any other module import.
// This ensures that process.env is fully populated when app.js and db.js are
// initialized and their top-level configuration code runs.
require('dotenv').config();

const http       = require('http');
const app        = require('./src/app');
const connectDB  = require('./src/config/db');
const { initSocket } = require('./src/config/socket');

// =============================================================================
// Process-Wide Error Guards
// =============================================================================
// These handlers must be registered before anything else runs to catch errors
// that occur during the startup sequence itself (e.g. bad module, syntax error).

/**
 * Catches synchronous exceptions that were not wrapped in a try/catch.
 * This is a last resort. If this fires, it means there is a bug in the code.
 * The safest action is to log it and exit immediately — the process is in an
 * undefined state and should not continue.
 */
process.on('uncaughtException', (err) => {
  console.error('[Server] CRITICAL: Uncaught Exception. Shutting down immediately...');
  console.error(`[Server] ${err.name}: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});

/**
 * Catches unhandled Promise rejections (e.g. a missing await, a failed async
 * operation with no .catch()). We close the HTTP server gracefully to allow
 * in-flight requests to complete before exiting.
 */
process.on('unhandledRejection', (err) => {
  console.error('[Server] CRITICAL: Unhandled Promise Rejection. Initiating graceful shutdown...');
  console.error(`[Server] ${err.name}: ${err.message}`);
  console.error(err.stack);

  if (server) {
    // Stop accepting new connections, then exit once existing ones drain.
    server.close(() => {
      console.log('[Server] HTTP server closed. Exiting process.');
      process.exit(1);
    });
  } else {
    // Server hasn't started yet (failure occurred during DB connection).
    process.exit(1);
  }
});

// =============================================================================
// Application Bootstrap
// =============================================================================

const PORT = process.env.PORT || 5000;
let server;

/**
 * Sequentially connects to MongoDB and then starts the HTTP server.
 *
 * Architecture note — why http.createServer(app)?
 * ─────────────────────────────────────────────────
 * Socket.io requires direct access to the raw Node http.Server instance so it
 * can intercept the WebSocket upgrade handshake BEFORE Express processes it.
 * Calling app.listen() internally creates an http.Server and returns it, but
 * Socket.io cannot be attached after the fact reliably in all environments.
 *
 * Creating the server explicitly here gives us a single named reference that:
 *   1. Wraps the Express app for REST request handling (unchanged).
 *   2. Is passed to initSocket() to mount the WebSocket layer on the SAME port.
 *   3. Is stored in `server` for the graceful-shutdown handler above.
 *
 * If the database connection fails, connectDB() calls process.exit(1) before
 * we ever reach server.listen(), keeping the startup logic clean.
 */
const startServer = async () => {
  // Step 1 — Establish database connection.
  await connectDB();

  // Step 2 — Wrap the Express app in a native Node HTTP server.
  //           Both REST and WebSocket traffic will be served on the same PORT.
  server = http.createServer(app);

  // Step 3 — Attach Socket.io to the HTTP server and register all real-time
  //           event listeners defined in src/config/socket.js.
  initSocket(server);

  // Step 4 — Start listening for inbound connections.
  server.listen(PORT, () => {
    console.log('='.repeat(55));
    console.log(`  CommitFlow API Server`);
    console.log('='.repeat(55));
    console.log(`  Status      : Running`);
    console.log(`  Environment : ${process.env.NODE_ENV || 'development'}`);
    console.log(`  Port        : ${PORT}`);
    console.log(`  Health      : http://localhost:${PORT}/api/health`);
    console.log(`  WebSocket   : ws://localhost:${PORT}`);
    console.log('='.repeat(55));
  });
};

startServer();

