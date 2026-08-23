const CACHE_NAME = 'plots-cache-v1';
const APP_SHELL = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

// Bump CACHE_NAME (e.g. v2, v3...) whenever you redeploy index.html
// so returning users pick up the new version instead of a stale cached copy.

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;

  // Only handle same-origin GET requests for the app shell.
  // Any external calls (fonts, APIs, cloud sync, etc.) pass straight to the
  // network untouched, so live sync/import-export features keep working.
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) {
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req)
        .then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => cached); // offline: fall back to cache
      return cached || network;
    })
  );
});
