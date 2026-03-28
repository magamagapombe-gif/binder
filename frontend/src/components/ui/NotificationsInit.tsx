'use client';
import { useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useStore } from '@/store';

export default function NotificationsInit() {
  const { token } = useStore();
  const { requestPermission } = useNotifications();

  useEffect(() => {
    // Only request when logged in, after 3 seconds (Tinder pattern)
    if (!token) return;
    const t = setTimeout(requestPermission, 3000);
    return () => clearTimeout(t);
  }, [token]);

  return null;
}
