'use client';
/**
 * useIncomingCall — listens on the shared WS bus for call_invite events.
 * Because useWebSocket is now a singleton, this does NOT open a second socket.
 */
import { useEffect, useRef, useState } from 'react';
import { useWebSocket } from './useWebSocket';
import { useStore } from '@/store';

export interface IncomingCall {
  match_id: string;
  room_id: string;
  is_video: boolean;
  caller_id: string;
  caller_name: string;
  caller_photo?: string;
}

export function useIncomingCall() {
  const [incoming, setIncoming] = useState<IncomingCall | null>(null);
  const incomingRef = useRef<IncomingCall | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const { user } = useStore();
  const userRef = useRef(user);
  userRef.current = user;

  const { send } = useWebSocket((msg) => {
    if (msg.type === 'call_invite') {
      // Ignore our own invite echoes
      if (msg.caller_id === userRef.current?.id) return;
      incomingRef.current = msg as IncomingCall;
      setIncoming(msg as IncomingCall);
      // Play ringtone
      try {
        if (!ringtoneRef.current) {
          ringtoneRef.current = new Audio('/ringtone.mp3');
          ringtoneRef.current.loop = true;
        }
        ringtoneRef.current.currentTime = 0;
        ringtoneRef.current.play().catch(() => {});
      } catch {}
    }

    if (msg.type === 'call_end') {
      const cur = incomingRef.current;
      if (cur && msg.room_id === cur.room_id) dismiss();
    }
  });

  function dismiss() {
    try { ringtoneRef.current?.pause(); } catch {}
    incomingRef.current = null;
    setIncoming(null);
  }

  function accept(call: IncomingCall): string {
    try { ringtoneRef.current?.pause(); } catch {}
    // Tell the caller we accepted
    send({ type: 'call_accept', room_id: call.room_id, caller_id: call.caller_id });
    incomingRef.current = null;
    setIncoming(null);
    const photo = encodeURIComponent(call.caller_photo || '');
    const name = encodeURIComponent(call.caller_name);
    return `/calls/${call.room_id}?name=${name}&photo=${photo}&video=${call.is_video}&match_id=${call.match_id}&caller=false`;
  }

  function reject(call: IncomingCall) {
    send({ type: 'call_reject', room_id: call.room_id, caller_id: call.caller_id });
    dismiss();
  }

  return { incoming, accept, reject, dismiss };
}
