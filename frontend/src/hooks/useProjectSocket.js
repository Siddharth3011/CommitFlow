import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import socket, { SOCKET_EVENTS } from '../config/socket';
import {
  taskAddedFromSocket,
  taskMovedFromSocket,
  taskRemovedFromSocket,
} from '../features/tasks/taskSlice';

// =============================================================================
// useProjectSocket
// =============================================================================
// Custom hook that manages the full WebSocket lifecycle for a single project
// workspace session:
//
//   Mount  → connect → join room → register event listeners
//   Unmount → deregister listeners → disconnect
//
// Design goals:
//   1. One connection per workspace session — connect on mount, disconnect on
//      unmount (navigation away). No persistent idle socket in the background.
//   2. Listener cleanup is always exact — we remove only the specific handler
//      functions registered in THIS hook invocation, preventing double-removal
//      of listeners if the hook were ever used in multiple component trees.
//   3. No self-echo risk — the backend uses `socket.to(room).emit(...)` which
//      excludes the sender. These reducers therefore only fire for remote peers.
//   4. Guard against stale projectId — the `projectIdRef` captures the value
//      at connection time so the cleanup effect can leave the correct room even
//      if the parent component re-renders with a different id before unmount.
//
// @param {string}  projectId   - MongoDB ObjectId of the active project.
// @param {object}  currentUser - Authenticated user object from Redux auth slice.
//                                Must contain `_id` to identify the sender.
// =============================================================================

const useProjectSocket = (projectId, currentUser) => {
  const dispatch = useDispatch();

  // Capture projectId in a ref so the cleanup closure always references the
  // value that was active when the connection was established, not the latest
  // render's value.
  const projectIdRef = useRef(projectId);

  useEffect(() => {
    // Guard: do not attempt to connect if either critical argument is missing.
    if (!projectId || !currentUser?._id) return;

    // Update the ref on every effect run (in case the project route changed).
    projectIdRef.current = projectId;

    // =========================================================================
    // Step 1 — Connect the socket
    // =========================================================================
    // Because autoConnect: false was set in src/config/socket.js, the TCP
    // handshake only happens here, exactly when the workspace mounts. If the
    // socket is already connected (e.g. hot-reload in development), calling
    // connect() again is a safe no-op.
    socket.connect();

    // =========================================================================
    // Step 2 — Join the project room once the connection is confirmed
    // =========================================================================
    // `connect` fires after the WebSocket handshake succeeds and a session ID
    // is assigned. Emitting `join:project` inside this callback guarantees the
    // server receives it on an established connection (not before the socket ID
    // is known).
    const handleConnect = () => {
      console.log(`[Socket] Connected → socket.id: ${socket.id}`);
      socket.emit(SOCKET_EVENTS.JOIN_PROJECT, {
        projectId,
        userId: currentUser._id,
      });
      console.log(`[Socket] Joined project room: ${projectId}`);
    };

    // If already connected (reconnection scenario), join the room immediately
    // without waiting for another `connect` event.
    if (socket.connected) {
      socket.emit(SOCKET_EVENTS.JOIN_PROJECT, {
        projectId,
        userId: currentUser._id,
      });
    }

    // =========================================================================
    // Step 3 — Real-Time Event Listeners
    // =========================================================================
    // Each handler dispatches a synchronous Redux action so that the Immer
    // reducer handles the state mutation and React re-renders the Kanban board
    // in a single synchronous pass — no async thunks needed here.

    /**
     * `task:created` — A peer added a new task to this project.
     *
     * Payload shape (from backend):
     *   { task: TaskDocument, createdBy: string, projectId: string, timestamp: string }
     *
     * Redux action: taskAddedFromSocket
     *   → pushes `task` onto state.tasks (duplicate-safe)
     */
    const handleTaskCreated = (payload) => {
      console.log(`[Socket] task:created received →`, payload.task?._id);
      dispatch(taskAddedFromSocket(payload));
    };

    /**
     * `task:moved` — A peer dragged a task to a different Kanban column.
     *
     * Payload shape (from backend):
     *   { taskId: string, newStatus: string, movedBy: string, projectId: string, timestamp: string }
     *
     * Redux action: taskMovedFromSocket
     *   → finds the task by _id and mutates its status field in-place
     *   → the Kanban board's column filter re-computes and the card moves
     */
    const handleTaskMoved = (payload) => {
      console.log(`[Socket] task:moved received → taskId: ${payload.taskId}, newStatus: ${payload.newStatus}`);
      dispatch(taskMovedFromSocket(payload));
    };

    /**
     * `task:deleted` — A peer deleted a task from this project.
     *
     * Payload shape (from backend):
     *   { taskId: string, deletedBy: string, projectId: string, timestamp: string }
     *
     * Redux action: taskRemovedFromSocket
     *   → filters the task out of state.tasks
     *   → clears selectedTask if the detail drawer was open for that card
     */
    const handleTaskDeleted = (payload) => {
      console.log(`[Socket] task:deleted received → taskId: ${payload.taskId}`);
      dispatch(taskRemovedFromSocket(payload));
    };

    /**
     * Optional: log disconnects for diagnostics during development.
     */
    const handleDisconnect = (reason) => {
      console.log(`[Socket] Disconnected → reason: ${reason}`);
    };

    // Register all listeners
    socket.on('connect',                   handleConnect);
    socket.on(SOCKET_EVENTS.TASK_CREATED,  handleTaskCreated);
    socket.on(SOCKET_EVENTS.TASK_MOVED,    handleTaskMoved);
    socket.on(SOCKET_EVENTS.TASK_DELETED,  handleTaskDeleted);
    socket.on('disconnect',                handleDisconnect);

    // =========================================================================
    // Cleanup — runs when the component unmounts or projectId / currentUser
    // changes (e.g. the user navigates to a different project).
    // =========================================================================
    return () => {
      console.log(`[Socket] Leaving project room: ${projectIdRef.current}`);

      // Remove ONLY our specific handler references, not all listeners for the
      // event type (avoids accidentally clearing listeners from other hooks if
      // the architecture ever changes).
      socket.off('connect',                   handleConnect);
      socket.off(SOCKET_EVENTS.TASK_CREATED,  handleTaskCreated);
      socket.off(SOCKET_EVENTS.TASK_MOVED,    handleTaskMoved);
      socket.off(SOCKET_EVENTS.TASK_DELETED,  handleTaskDeleted);
      socket.off('disconnect',                handleDisconnect);

      // Note: We deliberately do NOT call socket.disconnect() here because we want
      // the core connection to remain continuously connected for global events
      // handled by DashboardLayout (like global:task_updated).
    };

    // Re-run this effect only if the project or the authenticated user changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, currentUser?._id]);

  // This hook has no return value — it is a pure side-effect hook.
  // Callers interact with the socket indirectly through the Redux store.
};

export default useProjectSocket;
