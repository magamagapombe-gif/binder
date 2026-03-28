'use client';
/**
 * FIXED WebSocket — single shared connection with an event bus.
 *
 * Problems with the old approach:
 * 1. Each component calling useWebSocket() tried to open its own connection.
 *    The backend's `clients` Map (userId → ws) only stores ONE socket per user,
 *    so the last one to connect would overwrite the others — meaning messages
 *    sent to earlier sockets were silently dropped.
 * 2. Storing the WebSocket in Zustand caused stale-ref bugs because Zustand
 *    does shallow equality checks and WebSocket objects don't compare cleanly.
 *
 * Fix: one module-level singleton socket + a Set of listener callbacks.
 * Any component that calls useWebSocket() just registers its callback with
 * the shared bus — there is always exactly ONE open socket to the backend.
 */

import { useEffect, useRef } from 'react';

const BASE = (() => {
  const url = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000')
    : 'http://localhost:4000';
  return url.replace(/^http/, 'ws');
})();

// ── Singleton state ───────────────────────────────────────────────────────────
let socket: WebSocket | null = null;
let currentToken: string | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<(msg: any) => void>();

function broadcast(msg: any) {
  listeners.forEach(fn => {
    try { fn(msg); } catch {}
  });
}

function connect(token: string) {
  // Already open for this token — nothing to do
  if (socket && socket.readyState === WebSocket.OPEN && currentToken === token) return;

  // Close stale socket if token changed
  if (socket && currentToken !== token) {
    socket.onclose = null;
    socket.close();
    socket = null;
  }

  currentToken = token;
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }

  try {
    const ws = new WebSocket(`${BASE}/ws?token=${token}`);
    socket = ws;

    ws.onopen = () => {
      console.log('[WS] connected');
    };

    ws.onmessage = (e) => {
      try { broadcast(JSON.parse(e.data)); } catch {}
    };

    ws.onclose = () => {
      if (socket === ws) {
        socket = null;
        console.log('[WS] closed — reconnecting in 3s');
        reconnectTimer = setTimeout(() => {
          if (currentToken) connect(currentToken);
        }, 3000);
      }
    };

    ws.onerror = () => ws.close();
  } catch {
    reconnectTimer = setTimeout(() => {
      if (currentToken) connect(currentToken);
    }, 5000);
  }
}

export function disconnectWs() {
  currentToken = null;
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  if (socket) { socket.onclose = null; socket.close(); socket = null; }
}

export function sendWs(data: any): boolean {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
    return true;
  }
  return false;
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useWebSocket(onMessage?: (msg: any) => void) {
  // Keep the callback ref fresh without re-registering
  const cbRef = useRef(onMessage);
  cbRef.current = onMessage;

  useEffect(() => {
    // Ensure we're connected (reads token directly from localStorage so we
    // don't need to depend on the Zustand store here)
    const token = typeof window !== 'undefined' ? localStorage.getItem('binder_token') : null;
    if (token) connect(token);

    // Register this component's listener on the shared bus
    const handler = (msg: any) => cbRef.current?.(msg);
    if (onMessage) listeners.add(handler);

    return () => {
      listeners.delete(handler);
    };
  }, []); // intentionally empty — singleton manages its own lifecycle

  const send = (data: any) => sendWs(data);

  return { send };
}
