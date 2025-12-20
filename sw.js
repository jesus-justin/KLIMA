// Service Worker for offline support
const CACHE_NAME = 'klima-v1.3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/compare.html',
  '/alerts.html',
  '/offline.html',
  '/assets/css/styles.css',
  '/assets/css/compare.css',
  '/assets/css/alerts.css',
  '/assets/js/app.js',
  '/assets/js/compare.js',
  '/assets/js/alerts.js',
  '/assets/js/favorites.js',
  '/assets/js/theme.js',
  '/manifest.json'
];

const API_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for API calls

async function stampResponse(response, { fromCache = false } = {}) {
  const headers = new Headers(response.headers);
  headers.set('X-Klima-Cached-At', new Date().toISOString());
  headers.set('X-Klima-From-Cache', fromCache ? 'true' : 'false');
  const body = await response.clone().arrayBuffer();
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Navigation requests: provide offline fallback page if network fails
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          // Cache successful navigations for offline reuse
          if (networkResponse && networkResponse.ok) {
            const clone = networkResponse.clone();
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, clone);
          }
          return networkResponse;
        } catch (_) {
          // Try cached page first
          const cached = await caches.match(request);
          if (cached) return cached;
          // Fallback to offline.html
          const offline = await caches.match('/offline.html');
          if (offline) return offline;
          return new Response('<h1>Offline</h1><p>You are offline.</p>', { headers: { 'Content-Type': 'text/html' }, status: 503 });
        }
      })()
    );
    return;
  }
  
  // Network-first for API calls, cache as fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.ok) {
            const stamped = await stampResponse(response.clone());
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, stamped.clone());
            });
            return stamped;
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) {
            const stamped = await stampResponse(cached, { fromCache: true });
            stamped.headers.set('X-Klima-Offline', 'true');
            return stamped;
          }
          return new Response(JSON.stringify({ error: 'Offline', offline: true }), {
            headers: { 'Content-Type': 'application/json', 'X-Klima-Offline': 'true' },
            status: 503
          });
        })
    );
    return;
  }
  
  // Cache-first for static assets
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request).then((response) => {
        if (response.ok && request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

// Background sync for weather updates
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-weather') {
    event.waitUntil(syncWeather());
  }
});

async function syncWeather() {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({ type: 'SYNC_WEATHER' });
    });
  } catch (e) {
    console.error('Background sync failed:', e);
  }
}
