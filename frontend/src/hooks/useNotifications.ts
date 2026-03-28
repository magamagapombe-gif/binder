'use client';
import { useEffect, useRef } from 'react';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function getVapidKey(): Promise<string | null> {
  try {
    const token = localStorage.getItem('binder_token');
    const res = await fetch(`${BASE}/api/notifications/vapid-public-key`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const { key } = await res.json();
    return key;
  } catch { return null; }
}

async function subscribeUser(registration: ServiceWorkerRegistration) {
  const vapidKey = await getVapidKey();
  if (!vapidKey) return; // Not configured on backend

  const existing = await registration.pushManager.getSubscription();
  const sub = existing || await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });

  const token = localStorage.getItem('binder_token');
  await fetch(`${BASE}/api/notifications/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ subscription: sub.toJSON() }),
  });
}

export function useNotifications() {
  const asked = useRef(false);

  async function requestPermission() {
    if (asked.current) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (Notification.permission === 'denied') return;

    asked.current = true;

    try {
      // Register SW
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      if (Notification.permission === 'default') {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') return;
      }

      await subscribeUser(reg);
    } catch (e) {
      console.warn('[Push] setup failed:', e);
    }
  }

  useEffect(() => {
    // Auto-prompt after a short delay (like Tinder does on first visit)
    const timer = setTimeout(requestPermission, 3000);
    return () => clearTimeout(timer);
  }, []);

  return { requestPermission };
}
