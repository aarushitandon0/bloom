// ── useOnlineStatus — detect network connectivity ────────────

import { useState, useEffect } from 'react';
import { useNotifStore } from '@/stores/notifStore';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const showToast = useNotifStore((s) => s.showPatternToast);

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      showToast('back-online', 'you\'re back online');
    };
    const goOffline = () => {
      setIsOnline(false);
      showToast('offline', 'you\'re offline — changes will sync later');
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [showToast]);

  return isOnline;
}
