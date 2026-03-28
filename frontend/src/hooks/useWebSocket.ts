'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/store';

const WS_BASE = (() => {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  return url.replace(/^http/, 'ws');
})();

export function useWebSocket(onMessage?: (msg: any) => void) {
  const { token, setWs, wsRef } = useStore();
  const cbRef = useRef(onMessage);
  const reconnectTimer = useRef<any>(null);
  const mounted = useRef(true);
  cbRef.current = onMessage;

  const connect = useCallback(() => {
    if (!token || !mounted.current) return;
    if (wsRef?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(`${WS_BASE}/ws?token=${token}`);

      ws.onopen = () => {
        if (!mounted.current) { ws.close(); return; }
        setWs(ws);
        clearTimeout(reconnectTimer.current);
        console.log('[WS] connected');
      };

      ws.onmessage = (e) => {
        try { cbRef.current?.(JSON.parse(e.data)); } catch {}
      };

      ws.onclose = (e) => {
        setWs(null);
        if (!mounted.current) return;
        console.log('[WS] closed, reconnecting in 3s...');
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (err) {
      reconnectTimer.current = setTimeout(connect, 5000);
    }
  }, [token]);

  useEffect(() => {
    mounted.current = true;
    if (token) connect();
    return () => {
      mounted.current = false;
      clearTimeout(reconnectTimer.current);
    };
  }, [token, connect]);

  const send = useCallback((data: any) => {
    if (wsRef?.readyState === WebSocket.OPEN) {
      wsRef.send(JSON.stringify(data));
    }
  }, [wsRef]);

  return { send, ws: wsRef };
}
