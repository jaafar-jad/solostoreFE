'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

// Convert URL-safe base64 VAPID public key → Uint8Array (required by pushManager.subscribe)
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputBuffer = new ArrayBuffer(rawData.length);
  const output = new Uint8Array(outputBuffer);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return outputBuffer;
}

export type PushState = 'unsupported' | 'denied' | 'default' | 'subscribed';

export interface UsePushNotificationsReturn {
  pushState: PushState;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const { isLoggedIn } = useAuthStore();
  const [pushState, setPushState] = useState<PushState>('unsupported');
  const resubHandlerRef = useRef<((e: MessageEvent) => void) | null>(null);

  // ── Derive initial state from browser APIs ─────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setPushState('unsupported');
      return;
    }

    const perm = Notification.permission;
    if (perm === 'denied') { setPushState('denied'); return; }

    // Check if we already have an active push subscription
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (sub) {
          setPushState('subscribed');
        } else {
          setPushState(perm === 'granted' ? 'default' : 'default');
        }
      })
      .catch(() => setPushState('default'));
  }, []);

  // ── Listen for sw PUSH_RESUBSCRIBED message (key rotation) ────────────────
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    const handler = async (e: MessageEvent) => {
      if (e.data?.type !== 'PUSH_RESUBSCRIBED') return;
      const newSub = e.data.subscription as PushSubscriptionJSON;
      if (!newSub?.endpoint) return;
      try {
        await api.post('/notifications/push-subscribe', newSub);
      } catch {
        // silent — will retry on next subscribe
      }
    };

    navigator.serviceWorker.addEventListener('message', handler);
    resubHandlerRef.current = handler;
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, []);

  // ── Subscribe ──────────────────────────────────────────────────────────────
  const subscribe = useCallback(async () => {
    if (!isLoggedIn) return;
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    // 1. Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      setPushState(permission === 'denied' ? 'denied' : 'default');
      return;
    }

    // 2. Register / reuse the service worker
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;

    // 3. Fetch VAPID public key from backend (or use env var directly)
    let vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
    if (!vapidPublicKey) {
      try {
        const { data } = await api.get('/notifications/vapid-public-key');
        vapidPublicKey = (data.data?.publicKey as string) ?? '';
      } catch {
        console.warn('[Push] Could not fetch VAPID public key');
        return;
      }
    }
    if (!vapidPublicKey) return;

    // 4. Subscribe via PushManager
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    // 5. Send subscription to backend
    await api.post('/notifications/push-subscribe', subscription.toJSON());
    setPushState('subscribed');
  }, [isLoggedIn]);

  // ── Unsubscribe ────────────────────────────────────────────────────────────
  const unsubscribe = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await api.delete('/notifications/push-subscribe', { data: { endpoint } });
      }
      setPushState('default');
    } catch (err) {
      console.error('[Push] Unsubscribe failed:', err);
    }
  }, []);

  return { pushState, subscribe, unsubscribe };
}
