'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/store';

const WS_URL = process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws') || 'ws://localhost:4000';

export function useWebSocket(onMessage?: (msg: any) => void) {
  const { token, setWs, wsRef } = useStore();
  const cbRef = useRef(onMessage);
  cbRef.current = onMessage;

  useEffect(() => {
    if (!token || wsRef) return;
    const ws = new WebSocket(`${WS_URL}/ws?token=${token}`);
    ws.onopen = () => { setWs(ws); console.log('WS connected'); };
    ws.onmessage = (e) => { try { cbRef.current?.(JSON.parse(e.data)); } catch {} };
    ws.onclose = () => { setWs(null); };
    return () => { ws.close(); setWs(null); };
  }, [token]);

  const send = useCallback((data: any) => {
    if (wsRef?.readyState === WebSocket.OPEN) wsRef.send(JSON.stringify(data));
  }, [wsRef]);

  return { send, ws: wsRef };
}
