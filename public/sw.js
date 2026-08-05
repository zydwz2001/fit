const CACHE_NAME = 'vibe-fitness-v3-production-20260805-306';
const APP_ROOT = '/fit/';
const CORE_ASSETS = [
  APP_ROOT,
  `${APP_ROOT}manifest.webmanifest`,
  `${APP_ROOT}icons/app-icon.svg`,
  `${APP_ROOT}icons/app-icon-192.png`,
  `${APP_ROOT}icons/app-icon-512.png`,
  `${APP_ROOT}icons/app-icon-maskable-512.png`,
  `${APP_ROOT}icons/apple-touch-icon.png`,
  `${APP_ROOT}images/exercises/barbell_benchpress.png`,
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const response = await fetch(APP_ROOT, { cache: 'no-store' });
    const html = await response.clone().text();
    const builtAssets = [...html.matchAll(/(?:src|href)="(\/fit\/assets\/[^"]+)"/g)]
      .map((match) => match[1]);

    await cache.put(APP_ROOT, response);
    await cache.addAll([...CORE_ASSETS.slice(1), ...builtAssets]);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((name) => name !== CACHE_NAME)
        .map((name) => caches.delete(name))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(APP_ROOT)) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        await cache.put(APP_ROOT, response.clone());
        return response;
      } catch {
        return (await caches.match(APP_ROOT)) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  })());
});
