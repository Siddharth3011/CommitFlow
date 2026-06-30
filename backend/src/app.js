const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

// Route Imports
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');
const commentRoutes = require('./routes/comment.routes');
const attachmentRoutes = require('./routes/attachment.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const globalAnalyticsRoutes = require('./routes/globalAnalytics.routes');
const invitationRoutes = require('./routes/invitation.routes');

// Middleware Imports
const errorHandler = require('./middleware/error.middleware');

// =============================================================================
// App Initialization
// =============================================================================

const app = express();

// Trust proxy for secure cross-site cookies in production
app.set('trust proxy', 1);

// =============================================================================
// Middleware Stack
// =============================================================================

// CORS — Must be configured before any route definitions.
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Parse incoming requests with JSON payloads (e.g. application/json).
app.use(express.json({ limit: '16kb' }));

// Parse incoming requests with URL-encoded payloads.
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// Parse Cookie header and populate req.cookies.
app.use(cookieParser());

// =============================================================================
// Routes
// =============================================================================

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const dbStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const dbReadyState = mongoose.connection.readyState;
  const dbStatus = dbStateMap[dbReadyState] || 'unknown';
  const isHealthy = dbReadyState === 1;

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    server: 'running',
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', taskRoutes);
app.use('/api', commentRoutes);
app.use('/api', attachmentRoutes);
app.use('/api', analyticsRoutes);
app.use('/api/analytics', globalAnalyticsRoutes);
app.use('/api/invitations', invitationRoutes);

// =============================================================================
// Global Error Handler
// =============================================================================
// Centralized error handling middleware mounted after all routes
app.use(errorHandler);

module.exports = app;
