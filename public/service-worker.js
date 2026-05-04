// RezaKit Service Worker — network-first for HTML, cache-first for hashed assets.
// Bump CACHE_VERSION on every deploy that should invalidate caches.
const CACHE_VERSION = 'rezakit-v3';
const RUNTIME_CACHE  = `rezakit-runtime-${CACHE_VERSION}`;

const PRECACHE_URLS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(RUNTIME_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => k !== RUNTIME_CACHE)
        .map((k) => caches.delete(k))
    );
    await self.clients.claim();
    // Tell every open client a new version is now active
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const c of clients) c.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION });
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

const isHashedAsset = (url) =>
  /\/assets\/.+-[A-Za-z0-9_-]{8,}\.(js|css|woff2?|ttf|otf|png|jpg|jpeg|webp|svg)$/.test(url.pathname);

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Skip cross-origin (Supabase, Gemini, ExerciseDB, wger, YouTube, Strava…)
  if (url.origin !== self.location.origin) return;

  const isHTML =
    request.mode === 'navigate' ||
    request.destination === 'document' ||
    (request.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    // NETWORK-FIRST: always try the latest index.html, fall back to cache offline.
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request, { cache: 'no-store' });
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put('/index.html', fresh.clone());
        return fresh;
      } catch {
        return (await caches.match('/index.html')) || (await caches.match('/'));
      }
    })());
    return;
  }

  if (isHashedAsset(url)) {
    // CACHE-FIRST: hashed assets never change, safe to serve from cache forever.
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      const fresh = await fetch(request);
      if (fresh.ok) {
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(request, fresh.clone());
      }
      return fresh;
    })());
    return;
  }

  // Default: stale-while-revalidate for other same-origin GETs (manifest, icons…)
  event.respondWith((async () => {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(request);
    const network = fetch(request).then((res) => {
      if (res.ok) cache.put(request, res.clone());
      return res;
    }).catch(() => cached);
    return cached || network;
  })());
});
