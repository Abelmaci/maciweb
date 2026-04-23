const CACHE_NAME = 'maci-cache-v7';
const CRITICAL_ASSETS = [
  './',
  './index.html',
  './src/compiled.css',
  './src/main.js',
  './src/vanilla-app.js'
];

const IMAGE_ASSETS = [
  './images/MaciLogo.svg',
  './images/Banner-MACI-optimized.webp',
  './images/CD_caigo_a_tus_pies.webp',
  './images/CD_PEON_EN_EL_AMOR_optimized.webp',
  './images/CD_TU_CUERPO_ME_HABLA.webp',
  './images/CD_YOUR_BODY_optimized.webp',
  './images/CD_adela_optimized.webp',
  './images/CD_el_idiota_optimized.webp',
  './images/Banner-MACI-optimized.jpg',
  './images/CD_caigo_a_tus_pies.jpg',
  './images/CD_PEON_EN_EL_AMOR_optimized.jpg',
  './images/CD_TU_CUERPO_ME_HABLA.jpg',
  './images/CD_YOUR_BODY_optimized.jpg',
  './images/CD_adela_optimized.jpg',
  './images/CD_el_idiota_optimized.jpg',
  './images/CD_quien_fue.jpg',
  './images/Biomaci.jpeg',
  './images/adela2.jpg'
];

const AUDIO_ASSETS = [
  './music-preview/peon-en-el-amor.mp3',
  './music-preview/tu-cuerpo-me-habla.mp3',
  './music-preview/your-body.mp3',
  './music-preview/adela-v5.mp3',
  './music-preview/el-idiota.mp3',
  './music-preview/caigo-a-tus-pies.mp3',
  './music-preview/quien-fue.mp3'
];

// Install: Cache critical assets only (faster activation)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: Caching critical assets');
        return cache.addAll(CRITICAL_ASSETS)
          .then(() => cache.addAll(IMAGE_ASSETS))
          .catch(err => console.warn('SW: Cache add error:', err));
      })
  );
  self.skipWaiting();
});

// Activate: Clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cache => cache !== CACHE_NAME)
          .map(cache => {
            console.log('SW: Deleting old cache:', cache);
            return caches.delete(cache);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Smart caching strategies
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isLocal = url.origin === location.origin;
  const isImage = /\.(webp|jpg|jpeg|png|gif|svg)$/i.test(url.pathname);
  const isAudio = /\.mp3$/i.test(url.pathname);
  const isCDN = url.origin.includes('cdnjs.cloudflare.com') || url.origin.includes('fonts.googleapis.com') || url.origin.includes('unpkg.com');

  // Images: Cache-first (never changes)
  if (isImage || isAudio) {
    event.respondWith(
      caches.match(event.request)
        .then(cached => {
          if (cached) return cached;
          
          return fetch(event.request)
            .then(response => {
              if (response && response.status === 200) {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, clone);
                });
              }
              return response;
            })
            .catch(() => {
              // Offline fallback for images
              return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#333" width="100" height="100"/></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              );
            });
        })
    );
    return;
  }

  // JS/CSS: Network-first, fallback to cache
  if ((url.pathname.includes('.js') || url.pathname.includes('.css')) && isLocal) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request)
            .then(cached => cached || new Response('Offline', { status: 503 }));
        })
    );
    return;
  }

  // HTML: Network-first
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone(); // clone synchronously before async caches.open
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request)
            .then(cached => cached || caches.match('./index.html'));
        })
    );
    return;
  }

  // Default: Try cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
      .catch(() => new Response('Offline', { status: 503 }))
  );
});
