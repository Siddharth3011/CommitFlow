const { Server } = require('socket.io');

// =============================================================================
// Socket.io Configuration
// =============================================================================
// This module is intentionally decoupled from server.js and app.js so that:
//   1. The Socket.io instance can be initialized with the raw http.Server.
//   2. The Express app remains unaware of WebSocket concerns (clean separation).
//   3. The io instance can be exported and re-used by controllers that need to
//      push server-initiated events (e.g. triggering a broadcast after a REST
//      PATCH succeeds alongside the real-time path).
// =============================================================================

/** Shared Socket.io server instance — set once by initSocket(). */
let io = null;

// =============================================================================
// Event Name Registry
// =============================================================================
// All event names are declared here as constants so they can be easily mapped
// to Redux dispatch actions on the frontend without magic string mismatches.
//
// Naming convention: <noun>:<verb>
//   Client → Server events: describe the intent (e.g. 'task:move')
//   Server → Client events: describe the outcome (e.g. 'task:moved')
// =============================================================================

const EVENTS = {
  // ── Client → Server ────────────────────────────────────────────────────────
  /** Client requests to subscribe to a project room's real-time feed. */
  JOIN_PROJECT:         'join:project',

  /**
   * Client requests to subscribe to their personal user room so they receive
   * global cross-project events (e.g. dashboard progress updates) regardless
   * of which page they are currently viewing.
   */
  JOIN_USER:            'join:user',

  /** Client signals it dragged/dropped a task to a new Kanban column. */
  TASK_MOVE:            'task:move',

  /** Client signals it created a new task inside a project. */
  TASK_CREATE:          'task:create',

  /** Client signals it deleted a task from a project. */
  TASK_DELETE:          'task:delete',

  // ── Server → Client ────────────────────────────────────────────────────────
  /** Broadcast: a task's status/column changed — update the Kanban board. */
  TASK_MOVED:           'task:moved',

  /** Broadcast: a new task was added — append it to the correct column. */
  TASK_CREATED:         'task:created',

  /** Broadcast: a task was removed — remove it from the board. */
  TASK_DELETED:         'task:deleted',

  /**
   * Broadcast: emitted to every project member's personal user room after any
   * task mutation (create / update / delete). Allows the Dashboard progress bars
   * to update in real time without the recipient being in a project room.
   *
   * Payload: { projectId, task, event: 'created'|'updated'|'deleted' }
   */
  GLOBAL_TASK_UPDATED:  'global:task_updated',

  /** Broadcast: a task or project field was updated. */
  TASK_UPDATED:         'taskUpdated',

  /**
   * Broadcast: emitted to an individual user's personal room when they receive
   * a new project invitation.
   */
  NEW_INVITATION:       'newInvitation',
};

// =============================================================================
// initSocket
// =============================================================================

/**
 * Bootstraps a Socket.io server on top of the provided Node http.Server
 * instance. Must be called ONCE during application startup, after the HTTP
 * server is created but before it starts accepting connections.
 *
 * @param {import('http').Server} server - Native Node HTTP server wrapping Express.
 * @returns {import('socket.io').Server} The configured Socket.io server instance.
 */
const initSocket = (server) => {
  io = new Server(server, {
    // ── CORS ─────────────────────────────────────────────────────────────────
    // Mirror the same allowed origin used in the Express CORS middleware so that
    // both REST and WebSocket handshakes are treated consistently.
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },

    // ── Transport ─────────────────────────────────────────────────────────────
    // Prefer WebSocket upgrades for low latency; fall back to long-polling for
    // environments where WebSocket connections are blocked (e.g. some proxies).
    transports: ['websocket', 'polling'],

    // ── Ping/Pong Heartbeat ───────────────────────────────────────────────────
    // Send a ping every 25 s; disconnect the socket if no pong is received
    // within 60 s. Keeps idle connection detection responsive without hammering
    // the client too frequently.
    pingInterval: 25000,
    pingTimeout:  60000,
  });

  console.log('[Socket.io] Server initialized. Waiting for client connections...');

  // ===========================================================================
  // Connection Handler
  // ===========================================================================

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected    → socket.id: ${socket.id}`);

    // -------------------------------------------------------------------------
    // Event: join:project
    // -------------------------------------------------------------------------
    // Payload: { projectId: string, userId: string }
    //
    // Subscribes this socket to a named room keyed by projectId. All subsequent
    // broadcasts scoped to that room will be received by this socket.
    //
    // Frontend mapping:
    //   socket.emit('join:project', { projectId, userId })
    //   → called inside a useEffect when the ProjectWorkspace page mounts.
    // -------------------------------------------------------------------------
    socket.on(EVENTS.JOIN_PROJECT, ({ projectId, userId } = {}) => {
      if (!projectId) {
        console.warn(`[Socket.io] join:project received without projectId from socket ${socket.id}`);
        return;
      }

      socket.join(projectId);
      console.log(
        `[Socket.io] User joined room     → userId: ${userId || 'anonymous'} | room: ${projectId}`
      );
    });

    // -------------------------------------------------------------------------
    // Event: join:user
    // -------------------------------------------------------------------------
    // Payload: { userId: string }
    //
    // Subscribes this socket to a personal room keyed by the authenticated
    // user's MongoDB ObjectId string. The task controller emits
    // `global:task_updated` to every project member's personal room after any
    // task mutation, so the Dashboard can update progress bars without the
    // recipient being subscribed to the specific project room.
    //
    // Frontend mapping:
    //   socket.emit('join:user', { userId: user._id })
    //   → called once inside DashboardLayout's useEffect on mount.
    // -------------------------------------------------------------------------
    socket.on(EVENTS.JOIN_USER, ({ userId } = {}) => {
      if (!userId) {
        console.warn(`[Socket.io] join:user received without userId from socket ${socket.id}`);
        return;
      }

      socket.join(userId.toString());
      console.log(
        `[Socket.io] User joined personal room → userId: ${userId} | socket: ${socket.id}`
      );
    });

    // -------------------------------------------------------------------------
    // Event: task:move
    // -------------------------------------------------------------------------
    // Payload:
    //   {
    //     projectId : string,   — which room to broadcast to
    //     taskId    : string,   — MongoDB ObjectId of the moved task
    //     newStatus : string,   — target Kanban column ('Todo', 'In Progress', ...)
    //     movedBy   : string,   — userId of the person who moved the card
    //   }
    //
    // Server action:
    //   Relay the move to all OTHER sockets in the same project room so their
    //   Kanban boards update without a page refresh.
    //
    // Frontend Redux mapping (receiver side):
    //   socket.on('task:moved', (payload) => dispatch(taskMovedRemotely(payload)))
    // -------------------------------------------------------------------------
    socket.on(EVENTS.TASK_MOVE, (payload = {}) => {
      const { projectId, taskId, newStatus, movedBy } = payload;

      if (!projectId || !taskId || !newStatus) {
        console.warn(`[Socket.io] task:move received with incomplete payload:`, payload);
        return;
      }

      console.log(
        `[Socket.io] task:move            → taskId: ${taskId} | status: ${newStatus} | room: ${projectId}`
      );

      // Broadcast to everyone in the project room EXCEPT the sender.
      // The sender's Redux store is already updated optimistically on the client.
      socket.to(projectId).emit(EVENTS.TASK_MOVED, {
        taskId,
        newStatus,
        movedBy,
        projectId,
        timestamp: new Date().toISOString(),
      });
    });

    // -------------------------------------------------------------------------
    // Event: task:create
    // -------------------------------------------------------------------------
    // Payload:
    //   {
    //     projectId : string,   — which room to broadcast to
    //     task      : object,   — full serialized Task document from the REST response
    //     createdBy : string,   — userId of the creator
    //   }
    //
    // Frontend Redux mapping (receiver side):
    //   socket.on('task:created', (payload) => dispatch(taskCreatedRemotely(payload)))
    // -------------------------------------------------------------------------
    socket.on(EVENTS.TASK_CREATE, (payload = {}) => {
      const { projectId, task, createdBy } = payload;

      if (!projectId || !task) {
        console.warn(`[Socket.io] task:create received with incomplete payload:`, payload);
        return;
      }

      console.log(
        `[Socket.io] task:create          → taskId: ${task._id || '?'} | room: ${projectId}`
      );

      socket.to(projectId).emit(EVENTS.TASK_CREATED, {
        task,
        createdBy,
        projectId,
        timestamp: new Date().toISOString(),
      });
    });

    // -------------------------------------------------------------------------
    // Event: task:delete
    // -------------------------------------------------------------------------
    // Payload:
    //   {
    //     projectId : string,   — which room to broadcast to
    //     taskId    : string,   — MongoDB ObjectId of the deleted task
    //     deletedBy : string,   — userId of the person who deleted the task
    //   }
    //
    // Frontend Redux mapping (receiver side):
    //   socket.on('task:deleted', (payload) => dispatch(taskDeletedRemotely(payload)))
    // -------------------------------------------------------------------------
    socket.on(EVENTS.TASK_DELETE, (payload = {}) => {
      const { projectId, taskId, deletedBy } = payload;

      if (!projectId || !taskId) {
        console.warn(`[Socket.io] task:delete received with incomplete payload:`, payload);
        return;
      }

      console.log(
        `[Socket.io] task:delete          → taskId: ${taskId} | room: ${projectId}`
      );

      socket.to(projectId).emit(EVENTS.TASK_DELETED, {
        taskId,
        deletedBy,
        projectId,
        timestamp: new Date().toISOString(),
      });
    });

    // -------------------------------------------------------------------------
    // Disconnection Handler
    // -------------------------------------------------------------------------
    // Socket.io automatically removes the socket from all rooms it joined when
    // it disconnects — no manual cleanup is needed for room membership.
    // -------------------------------------------------------------------------
    socket.on('disconnect', (reason) => {
      console.log(
        `[Socket.io] Client disconnected  → socket.id: ${socket.id} | reason: ${reason}`
      );
    });
  });

  return io;
};

// =============================================================================
// getIO
// =============================================================================

/**
 * Returns the already-initialized Socket.io server instance.
 * Throws if called before initSocket() — prevents silent failures in
 * controllers that attempt to emit events before the server is ready.
 *
 * Usage in a REST controller:
 *   const { getIO } = require('../config/socket');
 *   getIO().to(projectId).emit('task:moved', payload);
 *
 * @returns {import('socket.io').Server}
 */
const getIO = () => {
  if (!io) {
    throw new Error(
      '[Socket.io] getIO() called before initSocket(). ' +
      'Ensure initSocket(server) is invoked in server.js before any route handler runs.'
    );
  }
  return io;
};

module.exports = { initSocket, getIO, EVENTS };
