/* Messenger Pro BD - Firebase Web Push service worker */
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDtWVn92ftCcrznTkPitPDb-n-zt7XLy8g',
  authDomain: 'ms-fix-4e05f.firebaseapp.com',
  databaseURL: 'https://ms-fix-4e05f-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'ms-fix-4e05f',
  storageBucket: 'ms-fix-4e05f.firebasestorage.app',
  messagingSenderId: '830615298933',
  appId: '1:830615298933:web:78e02c5b5a40d14b1ee93c'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  const d = payload?.data || {};
  const title = d.title || payload?.notification?.title || 'Messenger Pro BD';
  const body = d.body || payload?.notification?.body || 'New message';
  self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: d.tag || 'messenger-web-push',
    data: { url: d.url || '/', roomId: d.roomId || '' },
    renotify: true
  });
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification?.data?.url || '/';
  event.waitUntil((async () => {
    const list = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of list) {
      if ('focus' in client) {
        await client.focus();
        if (url) client.postMessage({ type: 'OPEN_CHAT_FROM_PUSH', roomId: event.notification?.data?.roomId || '' });
        return;
      }
    }
    if (clients.openWindow) await clients.openWindow(url);
  })());
});

const PWA_CACHE = 'messenger-pro-bd-v1';
const PWA_ASSETS = [
  './', './index.html', './style.css', './script.js', './manifest.json',
  './icon-192.png', './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(PWA_CACHE).then(cache => cache.addAll(PWA_ASSETS).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== PWA_CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const response = await fetch(req);
      if (response.ok) {
        const copy = response.clone();
        caches.open(PWA_CACHE).then(cache => cache.put(req, copy));
      }
      return response;
    } catch (e) {
      return cached || caches.match('./index.html');
    }
  })());
});
