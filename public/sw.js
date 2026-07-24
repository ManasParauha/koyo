const CACHE_NAME = 'koyo-static-cache-v1';
const RUNTIME_CACHE_NAME = 'koyo-runtime-cache-v1';

const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching static assets');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[Service Worker] Failed to pre-cache some assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME && cache !== RUNTIME_CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const path = url.pathname;

  // Only handle GET requests for local assets to avoid breaking POST APIs or external integrations
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // 1. EXCLUSIONS: Do NOT cache or intercept kitchen dashboard, cart, confirmation, or API routes
  if (
    path.startsWith('/dashboard') ||
    path.startsWith('/api') ||
    path.includes('/cart') ||
    path.includes('/confirmation')
  ) {
    // Network only
    return;
  }

  // 2. NEXT.JS IMMUTABLE STATIC BUNDLES (Cache First)
  if (path.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        });
      })
    );
    return;
  }

  // 3. STATIC ASSETS & PUBLIC IMAGES/ICONS (Cache First)
  if (
    path.startsWith('/icons/') ||
    path.endsWith('.svg') ||
    path.endsWith('.png') ||
    path.endsWith('.ico') ||
    path.endsWith('.webp') ||
    path.startsWith('/fonts/')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        });
      })
    );
    return;
  }

  // 4. CUSTOMER MENU PAGES & HOME (Network First, Falling Back to Cache)
  if (path === '/' || path.startsWith('/menu/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Fallback response if completely offline and page is not cached
            return new Response(
              '<html><body style="background:#0f0f0f;color:#ffffff;font-family:sans-serif;padding:2rem;text-align:center;">' +
              '<h2>You are offline</h2>' +
              '<p>Please reconnect to view this page.</p>' +
              '<button onclick="window.location.reload()" style="background:#0007cd;color:#ffffff;border:none;padding:0.5rem 1rem;border-radius:4px;cursor:pointer;">Retry</button>' +
              '</body></html>',
              {
                headers: { 'Content-Type': 'text/html' }
              }
            );
          });
        })
    );
    return;
  }
});
