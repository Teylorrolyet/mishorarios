const cacheName = 'portal-bosque-v1';
const filesToCache = [
  './index.html',
  './main.js',
  './firebase-config.js',
  './manifest.json',
  './logo-portal-bosque.png'
];

self.addEventListener('install', e=>{
  e.waitUntil(
    caches.open(cacheName).then(cache=>cache.addAll(filesToCache))
  );
});

self.addEventListener('fetch', e=>{
  e.respondWith(
    caches.match(e.request).then(resp=>resp || fetch(e.request))
  );
});
