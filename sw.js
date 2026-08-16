/* Job Tracker service worker
 *
 * Update policy:
 *   - HTML is network-first, so a new deploy is picked up as soon as you're online.
 *   - Icons/manifest are cache-first (they rarely change and are cheap to re-fetch).
 *   - Bump CACHE_VERSION on every deploy. Old caches are deleted on activate.
 *   - The worker does NOT skipWaiting on its own; the page asks it to, after the
 *     user clicks Reload. That avoids swapping code out from under an open form.
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `job-tracker-${CACHE_VERSION}`;

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      // addAll fails the whole install if any single file 404s, so add
      // individually and tolerate misses.
      .then(cache => Promise.all(
        PRECACHE.map(url => cache.add(url).catch(() => null))
      ))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(k => k.startsWith('job-tracker-') && k !== CACHE_NAME)
          .map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;

  // Never touch anything that isn't a plain GET on our own origin.
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isHTML = req.mode === 'navigate' ||
                 (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    // Network first: always prefer a fresh deploy, fall back to cache offline.
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (e) {
        const cached = await caches.match(req) || await caches.match('./index.html');
        return cached || new Response(
          '<h1>Offline</h1><p>Reconnect once to finish setting up offline mode.</p>',
          { headers: { 'Content-Type': 'text/html' }, status: 503 }
        );
      }
    })());
    return;
  }

  // Everything else: cache first, refresh in the background.
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      if (fresh && fresh.status === 200 && fresh.type === 'basic') {
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch (e) {
      return new Response('', { status: 504 });
    }
  })());
});
