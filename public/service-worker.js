// Service worker de macimusic.es (versión Astro).
//
// - HTML: red primero (siempre la última versión), caché si no hay conexión.
// - /_astro/*: los ficheros llevan hash en el nombre → caché primero.
// - Imágenes y audio: caché primero.
//
// Al subir CACHE_NAME se borran las cachés anteriores (incluida la
// 'maci-cache-v8' de la web sin Astro, con rutas que ya no existen).
const CACHE_NAME = 'maci-astro-v1';

const PRECACHE = [
  '/',
  '/images/MaciLogo.svg',
  '/images/Banner-MACI-optimized.webp',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .catch((err) => console.warn('SW: Cache add error:', err)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)),
    )),
  );
  self.clients.claim();
});

const putInCache = (request, response) => {
  if (response && response.status === 200) {
    const clone = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
  }
  return response;
};

const cacheFirst = (request, fallback) => caches.match(request).then((cached) => {
  if (cached) return cached;
  return fetch(request).then((response) => putInCache(request, response)).catch(fallback);
});

const networkFirst = (request) => fetch(request)
  .then((response) => putInCache(request, response))
  .catch(() => caches.match(request).then((cached) => cached || caches.match('/')));

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  // El audio se pide con Range: no se cachea para no romper la reproducción.
  if (/\.mp3$/i.test(url.pathname)) {
    if (!request.headers.has('range')) {
      event.respondWith(cacheFirst(request, () => new Response('Offline', { status: 503 })));
    }
    return;
  }

  const isImage = /\.(webp|avif|jpe?g|png|gif|svg)$/i.test(url.pathname);
  if (isImage || url.pathname.startsWith('/_astro/') || /\.woff2?$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request, () => (isImage
      ? new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#333" width="100" height="100"/></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } },
      )
      : new Response('Offline', { status: 503 }))));
    return;
  }

  if (request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
    event.respondWith(networkFirst(request));
  }
});
