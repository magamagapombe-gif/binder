'use client';
/**
 * WsBootstrap — mounts in layout, ensures the shared WebSocket
 * connects as soon as the user is logged in (not lazily).
 * No JSX rendered — pure side-effect component.
 */
import { useEffect } from 'react';
import { useStore } from '@/store';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function WsBootstrap() {
  const { token } = useStore();
  // Calling useWebSocket() with no handler just ensures the singleton
  // connects. The empty dependency is intentional — singleton manages itself.
  useWebSocket();
  return null;
}
