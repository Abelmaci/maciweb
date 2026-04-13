const CACHE_NAME = 'maci-cache-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './src/style.css',
  './src/vanilla-app.js',
  './src/vanilla-sand.js',
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
  './images/Biomaci.jpeg',
  './images/adela2.jpg',
  './music-preview/peon-en-el-amor.mp3',
  './music-preview/tu-cuerpo-me-habla.mp3',
  './music-preview/your-body.mp3',
  './music-preview/adela-v5.mp3',
  './music-preview/el-idiota.mp3',
  './music-preview/caigo-a-tus-pies.mp3'
];

// Install Event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache v2');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// Activate Event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Deleting old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch Event (Stale-While-Revalidate Strategy for dynamic/external balancing)
self.addEventListener('fetch', event => {
  // Only handle local or specific trusted CDNs
  const url = new URL(event.request.url);
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return from cache if found
        if (cachedResponse) {
          // Optional: Fetch in background to update cache (Stale-while-revalidate)
          fetch(event.request).then(networkResponse => {
            caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, networkResponse);
            });
          }).catch(() => {});
          
          return cachedResponse;
        }

        return fetch(event.request).then(networkResponse => {
          // Don't cache everything, just specific external libraries or local assets
          if (url.origin === location.origin || url.origin.includes('cdnjs.cloudflare.com') || url.origin.includes('fonts.googleapis.com')) {
              return caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, networkResponse.clone());
                  return networkResponse;
              });
          }
          return networkResponse;
        });
      })
  );
});
