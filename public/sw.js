const CACHE_NAME = 'simulizimix-v7';
const AUDIO_CACHE_NAME = 'simulizi-audio-v1';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-192-maskable.png',
  '/icon-512.png',
  '/icon-512-maskable.png',
  'https://vqgnxqabvmmpfoiceass.supabase.co/storage/v1/object/public/app-assets/apple-touch-icon.png',
  'https://vqgnxqabvmmpfoiceass.supabase.co/storage/v1/object/public/app-assets/icon-192-maskable.png',
  'https://vqgnxqabvmmpfoiceass.supabase.co/storage/v1/object/public/app-assets/icon-192.png',
  'https://vqgnxqabvmmpfoiceass.supabase.co/storage/v1/object/public/app-assets/icon-512-maskable.png',
  'https://vqgnxqabvmmpfoiceass.supabase.co/storage/v1/object/public/app-assets/icon-512.png'
];

// Install Event: Activate new service worker immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_ASSETS.map((asset) =>
          cache.add(asset).catch((err) => console.warn('[SW] Skipped caching:', asset, err))
        )
      );
    })
  );
});

// Activate Event: Claim control of all open pages immediately & delete old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME && cache !== AUDIO_CACHE_NAME) {
            console.log('[SW] Purging old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network-First for HTML, JS, CSS (so homescreen app always gets updates from Vercel); Cache-First for Audio
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Audio files: Cache First for offline listening
  const isAudioRequest = url.pathname.match(/\.(mp3|wav|m4a|aac|ogg|webm|mp4)$/i) || 
                         event.request.headers.get('accept')?.includes('audio');

  if (isAudioRequest) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const contentType = networkResponse.headers.get('content-type') || '';
            if (!contentType.includes('text/html')) {
              const responseToCache = networkResponse.clone();
              caches.open(AUDIO_CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
          }
          return networkResponse;
        }).catch(() => new Response('Offline audio unavailable', { status: 503 }));
      })
    );
    return;
  }

  // Check if this request is for an image asset
  const isImageRequest = url.pathname.match(/\.(png|jpg|jpeg|gif|webp|ico|svg)$/i) ||
                         event.request.destination === 'image';

  // App shell, navigation & code bundles: Network First with Cache Fallback
  // This ensures installed PWAs automatically receive updates when online!
  if (event.request.mode === 'navigate' || url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const contentType = networkResponse.headers.get('content-type') || '';
            // CRITICAL: Never cache text/html responses when an image or static file was expected
            const isHtml = contentType.includes('text/html');
            if (!isHtml || event.request.mode === 'navigate') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
          });
        })
    );
    return;
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
