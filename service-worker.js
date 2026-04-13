const CACHE_NAME = 'maci-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './src/style.css',
  './src/vanilla-app.js',
  './src/vanilla-sand.js',
  './images/MaciLogo.svg',
  './images/Banner-MACI-optimized.jpg',
  './images/CD_caigo_a_tus_pies.jpg',
  './images/CD PEON EN EL AMOR.jpg',
  './images/CD_TU_CUERPO_ME_HABLA.jpg',
  './images/CD_YOUR_BODY_optimized.jpg',
  './images/CD_adela_optimized.jpg',
  './images/CD el idiota.jpg',
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
        console.log('Opened cache');
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

// Fetch Event (Cache First Strategy for static assets)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Return from cache
        }
        return fetch(event.request).then(networkResponse => {
            // Optional: add external resources to cache dynamically
            return networkResponse;
        });
      })
  );
});
