import { io } from 'socket.io-client';

// =============================================================================
// Socket.io Client — Singleton Instance
// =============================================================================
// We export a single `socket` instance that is shared across the entire React
// app. This prevents duplicate connections being opened when components re-render
// or when the same hook is mounted in multiple places simultaneously.
//
// Key design decisions:
//   1. `autoConnect: false` — The socket will NOT connect on import. Connection
//      is explicitly triggered by calling socket.connect() inside useProjectSocket,
//      which is mounted only while a ProjectWorkspace is active. This means no
//      persistent background WebSocket to the server when the user is only
//      browsing the Dashboard or Settings pages.
//
//   2. Single origin — Points to the same port as our Express REST API (5000)
//      because Socket.io is co-hosted on the same http.Server instance. No
//      separate WebSocket server or port mapping is needed.
//
//   3. Shared transport options mirror the backend initSocket() configuration
//      so that the client and server negotiate the same upgrade path.
// =============================================================================

/** Backend origin — must match the port used by server.js */
const BACKEND_ORIGIN = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')   // strip the /api prefix
  : 'http://localhost:5000';

// =============================================================================
// Event Name Registry
// =============================================================================
// Keep these in sync with backend/src/config/socket.js EVENTS constants.
// Having the registry on the frontend prevents magic-string drift when wiring
// Redux dispatches inside useProjectSocket.
// =============================================================================

export const SOCKET_EVENTS = {
  // ── Client → Server ────────────────────────────────────────────────────────
  /** Emitted once when the workspace mounts to subscribe to a project room. */
  JOIN_PROJECT:         'join:project',

  /**
   * Emitted once on DashboardLayout mount to subscribe to the personal user
   * room. Enables global:task_updated to be received on every page.
   */
  JOIN_USER:            'join:user',

  /** Emitted after a successful drag-drop to sync the Kanban move to peers. */
  TASK_MOVE:            'task:move',

  /** Emitted after creating a task via REST to push the new card to peers. */
  TASK_CREATE:          'task:create',

  /** Emitted after deleting a task via REST to remove the card for peers. */
  TASK_DELETE:          'task:delete',

  // ── Server → Client ────────────────────────────────────────────────────────
  /** Received when a peer in the same room moved a task to a new column. */
  TASK_MOVED:           'task:moved',

  /** Received when a peer in the same room created a new task. */
  TASK_CREATED:         'task:created',

  /** Received when a peer in the same room deleted a task. */
  TASK_DELETED:         'task:deleted',

  /**
   * Received on the personal user room after any task mutation in any project
   * the user belongs to. Used by DashboardLayout to update progress bars
   * without requiring the user to be in a project room.
   *
   * Payload: { projectId, task, event: 'created'|'updated'|'deleted', timestamp }
   */
  GLOBAL_TASK_UPDATED:  'global:task_updated',

  /**
   * Received on the personal user room after a comment is added in any project.
   * Payload: { projectId, comment }
   */
  GLOBAL_COMMENT_ADDED: 'global:comment_added',
};


// =============================================================================
// Singleton Socket Instance
// =============================================================================

const socket = io(BACKEND_ORIGIN, {
  // Do not open the connection on module load — wait for explicit .connect()
  autoConnect: false,

  // Prefer WebSocket upgrade; fall back to long-polling if the environment
  // blocks raw WebSocket connections (e.g. some corporate proxies).
  transports: ['websocket', 'polling'],

  // Send cookies with every handshake request so the server can validate
  // the authenticated session if we ever add server-side auth guards.
  withCredentials: true,
});

export default socket;
