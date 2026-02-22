/* Solo Store — Service Worker
 * Handles: PWA install shell + Web Push Notifications
 */

// ── Lifecycle ──────────────────────────────────────────────────────────────────
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// ── Fetch — pass-through (no caching strategy needed for now) ─────────────────
self.addEventListener('fetch', (e) =>
  e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })))
);

// ── Push — show a native browser notification ──────────────────────────────────
self.addEventListener('push', (e) => {
  if (!e.data) return;

  let data;
  try {
    data = e.data.json();
  } catch {
    data = { title: 'Solo Store', body: e.data.text(), link: '/dashboard/notifications' };
  }

  const title = data.title || 'Solo Store';
  const options = {
    body:             data.body || data.message || '',
    icon:             '/pwa-icon.svg',
    badge:            '/pwa-icon.svg',
    tag:              data.tag  || 'solostore-notif',
    data:             { link: data.link || '/dashboard/notifications' },
    vibrate:          [200, 100, 200],
    requireInteraction: false,
    // Show even if tab is currently focused
    silent: false,
  };

  e.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification click — focus existing tab or open new one ───────────────────
self.addEventListener('notificationclick', (e) => {
  e.notification.close();

  const targetLink = e.notification.data?.link || '/dashboard/notifications';

  e.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If a tab with our origin is already open, focus it and navigate
        for (const client of clientList) {
          if (
            client.url.startsWith(self.location.origin) &&
            'focus' in client
          ) {
            client.focus();
            client.navigate(targetLink);
            return;
          }
        }
        // No tab open — open a fresh one
        return self.clients.openWindow(targetLink);
      })
  );
});

// ── Push subscription change — auto re-subscribe when browser rotates keys ────
self.addEventListener('pushsubscriptionchange', (e) => {
  e.waitUntil(
    self.registration.pushManager
      .subscribe(e.oldSubscription
        ? { userVisibleOnly: true, applicationServerKey: e.oldSubscription.options.applicationServerKey }
        : { userVisibleOnly: true }
      )
      .then((newSub) =>
        // Notify the app so it can POST the new subscription to the backend
        self.clients.matchAll({ type: 'window' }).then((clients) => {
          clients.forEach((c) => c.postMessage({ type: 'PUSH_RESUBSCRIBED', subscription: newSub.toJSON() }));
        })
      )
      .catch(console.error)
  );
});
