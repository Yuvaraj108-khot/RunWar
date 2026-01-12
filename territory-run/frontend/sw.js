const CACHE_NAME = 'territory-run-v3';
const ASSETS_TO_CACHE = ['/css/styles.css', '/js/app.js', '/js/api.js', '/js/auth.js', '/js/map.js', '/js/ui.js', '/js/gps.js'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Never cache HTML - always fetch fresh
  if (request.url.includes('.html') || request.url.endsWith('/')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }
  
  // For other assets, use cache first, fall back to network
  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request))
    );
  }
});

